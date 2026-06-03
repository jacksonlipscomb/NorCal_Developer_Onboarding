// Per-browser step completion. There is no per-user login, so each visitor tracks
// their own progress in localStorage — one person's checks never affect another's.
// Pure helpers here; the React hook wraps them in useCompletedSteps.

export const COMPLETION_KEY = "norcal-onboarding-completed-v1";

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
