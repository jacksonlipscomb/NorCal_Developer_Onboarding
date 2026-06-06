-- Enforced sign-up eligibility gate (Supabase "Before User Created" Auth Hook).
--
-- Removing the shared Basic Auth gate + open sign-up would let anyone on the internet
-- register. This hook rejects sign-ups whose email is outside the approved domain, enforced
-- in the database so it can't be bypassed by a direct REST client. Registered as a hook in
-- supabase/config.toml (local) and in the dashboard/Management API (prod).

create or replace function public.restrict_signup_domain(event jsonb)
  returns jsonb language plpgsql as $$
declare
  email text;
begin
  email := event #>> '{user,email}'; -- Before User Created payload: event->'user'->>'email'
  -- domains are case-insensitive: lower() so NewHire@NorCalCrew.org is accepted
  if lower(split_part(coalesce(email, ''), '@', 2)) <> 'norcalcrew.org' then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code', 403,
        'message', 'Sign-up is restricted to approved @norcalcrew.org email addresses.'
      )
    );
  end if;
  return '{}'::jsonb; -- allow
end;
$$;

-- The Auth admin role must both REACH the schema and EXECUTE the hook (Supabase requires both).
grant usage on schema public to supabase_auth_admin;
grant execute on function public.restrict_signup_domain to supabase_auth_admin;
revoke execute on function public.restrict_signup_domain from authenticated, anon, public;
