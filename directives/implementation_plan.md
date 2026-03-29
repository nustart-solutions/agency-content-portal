# Google Docs Export Integration

Automatically export the AI-generated markdown content to a formatted Google Document for client collaboration, seamlessly attaching the link to the Asset in the dashboard.

## User Review Required

> [!IMPORTANT]
> Since Modal runs autonomously in the cloud, it cannot display a "Google Login" popup window to authorize your personal Google account. 
> We must authenticate the script using a **Google Cloud Service Account JSON key** (similar to what you use for GA4/GSC in your SEO Machine).

## Proposed Changes

---

### Execution Pipeline (Modal)

#### [MODIFY] `execution/modal_pipeline.py`
- Add `google-api-python-client`, `google-auth`, and `markdown` dependencies to the Modal image build.
- Inject a new Modal Secret for the Google Service Account credentials.
- After Gemini generates the content:
  1. Convert the raw Markdown into HTML using the Python `markdown` library.
  2. Prepend the customized HTML metadata table to the very top of the document output. The table will contain `Meta` and `Details` columns capturing:
     - **Campaign ID**: `{campaign.id}`
     - **Channel**: `{asset.channel}`
     - **Date Created**: The current timestamp.
  3. Upload the combined HTML to Google Drive via the `drive/v3/files` API, explicitly setting the `mimeType` to `application/vnd.google-apps.document`. (Google Drive inherently parses native HTML tables and markup directly into perfect Google Doc styling).
  4. Hit the Drive Permissions API to set the file to "Anyone with the link can comment or edit."
  5. Extract the generated `webViewLink`.
- Append the `webViewLink` to the Supabase database# Cloud Website Crawler for Master Brand Knowledge

This major architectural upgrade turns the `generate_brand_context` webhook from a simple "homepage scraper" into a full-scale web crawler mimicking NotebookLM's website ingestion directly inside the cloud.

## User Review Required

> [!WARNING]
> This will increase the time it takes the "Generate Brand Context" webhook to run on brand onboarding from ~15 seconds to potentially ~2 minutes, because it will now be reading up to 25 separate web pages sequentially. The Modal webhook timeout covers up to 10 minutes (`timeout=600`), so this is safe, but be aware of the wait time on your agency dashboard!

## Proposed Changes

### `modal_pipeline.py`

#### [MODIFY] `execution/modal_pipeline.py`
We will overhaul the `generate_brand_context` endpoint at the bottom of the file.
- **Sitemap Extraction:** Add an internal helper function that builds a `/sitemap.xml` URL from the submitted website URL, queries it, and extracts up to 25 unique HTML page links using Python's native `xml.etree.ElementTree`.
- **Jina Reader Interception:** Iterate over the extracted URLs synchronously. Instead of making raw `requests.get` calls that return messy HTML menus and footers, we prepend `https://r.jina.ai/` to every request. This uses Jina AI's free public endpoint to instantly strip the page of all visual clutter and return nothing but pristine, LLM-optimized Markdown text.
- **Aggregation:** We compile all 25 pages of markdown into a single massive string: e.g. `compiled_website_text`.
- **Gemini Context Amplification:** Gemini 2.5 Flash receives the massive compiled text block instead of the tiny homepage HTML. Because Flash has a 1-million token window, it will instantly read all 25 pages perfectly and synthesize the 3 JSON baseline rules (`brand-voice`, `uvp`, `target-keywords`) with significantly deeper accuracy.
- **Master Blob Upsert:** Along with saving the 3 JSON baseline rules back to your Supabase `brand_contexts` table, it will also save a brand new row called `context_type: 'master_brand_knowledge'` holding the entire 25-page aggregated markdown blob. This sets the perfect foundation for future "Step 2" operations!

## Open Questions

None. Everything is strictly local to Modal and utilizes free APIs.

## Verification Plan

### Automated Test
- After deployment, I will trigger the `generate_brand_context` script logic on a test URL or ask you to create a new Brand in your dashboard to trigger the onboarding scrape.
- We will verify that a `master_brand_knowledge` row appears in Supabase containing markdown headers from multiple interior pages ('About Us', 'Services', etc.).der the existing `google_doc_url` column.

---

### Dashboard UI (Next.js)

#### [MODIFY] `web/src/app/dashboard/assets/[id]/page.tsx`
- Pull the `google_doc_url` from the database.
- Add a prominent, styled "Open in Google Docs" button at the top-right of the Asset Viewer panel, allowing clients and admins to jump directly into the live collaboration environment.

#### [MODIFY] `web/src/app/dashboard/campaigns/[id]/page.tsx`
- Add a small Google Drive icon/link next to the Status badge on the main campaign grid if a `google_doc_url` is present, for quick access.

### Next.js Frontend (Admin UI)

#### [NEW] `web/src/app/dashboard/settings/templates/page.tsx`
A new dedicated Settings page accessible at `/dashboard/settings/templates`. Since you are the Super Admin, this will provide a fast, secure UI to list out all existing Global Channel Prompts (e.g., Linkedin, GMB, Email) with large Textareas to edit and save them in real-time.

#### [NEW] `web/src/app/dashboard/settings/templates/actions.ts`
Server Actions to `updateChannelTemplate()` seamlessly, saving the string tightly to the database without needing API routes.

#### [MODIFY] `web/src/app/dashboard/layout.tsx`
I'll add a minimal link to "Settings" in the Global Sidebar so you can easily access this page.

## Verification Plan

### Manual Verification
1. Run the `11_global_channel_templates.sql` file in Supabase.
2. Ensure the 5 default templates are populated.
3. Push the Vercel changes.
4. Navigate to `/dashboard/settings/templates` and verify you can edit the prompts.
5. Deploy the updated `modal_pipeline.py`.
6. Trigger a Spoke Asset generation and ensure it obeys your newly edited UI constraints!n in Google Docs" button in the Dashboard UI.
4. Verify the Google Doc opens perfectly formatted, allows immediate guest access for comments/edits, and contains the correct Metadata table.
