rule_id: scope-discipline

# NorcalOS Scope Discipline

> Extends: `CLAUDE.md` section "Scope". Pairs with `conventions.md` "Deferred
> scope".

When writing or reviewing a NorcalOS spec or plan, every in-scope item must be
load-bearing for the stated phase outcome. Bundled non-critical work is a
defect — it is the recurring `scope_creep` finding.

## MVP means minimum

- If a spec or plan calls itself a prototype, MVP, or demo, every included item
  must be required by the stated outcome.
- The test for each item: **"does the phase outcome fail without this?"** If the
  answer is no, the item is deferred — not included "while we're here".

## Deferred items are explicit

- Anything cut goes under an explicit "Deferred" heading with a one-line reason
  and the phase that picks it up. Deferral is visible, never silent.
- Precedent: `conventions.md` defers the team CRUD audit to Phase 3 CDC — a
  named cut with a named owner, not an omission.

## Verification

- Every plan/spec under `docs/superpowers/` that claims MVP/prototype/demo
  scope has an explicit "Deferred" section.
- Each in-scope item traces to the stated phase outcome; items that do not are
  moved to "Deferred".
- No feature is added without a phase-spec line authorizing it — grep the
  governing spec before accepting new scope in a plan.
