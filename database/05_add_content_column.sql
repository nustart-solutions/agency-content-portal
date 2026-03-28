-- 05_add_content_column.sql
-- Goal: Decouple assets entirely from Google Docs by storing generated markdown natively.

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS content_markdown TEXT;

-- Update RLS policies (optional, standard asset policies already grant column access, 
-- but this comment is here to remind us that no explicit column-level policy is needed)
