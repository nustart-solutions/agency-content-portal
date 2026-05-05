-- 20_campaign_images_tracking.sql

CREATE TABLE public.campaign_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected')),
    comments TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.campaign_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view campaign image tracking" ON public.campaign_images;
CREATE POLICY "Users can view campaign image tracking" ON public.campaign_images
FOR SELECT TO authenticated USING (public.has_campaign_access(campaign_id));

DROP POLICY IF EXISTS "Users can insert campaign image tracking" ON public.campaign_images;
CREATE POLICY "Users can insert campaign image tracking" ON public.campaign_images
FOR INSERT TO authenticated WITH CHECK (public.has_campaign_access(campaign_id));

DROP POLICY IF EXISTS "Users can update campaign image tracking" ON public.campaign_images;
CREATE POLICY "Users can update campaign image tracking" ON public.campaign_images
FOR UPDATE TO authenticated USING (public.has_campaign_access(campaign_id));

DROP POLICY IF EXISTS "Users can delete campaign image tracking" ON public.campaign_images;
CREATE POLICY "Users can delete campaign image tracking" ON public.campaign_images
FOR DELETE TO authenticated USING (public.has_campaign_access(campaign_id));
