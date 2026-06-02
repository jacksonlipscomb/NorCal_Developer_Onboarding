-- NorCal Developer Onboarding — steps table, ordering, soft-delete, access boundary.
-- Boundary model: the edge functions are the sole access path (service-role key).
-- RLS is enabled with NO permissive policies and anon/authenticated are revoked, so
-- the public anon key reaches nothing; service_role bypasses RLS and retains access.

-- Monotonic, unique position assignment (removes the read-before-insert race).
create sequence if not exists onboarding_steps_position_seq;

create table if not exists onboarding_steps (
  id          uuid        primary key default gen_random_uuid(),
  position    integer     not null default nextval('onboarding_steps_position_seq'),
  title       text        not null,
  body        text        not null,
  deleted_at  timestamptz,                          -- null = active; non-null = soft-deleted
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Reject blank/whitespace content and absurd lengths at the DB boundary.
  constraint title_nonempty    check (length(btrim(title)) > 0),
  constraint title_maxlen      check (length(title) <= 200),
  constraint body_nonempty     check (length(btrim(body)) > 0),
  constraint body_maxlen       check (length(body) <= 10000),
  constraint position_positive check (position > 0),
  constraint position_unique   unique (position)    -- guards explicit inserts, not just sequence defaults
);

alter sequence onboarding_steps_position_seq owned by onboarding_steps.position;

-- Read path: active steps in order, with the created_at tiebreaker baked in.
create index if not exists onboarding_steps_active_order_idx
  on onboarding_steps (position asc, created_at asc)
  where deleted_at is null;

-- updated_at maintained by trigger, not just by API code.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists onboarding_steps_set_updated_at on onboarding_steps;
create trigger onboarding_steps_set_updated_at
  before update on onboarding_steps
  for each row execute function set_updated_at();

-- Access boundary: enable RLS, create no policies, revoke from public roles.
alter table onboarding_steps enable row level security;
revoke all on onboarding_steps from anon, authenticated;
revoke all on sequence onboarding_steps_position_seq from anon, authenticated;

-- Grant the Worker's service_role explicit object privileges. Bypassing RLS does
-- NOT bypass PostgreSQL object privileges, and newer Supabase projects no longer
-- auto-grant them — without these, every endpoint would fail with a 500.
grant select, insert, update, delete on table onboarding_steps to service_role;
grant usage, select on sequence onboarding_steps_position_seq to service_role;
