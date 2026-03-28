-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Goal: Strict Agency, Organization, and Brand Isolation
-- ==========================================

-- 1. Helper Function: Is Current User an Agency Admin?
-- This is a fast 'security definer' function that checks the top-level role instantly.
create or replace function public.is_agency_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role = 'agency_admin'
  );
$$ language sql security definer;

-- ==========================================
-- 2. User Roles Table
-- ==========================================
create policy "Agency admins full access to user roles" on public.user_roles 
  for all using (public.is_agency_admin());

create policy "Users can read their own roles" on public.user_roles 
  for select using (auth.uid() = user_id);

-- ==========================================
-- 3. Organizations Table
-- ==========================================
create policy "Agency admins full access to organizations" on public.organizations 
  for all using (public.is_agency_admin());

create policy "Org admins can see their mapped orgs" on public.organizations 
  for select using (
    id in (select organization_id from public.user_roles where user_id = auth.uid() and role = 'org_admin')
  );

-- ==========================================
-- 4. Brands Table
-- ==========================================
create policy "Agency admins full access to brands" on public.brands 
  for all using (public.is_agency_admin());

create policy "Org admins can see child brands" on public.brands 
  for select using (
    organization_id in (select organization_id from public.user_roles where user_id = auth.uid() and role = 'org_admin')
  );

create policy "Brand users can see mapped brands" on public.brands 
  for select using (
    id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
  );

-- ==========================================
-- 5. Campaign Groups Table
-- ==========================================
create policy "Agency admins full access to groups" on public.campaign_groups 
  for all using (public.is_agency_admin());

create policy "Org admins can see child groups" on public.campaign_groups 
  for select using (
    brand_id in (
      select b.id from public.brands b
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

create policy "Brand users can see mapped groups" on public.campaign_groups 
  for select using (
    brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
  );

-- ==========================================
-- 6. Campaigns Table
-- ==========================================
create policy "Agency admins full access to campaigns" on public.campaigns 
  for all using (public.is_agency_admin());

create policy "Org admins can see child campaigns" on public.campaigns 
  for select using (
    campaign_group_id in (
      select cg.id from public.campaign_groups cg
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

create policy "Brand users can see mapped campaigns" on public.campaigns 
  for select using (
    campaign_group_id in (
      select cg.id from public.campaign_groups cg
      where cg.brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
    )
  );

-- ==========================================
-- 7. Assets Table
-- ==========================================
create policy "Agency admins full access to assets" on public.assets 
  for all using (public.is_agency_admin());

create policy "Org admins can see child assets" on public.assets 
  for select using (
    campaign_id in (
      select c.id from public.campaigns c
      join public.campaign_groups cg on c.campaign_group_id = cg.id
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

create policy "Brand users can see mapped assets" on public.assets 
  for select using (
    campaign_id in (
      select c.id from public.campaigns c
      join public.campaign_groups cg on c.campaign_group_id = cg.id
      where cg.brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
    )
  );
