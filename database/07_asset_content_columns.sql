-- database/07_asset_content_columns.sql

-- Add columns to store generated AI text and the transparency engine prompts
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS content_markdown TEXT,
ADD COLUMN IF NOT EXISTS compiled_prompt TEXT;
