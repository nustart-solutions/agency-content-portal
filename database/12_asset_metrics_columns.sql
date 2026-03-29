-- Add lifecycle tracking columns to assets table
-- This allows us to measure approval velocity and calculate published asset counts on the scoreboard

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Optional: Since we already have data, we won't try to backfill these retrospectively, as the created_at might be old.
-- New actions will trigger the population of these columns.
