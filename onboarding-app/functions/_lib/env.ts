// Bindings available to every edge function via `context.env`.
// These are set as encrypted secrets in Cloudflare Pages (prod) and read from a
// gitignored `.dev.vars` locally. They are NEVER bundled into the frontend.
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}
