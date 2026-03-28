-- ==========================================
-- SCHEMA UPDATE MIGRATION
-- Adds Campaign Subgroups layer to hierarchy
-- ==========================================

-- 1. DROP EXISTING TABLES (Safe because they have no production data yet)
drop table if exists public.assets cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.campaign_subgroups cascade;

-- 2. CREATE NEW SUBGROUPS TABLE
create table public.campaign_subgroups (
  id uuid primary key default gen_random_uuid(),
  campaign_group_id uuid references public.campaign_groups(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CREATE NEW CAMPAIGNS TABLE (Now mapped to Subgroups)
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_subgroup_id uuid references public.campaign_subgroups(id) on delete cascade not null,
  name text not null,
  target_publish_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CREATE NEW ASSETS TABLE (Mapped to Campaigns)
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  title text not null,
  asset_type text not null, -- E.g., 'anchor_article', 'social_post', 'email_newsletter'
  status text not null default 'draft', -- 'draft', 'awaiting_approval', 'approved', 'sync_failed'
  google_doc_url text,
  wordpress_post_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ENABLE ROW LEVEL SECURITY
alter table public.campaign_subgroups enable row level security;
alter table public.campaigns enable row level security;
alter table public.assets enable row level security;

-- 6. POLICIES: CAMPAIGN SUBGROUPS
drop policy if exists "Agency admins full access to subgroups" on public.campaign_subgroups;
create policy "Agency admins full access to subgroups" on public.campaign_subgroups 
  for all using (public.is_agency_admin(auth.uid()));

drop policy if exists "Org admins can see child subgroups" on public.campaign_subgroups;
create policy "Org admins can see child subgroups" on public.campaign_subgroups 
  for select using (
    campaign_group_id in (
      select cg.id from public.campaign_groups cg
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

drop policy if exists "Brand users can see mapped subgroups" on public.campaign_subgroups;
create policy "Brand users can see mapped subgroups" on public.campaign_subgroups 
  for select using (
    campaign_group_id in (
      select cg.id from public.campaign_groups cg
      where cg.brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
    )
  );

-- 7. POLICIES: CAMPAIGNS
drop policy if exists "Agency admins full access to campaigns" on public.campaigns;
create policy "Agency admins full access to campaigns" on public.campaigns 
  for all using (public.is_agency_admin(auth.uid()));

drop policy if exists "Org admins can see child campaigns" on public.campaigns;
create policy "Org admins can see child campaigns" on public.campaigns 
  for select using (
    campaign_subgroup_id in (
      select csg.id from public.campaign_subgroups csg
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

drop policy if exists "Brand users can see mapped campaigns" on public.campaigns;
create policy "Brand users can see mapped campaigns" on public.campaigns 
  for select using (
    campaign_subgroup_id in (
      select csg.id from public.campaign_subgroups csg
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      where cg.brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
    )
  );

-- 8. POLICIES: ASSETS
drop policy if exists "Agency admins full access to assets" on public.assets;
create policy "Agency admins full access to assets" on public.assets 
  for all using (public.is_agency_admin(auth.uid()));

drop policy if exists "Org admins can see child assets" on public.assets;
create policy "Org admins can see child assets" on public.assets 
  for select using (
    campaign_id in (
      select c.id from public.campaigns c
      join public.campaign_subgroups csg on c.campaign_subgroup_id = csg.id
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

drop policy if exists "Brand users can see mapped assets" on public.assets;
create policy "Brand users can see mapped assets" on public.assets 
  for select using (
    campaign_id in (
      select c.id from public.campaigns c
      join public.campaign_subgroups csg on c.campaign_subgroup_id = csg.id
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      where cg.brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
    )
  );
