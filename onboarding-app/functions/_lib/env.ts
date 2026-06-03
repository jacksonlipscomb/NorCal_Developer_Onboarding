// Bindings available to every edge function via `context.env`.
// These are set as encrypted secrets in Cloudflare Pages (prod) and read from a
// gitignored `.dev.vars` locally. They are NEVER bundled into the frontend.
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Shared "user:password" credential for the site-wide Basic Auth gate. When unset,
  // the gate fails closed (every request gets 401).
  SITE_BASIC_AUTH?: string;
}
