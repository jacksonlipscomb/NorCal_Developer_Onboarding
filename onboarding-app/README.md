# NorCal Developer Onboarding

A lightweight internal web app where each NorCal developer signs in with email/password and
manages **their own** step-by-step onboarding list. Steps can be added and soft-deleted (the
UI hides a step by setting `deleted_at` rather than removing the row), and each user checks off
their own progress (stored per-user in the browser).

## Architecture (two layers)

- **Frontend** — Vite + React 19 SPA (TanStack Query v5, Tailwind v4, Radix UI). It talks
  **directly to Supabase** from the browser using the public anon key plus the signed-in
  user's JWT. There is no edge/API tier.
- **Data tier** — Supabase: **Auth** (email/password) for identity, and **Postgres** for the
  `onboarding_steps` table (sequence-assigned ordering, a `deleted_at` soft-delete flag, and a
  `user_id` owner column).

### Access model — RLS is the boundary

There is no shared password and no app-layer gate. Identity comes from **Supabase Auth**; the
browser sends the user's JWT to PostgREST with every request, and **row-level security on
`onboarding_steps` is the security boundary**:

- A user can **read / update / delete only their own rows** (`auth.uid() = user_id`) and can
  **insert only rows they own** (`with check auth.uid() = user_id`).
- `anon` has a bare `SELECT` privilege but **no policy**, so an unauthenticated request returns
  **zero rows** (not an error) — proven by the data-layer test in
  [`tests/rls.owner.integration.test.ts`](tests/rls.owner.integration.test.ts).
- The service-role key (which bypasses RLS) is **not** used by the app — only by test fixtures
  and maintenance.

**Delete semantics / contract:** the UI deletes by _soft delete_ (sets `deleted_at`), but
owners hold direct `UPDATE`/`DELETE` privileges on their own rows, so a direct PostgREST client
can also **hard-delete** a row or **restore** a soft-deleted one. RLS limits _which rows_ an
owner can touch, not _which columns or operations_ — so the "records are always preserved"
guarantee is no longer absolute. Constraining deletes to a `security definer` `soft_delete_step`
RPC (and column-scoping updates) is a documented future hardening.

### Sign-up eligibility gate (required before any public deploy)

Sign-up is open but **restricted to the approved email domain**, enforced in the database by a
Supabase **Before User Created** auth hook (`public.restrict_signup_domain`, migration
[`0004`](supabase/migrations/0004_before_user_created_domain_gate.sql)) so it can't be bypassed
by a direct REST client. Locally the hook is registered in
[`supabase/config.toml`](supabase/config.toml); **for production, register the same hook and
enable email confirmation in the Supabase dashboard (Authentication → Hooks / Providers → Email)
or via the Management API** — `config.toml` governs local only.

## Prerequisites

- Node 20+ and npm (npm is the authoritative package manager — no `bun.lockb`).
- A Supabase project (URL + anon/publishable key for the app; service-role key for tests only).
- Docker Desktop running — needed for the local Supabase stack and the DB/RLS tests.
- Cloudflare account with Wrangler (a dev dependency) to deploy the static SPA.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local Supabase stack and apply migrations:
   ```bash
   npm run db:start     # supabase start (Docker)
   npm run db:reset     # applies migrations 0001 + 0002 (+ 0004 hook); seed is empty
   ```
3. Provide the frontend's public Supabase values in a **gitignored** `.env.local` (copy the
   example). Vite embeds these at build time:
   ```bash
   cp .env.example .env.local
   # then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (from `npx supabase status`)
   ```
4. Run the SPA — it talks straight to your local Supabase:
   ```bash
   npm run dev
   ```
   Sign up with an `@norcalcrew.org` email (other domains are rejected by the gate), then add
   and check off your own steps.

## Quality gates

```bash
npm run typecheck    # tsc -b across the app
npm run lint         # eslint
npm test             # vitest unit tests (src/, fast, no Docker)
npm run build        # tsc -b && vite build → dist/
```

### Data-layer protection tests (require Docker + a running stack)

```bash
npm run db:reset       # apply migrations into the local stack
npm run test:rls       # vitest integration: anon → 0 rows; owner → only their rows
npx supabase test db   # pgTAP: policies/grants, owner isolation, WITH CHECK, sequence access
```

[`supabase/tests/onboarding_steps_test.sql`](supabase/tests/onboarding_steps_test.sql) asserts
RLS is enabled, the four owner policies and grants exist, `anon` sees zero rows under RLS, an
owner sees only their rows, and cross-owner insert/update/delete and ownership reassignment are
blocked.

## Provisioning the data tier (remote)

```bash
npx supabase link --project-ref <ref>
npx supabase db push    # applies 0001, 0002, 0004
```

Then, in the dashboard / Management API: register the **Before User Created** hook and **enable
email confirmation**. `0003` (adds `NOT NULL` to `user_id`) ships in a **separate later PR**,
after a one-time owner backfill of any legacy rows — do not apply it before that backfill. Do
**not** run `supabase db reset` against a linked remote DB (local-only / destructive).

## Deploy

```bash
npm run pages:deploy    # vite build && wrangler pages deploy dist --project-name norcal-onboarding
```

The deployed artifact is a **static SPA** (no functions). Because Vite embeds `VITE_*` at build
time, the build environment — your shell for a manual deploy, or the CI/CD job — must provide
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public values), or the bundle ships `undefined`.
The app's data protection lives in Supabase (RLS + the sign-up hook + email confirmation), not in
any deploy-time secret.

> **Do not deploy production from this branch alone.** Wiring `VITE_SUPABASE_*` into the CD build
> environment (and the deploy smoke check) is a separate follow-up tied to the CD workflow
> (`deploy.yml`); without it the deployed bundle ships with `undefined` Supabase config. Merge this
> branch as app/schema work, but gate the production deploy on that follow-up.

### Backups

Soft-delete preserves rows. At deploy time, select the project's Supabase backup mode (daily
backups, or PITR if the plan offers it) and record the restore runbook location. On the free
tier, add a periodic off-site `supabase db dump` (see [`BACKUPS.md`](BACKUPS.md)).

## Project layout

```
public/
  norcal-crew-logo.png  NorCal Crew brand logo (shown in the header)
src/
  auth/             AuthProvider (Supabase session) + context/useAuth
  data/types.ts     OnboardingStep (incl. user_id) + field length limits
  hooks/            useCompletedSteps (per-user check-off via localStorage)
  lib/              supabase client, api (direct PostgREST CRUD), completion, cn() util
  components/       AuthScreen, StepCard, Add/ConfirmDelete dialogs, StepForm, ui/ primitives
  App.tsx           auth gate → branded header + footer; loading / error / empty / list states
supabase/
  migrations/   0001 (table), 0002 (owner column + RLS), 0004 (sign-up domain hook)
  seed.sql      empty (steps are per-user owned — nothing shared to seed)
  tests/        pgTAP DB contract tests
  config.toml   local config incl. the before_user_created hook registration
  updates/      one-time content-revision SQL applied to live data
tests/
  rls.owner.integration.test.ts   data-layer RLS proof (anon vs owner) — npm run test:rls
scripts/
  backup.sh     supabase db dump helper (see BACKUPS.md)
BACKUPS.md      backup modes + restore runbook
```
