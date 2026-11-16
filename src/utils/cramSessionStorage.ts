import type { CramMistakeDrillPayload, CramSessionSnapshot } from "@/types/practice";

const SESSION_SNAPSHOT_PREFIX = "fuo_cram_last_session_";
const MISTAKE_DRILL_PREFIX = "fuo_cram_mistake_drill_";

function normalizeCode(subjectCode: string): string {
  return subjectCode.trim().toUpperCase();
}

export function getCramSessionStorageKey(subjectCode: string): string {
  return `${SESSION_SNAPSHOT_PREFIX}${normalizeCode(subjectCode)}`;
}

export function getCramMistakeDrillKey(subjectCode: string): string {
  return `${MISTAKE_DRILL_PREFIX}${normalizeCode(subjectCode)}`;
}

export function saveCramSessionSnapshot(snapshot: CramSessionSnapshot): void {
  if (!snapshot.subjectCode) return;
  try {
    window.sessionStorage.setItem(
      getCramSessionStorageKey(snapshot.subjectCode),
      JSON.stringify(snapshot)
    );
  } catch {
    // Ignore storage quota / restricted browser mode
  }
}

export function loadCramSessionSnapshot(subjectCode: string): CramSessionSnapshot | null {
  if (!subjectCode) return null;
  try {
    const raw = window.sessionStorage.getItem(getCramSessionStorageKey(subjectCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<CramSessionSnapshot>;
    if (!candidate.subjectCode || !Array.isArray(candidate.entries)) return null;
    return candidate as CramSessionSnapshot;
  } catch {
    return null;
  }
}

export function clearCramSessionSnapshot(subjectCode: string): void {
  if (!subjectCode) return;
  try {
    window.sessionStorage.removeItem(getCramSessionStorageKey(subjectCode));
  } catch {
    // Ignore storage errors
  }
}

export function saveCramMistakeDrill(subjectCode: string, questionIds: string[]): void {
  const uniqueIds = Array.from(new Set(questionIds.filter(Boolean)));
  if (!subjectCode || uniqueIds.length === 0) return;
  const payload: CramMistakeDrillPayload = {
    subjectCode: normalizeCode(subjectCode),
    questionIds: uniqueIds,
    createdAt: new Date().toISOString(),
  };
  try {
    window.sessionStorage.setItem(
      getCramMistakeDrillKey(subjectCode),
      JSON.stringify(payload)
    );
  } catch {
    // Ignore storage errors
  }
}

export function loadCramMistakeDrill(subjectCode: string): string[] {
  if (!subjectCode) return [];
  try {
    const raw = window.sessionStorage.getItem(getCramMistakeDrillKey(subjectCode));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const candidate = parsed as Partial<CramMistakeDrillPayload>;
    if (!Array.isArray(candidate.questionIds)) return [];
    return candidate.questionIds.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function clearCramMistakeDrill(subjectCode: string): void {
  if (!subjectCode) return;
  try {
    window.sessionStorage.removeItem(getCramMistakeDrillKey(subjectCode));
  } catch {
    // Ignore storage errors
  }
}

export function clearAllCramSessionStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (
        key &&
        (key.startsWith(SESSION_SNAPSHOT_PREFIX) || key.startsWith(MISTAKE_DRILL_PREFIX))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore storage errors
  }
}
