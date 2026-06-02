rule_id: build-tooling

# NorcalOS Build & Tooling

> Extends: `CLAUDE.md` section "Build & deploy".

When changing dependencies, lockfiles, or diagnosing build/deploy failures,
enforce these patterns.

## npm is the authoritative package manager

- `package-lock.json` is the maintained lockfile. Install and update
  dependencies with npm.
- Do not add, commit, or keep a `bun.lockb`. A stale `bun.lockb` broke
  Cloudflare builds — the deploy picked up Bun and an outdated dependency set.

## Inspect logs before assigning a build-failure cause

- Never guess the root cause of a Cloudflare/CI build failure. Read the build
  logs first, then assign cause.
- Precedent: PR #7's failure looked like a Supabase CLI issue but was actually
  stale `bun.lockb` behavior — the wrong cause would have been "fixed" without
  effect.

## Browser-bundle Supabase values are hardcoded fallbacks (Norcal-specific)

- `src/lib/supabase.ts` carries the production Supabase project URL and
  anon/publishable key as in-source constants (`PROD_URL`, `PROD_ANON_KEY`),
  with `import.meta.env.VITE_*` taking precedence so local `.env.local`
  still wins for the 544xx local stack.
- This is an explicit NorcalOS exception. Cloudflare Workers Builds has
  repeatedly wiped this Worker's build-time environment variables across
  deploys, causing the bundle to ship with `undefined` and throw at module
  load on every Worker request (HTTP 500 site-wide).
- Do not generalize. The pattern applies only to values that are already
  public in the deployed bundle (anon keys, project URLs). Do not hardcode
  secret-like values. Do not apply this pattern in other projects without
  explicit review — it trades env-driven config for deploy resilience, and
  that trade is project-specific.
- Rotating the Supabase project means editing `PROD_URL` / `PROD_ANON_KEY`
  in `src/lib/supabase.ts` and committing.

Precedent: Phase 3C deploy validation surfaced a recurring deploy state
where the build env vars went missing, taking the deployed app down with
a module-init throw on every URL. The fix lives at `src/lib/supabase.ts`.

## Verification

- `test ! -e bun.lockb` — no Bun lockfile is committed.
- `package-lock.json` exists and is current with `package.json`.
- Any build-failure finding cites a specific log line, not a guess.
