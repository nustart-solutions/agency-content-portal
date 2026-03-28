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
- Append the `webViewLink` to the Supabase database write payload under the existing `google_doc_url` column.

---

### Dashboard UI (Next.js)

#### [MODIFY] `web/src/app/dashboard/assets/[id]/page.tsx`
- Pull the `google_doc_url` from the database.
- Add a prominent, styled "Open in Google Docs" button at the top-right of the Asset Viewer panel, allowing clients and admins to jump directly into the live collaboration environment.

#### [MODIFY] `web/src/app/dashboard/campaigns/[id]/page.tsx`
- Add a small Google Drive icon/link next to the Status badge on the main campaign grid if a `google_doc_url` is present, for quick access.

## Open Questions

> [!WARNING]
> Do you currently have a generic **Google Cloud Service Account JSON file** (with Drive API enabled) that we can upload into a Modal Secret called `google-service-account`?
> If not, I can guide you through the 60-second process of grabbing one from the Google Cloud Console.

## Verification Plan

### Manual Verification
1. Trigger a fresh Asset Generation from the Dashboard.
2. Verify Modal successfully converts the markdown to a Google Doc with the prepended HTML table.
3. Click the new "Open in Google Docs" button in the Dashboard UI.
4. Verify the Google Doc opens perfectly formatted, allows immediate guest access for comments/edits, and contains the correct Metadata table.
