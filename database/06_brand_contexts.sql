-- Add website and context tracking to the brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS context_status VARCHAR(50) DEFAULT 'missing';

-- Create the robust flexible 1-to-many Context table
CREATE TABLE IF NOT EXISTS public.brand_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    
    -- Ensure we don't accidentally create two 'brand-voice' contexts for the exact same brand
    UNIQUE(brand_id, context_type)
);

-- Turn on Row Level Security
ALTER TABLE public.brand_contexts ENABLE ROW LEVEL SECURITY;

-- Service Role Policy (Modal/Backend)
CREATE POLICY "Service Role Full Access for Contexts"
ON public.brand_contexts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated Users Policies using our established helper function
CREATE POLICY "Users can view contexts for their brands"
ON public.brand_contexts FOR SELECT
TO authenticated
USING (public.has_brand_access(brand_id));

CREATE POLICY "Users can insert contexts for their brands"
ON public.brand_contexts FOR INSERT
TO authenticated
WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY "Users can update contexts for their brands"
ON public.brand_contexts FOR UPDATE
TO authenticated
USING (public.has_brand_access(brand_id))
WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY "Users can delete contexts for their brands"
ON public.brand_contexts FOR DELETE
TO authenticated
USING (public.has_brand_access(brand_id));
