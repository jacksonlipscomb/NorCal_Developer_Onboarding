import { afterAll, beforeAll, expect, test } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Proves data-layer protection: an unauthenticated request straight to the table's REST
// endpoint (anon key, no session) returns NO rows, and a logged-in owner sees ONLY their
// own rows. This exercises RLS at PostgREST — not the UI. Requires a live local stack
// (`supabase start`); run via `npm run test:rls`.
//
// Defaults are the well-known, non-secret LOCAL Supabase keys; override with env for
// other environments.
const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Unique per run so repeated runs don't collide on the email allowlist / unique email.
const runId = Date.now().toString(36);
const A = { email: `rls-a-${runId}@norcalcrew.org`, password: `pw-a-${runId}` };
const B = { email: `rls-b-${runId}@norcalcrew.org`, password: `pw-b-${runId}` };

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let aId = "";
let bId = "";

async function createUser(email: string, password: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!.id;
}

beforeAll(async () => {
  aId = await createUser(A.email, A.password);
  bId = await createUser(B.email, B.password);
  // Seed owned rows via the service role (bypasses RLS, sets explicit owners).
  const { error } = await admin.from("onboarding_steps").insert([
    { user_id: aId, title: "A one", body: "body" },
    { user_id: aId, title: "A two", body: "body" },
    { user_id: bId, title: "B one", body: "body" },
  ]);
  if (error) throw error;
});

afterAll(async () => {
  // Deleting the users cascades to their onboarding_steps rows (FK on delete cascade).
  if (aId) await admin.auth.admin.deleteUser(aId);
  if (bId) await admin.auth.admin.deleteUser(bId);
});

test("anon (no session) reads zero rows from onboarding_steps", async () => {
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await anon.from("onboarding_steps").select("*");
  expect(error).toBeNull(); // anon HAS the SELECT privilege → no permission error
  expect(data).toEqual([]); // …but no policy matches anon → zero rows (RLS is the boundary)
});

test("a logged-in owner reads only their own rows", async () => {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error: signInError } = await sb.auth.signInWithPassword(A);
  expect(signInError).toBeNull();

  const { data, error } = await sb.from("onboarding_steps").select("user_id");
  expect(error).toBeNull();
  expect(data!.length).toBeGreaterThan(0);
  expect(data!.every((row) => row.user_id === aId)).toBe(true); // only A's rows, never B's
});
