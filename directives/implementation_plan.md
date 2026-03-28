# Directive: Automated Context Generation Pipeline

**Layer# Asset Execution & Transparency Layer

The user wants to bridge the frontend UI with the Python execution layer (Modal) and, most importantly, wants full transparency into what context and templates are actually being passed to the LLM. 

## Proposed Changes

### Database
Update the database to track the compiled prompt sent to the LLM.

#### [NEW] `database/07_asset_execution_logs.sql`
- Add `compiled_prompt TEXT` column to the `assets` table.
- This will allow the Modals webhook to write the exact prompt it sent to Gemini down to the character.

---

### Python Execution Layer

#### [MODIFY] `execution/modal_pipeline.py`
- Modify the `generate_asset` function.
- Before awaiting the Gemini response, it will save the `prompt` variable into the `assets.compiled_prompt` column. This creates a permanent, auditable log of what context was sent.

---

### Frontend Next.js Admin UI

#### [MODIFY] `web/src/app/dashboard/campaigns/[id]/page.tsx`
- Make the Asset Title a clickable `<Link href="/dashboard/assets/{asset.id}">`. Currently, it's just raw text.

#### [NEW] `web/src/app/dashboard/assets/[id]/page.tsx`
- Build a new detail view for individual Assets.
- **Top Section**: Read-only (or manageable) view of the generated `content_markdown`.
- **Transparency Section**: A dedicated "AI Execution Context" accordion or side-panel that reveals `asset.compiled_prompt` so an Agency Admin can see exactly which Knowledge Bank variables and prompt templates made it into the shot.

## Open Questions

1. **Local webhook testing**: Since we are about to trigger the execution layer from the frontend, do you want us to set up standard mock triggers so we can verify the DB and UI without actually burning Gemini API credits/Modal compute right away, or should we wire it straight up?
2. **Text Editor**: For the generated `content_markdown` variable showing up in the UI, do you want just a raw `<textarea>` for MVP, or a read-only rendered markdown block?

## Verification Plan

### Manual Verification
- I will create a dummy asset in the Campaign UI.
- I will manually trigger the Python webhook via a script or button.
- I will navigate to the new `assets/[id]` page and visually confirm both the Content and the exact Prompt Context are visible.-guidelines`
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
