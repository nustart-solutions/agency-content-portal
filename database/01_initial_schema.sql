-- 1. Organizations (Top Level Agencies/Clients)
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Brands (Sub-Clients/Divisions)
create table public.brands (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Campaign Groups (Broad initiatives)
create table public.campaign_groups (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4b. Campaign Subgroups (Nested sub-initiatives)
create table public.campaign_subgroups (
  id uuid primary key default gen_random_uuid(),
  campaign_group_id uuid references public.campaign_groups(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Campaigns (Specific, actionable runs)
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_subgroup_id uuid references public.campaign_subgroups(id) on delete cascade not null,
  name text not null,
  target_publish_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Assets (The actual content pieces: Anchors, Social, etc)
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

-- 6. User Roles (Linking Auth to our Data Model)
create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('agency_admin', 'org_admin', 'brand_user')),
  organization_id uuid references public.organizations(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all tables (Policies to be added next)
alter table public.organizations enable row level security;
alter table public.brands enable row level security;
alter table public.campaign_groups enable row level security;
alter table public.campaigns enable row level security;
alter table public.assets enable row level security;
alter table public.user_roles enable row level security;
