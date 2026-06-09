# NorcalOS

Always-on rules for writing or changing specs, plans, code, and tests in this
repo. Full review patterns live in `.claude/rules/`; the `norcal-review` skill
applies them when reviewing an artifact, and the `writing-review-ready-artifacts`
skill carries the proactive checklist when authoring one.

## Data contract

- `src/data/types.ts` is the source of truth for domain types, fields, enums,
  and ID shapes. Cross-check every spec, plan, and code change against it —
  never invent or assume fields.
- Domain `EntityId`s are prefixed `text` IDs. `profiles.id` is a `uuid` equal
  to `auth.users.id`.

## Security

- Enforce access control at the real boundary. Tables reachable by
  authenticated PostgREST clients need RLS — UI filtering and app-layer
  projection are not security controls.
- Field-level secrets need a real mechanism (separate table, view, function),
  not a hidden column on an otherwise-readable row.

## Tests

- Tests must be load-bearing: exercise the actual policy/behavior, with both
  positive and negative fixtures. No vacuous assertions.
- pgTAP fixtures are functions in `supabase/seed.sql`. RLS tests must assert
  `current_user = 'authenticated'`; a blocked UPDATE is zero rows changed, not
  an exception.

## State & invariants

- Every state-changing operation states its pre/post invariant and its atomic
  unit (e.g. a rejected past-24h edit writes no audit row — both halves are the
  contract). Atomic operations are transactional, or the spec documents
  partial-state recovery. Never describe a transition by its success path alone.

## Scope

- Specs that claim MVP/prototype/demo scope keep only items load-bearing for the
  stated outcome; everything else goes under an explicit "Deferred" heading with
  a reason.

## Generated & managed files

- Regenerate and commit `src/routeTree.gen.ts` after any route-file change.
- `package-lock.json` (npm) is the authoritative lockfile — no `bun.lockb`.

## Build & deploy

- Never guess a Cloudflare/CI build-failure cause — inspect the build logs.

## Failure handling

- Fail hard and loud: no broad try/catch, no retry/backoff, no optimistic
  rollback — unless the current phase spec explicitly requires recovery
  behavior. Let unexpected errors propagate; precheck expected failures and
  surface them inline.

## Plan mode structure

- Always name your plans appropriately depending on task at hand
- Always create a new branch for a feature immediately after exiting plan mode