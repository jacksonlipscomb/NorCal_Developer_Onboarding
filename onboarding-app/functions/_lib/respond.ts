import type { Env } from "./env";

type AnyContext = EventContext<Env, string, unknown>;

/**
 * Thin try/finally logging wrapper — NOT catch-and-rewrite.
 *
 * It generates the request ID, initializes the logged status to 500, runs the
 * handler, and overwrites status with the real response status on success. It does
 * not catch: an unexpected throw propagates so Cloudflare returns its platform 500,
 * and because status was never overwritten the `finally` log line correctly reads
 * 500. This keeps fail-hard-and-loud intact while still giving one structured log
 * line per request for correlation.
 */
export async function withLogging(
  context: AnyContext,
  handler: (requestId: string) => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  const { pathname } = new URL(context.request.url);
  let status = 500;
  try {
    const response = await handler(requestId);
    status = response.status;
    return response;
  } finally {
    console.log(
      JSON.stringify({
        requestId,
        method: context.request.method,
        path: pathname,
        status,
        ms: Date.now() - start,
      }),
    );
  }
}

/** JSON response carrying the request ID in the `x-request-id` header. */
export function json(
  body: unknown,
  status: number,
  requestId: string,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-request-id": requestId,
      ...extraHeaders,
    },
  });
}

/** 4xx error body: `{ error, requestId }`. */
export function errorResponse(
  message: string,
  status: number,
  requestId: string,
): Response {
  return json({ error: message, requestId }, status, requestId);
}

export function badRequest(message: string, requestId: string): Response {
  return errorResponse(message, 400, requestId);
}

export function notFound(requestId: string): Response {
  return errorResponse("Step not found", 404, requestId);
}

/**
 * Generic `onRequest` fallback. Fires only when no verb-specific export matched
 * (Cloudflare runs the generic handler only for unhandled methods), so it never
 * shadows the real handlers. Returns our own structured 405 with an `Allow` header.
 */
export function methodNotAllowed(
  context: AnyContext,
  allow: string,
): Promise<Response> {
  return withLogging(context, (requestId) =>
    Promise.resolve(
      json(
        { error: `Method not allowed. Allowed: ${allow}`, requestId },
        405,
        requestId,
        { Allow: allow },
      ),
    ),
  );
}
