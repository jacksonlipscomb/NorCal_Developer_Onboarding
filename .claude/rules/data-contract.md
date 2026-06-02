rule_id: data-contract

# NorcalOS Data Contract

> Extends: `CLAUDE.md` section "Data contract".

When writing or reviewing specs, plans, types, schema, or migrations, enforce
these patterns. `src/data/types.ts` is the source of truth for the domain data
contract.

## Cross-check against `src/data/types.ts`

- Every spec, plan, and code change must be cross-checked against
  `src/data/types.ts`. Recurring defects came from invented or stale fields,
  enum assumptions, and ID-shape mismatches.
- Do not introduce a field, enum value, or type name that is not in
  `src/data/types.ts` (or being added to it in the same change).

## ID shapes

- Domain `EntityId`s are prefixed `text` IDs (e.g. `athlete_…`, `team_…`) and
  stay `text` in the database.
- `profiles.id` is the exception: it is a `uuid` and must equal
  `auth.users.id`. Never model `profiles.id` as a prefixed `text` ID.

## Type-contract corrections

- Migration warnings use the field `sourceType`, not `kind`. Match the existing
  type contract exactly when emitting or consuming migration warnings.

## Verification

- `grep -n "sourceType" src/` — migration-warning code uses `sourceType`;
  `grep -rn "\.kind" src/` near migration-warning code returns no stale uses.
- `profiles.id` columns/types resolve to `uuid` in `supabase/` migrations.
- Fields referenced in a spec/plan all resolve to a definition in
  `src/data/types.ts`.
