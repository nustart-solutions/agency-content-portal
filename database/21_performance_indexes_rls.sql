-- =============================================================
-- 21: Performance remediation (applied to live DB 2026-07-24)
-- Fixes dashboard statement timeouts found via Supabase advisors:
--   1. Covering indexes for every unindexed foreign key in the
--      org -> brand -> group -> subgroup -> campaign -> asset chain.
--   2. RLS policies rewritten so auth.uid()/is_agency_admin() are
--      evaluated once per query (InitPlan) instead of once per row.
-- Policy logic/visibility is unchanged.
-- =============================================================

-- ---------- Part 1: Foreign key indexes ----------
create index if not exists idx_brands_organization_id on public.brands (organization_id);
create index if not exists idx_campaign_groups_brand_id on public.campaign_groups (brand_id);
create index if not exists idx_campaign_subgroups_group_id on public.campaign_subgroups (campaign_group_id);
create index if not exists idx_campaigns_subgroup_id on public.campaigns (campaign_subgroup_id);
create index if not exists idx_assets_campaign_id on public.assets (campaign_id);
create index if not exists idx_asset_notifications_asset_id on public.asset_notifications (asset_id);
create index if not exists idx_campaign_images_campaign_id on public.campaign_images (campaign_id);
create index if not exists idx_user_roles_user_id on public.user_roles (user_id);
create index if not exists idx_user_roles_brand_id on public.user_roles (brand_id);
create index if not exists idx_user_roles_organization_id on public.user_roles (organization_id);
-- Notifications widget always orders by notified_at desc
create index if not exists idx_asset_notifications_notified_at on public.asset_notifications (notified_at desc);

-- ---------- Part 2: RLS single-evaluation rewrite ----------
-- Pattern: wrap every auth.uid()/is_agency_admin() reference in a scalar
-- subselect. Postgres hoists it into an InitPlan, so the role lookup runs
-- once per statement instead of per candidate row.

-- organizations
alter policy "Agency admins full access to organizations" on public.organizations
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Org admins can see their mapped orgs" on public.organizations
  using (id in (select organization_id from user_roles where user_id = (select auth.uid()) and role = 'org_admin'));

-- brands
alter policy "Agency admins full access to brands" on public.brands
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Brand users can see mapped brands" on public.brands
  using (id in (select brand_id from user_roles where user_id = (select auth.uid()) and role = 'brand_user'));
alter policy "Org admins full access to child brands" on public.brands
  using (organization_id in (select organization_id from user_roles where user_id = (select auth.uid()) and role = 'org_admin'))
  with check (organization_id in (select organization_id from user_roles where user_id = (select auth.uid()) and role = 'org_admin'));

-- campaign_groups
alter policy "Agency admins full access to groups" on public.campaign_groups
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Brand users can see mapped groups" on public.campaign_groups
  using (brand_id in (select brand_id from user_roles where user_id = (select auth.uid()) and role = 'brand_user'));
