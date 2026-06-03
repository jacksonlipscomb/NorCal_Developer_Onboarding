import { useCallback, useState } from "react";
import {
  COMPLETION_KEY,
  parseCompleted,
  toggleId,
} from "@/lib/completion";

// Tracks which steps this browser has checked off, persisted to localStorage.
export function useCompletedSteps() {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof localStorage === "undefined") return new Set();
    return new Set(parseCompleted(localStorage.getItem(COMPLETION_KEY)));
  });

  const toggle = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = toggleId([...prev], id);
      localStorage.setItem(COMPLETION_KEY, JSON.stringify(next));
      return new Set(next);
    });
  }, []);

  return { completed, toggle };
}
