-- =============================================================
-- 22: Store the last AI generation error on the asset
-- Modal writes a readable message here when generation fails
-- (e.g. "credit balance too low") and clears it on success, so
-- the portal can show why an asset went back to Draft instead of
-- failing silently. Additive and nullable; no RLS changes needed
-- (covered by the existing row-level policies on assets).
-- =============================================================

alter table public.assets add column if not exists generation_error text;
