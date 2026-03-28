-- 07_asset_execution_logs.sql
-- Goal: Provide super admins transparency into the exact prompt assembled by the Python Execution Layer.

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS compiled_prompt TEXT;

-- No new RLS policies needed, as assets already inherit RLS from campaigns and access is checked via API and UI.
