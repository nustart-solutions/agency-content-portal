-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Goal: Strict Agency, Organization, and Brand Isolation
-- ==========================================

-- 1. Helper Function: Is Current User an Agency Admin?
drop function if exists public.is_agency_admin();
create or replace function public.is_agency_admin(check_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = check_user_id and role = 'agency_admin'
  );
$$ language sql security definer set search_path = public;

-- ==========================================
-- 2. User Roles Table
-- ==========================================
drop policy if exists "Agency admins full access to user roles" on public.user_roles;
create policy "Agency admins full access to user roles" on public.user_roles 
  for all using (public.is_agency_admin(auth.uid()));

drop policy if exists "Users can read their own roles" on public.user_roles;
create policy "Users can read their own roles" on public.user_roles 
  for select using (auth.uid() = user_id);

-- ==========================================
-- 3. Organizations Table
-- ==========================================
drop policy if exists "Agency admins full access to organizations" on public.organizations;
create policy "Agency admins full access to organizations" on public.organizations 
  for all using (public.is_agency_admin(auth.uid()));

drop policy if exists "Org admins can see their mapped orgs" on public.organizations;
create policy "Org admins can see their mapped orgs" on public.organizations 
  for select using (
    id in (select organization_id from public.user_roles where user_id = auth.uid() and role = 'org_admin')
  );

-- ==========================================
-- 4. Brands Table
-- ==========================================
drop policy if exists "Agency admins full access to brands" on public.brands;
create policy "Agency admins full access to brands" on public.brands 
  for all using (public.is_agency_admin(auth.uid()));

drop policy if exists "Org admins can see child brands" on public.brands;
create policy "Org admins can see child brands" on public.brands 
  for select using (
    organization_id in (select organization_id from public.user_roles where user_id = auth.uid() and role = 'org_admin')
  );

drop policy if exists "Brand users can see mapped brands" on public.brands;
create policy "Brand users can see mapped brands" on public.brands 
  for select using (
    id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
  );

-- ==========================================
-- 5. Campaign Groups Table
-- ==========================================
drop policy if exists "Agency admins full access to groups" on public.campaign_groups;
create policy "Agency admins full access to groups" on public.campaign_groups 
  for all using (public.is_agency_admin(auth.uid()));

drop policy if exists "Org admins can see child groups" on public.campaign_groups;
create policy "Org admins can see child groups" on public.campaign_groups 
  for select using (
    brand_id in (
      select b.id from public.brands b
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

drop policy if exists "Brand users can see mapped groups" on public.campaign_groups;
create policy "Brand users can see mapped groups" on public.campaign_groups 
  for select using (
    brand_id in (select brand_id from public.user_roles where user_id = auth.uid() and role = 'brand_user')
  );

-- ==========================================
-- 6. Campaign Subgroups Table
-- ==========================================
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

-- ==========================================
-- 7. Campaigns Table
-- ==========================================
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

-- ==========================================
-- 8. Assets Table
-- ==========================================
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
