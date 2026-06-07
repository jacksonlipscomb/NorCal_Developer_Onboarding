import { useCallback, useEffect, useState } from "react";
import { completionKey, parseCompleted, toggleId } from "@/lib/completion";

// Tracks which steps the signed-in user has checked off, persisted to localStorage under
// a user-scoped key so check-offs don't bleed across accounts on a shared browser.
export function useCompletedSteps(userId: string) {
  const key = completionKey(userId);

  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof localStorage === "undefined") return new Set();
    return new Set(parseCompleted(localStorage.getItem(key)));
  });

  // Re-read when the user (and therefore the key) changes.
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    setCompleted(new Set(parseCompleted(localStorage.getItem(key))));
  }, [key]);

  const toggle = useCallback(
    (id: string) => {
      setCompleted((prev) => {
        const next = toggleId([...prev], id);
        localStorage.setItem(key, JSON.stringify(next));
        return new Set(next);
      });
    },
    [key],
  );

  return { completed, toggle };
}
