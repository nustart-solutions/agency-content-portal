-- Add deep_research flag to the assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS deep_research BOOLEAN DEFAULT FALSE;

-- End of migration
