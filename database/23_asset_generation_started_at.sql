-- =============================================================
-- 23: When the current AI generation run started
-- The Modal worker stamps this when it begins; the reset_stuck_assets
-- cron puts assets still "in_progress" 20+ minutes later back to draft
-- (a crash or timeout skips the worker's own clean-up). Additive and
-- nullable; covered by the existing row-level policies on assets.
-- =============================================================

alter table public.assets add column if not exists generation_started_at timestamptz;
