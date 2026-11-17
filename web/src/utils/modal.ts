// Server-only helper for calling the Modal webhooks (execution/modal_pipeline.py).
//
// Always AWAIT this. A fetch that is not awaited ("fire and forget") can be
// dropped on Vercel: the function is frozen as soon as the server action
// returns, so the request may never leave. The long jobs (generate_asset,
// generate_brand_context) reply within seconds with {accepted: true} and do
// the work in the background, so waiting here is cheap.

type ModalEnvVar =
  | 'MODAL_GENERATE_ASSET_URL'
  | 'MODAL_INGEST_ASSET_URL'
  | 'MODAL_PUBLISH_ASSET_URL'
  | 'MODAL_GENERATE_BRAND_CONTEXT_URL'
  | 'MODAL_SYNC_ASSET_URL'

export type ModalResult = { ok: true } | { ok: false; error: string }

export async function callModal(
  envVar: ModalEnvVar,
  body: Record<string, unknown>,
  timeoutMs = 60_000,
): Promise<ModalResult> {
  const url = process.env[envVar]
  if (!url) {
    return { ok: false, error: `${envVar} is not set in the Vercel environment variables.` }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.error) {
      return { ok: false, error: data?.error || `Modal returned HTTP ${res.status}.` }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Could not reach Modal: ${message}` }
  }
}
