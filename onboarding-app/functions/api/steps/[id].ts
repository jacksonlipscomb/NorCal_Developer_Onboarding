import type { Env } from "../../_lib/env";
import { createServiceClient, STEPS_TABLE } from "../../_lib/supabase";
import {
  json,
  badRequest,
  notFound,
  methodNotAllowed,
  withLogging,
} from "../../_lib/respond";
import { isUuid, readJsonBody, validatePatch } from "../../_lib/validation";

function stepId(context: EventContext<Env, "id", unknown>): string {
  const { id } = context.params;
  return Array.isArray(id) ? id[0] : id;
}

// PATCH /api/steps/:id — edit fields of a still-active step (conditional update).
export const onRequestPatch: PagesFunction<Env, "id"> = (context) =>
  withLogging(context, async (requestId) => {
    const id = stepId(context);
    if (!isUuid(id)) return badRequest("Malformed step id", requestId);

    const parsed = await readJsonBody(context.request);
    if (!parsed.ok) return badRequest(parsed.error, requestId);
    const validated = validatePatch(parsed.value);
    if (!validated.ok) return badRequest(validated.error, requestId);

    const db = createServiceClient(context.env);
    const { data, error } = await db
      .from(STEPS_TABLE)
      .update(validated.value)
      .eq("id", id)
      .is("deleted_at", null) // only touch a still-active row — no precheck race
      .select()
      .maybeSingle();
    if (error) throw error; // DB failure → 500, NOT a false 404
    if (!data) return notFound(requestId); // genuine zero rows → 404
    return json({ step: data }, 200, requestId);
  });

// DELETE /api/steps/:id — soft delete (sets deleted_at; row is preserved).
export const onRequestDelete: PagesFunction<Env, "id"> = (context) =>
  withLogging(context, async (requestId) => {
    const id = stepId(context);
    if (!isUuid(id)) return badRequest("Malformed step id", requestId);

    const db = createServiceClient(context.env);
    const { data, error } = await db
      .from(STEPS_TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null) // missing OR already-deleted both yield zero rows
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return notFound(requestId); // 404 (missing or already deleted)
    return json({ step: data }, 200, requestId);
  });

// Fallback for unhandled methods → structured 405 with Allow header.
export const onRequest: PagesFunction<Env, "id"> = (context) =>
  methodNotAllowed(context, "PATCH, DELETE");
