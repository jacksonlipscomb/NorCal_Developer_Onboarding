import type { Env } from "./_lib/env";
import { isAuthorized, UNAUTHORIZED_HEADERS } from "./_lib/auth";

// Site-wide gate. A root _middleware runs on EVERY request to the Pages project —
// static assets and API alike — before any other handler. Unauthenticated requests
// get a 401 that triggers the browser's Basic Auth prompt; authorized requests fall
// through to the normal asset/function handling via context.next().
//
// Fails closed: if SITE_BASIC_AUTH is not configured, nothing is authorized.
export const onRequest: PagesFunction<Env> = (context) => {
  const expected = context.env.SITE_BASIC_AUTH ?? "";
  const auth = context.request.headers.get("Authorization");
  if (!isAuthorized(auth, expected)) {
    return new Response("Authentication required.", {
      status: 401,
      headers: UNAUTHORIZED_HEADERS,
    });
  }
  return context.next();
};
