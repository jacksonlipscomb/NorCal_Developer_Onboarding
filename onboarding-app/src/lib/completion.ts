// Per-user step completion, persisted to localStorage. The storage key is namespaced by
// the signed-in user id so two accounts on the same browser never see each other's
// check-offs. Pure helpers here; the React hook wraps them in useCompletedSteps.

const COMPLETION_KEY_PREFIX = "norcal-onboarding-completed-v1";

/** localStorage key for a given user's check-offs. */
export function completionKey(userId: string): string {
  return `${COMPLETION_KEY_PREFIX}:${userId}`;
}

/** Parse the stored value into a clean list of step ids (tolerant of junk). */
export function parseCompleted(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

/** Add or remove an id, returning a new list (no in-place mutation). */
export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}
