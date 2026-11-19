import type {
  CardMasteryRecord,
  CramActiveBatch,
  CramSessionQuestionEntry,
  PracticeMode,
  SubjectPracticeProgress,
} from "@/types/practice";

export interface SubjectLocalProgress {
  cramCount: number;
  learnCount: number;
  hasProgress: boolean;
}

const CRAM_MASTERED_PREFIX = "fuo_cram_mastered_";
const LEARN_MASTERED_PREFIX = "fuo_learn_mastered_";
const CARD_STATS_PREFIX = "fuo_card_stats_";
const CRAM_SYNCED_PREFIX = "fuo_cram_synced_";
const LEARN_SYNCED_PREFIX = "fuo_learn_synced_";
const CRAM_ACTIVE_BATCH_PREFIX = "fuo_cram_active_batch_";
const CRAM_ACTIVE_ENTRIES_PREFIX = "fuo_cram_active_entries_";

function readStringArrayFromStorage(key: string): { exists: boolean; values: string[] } {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { exists: false, values: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { exists: true, values: [] };
    return {
      exists: true,
      values: parsed.filter((item): item is string => typeof item === "string" && item.length > 0),
    };
  } catch {
    return { exists: false, values: [] };
  }
}

export function readLocalCramMasteredIds(subjectCode: string): string[] {
  return readStringArrayFromStorage(`${CRAM_MASTERED_PREFIX}${subjectCode}`).values;
}

export function readLocalLearnMasteredIds(subjectCode: string): string[] {
  return readStringArrayFromStorage(`${LEARN_MASTERED_PREFIX}${subjectCode}`).values;
}