alter policy "Org admins full access to child groups" on public.campaign_groups
  using (brand_id in (select b.id from brands b join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'))
  with check (brand_id in (select b.id from brands b join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'));

-- campaign_subgroups
alter policy "Agency admins full access to subgroups" on public.campaign_subgroups
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Brand users can see mapped subgroups" on public.campaign_subgroups
  using (campaign_group_id in (select cg.id from campaign_groups cg where cg.brand_id in (select brand_id from user_roles where user_id = (select auth.uid()) and role = 'brand_user')));
alter policy "Org admins full access to child subgroups" on public.campaign_subgroups
  using (campaign_group_id in (select cg.id from campaign_groups cg join brands b on cg.brand_id = b.id join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'))
  with check (campaign_group_id in (select cg.id from campaign_groups cg join brands b on cg.brand_id = b.id join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'));

-- campaigns
alter policy "Agency admins full access to campaigns" on public.campaigns
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Brand users can see mapped campaigns" on public.campaigns
  using (campaign_subgroup_id in (select csg.id from campaign_subgroups csg join campaign_groups cg on csg.campaign_group_id = cg.id where cg.brand_id in (select brand_id from user_roles where user_id = (select auth.uid()) and role = 'brand_user')));
alter policy "Org admins full access to child campaigns" on public.campaigns
  using (campaign_subgroup_id in (select csg.id from campaign_subgroups csg join campaign_groups cg on csg.campaign_group_id = cg.id join brands b on cg.brand_id = b.id join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'))
  with check (campaign_subgroup_id in (select csg.id from campaign_subgroups csg join campaign_groups cg on csg.campaign_group_id = cg.id join brands b on cg.brand_id = b.id join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'));

-- assets
alter policy "Agency admins full access to assets" on public.assets
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Brand users full access to mapped assets" on public.assets
  using (campaign_id in (select c.id from campaigns c join campaign_subgroups csg on c.campaign_subgroup_id = csg.id join campaign_groups cg on csg.campaign_group_id = cg.id where cg.brand_id in (select brand_id from user_roles where user_id = (select auth.uid()) and role = 'brand_user')))
  with check (campaign_id in (select c.id from campaigns c join campaign_subgroups csg on c.campaign_subgroup_id = csg.id join campaign_groups cg on csg.campaign_group_id = cg.id where cg.brand_id in (select brand_id from user_roles where user_id = (select auth.uid()) and role = 'brand_user')));
alter policy "Org admins full access to child assets" on public.assets
  using (campaign_id in (select c.id from campaigns c join campaign_subgroups csg on c.campaign_subgroup_id = csg.id join campaign_groups cg on csg.campaign_group_id = cg.id join brands b on cg.brand_id = b.id join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'))
  with check (campaign_id in (select c.id from campaigns c join campaign_subgroups csg on c.campaign_subgroup_id = csg.id join campaign_groups cg on csg.campaign_group_id = cg.id join brands b on cg.brand_id = b.id join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'));

-- asset_notifications
alter policy "Agency admins full access to asset notifications" on public.asset_notifications
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Brand users can insert mapped asset notifications" on public.asset_notifications
  with check (asset_id in (select a.id from assets a join campaigns c on a.campaign_id = c.id join campaign_subgroups csg on c.campaign_subgroup_id = csg.id join campaign_groups cg on csg.campaign_group_id = cg.id where cg.brand_id in (select brand_id from user_roles where user_id = (select auth.uid()) and role = 'brand_user')));
alter policy "Brand users can see mapped asset notifications" on public.asset_notifications
  using (asset_id in (select a.id from assets a join campaigns c on a.campaign_id = c.id join campaign_subgroups csg on c.campaign_subgroup_id = csg.id join campaign_groups cg on csg.campaign_group_id = cg.id where cg.brand_id in (select brand_id from user_roles where user_id = (select auth.uid()) and role = 'brand_user')));
alter policy "Org admins can see child asset notifications" on public.asset_notifications
  using (asset_id in (select a.id from assets a join campaigns c on a.campaign_id = c.id join campaign_subgroups csg on c.campaign_subgroup_id = csg.id join campaign_groups cg on csg.campaign_group_id = cg.id join brands b on cg.brand_id = b.id join user_roles u on b.organization_id = u.organization_id where u.user_id = (select auth.uid()) and u.role = 'org_admin'));

-- user_roles
alter policy "Agency admins full access to user roles" on public.user_roles
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Users can read their own roles" on public.user_roles
  using ((select auth.uid()) = user_id);

-- global_channel_templates
alter policy "Agency admins can delete global templates" on public.global_channel_templates
  using ((select is_agency_admin((select auth.uid()))));
alter policy "Agency admins can insert global templates" on public.global_channel_templates
  with check ((select is_agency_admin((select auth.uid()))));
alter policy "Agency admins can update global templates" on public.global_channel_templates
  using ((select is_agency_admin((select auth.uid()))))
  with check ((select is_agency_admin((select auth.uid()))));
