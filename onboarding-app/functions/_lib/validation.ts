import { TITLE_MAX_LENGTH, BODY_MAX_LENGTH } from "../../src/data/types";

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface CreateInput {
  title: string;
  body: string;
}
export interface PatchInput {
  title?: string;
  body?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

/**
 * Validate a text field: must be a non-blank string within `max`. `title` is stored
 * trimmed; `body` keeps its internal whitespace (it renders as pre-formatted text),
 * so only its trimmed form is checked for emptiness.
 */
function checkText(
  name: string,
  value: unknown,
  max: number,
  trim: boolean,
): Validated<string> {
  if (typeof value !== "string") {
    return { ok: false, error: `${name} must be a string` };
  }
  const stored = trim ? value.trim() : value;
  if (stored.trim().length === 0) {
    return { ok: false, error: `${name} must not be empty` };
  }
  if (stored.length > max) {
    return { ok: false, error: `${name} must be at most ${max} characters` };
  }
  return { ok: true, value: stored };
}

function unknownKey(
  input: Record<string, unknown>,
  allowed: string[],
): string | undefined {
  return Object.keys(input).find((key) => !allowed.includes(key));
}

/** POST contract: { title, body } both required; reject unknown keys (strict). */
export function validateCreate(input: unknown): Validated<CreateInput> {
  if (!isPlainObject(input)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const extra = unknownKey(input, ["title", "body"]);
  if (extra) {
    return { ok: false, error: `Unknown field: ${extra}` };
  }
  const title = checkText("title", input.title, TITLE_MAX_LENGTH, true);
  if (!title.ok) return title;
  const body = checkText("body", input.body, BODY_MAX_LENGTH, false);
  if (!body.ok) return body;
  return { ok: true, value: { title: title.value, body: body.value } };
}

/**
 * PATCH contract: { title?, body? } — at least one present; reject unknown keys and
 * non-string/blank values. A field that is absent is left unchanged.
 */
export function validatePatch(input: unknown): Validated<PatchInput> {
  if (!isPlainObject(input)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const extra = unknownKey(input, ["title", "body"]);
  if (extra) {
    return { ok: false, error: `Unknown field: ${extra}` };
  }
  const hasTitle = "title" in input;
  const hasBody = "body" in input;
  if (!hasTitle && !hasBody) {
    return { ok: false, error: "Provide at least one of: title, body" };
  }
  const value: PatchInput = {};
  if (hasTitle) {
    const title = checkText("title", input.title, TITLE_MAX_LENGTH, true);
    if (!title.ok) return title;
    value.title = title.value;
  }
  if (hasBody) {
    const body = checkText("body", input.body, BODY_MAX_LENGTH, false);
    if (!body.ok) return body;
    value.body = body.value;
  }
  return { ok: true, value };
}

/** Parse a JSON request body, rejecting wrong content-type and malformed JSON. */
export async function readJsonBody(
  request: Request,
): Promise<Validated<unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  // Parse the MIME type before any `;` params and require exact equality — a
  // substring check would accept values like `text/application/json-invalid`.
  const mime = contentType.split(";", 1)[0].trim().toLowerCase();
  if (mime !== "application/json") {
    return { ok: false, error: "Content-Type must be application/json" };
  }
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, error: "Body must be valid JSON" };
  }
}
