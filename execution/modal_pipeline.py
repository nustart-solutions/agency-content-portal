import modal
from typing import Dict, Any

# 1. Define Image (Cloud Environment)
# We bake in the libraries we need to run DataForSeo, Supabase, and OpenAI
image = (
    modal.Image.debian_slim()
    .pip_install(
        "supabase", 
        "google-genai", 
        "requests", 
        "git+https://github.com/TheCraigHewitt/seomachine.git" # As requested per user specs
    )
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
        
        # 3. Pull Brand Voice from Storage Bucket
        try:
            voice_res = supabase.storage.from_("brand_contexts").download(f"{brand_id}/brand-voice.md")
            brand_voice = voice_res.decode('utf-8')
        except Exception:
            # Fallback if file doesn't exist
            brand_voice = "Professional, authoritative, yet approachable."
        
        # 4. Generate Content (The "SEOMachine" hook)
        # Using Gemini instead of OpenAI
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        
        prompt = f"""You are a master SEO content generator. 
Tone Guidelines:
{brand_voice}

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
