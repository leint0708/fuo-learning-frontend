import type { BenchmarkMode } from "@/types/exam";

export const ANSWER_SOURCE_STORAGE_KEY = "fuo_answer_source_preference";

/**
 * Loads the user's fixed answer source preference from localStorage.
 * Safely defaults to "ai" if missing, invalid, or storage is inaccessible.
 */
export function loadAnswerSourcePreference(): BenchmarkMode {
  try {
    if (typeof window === "undefined") return "ai";
    const stored = window.localStorage.getItem(ANSWER_SOURCE_STORAGE_KEY);
    return stored === "community" ? "community" : "ai";
  } catch {
    return "ai";
  }
}

/**
 * Persists the user's chosen answer source preference across sessions and study modes.
 */
export function saveAnswerSourcePreference(mode: BenchmarkMode): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ANSWER_SOURCE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage quota or restricted context errors
  }
}
