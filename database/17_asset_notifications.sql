-- ==========================================
-- ASSET NOTIFICATIONS
-- Tracking history of sent Google Doc notifications
-- ==========================================

-- 1. Create the Asset Notifications Table
create table public.asset_notifications (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade not null,
  sender_email text not null,     -- Who initiated the notification
  recipient_email text not null,  -- Who was notified
  message text,                   -- Optional message content
  source_id text unique,          -- Unique ID for deduplication (e.g., from Google Docs)
  notified_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.asset_notifications enable row level security;

-- 3. RLS Policies (Mimicking the assets table hierarchy)

-- Agency Admins: Full Access
drop policy if exists "Agency admins full access to asset notifications" on public.asset_notifications;
create policy "Agency admins full access to asset notifications" on public.asset_notifications 
  for all using (public.is_agency_admin(auth.uid()));

-- Org Admins: Can view all notifications for their mapped organizations
drop policy if exists "Org admins can see child asset notifications" on public.asset_notifications;
create policy "Org admins can see child asset notifications" on public.asset_notifications 
  for select using (
    asset_id in (
      select a.id from public.assets a
      join public.campaigns c on a.campaign_id = c.id
      join public.campaign_subgroups csg on c.campaign_subgroup_id = csg.id
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

-- Brand Users: Can view notifications for assets belonging to their Brands
drop policy if exists "Brand users can see mapped asset notifications" on public.asset_notifications;
create policy "Brand users can see mapped asset notifications" on public.asset_notifications 
  for select using (
    asset_id in (
      select a.id from public.assets a
      join public.campaigns c on a.campaign_id = c.id
      join public.campaign_subgroups csg on c.campaign_subgroup_id = csg.id
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      where cg.brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
    )
  );

-- Brand Users: Can INSERT new notifications for assets belonging to their Brands
drop policy if exists "Brand users can insert mapped asset notifications" on public.asset_notifications;
create policy "Brand users can insert mapped asset notifications" on public.asset_notifications 
  for insert with check (
    asset_id in (
      select a.id from public.assets a
      join public.campaigns c on a.campaign_id = c.id
      join public.campaign_subgroups csg on c.campaign_subgroup_id = csg.id
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      where cg.brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
    )
  );
