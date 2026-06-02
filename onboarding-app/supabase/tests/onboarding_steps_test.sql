-- DB-level contract tests. Run with: supabase test db  (requires Docker).
-- The harness resets the DB and applies seed.sql first, so the 8 seeded steps exist.
-- pgTAP is created inside the test transaction and rolled back, so it never ships
-- to production.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

-- Structure
select has_table('public', 'onboarding_steps', 'onboarding_steps table exists');
select has_column(
  'public', 'onboarding_steps', 'deleted_at',
  'soft-delete column exists'
);

-- Access boundary: RLS on, no permissive policies.
select is(
  (select relrowsecurity from pg_class where oid = 'public.onboarding_steps'::regclass),
  true,
  'RLS is enabled'
);
select policies_are(
  'public', 'onboarding_steps', ARRAY[]::text[],
  'no permissive policies (Worker/service-role is the only path)'
);

-- Object privileges: service_role can CRUD; public client roles get nothing.
-- Assert the Worker CAN perform every operation it needs, rather than pinning the
-- exact privilege set: Supabase's default privileges also grant service_role
-- REFERENCES/TRIGGER/TRUNCATE, which are harmless here.
select ok(
  has_table_privilege('service_role', 'public.onboarding_steps', 'SELECT')
    and has_table_privilege('service_role', 'public.onboarding_steps', 'INSERT')
    and has_table_privilege('service_role', 'public.onboarding_steps', 'UPDATE')
    and has_table_privilege('service_role', 'public.onboarding_steps', 'DELETE'),
  'service_role can SELECT/INSERT/UPDATE/DELETE onboarding_steps'
);
select table_privs_are(
  'public', 'onboarding_steps', 'anon',
  ARRAY[]::text[],
  'anon has no table privileges'
);
select table_privs_are(
  'public', 'onboarding_steps', 'authenticated',
  ARRAY[]::text[],
  'authenticated has no table privileges'
);

-- Sequence privileges: inserts depend on these. service_role needs usage+select;
-- public client roles get nothing.
select ok(
  has_sequence_privilege(
    'service_role', 'public.onboarding_steps_position_seq', 'USAGE'
  )
    and has_sequence_privilege(
      'service_role', 'public.onboarding_steps_position_seq', 'SELECT'
    ),
  'service_role can use + select the position sequence'
);
select sequence_privs_are(
  'public', 'onboarding_steps_position_seq', 'anon',
  ARRAY[]::text[],
  'anon has no sequence privileges'
);
select sequence_privs_are(
  'public', 'onboarding_steps_position_seq', 'authenticated',
  ARRAY[]::text[],
  'authenticated has no sequence privileges'
);

-- Constraints reject bad input at the DB boundary.
select throws_ok(
  $$ insert into onboarding_steps (title, body) values ('   ', 'x') $$,
  '23514',
  null,
  'blank title rejected (check constraint)'
);
select throws_ok(
  $$ insert into onboarding_steps (title, body) values (repeat('x', 201), 'y') $$,
  '23514',
  null,
  'oversized title rejected (check constraint)'
);
select throws_ok(
  $$ insert into onboarding_steps (position, title, body)
       values (9000, 'a', 'b'), (9000, 'c', 'd') $$,
  '23505',
  null,
  'duplicate position rejected (unique constraint)'
);

-- The harness applied the real seed.sql once at reset: assert it loaded the 8
-- canonical active steps.
select is(
  (select count(*) from onboarding_steps where deleted_at is null),
  8::bigint,
  'seed.sql loaded 8 active steps'
);

-- Idempotency: seed.sql guards its insert with `where not exists (select 1 from
-- onboarding_steps)`. Exercise that guard's predicate against the now-non-empty
-- table — it selects zero rows, so a re-run inserts nothing. (This tests the guard
-- semantics, not a second execution of the file itself.)
insert into onboarding_steps (title, body)
select 'dupe', 'dupe'
where not exists (select 1 from onboarding_steps);
select is(
  (select count(*) from onboarding_steps),
  8::bigint,
  'seed guard predicate is a no-op against a non-empty table'
);

select * from finish();
rollback;
