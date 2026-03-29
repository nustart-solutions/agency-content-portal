-- 1. Enable Vault Extension
create extension if not exists supabase_vault with schema vault;

-- 2. Create the SET function to store credentials securely.
-- This is Security Definer so it can write to vault.secrets, but we manually check authorization.
create or replace function public.set_brand_credentials(p_brand_id uuid, p_credentials_json text)
returns void
language plpgsql
security definer
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
      join public.brands b on (ur.role = 'agency_admin' or b.organization_id = ur.organization_id or b.id = ur.brand_id)
      where ur.user_id = v_user_id and b.id = p_brand_id
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

-- 3. Create the GET function to read credentials securely.
-- This is RESTRICTED to the Service Role only (Backend / Modal Pipelines).
-- Regular users (Frontend React) CANNOT read the decrypted secrets back!
create or replace function public.get_brand_credentials(p_brand_id uuid)
returns text
language plpgsql
security definer
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
