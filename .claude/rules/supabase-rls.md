rule_id: supabase-rls

# NorcalOS Supabase & RLS

> Extends: `CLAUDE.md` section "Security".

When writing or reviewing Supabase migrations, schema, or RLS policies, enforce
these patterns.

## Migrations are artifact-first

- Phase 3 (3A/3B) is "write artifacts now, provision later". Migrations and
  policies are authored as files; local Docker verification (`supabase` CLI) is
  the gate — not a remote project.

## RLS is a real boundary, not app-layer projection

- Any table reachable by authenticated PostgREST clients needs RLS. The clients
  can query tables directly — app-layer projection and UI filtering do not
  restrict them.
- Field-level visibility is not row-level visibility. A field a user must not
  see needs a real mechanism (separate table, view, or function), not a hidden
  column on a row the user can otherwise read.

## Locked Phase 3B decisions

- `coach_only_notes` belongs in the `report_coach_notes` table — this split is
  locked for Phase 3B. Coach-only notes are never a column on a report row that
  athletes/parents can read.
- Athlete and parent report visibility is **`published` only**. Coaches and
  admins may see drafts and skips; athlete/parent RLS must mirror that app
  behavior — drafts and skips are not visible to them.
- Rubric visibility must check **both** parent dimensions and child
  subcomponents. A subcomponent that is not coach-only, sitting under a
  coach-only dimension, must still not leak — evaluate the parent.
- Wellness raw reports are **denied to admin** in 3B. The admin aggregate view
  is deferred to Phase 3D; do not expose raw wellness rows to admin in 3B.

## Verification

- Every table exposed to authenticated clients has an RLS policy; none rely on
  app-layer filtering alone.
- `grep -rn "coach_only" supabase/` — coach-only notes live in
  `report_coach_notes`, not on a shared report row.
- Athlete/parent SELECT policies on reports filter to `status = 'published'`.
- A coach-only parent dimension blocks its non-coach-only child subcomponents.
- No admin-readable policy exposes raw wellness reports in 3B.
