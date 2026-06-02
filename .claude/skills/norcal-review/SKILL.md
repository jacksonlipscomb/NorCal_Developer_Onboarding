---
name: norcal-review
description: Use when reviewing, auditing, or approving any NorcalOS artifact — a phase spec, implementation plan, PR, migration, or code change. Applies the NorcalOS review rules and the 9.2 approval gate.
---

# NorcalOS Review

This skill applies the NorcalOS-specific review rules. It does not duplicate
their content — the detailed patterns live in `.claude/rules/`. (To *author* a
NorcalOS artifact that passes this review, use the
`writing-review-ready-artifacts` skill.)

## How to review a NorcalOS artifact

1. **Apply the `adversarial-review` approach.** Findings first, honest scoring,
   minimal-fix + regression-test for each finding. The artifact is adversarial
   until proven otherwise.

2. **Load the repo rules.** Read every file in `.claude/rules/` and apply it as
   the review checklist:
   - `review-gates.md` — the 9.2 approval gate and the spec → plan →
     implementation → PR gate sequence.
   - `data-contract.md` — cross-check against `src/data/types.ts`; ID shapes.
   - `frontend-state.md` — Zustand selector stability; route surfaces; the
     tracked `src/routeTree.gen.ts`.
   - `build-tooling.md` — npm authoritative; inspect build logs.
   - `supabase-rls.md` — RLS as a real boundary; locked Phase 3B decisions.
   - `testing.md` — load-bearing tests; pgTAP harness; frontend test strategy.
   - `conventions.md` — fail hard and loud; deferred scope; locked decisions.
   - `scope-discipline.md` — MVP means minimum; deferred items explicit.
   - `state-invariants.md` — name the invariant and the atomic unit; document
     partial-state recovery.

3. **Enforce the approval gate.** The overall score must be **≥ 9.2** to
   approve moving forward. Below 9.2: list the fixes needed and do not approve.

4. **Respect the phase-gate sequence.** Review spec → plan → implementation →
   PR as separate gates; do not collapse them unless explicitly asked.

5. **Cross-check against `src/data/types.ts`.** It is the source of truth for
   domain types, fields, enums, and ID shapes — verify every claim against it.
