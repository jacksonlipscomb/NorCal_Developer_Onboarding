import { supabase, STEPS_TABLE } from "@/lib/supabase";
import type { OnboardingStep } from "@/data/types";

// Data access goes straight to Supabase/PostgREST as the signed-in user. RLS (migration
// 0002) enforces per-owner access — the database, not the UI, is the boundary. Every call
// throws on error so the UI surfaces it inline (no silent failures, no optimistic updates).

export async function listSteps(): Promise<OnboardingStep[]> {
  const { data, error } = await supabase
    .from(STEPS_TABLE)
    .select("*")
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createStep(input: {
  title: string;
  body: string;
}): Promise<OnboardingStep> {
  // user_id defaults to auth.uid() in the DB; the INSERT policy enforces ownership.
  const { data, error } = await supabase
    .from(STEPS_TABLE)
    .insert({ title: input.title, body: input.body })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateStep(
  id: string,
  input: { title?: string; body?: string },
): Promise<OnboardingStep> {
  const { data, error } = await supabase
    .from(STEPS_TABLE)
    .update(input)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteStep(id: string): Promise<void> {
  // Soft delete (sets deleted_at). RLS restricts this to the owner's row. We do NOT
  // RETURNING the row: the SELECT policy hides soft-deleted rows, so a returning clause
  // would come back empty and mask success as an error.
  const { error } = await supabase
    .from(STEPS_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
}
