-- 04_execution_integration.sql
-- 1. Add requires_approval column to brands
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;

-- 2. Create the Storage Bucket for brand__contexts (Markdown files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand_contexts',
  'brand_contexts',
  false, -- private bucket
  5242880, -- 5MB limit for markdown files
  ARRAY['text/markdown', 'text/plain', 'application/json', 'text/csv']
) ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS Policies
-- We need to ensure brand_users can only access folders matching their brand_id
-- Path structure: brand_id/filename.md (e.g., "123e4567-e89b-12d3-a456-426614174000/brand-voice.md")

-- Helper Function to check if a user has access to a specific brand
CREATE OR REPLACE FUNCTION public.has_brand_access(check_brand_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Agency Admins
  IF public.is_agency_admin(auth.uid()) THEN RETURN true; END IF;
  
  -- Org Admins
  IF EXISTS (
    SELECT 1 FROM public.brands b
    JOIN public.user_roles u ON b.organization_id = u.organization_id
    WHERE b.id = check_brand_id AND u.user_id = auth.uid() AND u.role = 'org_admin'
  ) THEN RETURN true; END IF;

  -- Brand Users
  IF EXISTS (
    SELECT 1 FROM public.user_roles u
    WHERE u.brand_id = check_brand_id AND u.user_id = auth.uid() AND u.role = 'brand_user'
  ) THEN RETURN true; END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allow users to SELECT objects if they have access to the brand
DROP POLICY IF EXISTS "Users can view brand context files" ON storage.objects;
CREATE POLICY "Users can view brand context files" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand_contexts' AND
  public.has_brand_access((storage.foldername(name))[1]::uuid)
);

-- Allow users to INSERT objects if they have access to the brand
DROP POLICY IF EXISTS "Users can upload brand context files" ON storage.objects;
CREATE POLICY "Users can upload brand context files" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand_contexts' AND
  public.has_brand_access((storage.foldername(name))[1]::uuid)
);

-- Allow users to UPDATE objects if they have access to the brand
DROP POLICY IF EXISTS "Users can update brand context files" ON storage.objects;
CREATE POLICY "Users can update brand context files" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand_contexts' AND
  public.has_brand_access((storage.foldername(name))[1]::uuid)
);

-- Allow users to DELETE objects if they have access to the brand
DROP POLICY IF EXISTS "Users can delete brand context files" ON storage.objects;
CREATE POLICY "Users can delete brand context files" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand_contexts' AND
  public.has_brand_access((storage.foldername(name))[1]::uuid)
);
