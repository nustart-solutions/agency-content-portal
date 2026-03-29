import modal
from typing import Dict, Any

# 1. Define Image (Cloud Environment)
# We bake in the libraries we need to run DataForSeo, Supabase, and OpenAI
image = (
    modal.Image.debian_slim()
    .pip_install(
        "fastapi",
        "supabase", 
        "google-genai", 
        "requests",
        "google-api-python-client",
        "google-auth",
        "markdown"
    )
    .add_local_dir("execution/seomachine", remote_path="/root/seomachine")
)

app = modal.App("content-portal-execution")

# ==========================================
# WEBHOOK: generate_asset
# ==========================================
@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("content-portal-secrets"),
        modal.Secret.from_name("googlecloud-secret")
    ],
    timeout=600 # 10 mins execution for heavy AI tasks
)
@modal.web_endpoint(method="POST")
def generate_asset(data: Dict[str, Any]):
    import os
    from supabase import create_client
    from google import genai
    
    # 1. Init Connections
    print(f"== Starting Generate Asset for {data} ==")
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Modal Secrets!")
        return {"error": "Missing Supabase Credentials"}
        
    supabase = create_client(supabase_url, supabase_key)
    
    asset_id = data.get("asset_id")
    if not asset_id:
        print("ERROR: API payload did not contain 'asset_id'")
        return {"error": "asset_id required"}
        
    try:
        # 2. Fetch Asset and Hierarchical Context
        asset_res = supabase.table("assets").select(
            "*, campaigns(id, campaign_subgroups(campaign_group_id, campaign_groups(brand_id)))"
        ).eq("id", asset_id).single().execute()
        asset = asset_res.data
        
        # Traverse up the complex hierarchy to find the brand settings
        brand_id = asset["campaigns"]["campaign_subgroups"]["campaign_groups"]["brand_id"]
        brand_res = supabase.table("brands").select("requires_approval").eq("id", brand_id).single().execute()
        requires_approval = brand_res.data.get("requires_approval", True)
        
        # 3. Pull ALL Brand Contexts from the new database table
        contexts_res = supabase.table("brand_contexts").select("context_type, content_markdown").eq("brand_id", brand_id).execute()
        
        compiled_context = ""
        master_knowledge = ""
        if contexts_res.data:
            for ctx in contexts_res.data:
                if ctx['context_type'] == 'master_brand_knowledge':
                    master_knowledge = ctx['content_markdown']
                else:
                    compiled_context += f"--- {ctx['context_type'].upper()} ---\n{ctx['content_markdown']}\n\n"
        else:
            # Fallback if absolutely zero context is supplied by the user
            compiled_context = "--- TONE GUIDELINES ---\nProfessional, authoritative, yet approachable."
            
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        deep_research_context = ""
        
        # 3.5 DEEP RESEARCH
        if data.get("deep_research", False):
            print("== Executing Deep Research ==")
            import requests
            
            # A. Internal Knowledge Extraction
            if master_knowledge:
                print("  -> Extracting targeted facts from Master Knowledge Blob...")
                # We limit to first 300k chars to guarantee we stay comfortably within token limits for a quick retrieval
                kr_prompt = f"The following is raw scraped content from a brand's website:\n\n{master_knowledge[:300000]}\n\nExtract the top 10 most relevant facts, capabilities, or stances this brand has regarding the topic: '{asset['title']}'. Return only the facts."
                kr_resp = client.models.generate_content(model='gemini-2.5-flash', contents=kr_prompt)
                deep_research_context += f"--- TARGETED BRAND FACTS ---\n{kr_resp.text}\n\n"
                
            # B. DataForSEO SERP Analysis
            dfs_login = os.environ.get("DATAFORSEO_LOGIN")
            dfs_pass = os.environ.get("DATAFORSEO_PASSWORD")
            if dfs_login and dfs_pass:
                print("  -> Fetching Top 5 Competitors from DataForSEO...")
                dfs_url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
                payload = [{"keyword": asset['title'], "location_name": "United States", "language_code": "en", "depth": 5}]
                try:
                    serp_resp = requests.post(dfs_url, auth=(dfs_login, dfs_pass), json=payload, timeout=20)
                    if serp_resp.status_code == 200:
                        serp_data = serp_resp.json()
                        items = serp_data.get("tasks", [])[0].get("result", [])[0].get("items", [])
                        
                        # Top 3 organic competitors for scraping speed
                        top_urls = [item["url"] for item in items if item.get("type") == "organic"][:3]
                        
                        # C. Scrape Competitors via Jina
                        if top_urls:
                            print("  -> Scraping Competitor Outlines via Jina AI...")
                            import concurrent.futures
                            competitor_texts = []
                            
                            def scrape_comp(u):
                                try:
                                    j_resp = requests.get(f"https://r.jina.ai/{u}", headers={"Accept": "application/json"}, timeout=15)
                                    if j_resp.status_code == 200: return f"URL: {u}\nContent: {j_resp.text[:20000]}\n"
                                    return ""
                                except: return ""
                                
                            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as exec:
                                for idx, f in enumerate(concurrent.futures.as_completed({exec.submit(scrape_comp, u): u for u in top_urls})):
                                    text = f.result()
                                    if text: competitor_texts.append(text)
                                    
                            if competitor_texts:
                                comp_prompt = "Summarize the core outline and key missing gaps from these top-ranking competitors:\n\n" + "\n---\n".join(competitor_texts)
                                comp_resp = client.models.generate_content(model='gemini-2.5-flash', contents=comp_prompt)
                                deep_research_context += f"--- COMPETITOR OUTLINE & GAPS ---\n{comp_resp.text}\n\n"
                except Exception as e:
                    print(f"  -> DataForSEO/Competitor scraping failed: {e}")
            else:
                print("  -> Skipping SERP check (Missing DATAFORSEO_LOGIN or PASSWORD credentials in Modal)")

        # 4. Generate Content (The "SEOMachine" hook)
        print("== Generating Final Content ==")
        
        anchor_context = None
        if asset.get("anchor_asset_id"):
            anchor_res = supabase.table("assets").select("content_markdown, published_url").eq("id", asset["anchor_asset_id"]).single().execute()
            if anchor_res.data:
                anchor_context = anchor_res.data

        if anchor_context:
            print("== Executing Spoke Repurposing ==")
            prompt = f"""You are a master Social Media Manager and Copywriter.
Your ONLY goal is to repurpose the following approved Anchor Article into a highly-engaging {asset['asset_type']} for {asset['channel']}.

{compiled_context}

--- APPROVED ANCHOR ARTICLE ---
{anchor_context.get('content_markdown', '')[:200000]}

Task: Write the {asset['channel']} post summarizing the core value of the anchor article. 
You MUST explicitly end the post with a strong call to action linking exactly to this URL: {anchor_context.get('published_url', 'this link')}.
Return raw text/markdown (no markdown blocks like ```markdown)."""
        else:
            prompt = f"""You are a master SEO content generator. 

{compiled_context}
{deep_research_context}

Write an optimized {asset['asset_type']} about '{asset['title']}' for a {asset['channel']} channel. Return raw markdown (no markdown blocks like ```markdown)."""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        content = response.text
        
        # 4.1 Convert to Google Doc (if credentials present)
        import markdown
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaIoBaseUpload
        import io
        import json
        from datetime import datetime
        from googleapiclient.http import MediaIoBaseUpload
        
        google_doc_url = None
        # Handle typo and varying uppercase/lowercase formats in Modal Secrets
        possible_keys = ["service_accout_json", "service_account_json", "SERVICE_ACCOUT_JSON", "SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_JSON"]
        service_account_info_str = next((os.environ.get(k) for k in possible_keys if os.environ.get(k)), None)
        
        if service_account_info_str:
            try:
                import json
                from google.oauth2.service_account import Credentials
                from googleapiclient.discovery import build
                
                creds_info = json.loads(service_account_info_str)
                
                # Check if the user accidentally pasted the wrapped JSON from secrets.json 
                # instead of the raw Google Service account JSON
                if "google_cloud" in creds_info:
                    print("Detected nested 'google_cloud' key in secret. Unwrapping...")
                    creds_info = creds_info["google_cloud"]
                
                creds = Credentials.from_service_account_info(
                    creds_info, 
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
                drive_service = build('drive', 'v3', credentials=creds)
                
                html_body = markdown.markdown(content)
                current_date = datetime.now().strftime("%Y-%m-%d")
                
                meta_table = f"""
                <table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
                  <tr><th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Meta</th><th style="padding: 8px; text-align: left; background-color: #f2f2f2;">Details</th></tr>
                  <tr><td style="padding: 8px;"><b>Campaign ID</b></td><td style="padding: 8px;">{asset['campaigns']['id']}</td></tr>
                  <tr><td style="padding: 8px;"><b>Channel</b></td><td style="padding: 8px;">{asset['channel']}</td></tr>
                  <tr><td style="padding: 8px;"><b>Date Created</b></td><td style="padding: 8px;">{current_date}</td></tr>
                </table>
                <br><br>
                """
                
                final_html = f"<html><body>{meta_table}{html_body}</body></html>"
                
                # Setup Folders for Shared Drive
                root_drive_id = os.environ.get("ROOT_DRIVE_ID")
                parent_folder_id = root_drive_id
                brand_name = data.get("brand_name", "").strip()
                campaign_name = data.get("campaign_name", "").strip()
                
                if root_drive_id and brand_name:
                    print(f"Organizing inside Shared Drive {root_drive_id} for Brand: {brand_name}")
                    
                    def get_or_create_folder(f_name, p_id):
                        if not p_id: return None
                        safe_name = f_name.replace("'", "\\'")
                        query = f"name='{safe_name}' and '{p_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
                        res = drive_service.files().list(q=query, spaces='drive', supportsAllDrives=True, includeItemsFromAllDrives=True).execute()
                        if res.get('files'):
                            return res['files'][0]['id']
                            
                        # Create folder
                        f_metadata = {'name': f_name, 'mimeType': 'application/vnd.google-apps.folder', 'parents': [p_id]}
                        folder = drive_service.files().create(body=f_metadata, fields='id', supportsAllDrives=True).execute()
                        return folder.get('id')
                    
                    try:
                        brand_folder_id = get_or_create_folder(brand_name, root_drive_id)
                        if campaign_name:
                            camp_folder_id = get_or_create_folder(campaign_name, brand_folder_id)
                            parent_folder_id = camp_folder_id
                        else:
                            parent_folder_id = brand_folder_id
                    except Exception as e:
                        print(f"Failed to create Google Drive Subfolders, falling back: {e}")
                        parent_folder_id = root_drive_id
                
                file_metadata = {
                    'name': f"{asset['title']} - {asset['asset_type'].replace('_', ' ').title()}",
                    'mimeType': 'application/vnd.google-apps.document'
                }
                
                if parent_folder_id:
                    file_metadata['parents'] = [parent_folder_id]
                
                media = MediaIoBaseUpload(io.BytesIO(final_html.encode('utf-8')), mimetype='text/html', resumable=True)
                
                file = drive_service.files().create(
                    body=file_metadata,
                    media_body=media,
                    fields='id, webViewLink',
                    supportsAllDrives=True if root_drive_id else False
                ).execute()
                
                doc_id = file.get('id')
                google_doc_url = file.get('webViewLink')
                
                drive_service.permissions().create(
                    fileId=doc_id,
                    body={'type': 'anyone', 'role': 'writer'},
                    fields='id',
                    supportsAllDrives=True if root_drive_id else False
                ).execute()
                
                print(f"Successfully generated Google Doc: {google_doc_url}")
            except Exception as e:
                print(f"FAILED to upload to Google Docs: {str(e)}")
        else:
            print("Skipped Google Docs generation (GOOGLE_SERVICE_ACCOUNT_JSON not provided)")
        
        # 5. Route the Asset Status & Save
        new_status = "review" if requires_approval else "published"
        
        update_payload = {
            "content_markdown": content,
            "compiled_prompt": prompt,
            "status": new_status
        }
        if google_doc_url:
            update_payload["google_doc_url"] = google_doc_url
            
        supabase.table("assets").update(update_payload).eq("id", asset_id).execute()
        
        # 6. Auto-publish skip
        if not requires_approval:
            # We call the publish function directly inside Modal to save latency
            publish_asset.local({"asset_id": asset_id})
            
        print(f"SUCCESS: Generated content and saved to DB. New Status: {new_status}")
        return {"success": True, "status": new_status, "asset_id": asset_id}
        
    except Exception as e:
        print(f"CRITICAL ERROR in generate_asset: {str(e)}")
        # Revert on fail
        try:
            supabase.table("assets").update({"status": "draft"}).eq("id", asset_id).execute()
        except Exception as inner_e:
            print(f"FAILED to revert to draft: {str(inner_e)}")
        return {"error": str(e)}


# ==========================================
# WEBHOOK: ingest_client_asset
# ==========================================
@app.function(
    image=image,
    secrets=[modal.Secret.from_name("content-portal-secrets")]
)
@modal.web_endpoint(method="POST")
def ingest_client_asset(data: Dict[str, Any]):
    import os
    import requests
    from supabase import create_client
    
    asset_id = data.get("asset_id")
    url = data.get("url")
    
    if not asset_id or not url:
        return {"error": "asset_id and url required"}
        
    supabase = create_client(os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
    
    try:
        # Download straight markup / text
        # If this is a Google Doc, we'd need GCP credentials here. Currently just downloading raw URLs.
        resp = requests.get(url, timeout=10)
        content = resp.text
        
        # Save to asset & push straight to review
        supabase.table("assets").update({
            "content_markdown": content,
            "google_doc_url": url,
            "status": "review"
        }).eq("id", asset_id).execute()
        
        return {"success": True, "asset_id": asset_id, "status": "review"}
    except Exception as e:
        supabase.table("assets").update({"status": "draft"}).eq("id", asset_id).execute()
        return {"error": str(e)}


# ==========================================
# WEBHOOK: publish_asset
# ==========================================
@app.function(
    image=image,
    secrets=[modal.Secret.from_name("content-portal-secrets")]
)
@modal.web_endpoint(method="POST")
def publish_asset(data: Dict[str, Any]):
    import os
    from supabase import create_client
    
    asset_id = data.get("asset_id")
    if not asset_id:
        return {"error": "asset_id required"}
        
    supabase = create_client(os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
    
    try:
        # 1. Fetch the asset + brand info
        asset_res = supabase.table("assets").select(
            "*, campaigns(id, campaign_subgroups(campaign_group_id, campaign_groups(brand_id)))"
        ).eq("id", asset_id).single().execute()
        asset = asset_res.data
        brand_id = asset["campaigns"]["campaign_subgroups"]["campaign_groups"]["brand_id"]
        
        # 2. Retrieve credentials from Vault (Placeholder Example)
        # Note: True vault retrieval requires a postgres RPC function because standard RLS blocks fetching 'vault.decrypted_secrets'
        # e.g., vault_creds = supabase.rpc("get_wordpress_keys", {"p_brand_id": brand_id}).execute()
        
        # 3. Transpile markdown to HTML and POST to WordPress REST API
        # e.g., requests.post("https://site.com/wp-json/wp/v2/posts", json={"content": html_content})
        
        # 4. Success State Update
        supabase.table("assets").update({
            "status": "published",
        }).eq("id", asset_id).execute()
        
        return {"success": True, "asset_id": asset_id, "status": "published"}
    except Exception as e:
        return {"error": str(e)}

# ==========================================
# ==========================================
# WEBHOOK: generate_brand_context
# ==========================================
@app.function(
    image=image,
    secrets=[modal.Secret.from_name("content-portal-secrets")],
    timeout=600 # upgraded to 600s to allow multiple pages
)
@modal.web_endpoint(method="POST")
def generate_brand_context(data: Dict[str, Any]):
    import os
    import requests
    import json
    import xml.etree.ElementTree as ET
    from urllib.parse import urlparse
    from supabase import create_client
    from google import genai
    from google.genai import types
    
    brand_id = data.get("brand_id")
    website_url = data.get("website_url")
    
    if not brand_id or not website_url:
        return {"error": "brand_id and website_url required"}
        
    supabase = create_client(os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
    
    try:
        # 1. Update status to 'generating'
        supabase.table("brands").update({"context_status": "generating"}).eq("id", brand_id).execute()
        
        # 2. Extract Sitemap URLs
        parsed_url = urlparse(website_url)
        base_domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
        sitemap_url = f"{base_domain}/sitemap.xml"
        
        urls_to_scrape = [website_url] # Always fallback/start with the root domain
        
        try:
            print(f"Fetching sitemap from {sitemap_url}...")
            # We strictly pass headers as some CDNs block python requests
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            resp = requests.get(sitemap_url, headers=headers, timeout=10)
            if resp.status_code == 200:
                root = ET.fromstring(resp.content)
                found_urls = [elem.text for elem in root.iter() if 'loc' in elem.tag and elem.text]
                
                valid_urls = []
                for u in found_urls:
                    lower_u = u.lower()
                    if u.startswith('http') and not any(ext in lower_u for ext in ['.jpg','.jpeg','.png','.gif','.pdf','.xml','.mp4','.zip']):
                        valid_urls.append(u)
                        
                if valid_urls:
                    urls_to_scrape = valid_urls
                    print(f"Successfully extracted {len(valid_urls)} URLs from sitemap.")
            else:
                print(f"Sitemap returned {resp.status_code}. Defaulting to homepage.")
        except Exception as e:
            print(f"Sitemap parsing failed: {e}. Defaulting to homepage only.")
            
        # Ensure unique, cap realistically at 500 to keep within Gemini 1M token context limit
        # but capture virtually all pages for small-to-medium businesses.
        urls_to_scrape = list(dict.fromkeys(urls_to_scrape))[:500]
        
        # 3. Scrape ALL extracted URLs quickly via Jina using ThreadPoolExecutor
        print(f"Scraping {len(urls_to_scrape)} pages using Jina AI in parallel...")
        compiled_website_text_blocks = []
        
        import concurrent.futures
        
        def scrape_url(u):
            try:
                jina_url = "https://r.jina.ai/" + u
                headers = {"Accept": "application/json"}
                jina_resp = requests.get(jina_url, timeout=30)
                if jina_resp.status_code == 200:
                    return f"\n\n======================\n--- PAGE: {u} ---\n======================\n\n{jina_resp.text}\n"
                return ""
            except Exception as e:
                print(f"  FAILED to scrape {u}: {e}")
                return ""

        # Rapid parallel execution
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_url = {executor.submit(scrape_url, curr_u): curr_u for curr_u in urls_to_scrape}
            for index, future in enumerate(concurrent.futures.as_completed(future_to_url)):
                url = future_to_url[future]
                try:
                    data = future.result()
                    if data:
                        compiled_website_text_blocks.append(data)
                        if index % 10 == 0:
                            print(f"  [{index}/{len(urls_to_scrape)}] Successfully processed chunk...")
                except Exception as exc:
                    print(f'{url} generated an exception: {exc}')
                    
        compiled_website_text = "".join(compiled_website_text_blocks)
                
        if not compiled_website_text.strip():
            raise Exception("No content could be extracted from the website.")
            
        # 4. Call Gemini to synthesize
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        
        prompt = f"""You are a master brand strategist. I have used a web-crawler to extract the entire text content of this client's website.
        
Read through their massive website context blob below, and generate 3 rigid pieces of context based ONLY on their current brand identity and facts. 
Format your response as pure JSON matching this exact structure:
{{
  "brand-voice": "...",
  "uvp": "...",
  "target-keywords": "..."
}}

WEBSITE CONTEXT:
{compiled_website_text[:700000]}
"""
        print("Sending large website packet to Gemini for JSON extraction...")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        # Extract JSON (strip potential markdown wrappers)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3]
            
        context_data = json.loads(raw_text.strip())
        
        # 5. Upsert into database efficiently
        print("Saving JSON Contexts to DB...")
        for ctx_type, markdown_content in context_data.items():
            supabase.table("brand_contexts").upsert({
                "brand_id": brand_id,
                "context_type": ctx_type,
                "content_markdown": markdown_content
            }, on_conflict="brand_id,context_type").execute()
            
        print("Saving Master Website Blob to DB...")
        supabase.table("brand_contexts").upsert({
            "brand_id": brand_id,
            "context_type": "master_brand_knowledge",
            "content_markdown": compiled_website_text
        }, on_conflict="brand_id,context_type").execute()
            
        # 6. Success
        supabase.table("brands").update({"context_status": "ready"}).eq("id", brand_id).execute()
        
        return {"success": True, "brand_id": brand_id}
    except Exception as e:
        print(f"CRITICAL ERROR generating brand context: {e}")
        # Revert status on failure
        supabase.table("brands").update({"context_status": "missing"}).eq("id", brand_id).execute()
        return {"error": str(e)}
