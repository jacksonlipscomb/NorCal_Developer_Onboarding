-- Contract tests for per-user step seeding (migration 0005). Run with: supabase test db.
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

-- Template table exists, holds the 8 canonical steps, and is locked to client roles.
select has_table(
  'public', 'onboarding_step_templates', 'template table exists'
);
select is(
  (select count(*) from onboarding_step_templates),
  8::bigint,
  'eight canonical step templates are present'
);
select table_privs_are(
  'public', 'onboarding_step_templates', 'authenticated',
  ARRAY[]::text[],
  'authenticated has no privileges on the template table (locked)'
);

-- Inserting a new auth user seeds them 8 owned steps via the AFTER INSERT trigger.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
  'newhire@norcalcrew.org', 'x', now(), now()
);
select is(
  (select count(*) from onboarding_steps
     where user_id = '33333333-3333-3333-3333-333333333333'),
  8::bigint,
  'a new user is seeded 8 steps by the trigger'
);

-- Re-seeding the same user is a no-op (idempotent guard), so no duplicates.
do $$ begin perform public.seed_user_steps('33333333-3333-3333-3333-333333333333'); end $$;
select is(
  (select count(*) from onboarding_steps
     where user_id = '33333333-3333-3333-3333-333333333333'),
  8::bigint,
  'seeding is idempotent (no duplicate steps on re-run)'
);

select * from finish();
rollback;
