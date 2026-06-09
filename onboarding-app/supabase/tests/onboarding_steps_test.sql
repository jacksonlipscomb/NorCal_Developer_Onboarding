-- DB-level contract tests for the per-owner RLS model. Run with: supabase test db (Docker).
-- pgTAP is created inside the test transaction and rolled back, so it never ships to prod.
begin;
create extension if not exists pgtap with schema extensions;

select plan(20);

-- ── Structure ──────────────────────────────────────────────────────────────
select has_table('public', 'onboarding_steps', 'onboarding_steps table exists');
select has_column(
  'public', 'onboarding_steps', 'deleted_at', 'soft-delete column exists'
);
select has_column(
  'public', 'onboarding_steps', 'user_id', 'owner column exists'
);

-- ── RLS + policies + grants ──────────────────────────────────────────────────
select is(
  (select relrowsecurity from pg_class where oid = 'public.onboarding_steps'::regclass),
  true,
  'RLS is enabled'
);
select policies_are(
  'public', 'onboarding_steps',
  ARRAY[
    'onboarding_steps_select_own',
    'onboarding_steps_insert_own',
    'onboarding_steps_update_own',
    'onboarding_steps_delete_own'
  ],
  'four owner-scoped policies exist'
);
select ok(
  has_table_privilege('authenticated', 'public.onboarding_steps', 'SELECT')
    and has_table_privilege('authenticated', 'public.onboarding_steps', 'INSERT')
    and has_table_privilege('authenticated', 'public.onboarding_steps', 'UPDATE')
    and has_table_privilege('authenticated', 'public.onboarding_steps', 'DELETE'),
  'authenticated can CRUD (rows still filtered by RLS)'
);
select ok(
  has_table_privilege('anon', 'public.onboarding_steps', 'SELECT')
    and not has_table_privilege('anon', 'public.onboarding_steps', 'INSERT')
    and not has_table_privilege('anon', 'public.onboarding_steps', 'UPDATE')
    and not has_table_privilege('anon', 'public.onboarding_steps', 'DELETE'),
  'anon may SELECT only (no policy → zero rows)'
);
select ok(
  has_sequence_privilege('authenticated', 'public.onboarding_steps_position_seq', 'USAGE')
    and has_sequence_privilege('authenticated', 'public.onboarding_steps_position_seq', 'SELECT'),
  'authenticated can use + select the position sequence'
);

-- ── Seed no longer loads shared rows ─────────────────────────────────────────
select is(
  (select count(*) from onboarding_steps),
  0::bigint,
  'seed loads no rows (per-user model)'
);

-- ── Constraints still reject bad input at the DB boundary ────────────────────
select throws_ok(
  $$ insert into onboarding_steps (title, body) values ('   ', 'x') $$,
  '23514', null, 'blank title rejected (check constraint)'
);
select throws_ok(
  $$ insert into onboarding_steps (title, body) values (repeat('x', 201), 'y') $$,
  '23514', null, 'oversized title rejected (check constraint)'
);
select throws_ok(
  $$ insert into onboarding_steps (position, title, body)
       values (9000, 'a', 'b'), (9000, 'c', 'd') $$,
  '23505', null, 'duplicate position rejected (unique constraint)'
);

-- ── Fixtures: two owners. Inserted as the (superuser) test role, which bypasses RLS. ──
-- Owner rows must exist in auth.users (FK target); create two ephemeral users.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'a@norcalcrew.org', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'b@norcalcrew.org', 'x', now(), now(), now());

-- The seeding trigger (0005) gives each new user 8 steps; clear them so the RLS counts
-- below reflect only the explicit fixtures.
delete from onboarding_steps
  where user_id in ('11111111-1111-1111-1111-111111111111',
                    '22222222-2222-2222-2222-222222222222');

insert into onboarding_steps (user_id, title, body) values
  ('11111111-1111-1111-1111-111111111111', 'A-step-1', 'b'),
  ('11111111-1111-1111-1111-111111111111', 'A-step-2', 'b'),
  ('22222222-2222-2222-2222-222222222222', 'B-step-1', 'b');

-- A soft-deleted row owned by A. The select policy is `auth.uid() = user_id AND deleted_at is
-- null`, so A must NOT see this even though A owns it (negative test below).
insert into onboarding_steps (user_id, title, body, deleted_at) values
  ('11111111-1111-1111-1111-111111111111', 'A-deleted', 'b', now());

-- anon: has SELECT privilege but NO policy → zero rows even though rows exist.
set local role anon;
select is(
  (select count(*) from onboarding_steps),
  0::bigint,
  'anon sees zero rows under RLS despite the SELECT grant'
);
reset role;

-- authenticated as user A (auth.uid() comes from request.jwt.claims).
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
set local role authenticated;

-- Prove the role switch took effect, so a "pass" below reflects RLS, not a superuser bypass.
select is(current_user, 'authenticated', 'role switched to authenticated before RLS checks');

select is(
  (select count(*) from onboarding_steps),
  2::bigint,
  'owner A sees only their own two rows'
);
-- Negative: the select policy's `deleted_at is null` clause hides an owner's own soft-deleted
-- row even from that owner (A owns 'A-deleted' but cannot see it).
select is(
  (select count(*) from onboarding_steps where title = 'A-deleted'),
  0::bigint,
  'owner A cannot see their own soft-deleted row (select policy filters deleted_at)'
);
select throws_ok(
  $$ insert into onboarding_steps (user_id, title, body)
       values ('22222222-2222-2222-2222-222222222222', 'x', 'y') $$,
  '42501', null, 'insert owned by another user blocked by WITH CHECK'
);
select throws_ok(
  $$ update onboarding_steps set user_id = '22222222-2222-2222-2222-222222222222'
       where title = 'A-step-1' $$,
  '42501', null, 'ownership reassignment blocked by WITH CHECK'
);
-- Cross-owner UPDATE/DELETE as A touch zero rows (USING filters B's row out). Run the
-- mutations, then verify from the superuser view that B's row is untouched.
update onboarding_steps set title = 'hacked' where title = 'B-step-1';
delete from onboarding_steps where title = 'B-step-1';
reset role;

select is(
  (select title from onboarding_steps
     where user_id = '22222222-2222-2222-2222-222222222222'),
  'B-step-1',
  'cross-owner UPDATE did not modify B''s row'
);
select is(
  (select count(*) from onboarding_steps
     where user_id = '22222222-2222-2222-2222-222222222222'),
  1::bigint,
  'cross-owner DELETE did not remove B''s row'
);
select * from finish();
rollback;
