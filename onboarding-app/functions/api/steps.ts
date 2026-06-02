import type { Env } from "../_lib/env";
import { createServiceClient, STEPS_TABLE } from "../_lib/supabase";
import { json, badRequest, methodNotAllowed, withLogging } from "../_lib/respond";
import { readJsonBody, validateCreate } from "../_lib/validation";

// GET /api/steps — active steps, ordered.
export const onRequestGet: PagesFunction<Env> = (context) =>
  withLogging(context, async (requestId) => {
    const db = createServiceClient(context.env);
    const { data, error } = await db
      .from(STEPS_TABLE)
      .select("*")
      .is("deleted_at", null)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error; // DB failure → propagate → 500, never a misleading 200
    return json({ steps: data }, 200, requestId);
  });

// POST /api/steps — add a step. Position comes from the sequence default.
export const onRequestPost: PagesFunction<Env> = (context) =>
  withLogging(context, async (requestId) => {
    const parsed = await readJsonBody(context.request);
    if (!parsed.ok) return badRequest(parsed.error, requestId);
    const validated = validateCreate(parsed.value);
    if (!validated.ok) return badRequest(validated.error, requestId);

    const db = createServiceClient(context.env);
    const { data, error } = await db
      .from(STEPS_TABLE)
      .insert(validated.value)
      .select()
      .single();
    if (error) throw error;
    return json({ step: data }, 201, requestId);
  });

// Fallback for unhandled methods → structured 405 with Allow header.
export const onRequest: PagesFunction<Env> = (context) =>
  methodNotAllowed(context, "GET, POST");
