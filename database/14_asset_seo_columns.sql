-- database/14_asset_seo_columns.sql

-- Add SEO & WordPress tracking columns to assets table
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
ADD COLUMN IF NOT EXISTS wordpress_post_url TEXT;
