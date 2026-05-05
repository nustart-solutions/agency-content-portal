-- 19_campaign_images_storage.sql

-- 1. Create the Storage Bucket for campaign_images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign_images',
  'campaign_images',
  true, -- public bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- 2. Helper Function to check if a user has access to a specific campaign
CREATE OR REPLACE FUNCTION public.has_campaign_access(check_campaign_id uuid)
RETURNS boolean AS $$
DECLARE
  resolved_brand_id uuid;
BEGIN
  -- Resolve brand_id from the campaign
  SELECT cg.brand_id INTO resolved_brand_id
  FROM public.campaigns c
  JOIN public.campaign_subgroups cs ON c.campaign_subgroup_id = cs.id
  JOIN public.campaign_groups cg ON cs.campaign_group_id = cg.id
  WHERE c.id = check_campaign_id;
  
  IF resolved_brand_id IS NULL THEN
    RETURN false;
  END IF;

  -- Delegate to the existing has_brand_access function
  RETURN public.has_brand_access(resolved_brand_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Set up Storage RLS Policies
-- Path structure: campaign_id/filename.ext (e.g., "123e4567-.../banner.jpg")

DROP POLICY IF EXISTS "Users can view campaign images" ON storage.objects;
CREATE POLICY "Users can view campaign images" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'campaign_images' AND
  public.has_campaign_access((storage.foldername(name))[1]::uuid)
);

DROP POLICY IF EXISTS "Users can upload campaign images" ON storage.objects;
CREATE POLICY "Users can upload campaign images" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaign_images' AND
  public.has_campaign_access((storage.foldername(name))[1]::uuid)
);

DROP POLICY IF EXISTS "Users can update campaign images" ON storage.objects;
CREATE POLICY "Users can update campaign images" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaign_images' AND
  public.has_campaign_access((storage.foldername(name))[1]::uuid)
);

DROP POLICY IF EXISTS "Users can delete campaign images" ON storage.objects;
CREATE POLICY "Users can delete campaign images" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaign_images' AND
  public.has_campaign_access((storage.foldername(name))[1]::uuid)
);
