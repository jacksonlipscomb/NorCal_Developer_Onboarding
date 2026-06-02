rule_id: frontend-state

# NorcalOS Frontend State & Routing

> Extends: `CLAUDE.md` section "Generated & managed files".

When writing or reviewing frontend state, Zustand stores, or route files,
enforce these patterns.

## Zustand selectors must be referentially stable

- A Zustand selector must not return a freshly constructed value. Select a
  primitive, or a memoized derived value — never a new object, array, or
  `Date` per call.
- Precedent: `useDemo(demoNow)` caused an infinite render loop because the
  selector returned a fresh `Date` on every render. Treat any selector that
  builds a new value inline as a bug.

## Route navigation has multiple surfaces

- A role or navigation change touches more than one file. Check **both**
  `src/routes/index.tsx` and `src/components/shell/AppShell.tsx` — route
  definitions and the shell's nav both need updating.

## The route tree is tracked

- `src/routeTree.gen.ts` (TanStack) is a committed, tracked file. Any plan or
  change that adds, removes, or renames a route file must also regenerate and
  commit `src/routeTree.gen.ts`.

## Verification

- No Zustand selector returns an object/array/`Date` literal — selectors return
  primitives or memoized values.
- Route/role changes are reflected in both `src/routes/index.tsx` and
  `src/components/shell/AppShell.tsx`.
- `git status` shows `src/routeTree.gen.ts` updated whenever route files change;
  it is never left stale.
