// HTTP Basic Auth check for the site gate. Pure + unit-tested; the middleware wires
// it to requests. `expected` is the shared credential in "user:password" form.

function timingSafeEqual(a: string, b: string): boolean {
  // Length comparison can leak length, which is acceptable here. The byte loop
  // avoids short-circuiting on the first differing character.
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Returns true only when the request carries a Basic credential that matches
 * `expected` exactly. Fails closed: an empty `expected` (secret not configured)
 * authorizes nothing.
 */
export function isAuthorized(
  authHeader: string | null,
  expected: string,
): boolean {
  if (!expected) return false;
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(authHeader.slice("Basic ".length).trim());
  } catch {
    return false; // not valid base64
  }
  return timingSafeEqual(decoded, expected);
}

export const UNAUTHORIZED_HEADERS = {
  "WWW-Authenticate": 'Basic realm="NorCal Onboarding", charset="UTF-8"',
};
