-- database/10_asset_spokes.sql

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS anchor_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS published_url TEXT;

-- Index for querying spokes by anchor
CREATE INDEX IF NOT EXISTS idx_assets_anchor_id ON public.assets(anchor_asset_id);
