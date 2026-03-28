-- Migration to support Google Docs exports
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS google_doc_url TEXT;
