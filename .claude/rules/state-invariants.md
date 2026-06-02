rule_id: state-invariants

# NorcalOS State Invariants & Atomicity

> Extends: `CLAUDE.md` sections "Failure handling" and "Tests". Reinforces
> `conventions.md` "Locked decisions".

When writing or reviewing any state-changing operation — store mutations,
migrations, season and season-status transitions, audit writes — specify
invariants and atomicity, not just the happy path. Underspecified state is the
recurring `stability` finding.

## Name the invariant

- Every persistent-state operation states the invariant that holds before and
  after it.
- Worked example (locked Option A in `conventions.md`): a season is never
  archived-but-active or activated-but-archived — that is the invariant, and
  the unarchive+activate operation must preserve it.

## Name the atomic unit

- When an operation has more than one effect, state which effects happen
  together. Both halves are part of the contract and both get tested.
- Worked example: editing a wellness report past the 24h window **rejects the
  edit AND writes no audit row** — the "writes no audit row" half is not
  optional cleanup, it is the spec.

## Recovery from partial state

- Any operation whose write can fail mid-way states what a partial or corrupt
  state looks like and how the next read or operation recovers — or states that
  the operation is transactional, so a partial state is impossible.

## Verification

- Every state-changing operation in a spec/plan names its pre/post invariant.
- Multi-effect operations name their atomic unit; tests assert every half
  (e.g. a rejected edit leaves zero audit rows — assert with a row-count check).
- Atomic operations are transactional, or the spec documents the partial-state
  recovery path.
- No state transition is described only by its success path.
