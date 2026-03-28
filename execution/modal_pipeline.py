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
        "requests"
    )
    .add_local_dir("execution/seomachine", remote_path="/root/seomachine")
)

app = modal.App("content-portal-execution")

# ==========================================
# WEBHOOK: generate_asset
# ==========================================
@app.function(
    image=image,
    secrets=[modal.Secret.from_name("content-portal-secrets")],
    timeout=600 # 10 mins execution for heavy AI tasks
)
@modal.web_endpoint(method="POST")
def generate_asset(data: Dict[str, Any]):
    import os
    from supabase import create_client
    from google import genai
    
    # 1. Init Connections
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        return {"error": "Missing Supabase Credentials"}
        
    supabase = create_client(supabase_url, supabase_key)
    
    asset_id = data.get("asset_id")
    if not asset_id:
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
        if contexts_res.data:
            for ctx in contexts_res.data:
                compiled_context += f"--- {ctx['context_type'].upper()} ---\n{ctx['content_markdown']}\n\n"
        else:
            # Fallback if absolutely zero context is supplied by the user
            compiled_context = "--- TONE GUIDELINES ---\nProfessional, authoritative, yet approachable."
        
        # 4. Generate Content (The "SEOMachine" hook)
        # Using Gemini instead of OpenAI
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        
        prompt = f"""You are a master SEO content generator. 

{compiled_context}

Write an optimized {asset['asset_type']} about '{asset['title']}' for a {asset['channel']} channel. Return raw markdown (no markdown blocks like ```markdown)."""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        content = response.text
        
        # 5. Route the Asset Status & Save
        new_status = "review" if requires_approval else "published"
        
        supabase.table("assets").update({
            "content_markdown": content,
            "compiled_prompt": prompt,
            "status": new_status
        }).eq("id", asset_id).execute()
        
        # 6. Auto-publish skip
        if not requires_approval:
            # We call the publish function directly inside Modal to save latency
            publish_asset.local({"asset_id": asset_id})
            
        return {"success": True, "status": new_status, "asset_id": asset_id}
        
    except Exception as e:
        # Revert on fail
        supabase.table("assets").update({"status": "draft"}).eq("id", asset_id).execute()
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
# WEBHOOK: generate_brand_context
# ==========================================
@app.function(
    image=image,
    secrets=[modal.Secret.from_name("content-portal-secrets")],
    timeout=300
)
@modal.web_endpoint(method="POST")
def generate_brand_context(data: Dict[str, Any]):
    import os
    import requests
    import json
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
        
        # 2. Scrape Homepage
        resp = requests.get(website_url, timeout=15)
        html_content = resp.text
        
        # 3. Call Gemini to synthesize
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        
        prompt = f"""You are a master brand strategist. Analyze this homepage HTML:
        
{html_content[:150000]}

Generate 3 rigid pieces of Markdown context based ONLY on the brand's current identity. 
Format your response as pure JSON matching this exact structure:
{{
  "brand-voice": "...",
  "uvp": "...",
  "target-keywords": "..."
}}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        # Extract JSON (strip potential markdown wrappers)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3]
        
        context_data = json.loads(raw_text)
        
        # 4. Upsert into database efficiently
        for ctx_type, markdown_content in context_data.items():
            supabase.table("brand_contexts").upsert({
                "brand_id": brand_id,
                "context_type": ctx_type,
                "content_markdown": markdown_content
            }, on_conflict="brand_id,context_type").execute()
            
        # 5. Success
        supabase.table("brands").update({"context_status": "ready"}).eq("id", brand_id).execute()
        
        return {"success": True, "brand_id": brand_id}
    except Exception as e:
        # Revert status on failure
        supabase.table("brands").update({"context_status": "missing"}).eq("id", brand_id).execute()
        return {"error": str(e)}
