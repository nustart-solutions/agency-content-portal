-- Security Advisor Fixes

-- 1. Fix Function Search Path Mutable for Vault Integration Functions
-- Note: Re-creating the functions with `set search_path = ''` to ensure they are secure
-- against search_path manipulation attacks (Security Definer requires this).

create or replace function public.set_brand_credentials(p_brand_id uuid, p_credentials_json text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_has_access boolean;
  v_secret_name text;
begin
  -- Get the Auth UUID of the API caller
  v_user_id := auth.uid();
  
  -- If there's an authenticated user calling this, check their permissions
  if v_user_id is not null then
    select exists (
      select 1 from public.user_roles ur
      where ur.user_id = v_user_id and ur.role = 'agency_admin'
    ) into v_has_access;
    
    if not v_has_access then
      raise exception 'Unauthorized to update credentials for this brand';
    end if;
  end if;

  v_secret_name := 'brand_' || p_brand_id::text || '_credentials';
  
  -- Delete the old secret if it exists before recreating
  if exists (select 1 from vault.secrets where name = v_secret_name) then
    delete from vault.secrets where name = v_secret_name;
  end if;

  perform vault.create_secret(
    p_credentials_json,
    v_secret_name,
    'Credentials for Brand ID: ' || p_brand_id::text
  );
end;
$$;


create or replace function public.get_brand_credentials(p_brand_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_name text;
  v_decrypted text;
begin
  -- Restrict execution to the anon/authenticated roles? NO!
  -- We ONLY want backend services (like Modal using Service Role) to read this.
  -- In Supabase, the role of the caller is available via `current_user` or auth context.
  if current_user != 'service_role' and current_user != 'postgres' then
     raise exception 'Only backend services can decrypt client credentials!';
  end if;

  v_secret_name := 'brand_' || p_brand_id::text || '_credentials';
  
  select decrypted_secret into v_decrypted
  from vault.decrypted_secrets
  where name = v_secret_name;
  
  return v_decrypted;
end;
$$;


-- 2. Fix Overly Permissive RLS Policies on global_channel_templates
-- The previous policies used USING (true) for UPDATE/INSERT/DELETE for authenticated users,
-- which effectively bypassed RLS checks for mutative actions. We'll restrict them to agency admins.

-- Drop old, permissive policies
DROP POLICY IF EXISTS "Authenticated users can update global templates" ON public.global_channel_templates;
DROP POLICY IF EXISTS "Authenticated users can insert global templates" ON public.global_channel_templates;
DROP POLICY IF EXISTS "Authenticated users can delete global templates" ON public.global_channel_templates;

-- Create strict policies leveraging public.is_agency_admin() check
CREATE POLICY "Agency admins can update global templates"
ON public.global_channel_templates FOR UPDATE
TO authenticated
USING (public.is_agency_admin(auth.uid()))
WITH CHECK (public.is_agency_admin(auth.uid()));

CREATE POLICY "Agency admins can insert global templates"
ON public.global_channel_templates FOR INSERT
TO authenticated
WITH CHECK (public.is_agency_admin(auth.uid()));

CREATE POLICY "Agency admins can delete global templates"
ON public.global_channel_templates FOR DELETE
TO authenticated
USING (public.is_agency_admin(auth.uid()));
