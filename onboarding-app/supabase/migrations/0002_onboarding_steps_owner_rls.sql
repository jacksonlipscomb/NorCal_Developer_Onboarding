-- Per-user ownership + RLS policies for onboarding_steps.
--
-- 0001 enabled RLS with NO policies and revoked anon/authenticated, so the table was
-- reachable only via the service-role edge functions. Those functions are gone; the SPA
-- now talks to PostgREST directly as the signed-in user, so the DATABASE must enforce
-- per-owner access. This migration adds the owner column, grants the verbs back, and adds
-- owner-scoped policies.
--
-- user_id is added NULLABLE so `supabase db push` runs UNATTENDED even when legacy rows
-- exist (auth.uid() is NULL outside an authenticated request, so a NOT NULL DEFAULT
-- auth.uid() would fail on existing rows). Legacy NULL-owner rows are invisible under the
-- policies (auth.uid() = NULL never matches). The NOT NULL constraint is added in a
-- separate later migration (0003) after a one-time owner backfill — see the plan.

alter table onboarding_steps
  add column user_id uuid default auth.uid() references auth.users (id) on delete cascade;

create index if not exists onboarding_steps_user_id_idx on onboarding_steps (user_id);

-- RLS already enabled in 0001 (idempotent here). Policies filter ROWS; grants permit the
-- VERB at all. Sequence usage is required for the position-default insert.
alter table onboarding_steps enable row level security;
grant select, insert, update, delete on onboarding_steps to authenticated;
grant usage, select on sequence onboarding_steps_position_seq to authenticated;
-- anon may issue a SELECT but has NO policy → RLS returns zero rows (no permission error).
grant select on onboarding_steps to anon;

create policy onboarding_steps_select_own
  on onboarding_steps for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy onboarding_steps_insert_own
  on onboarding_steps for insert to authenticated
  with check (auth.uid() = user_id); -- can only insert rows you own

create policy onboarding_steps_update_own
  on onboarding_steps for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id); -- can target only your rows, and can't reassign ownership

create policy onboarding_steps_delete_own
  on onboarding_steps for delete to authenticated
  using (auth.uid() = user_id);
