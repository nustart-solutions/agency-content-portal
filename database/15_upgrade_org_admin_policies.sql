-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES UPDATE
-- Goal: Upgrade org_admin to full 'all' (manage) access
-- ==========================================

-- 1. Brands Table
drop policy if exists "Org admins can see child brands" on public.brands;
drop policy if exists "Org admins full access to child brands" on public.brands;

create policy "Org admins full access to child brands" on public.brands 
  for all using (
    organization_id in (select organization_id from public.user_roles where user_id = auth.uid() and role = 'org_admin')
  )
  with check (
    organization_id in (select organization_id from public.user_roles where user_id = auth.uid() and role = 'org_admin')
  );

-- 2. Campaign Groups Table
drop policy if exists "Org admins can see child groups" on public.campaign_groups;
drop policy if exists "Org admins full access to child groups" on public.campaign_groups;

create policy "Org admins full access to child groups" on public.campaign_groups 
  for all using (
    brand_id in (
      select b.id from public.brands b
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  )
  with check (
    brand_id in (
      select b.id from public.brands b
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

-- 3. Campaign Subgroups Table
drop policy if exists "Org admins can see child subgroups" on public.campaign_subgroups;
drop policy if exists "Org admins full access to child subgroups" on public.campaign_subgroups;

create policy "Org admins full access to child subgroups" on public.campaign_subgroups 
  for all using (
    campaign_group_id in (
      select cg.id from public.campaign_groups cg
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  )
  with check (
    campaign_group_id in (
      select cg.id from public.campaign_groups cg
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

-- 4. Campaigns Table
drop policy if exists "Org admins can see child campaigns" on public.campaigns;
drop policy if exists "Org admins full access to child campaigns" on public.campaigns;

create policy "Org admins full access to child campaigns" on public.campaigns 
  for all using (
    campaign_subgroup_id in (
      select csg.id from public.campaign_subgroups csg
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  )
  with check (
    campaign_subgroup_id in (
      select csg.id from public.campaign_subgroups csg
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );

-- 5. Assets Table
drop policy if exists "Org admins can see child assets" on public.assets;
drop policy if exists "Org admins full access to child assets" on public.assets;

create policy "Org admins full access to child assets" on public.assets 
  for all using (
    campaign_id in (
      select c.id from public.campaigns c
      join public.campaign_subgroups csg on c.campaign_subgroup_id = csg.id
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  )
  with check (
    campaign_id in (
      select c.id from public.campaigns c
      join public.campaign_subgroups csg on c.campaign_subgroup_id = csg.id
      join public.campaign_groups cg on csg.campaign_group_id = cg.id
      join public.brands b on cg.brand_id = b.id
      join public.user_roles u on b.organization_id = u.organization_id
      where u.user_id = auth.uid() and u.role = 'org_admin'
    )
  );
