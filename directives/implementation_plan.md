# Directive: Automated Context Generation Pipeline

**Layer 1 Context**: This directive outlines the standard operating procedure for generating, storing, and retrieving standardized Brand Contexts. It serves as the bridge between the Orchestration layer (Next.js UI) and the Execution layer (Modal Python webhooks).

## 1. Goal
Enforce a rigorous, highly flexible structure for context generation, standardization, and retrieval. When a new Brand is created, the system must autonomously scrape their website and synthesize pillars of brand identity securely into a dedicated relational database table (`brand_contexts`) to allow for rich client editing.

## 2. Inputs
- `brand_id` (UUID): The unique identifier for the brand in Supabase.
- `website_url` (Text): The primary domain of the brand (e.g., `https://example.com`).

## 3. Outputs (Deliverables)
The system will rigidly generate scalable Context Entities in a `1-to-many` relational table format. Supported out-of-the-box contexts:
- `brand-voice`
- `features`
- `target-keywords`
- `seo-guidelines`
- `style-guide`
- `internal-links-map`
- `competitor-analysis`

## 4. Execution Workflow (Layer 3)
### Database Migrations (`database/06_brand_contexts.sql`)
1. Add `website_url` (text) and `context_status` (varchar default 'missing') to `public.brands`.
2. **Create New Table `public.brand_contexts`:**
   - `id` (uuid)
   - `brand_id` (uuid, FK to brands)
   - `context_type` (varchar, e.g., 'brand-voice', 'target-keywords')
   - `content_markdown` (text)
3. Ensure RLS policies guarantee brand isolation.

### Python Webhook (`execution/modal_pipeline.py`)
- Define a new Model Webhook: `/generate_brand_context`.
- **Steps:**
  1. Receive `{ "brand_id": "...", "website_url": "..." }`.
  2. Scrape the homepage (via `requests`/`BeautifulSoup`).
  3. Prompt Gemini 2.5 to synthesize the URL content into a JSON structure mapping directly to `context_type` and `content_markdown`.
  4. Perform a batch insert/upsert into `public.brand_contexts`.
  5. Update `public.brands` `context_status` to `'ready'`.

### Future Retrieval Update
- The `/generate_asset` webhook must be modified to query `SELECT context_type, content_markdown FROM brand_contexts WHERE brand_id = X` to build the ultimate System Prompt before firing content back to Gemini.

## 5. Orchestration Implications (Layer 2)
### Next.js UI (`web/`)
- **Genesis:** Capture `website_url` in `CreateBrandModal.tsx` and trigger the Modal webhook asynchronously securely via `actions.ts`.
- **Editing (The Markdown Solution):** Create a dedicated `Brand Settings > Contexts` tab. Fetch rows from `brand_contexts`.
- Build a **Rich Markdown Editor** Component (e.g., Markdown Preview + Textarea, or a WYSIWYG implementation mapping to Markdown). This enables the client to richly format links, bold text, and lists without destroying the programmatic AI-readability of the underlying raw Markdown.

## 6. Open Questions & Edge Cases
- **Scraping Depth:** Does the crawler need depth (following links) or will the homepage suffice due to Gemini's huge intrinsic model memory?
- **Failure Handling:** If the site actively blocks scraping (403 Forbidden), what is the fallback context status?

*(End of Directive)*
