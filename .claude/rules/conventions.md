rule_id: conventions

# NorcalOS Conventions

> Extends: `CLAUDE.md` section "Failure handling".

When writing or reviewing NorcalOS code, enforce these architectural and scope
conventions.

## Fail hard and loud

- Phase 2 convention: no broad try/catch, no retries for the sync store, no
  optimistic UI with rollback — unless a later phase spec explicitly changes
  it. Let unexpected errors propagate so they stay diagnosable.
- Precheck expected failures and surface them inline/toast; only *unexpected*
  errors bubble.

## Deferred scope

- Team CRUD audit is intentionally deferred. Phase 2 emits no `team-created` /
  `team-updated` audit rows; Phase 3 CDC handles team audit. Do not flag the
  absence as a defect, and do not add those rows in Phase 2.

## Locked decisions

- Admin setting an archived season active means **unarchive + activate
  atomically** (Option A). The two steps happen together in one operation —
  never leave a season archived-but-active or activated-but-archived.

## Verification

- No broad `try/catch`, retry/backoff, or optimistic-rollback code in Phase 2
  paths absent an explicit phase-spec exception.
- No `team-created` / `team-updated` audit rows are written in Phase 2.
- Activating an archived season unarchives and activates it in a single atomic
  operation.
