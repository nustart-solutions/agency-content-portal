-- Add an idempotent column to prevent duplicate notifications from external background syncs
ALTER TABLE public.asset_notifications 
ADD COLUMN IF NOT EXISTS source_id text;

-- Create a unique constraint on source_id so we do not log the exact same external mention twice.
-- Note: PostgreSQL UNIQUE constraints permit multiple NULL values, which is exactly what we want 
-- for natively generated "manual" notifications.
ALTER TABLE public.asset_notifications 
DROP CONSTRAINT IF EXISTS asset_notifications_source_id_key;

ALTER TABLE public.asset_notifications 
ADD CONSTRAINT asset_notifications_source_id_key UNIQUE (source_id);
