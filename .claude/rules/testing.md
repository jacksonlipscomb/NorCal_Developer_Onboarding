rule_id: testing

# NorcalOS Testing

> Extends: `CLAUDE.md` section "Tests".

When writing or reviewing tests — pgTAP, seed validators, store/helper tests, or
UI verification — enforce these patterns.

## pgTAP fixtures and harness

- `supabase test db` treats every `.sql` file in `supabase/tests/` as a TAP
  test. pgTAP fixtures must therefore live as **functions in
  `supabase/seed.sql`**, not as bare test SQL files in `supabase/tests/`.
- RLS tests must assert `current_user = 'authenticated'` before interpreting
  policy results. Prove the role switch happened — otherwise a "pass" may just
  be the superuser bypassing RLS.
- An RLS-blocked UPDATE is typically a **zero-row** result, not an exception.
  Assert that the target rows are unchanged; do not expect error `42501` for
  every blocked mutation.

## Responsibilities are split

- `check:reports` validates **static seed surfaces**. Store, helper, and pgTAP
  tests protect **runtime behavior**. Do not use one to claim the other's
  coverage.

## Frontend testing strategy

- Phase 2 frontend avoids React Testing Library. The established strategy is
  pure helper extraction (unit-tested) plus browser/manual verification.
- Manual/browser verification is required for UI acceptance — focus rings,
  responsive layouts, route behavior, and transient toasts are not provable by
  unit tests.

## Verification

- No bare fixture `.sql` files in `supabase/tests/`; fixtures are functions in
  `supabase/seed.sql`.
- RLS tests contain an explicit `current_user = 'authenticated'` assertion.
- Blocked-mutation tests assert unchanged rows, not a `42501` exception.
- No new React Testing Library tests in Phase 2 frontend; helpers are extracted
  and unit-tested, with a documented manual/browser verification step.
