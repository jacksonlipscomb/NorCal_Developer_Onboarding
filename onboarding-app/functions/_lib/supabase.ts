import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "./env";

/**
 * Service-role client — the sole access path to the data tier. The service-role key
 * bypasses RLS, which is why it lives only here (server side) and never in the
 * frontend bundle. Missing config throws, surfacing as a 500 rather than silently
 * degrading.
 */
export function createServiceClient(env: Env): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in function environment",
    );
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const STEPS_TABLE = "onboarding_steps";