export function readLocalCardStats(subjectCode: string): Record<string, CardMasteryRecord> {
  try {
    const raw = localStorage.getItem(`${CARD_STATS_PREFIX}${subjectCode}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, CardMasteryRecord>;
  } catch {
    return {};
  }
}

export function writeLocalCramMasteredIds(subjectCode: string, ids: string[]): void {
  try {
    localStorage.setItem(`${CRAM_MASTERED_PREFIX}${subjectCode}`, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}

export function writeLocalLearnProgress(
  subjectCode: string,
  ids: string[],
  stats: Record<string, CardMasteryRecord>
): void {
  try {
    localStorage.setItem(`${LEARN_MASTERED_PREFIX}${subjectCode}`, JSON.stringify(ids));
    localStorage.setItem(`${CARD_STATS_PREFIX}${subjectCode}`, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

function sanitizeIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function readLocalCramActiveBatch(subjectCode: string): CramActiveBatch | null {
  try {
    const raw = localStorage.getItem(`${CRAM_ACTIVE_BATCH_PREFIX}${subjectCode}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CramActiveBatch> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const batchQuestionIds = sanitizeIdList(parsed.batchQuestionIds);
    const activeQueueIds = sanitizeIdList(parsed.activeQueueIds);
    if (batchQuestionIds.length === 0 || activeQueueIds.length === 0) return null;
    return {
      scope: parsed.scope === "mistakes" ? "mistakes" : "deck",
      scopedQuestionIds: Array.isArray(parsed.scopedQuestionIds)
        ? sanitizeIdList(parsed.scopedQuestionIds)
        : undefined,
      batchQuestionIds,
      activeQueueIds,
      queuePointer:
        typeof parsed.queuePointer === "number" && Number.isFinite(parsed.queuePointer)
          ? Math.max(0, Math.floor(parsed.queuePointer))
          : 0,
      masteredInBatchIds: sanitizeIdList(parsed.masteredInBatchIds),
      missedIds: sanitizeIdList(parsed.missedIds),
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt
          ? parsed.updatedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeLocalCramActiveBatch(subjectCode: string, batch: CramActiveBatch): void {
  try {
    localStorage.setItem(`${CRAM_ACTIVE_BATCH_PREFIX}${subjectCode}`, JSON.stringify(batch));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLocalCramActiveBatch(subjectCode: string): void {
  try {
    localStorage.removeItem(`${CRAM_ACTIVE_BATCH_PREFIX}${subjectCode}`);
  } catch {
    // Ignore storage errors
  }
}

export function readLocalCramActiveEntries(subjectCode: string): CramSessionQuestionEntry[] {
  try {
    const raw = localStorage.getItem(`${CRAM_ACTIVE_ENTRIES_PREFIX}${subjectCode}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CramSessionQuestionEntry =>
        Boolean(entry && typeof entry === "object" && (entry as CramSessionQuestionEntry).question?.questionId)
    );
  } catch {
    return [];
  }
}

export function writeLocalCramActiveEntries(
  subjectCode: string,
  entries: CramSessionQuestionEntry[]
): void {
  try {
    localStorage.setItem(`${CRAM_ACTIVE_ENTRIES_PREFIX}${subjectCode}`, JSON.stringify(entries));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLocalCramActiveEntries(subjectCode: string): void {
  try {
    localStorage.removeItem(`${CRAM_ACTIVE_ENTRIES_PREFIX}${subjectCode}`);
  } catch {
    // Ignore storage errors
  }
}

export function addLocalSyncedIds(
  subjectCode: string,
  mode: PracticeMode,
  ids: string[]
): void {
  if (ids.length === 0) return;
  const key =
    mode === "cram"
      ? `${CRAM_SYNCED_PREFIX}${subjectCode}`
      : `${LEARN_SYNCED_PREFIX}${subjectCode}`;
  try {
    const existing = readStringArrayFromStorage(key).values;
    const merged = Array.from(new Set([...existing, ...ids]));
    localStorage.setItem(key, JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLocalPracticeSyncMarkers(
  subjectCode: string,
  mode?: PracticeMode
): void {
  try {
    if (!mode || mode === "cram") {
      localStorage.removeItem(`${CRAM_SYNCED_PREFIX}${subjectCode}`);
    }
    if (!mode || mode === "learn") {
      localStorage.removeItem(`${LEARN_SYNCED_PREFIX}${subjectCode}`);
    }
  } catch {
    // Ignore storage access errors
  }
}

export function computeUnsyncedLocalDelta(subjectCode: string): {
  hasChanges: boolean;
  cramMasteredIds: string[];
  learnMasteredIds: string[];
  cardStats: Record<string, CardMasteryRecord>;
  cramActiveBatch?: CramActiveBatch;
} {
  const localCram = readLocalCramMasteredIds(subjectCode);
  const cramSynced = readStringArrayFromStorage(`${CRAM_SYNCED_PREFIX}${subjectCode}`);
  const cramSyncedSet = new Set(cramSynced.values);
  const unsyncedCram = cramSynced.exists
    ? localCram.filter((id) => !cramSyncedSet.has(id))
    : localCram;

  const localLearn = readLocalLearnMasteredIds(subjectCode);
  const learnSynced = readStringArrayFromStorage(`${LEARN_SYNCED_PREFIX}${subjectCode}`);
  const learnSyncedSet = new Set(learnSynced.values);
  const unsyncedLearn = learnSynced.exists
    ? localLearn.filter((id) => !learnSyncedSet.has(id))
    : localLearn;

  const localStats = readLocalCardStats(subjectCode);
  const unsyncedStats: Record<string, CardMasteryRecord> = {};
  for (const [qId, stat] of Object.entries(localStats)) {
    if (!learnSynced.exists || !learnSyncedSet.has(qId)) {
      unsyncedStats[qId] = stat;
    }
  }

  const localBatch = readLocalCramActiveBatch(subjectCode);
  const hasUnsyncedBatch = Boolean(localBatch && unsyncedCram.length > 0);

  const hasChanges =
    unsyncedCram.length > 0 ||
    unsyncedLearn.length > 0 ||
    Object.keys(unsyncedStats).length > 0;

  return {
    hasChanges,
    cramMasteredIds: unsyncedCram,
    learnMasteredIds: unsyncedLearn,
    cardStats: unsyncedStats,
    cramActiveBatch: hasUnsyncedBatch ? localBatch ?? undefined : undefined,
  };
}

export function applyServerSubjectProgress(
  subjectCode: string,
  progress: SubjectPracticeProgress
): void {
  try {
    localStorage.setItem(
      `${CRAM_MASTERED_PREFIX}${subjectCode}`,
      JSON.stringify(progress.cramMasteredIds)
    );
    localStorage.setItem(
      `${CRAM_SYNCED_PREFIX}${subjectCode}`,
      JSON.stringify(progress.cramMasteredIds)
    );
    localStorage.setItem(
      `${LEARN_MASTERED_PREFIX}${subjectCode}`,
      JSON.stringify(progress.learnMasteredIds)
    );
    localStorage.setItem(
      `${LEARN_SYNCED_PREFIX}${subjectCode}`,
      JSON.stringify(progress.learnMasteredIds)
    );
    localStorage.setItem(
      `${CARD_STATS_PREFIX}${subjectCode}`,
      JSON.stringify(progress.cardStats)
    );

    const localBatch = readLocalCramActiveBatch(subjectCode);
    if (progress.cramActiveBatch) {
      const serverMs = Date.parse(progress.cramActiveBatch.updatedAt) || 0;
      const localMs = localBatch ? Date.parse(localBatch.updatedAt) || 0 : -1;
      if (!localBatch || serverMs >= localMs) {
        writeLocalCramActiveBatch(subjectCode, progress.cramActiveBatch);
      }
    } else if (progress.cramActiveBatch === null && localBatch) {
      const serverCramSet = new Set(progress.cramMasteredIds);
      const allBatchDoneOnServer =
        localBatch.scope === "deck" &&
        localBatch.activeQueueIds.every((id) => serverCramSet.has(id));
      if (allBatchDoneOnServer || progress.cramMasteredIds.length === 0) {
        clearLocalCramActiveBatch(subjectCode);
        clearLocalCramActiveEntries(subjectCode);
      }
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAllLocalPracticeStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(CRAM_MASTERED_PREFIX) ||
          key.startsWith(LEARN_MASTERED_PREFIX) ||
          key.startsWith(CARD_STATS_PREFIX) ||
          key.startsWith(CRAM_SYNCED_PREFIX) ||
          key.startsWith(LEARN_SYNCED_PREFIX) ||
          key.startsWith(CRAM_ACTIVE_BATCH_PREFIX) ||
          key.startsWith(CRAM_ACTIVE_ENTRIES_PREFIX))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Reads cached Cram and Learn mastery counts for a subject from localStorage.
 */
export function getSubjectLocalProgress(subjectCode: string): SubjectLocalProgress {
  let cramCount = 0;
  let learnCount = 0;

  try {
    const storedCram = localStorage.getItem(`${CRAM_MASTERED_PREFIX}${subjectCode}`);
    if (storedCram) {
      const parsed = JSON.parse(storedCram);
      if (Array.isArray(parsed)) cramCount = parsed.length;
    }

    const storedLearn = localStorage.getItem(`${LEARN_MASTERED_PREFIX}${subjectCode}`);
    if (storedLearn) {
      const parsed = JSON.parse(storedLearn);
      if (Array.isArray(parsed)) learnCount = parsed.length;
    }
  } catch {
    // Ignore malformed localStorage entries
  }

  return {
    cramCount,
    learnCount,
    hasProgress: cramCount > 0 || learnCount > 0,
  };
}

/**
 * Normalizes text for Vietnamese accent-insensitive and whitespace-trimmed search matching.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();
}
