import { createClient } from "@supabase/supabase-js";

// Browser Supabase client. Uses the PUBLIC anon key plus the signed-in user's JWT
// (supabase-js attaches it to every PostgREST request automatically), so queries run
// as the `authenticated` role and RLS on onboarding_steps is the security boundary.
// The anon key is public by design and safe to ship in the bundle.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Vite embeds VITE_* at BUILD time. Missing here means .env.local (local) or the
  // build environment (CI/CD) didn't provide them — fail loud rather than ship undefined.
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in .env.local locally, " +
      "or inject them into the build environment for deploys.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const STEPS_TABLE = "onboarding_steps";
