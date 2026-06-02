rule_id: review-gates

# NorcalOS Review Gates

> Extends: `CLAUDE.md`. Applied by the `norcal-review` skill.

When reviewing or approving any NorcalOS artifact — a phase spec, implementation
plan, PR, migration, or code change — enforce these gates.

## Approval threshold

- The approval gate is an overall score of **9.2**. If a review scores below
  9.2, suggest the fixes needed to clear it and **do not** approve moving
  forward.
- Score residual/execution-time risk separately from unresolved design or
  security defects — they are not the same and must not be averaged away.

## Phase gate sequence

- Phase work is reviewed in sequence: **spec → plan → implementation → PR**.
  Each gate is reviewed on its own; do not collapse gates unless the developer
  explicitly asks.
- A passing spec does not pre-approve the plan; a passing plan does not
  pre-approve the implementation. Re-check intent at every gate.
- Look for plan-vs-spec divergence: a design can be correct while the plan
  fails to encode it.

## Verification

- A review report exists for each gate before the next gate begins.
- Any review with an overall score below 9.2 lists concrete fixes and is not
  marked approved.
- The phase plan/spec files under `docs/superpowers/` show one review per gate,
  not a single combined sign-off.
