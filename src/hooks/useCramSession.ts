import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Question } from "@/types/exam";
import type { CramActiveBatch, CramSessionScope } from "@/types/practice";
import {
  clearLocalCramActiveBatch,
  clearLocalCramActiveEntries,
  readLocalCramActiveBatch,
  writeLocalCramActiveBatch,
  writeLocalCramMasteredIds,
} from "@/utils/practiceProgress";

export interface UseCramSessionOptions {
  subjectCode: string;
  questions: Question[];
  initialMasteredIds?: string[];
  syncedMasteredIds?: string[];
  syncedActiveBatch?: CramActiveBatch | null;
  scopedQuestionIds?: string[];
  batchSize?: number;
}

interface CramBatchRuntimeState {
  sessionPool: Question[];
  batchIndex: number;
  currentBatch: Question[];
  activeQueue: Question[];
  queuePointer: number;
  masteredInBatch: Set<string>;
  missedIds: Set<string>;
  wasRestored: boolean;
}

/**
 * Fisher-Yates unbiased shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const itemI = result[i];
    const itemJ = result[j];
    if (itemI !== undefined && itemJ !== undefined) {
      result[i] = itemJ;
      result[j] = itemI;
    }
  }
  return result;
}

function sameIdSet(a?: string[], b?: string[]): boolean {
  const setA = new Set(a ?? []);
  const setB = new Set(b ?? []);
  if (setA.size !== setB.size) return false;
  for (const id of setA) {
    if (!setB.has(id)) return false;
  }
  return true;
}

function emptyBatchState(): CramBatchRuntimeState {
  return {
    sessionPool: [],
    batchIndex: 0,
    currentBatch: [],
    activeQueue: [],
    queuePointer: 0,
    masteredInBatch: new Set(),
    missedIds: new Set(),
    wasRestored: false,
  };
}

function restoreActiveBatchState(
  savedBatch: CramActiveBatch,
  questions: Question[],
  masteredIds: Set<string>,
  currentScope: CramSessionScope,
  scopedQuestionIds?: string[]
): CramBatchRuntimeState | null {
  if (savedBatch.scope !== currentScope) return null;
  if (currentScope === "mistakes" && !sameIdSet(savedBatch.scopedQuestionIds, scopedQuestionIds)) {
    return null;
  }

  const questionById = new Map(questions.map((q) => [q.questionId, q]));
  const seenBatchIds = new Set<string>();
  const currentBatch: Question[] = [];
  for (const id of savedBatch.batchQuestionIds) {
    if (seenBatchIds.has(id)) continue;
    const q = questionById.get(id);
    if (q) {
      seenBatchIds.add(id);
      currentBatch.push(q);
    }
  }
  if (currentBatch.length === 0) return null;

  const masteredInBatch = new Set<string>();
  for (const id of savedBatch.masteredInBatchIds) {
    if (seenBatchIds.has(id)) {
      masteredInBatch.add(id);
    }
  }
  if (currentScope === "deck") {
    for (const q of currentBatch) {
      if (masteredIds.has(q.questionId)) {
        masteredInBatch.add(q.questionId);
      }
    }
  }

  const activeQueue: Question[] = [];
  const seenQueueIds = new Set<string>();
  for (const id of savedBatch.activeQueueIds) {
    if (seenQueueIds.has(id) || !seenBatchIds.has(id) || masteredInBatch.has(id)) continue;
    const q = questionById.get(id);
    if (q) {
      seenQueueIds.add(id);
      activeQueue.push(q);
    }
  }
  for (const q of currentBatch) {
    if (!masteredInBatch.has(q.questionId) && !seenQueueIds.has(q.questionId)) {
      seenQueueIds.add(q.questionId);
      activeQueue.push(q);
    }
  }

  if (activeQueue.length === 0) return null;

  const queuePointer = Math.min(Math.max(0, savedBatch.queuePointer), activeQueue.length - 1);
  const missedIds = new Set(
    (savedBatch.missedIds ?? []).filter((id) => seenBatchIds.has(id))
  );

  const scopedSet =
    currentScope === "mistakes" && scopedQuestionIds ? new Set(scopedQuestionIds) : null;
  const remaining = questions.filter((q) => {
    if (seenBatchIds.has(q.questionId)) return false;
    if (scopedSet) return scopedSet.has(q.questionId);
    return !masteredIds.has(q.questionId);
  });

  return {
    sessionPool: [...currentBatch, ...remaining],
    batchIndex: 0,
    currentBatch,
    activeQueue,
    queuePointer,
    masteredInBatch,
    missedIds,
    wasRestored: true,
  };
}

function createFreshBatchState(
  questions: Question[],
  masteredIds: Set<string>,
  currentScope: CramSessionScope,
  scopedQuestionIds: string[] | undefined,
  batchSize: number
): CramBatchRuntimeState {
  const pool =
    currentScope === "mistakes" && scopedQuestionIds && scopedQuestionIds.length > 0
      ? questions.filter((q) => new Set(scopedQuestionIds).has(q.questionId))
      : questions.filter((q) => !masteredIds.has(q.questionId));

  const firstSlice = pool.slice(0, batchSize);
  return {
    sessionPool: pool,
    batchIndex: 0,
    currentBatch: firstSlice,
    activeQueue: shuffleArray(firstSlice),
    queuePointer: 0,
    masteredInBatch: new Set(),
    missedIds: new Set(),
    wasRestored: false,
  };
}

function buildInitialBatchState(
  questions: Question[],
  masteredIds: Set<string>,
  candidateBatch: CramActiveBatch | null,
  currentScope: CramSessionScope,
  scopedQuestionIds: string[] | undefined,
  batchSize: number
): CramBatchRuntimeState {
  if (questions.length === 0) return emptyBatchState();
  if (candidateBatch) {
    const restored = restoreActiveBatchState(
      candidateBatch,
      questions,
      masteredIds,
      currentScope,
      scopedQuestionIds
    );
    if (restored) return restored;
  }
  return createFreshBatchState(
    questions,
    masteredIds,
    currentScope,
    scopedQuestionIds,
    batchSize
  );
}

export function useCramSession({
  subjectCode,
  questions,
  initialMasteredIds,
  syncedMasteredIds,
  syncedActiveBatch,
  scopedQuestionIds,
  batchSize = 10,
}: UseCramSessionOptions) {
  const hasRecordedAnswerRef = useRef(false);
  const currentScope: CramSessionScope =
    scopedQuestionIds && scopedQuestionIds.length > 0 ? "mistakes" : "deck";

  // Load previously mastered card IDs from localStorage or prop
  const [masteredIds, setMasteredIds] = useState<Set<string>>(() => {
    const seed = syncedMasteredIds ?? initialMasteredIds;
    if (seed) return new Set(seed);
    try {
      const stored = localStorage.getItem(`fuo_cram_mastered_${subjectCode}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const masteredIdsRef = useRef<Set<string>>(masteredIds);

  const [batchState, setBatchState] = useState<CramBatchRuntimeState>(() => {
    const candidateBatch =
      syncedActiveBatch !== undefined
        ? syncedActiveBatch
        : readLocalCramActiveBatch(subjectCode);
    return buildInitialBatchState(
      questions,
      masteredIds,
      candidateBatch,
      currentScope,
      scopedQuestionIds,
      batchSize
    );
  });
  const batchStateRef = useRef<CramBatchRuntimeState>(batchState);
  batchStateRef.current = batchState;
  masteredIdsRef.current = masteredIds;

  const lastAppliedSyncKeyRef = useRef<string | null>(null);

  // Single unified initialization & server-sync hydration effect (avoids stale closure overwrites)
  useEffect(() => {
    if (hasRecordedAnswerRef.current) return;

    if (syncedMasteredIds) {
      const batchKey =
        syncedActiveBatch === undefined
          ? "undef"
          : syncedActiveBatch === null
            ? "null"
            : `${syncedActiveBatch.updatedAt}:${syncedActiveBatch.activeQueueIds.join(",")}`;
      const syncKey = `${questions.map((q) => q.questionId).join(",")}|${syncedMasteredIds.join(",")}|${scopedQuestionIds?.join(",") ?? ""}|${batchKey}`;
      if (lastAppliedSyncKeyRef.current === syncKey) return;
      lastAppliedSyncKeyRef.current = syncKey;

      const nextSet = new Set(syncedMasteredIds);
      masteredIdsRef.current = nextSet;
      setMasteredIds(nextSet);

      const candidateBatch =
        syncedActiveBatch !== undefined
          ? syncedActiveBatch
          : readLocalCramActiveBatch(subjectCode);
      const nextState = buildInitialBatchState(
        questions,
        nextSet,
        candidateBatch,
        currentScope,
        scopedQuestionIds,
        batchSize
      );
      batchStateRef.current = nextState;
      setBatchState(nextState);
      return;
    }

    if (batchStateRef.current.currentBatch.length === 0 && questions.length > 0) {
      const localBatch = readLocalCramActiveBatch(subjectCode);
      const nextState = buildInitialBatchState(
        questions,
        masteredIdsRef.current,
        localBatch,
        currentScope,
        scopedQuestionIds,
        batchSize
      );
      batchStateRef.current = nextState;
      setBatchState(nextState);
    }
  }, [
    subjectCode,
    syncedMasteredIds,
    syncedActiveBatch,
    questions,
    currentScope,
    scopedQuestionIds,
    batchSize,
  ]);

  const activePool = batchState.sessionPool;
  const totalBatches = Math.max(1, Math.ceil(activePool.length / batchSize));

  const currentCard: Question | null = useMemo(() => {
    if (batchState.activeQueue.length === 0) return null;
    const clampedIndex = Math.min(batchState.queuePointer, batchState.activeQueue.length - 1);
    return batchState.activeQueue[clampedIndex] || null;
  }, [batchState.activeQueue, batchState.queuePointer]);

  const isBatchCompleted =
    batchState.currentBatch.length > 0 &&
    batchState.masteredInBatch.size >= batchState.currentBatch.length;

  const isSessionCompleted =
    activePool.length > 0 &&
    isBatchCompleted &&
    (batchState.batchIndex + 1) * batchSize >= activePool.length;

  /**
   * Handles user answer submission:
   * - If correct: remove card from activeQueue, add to masteredInBatch
   * - If wrong: near-distance jitter re-insertion (2 to 4 slots ahead)
   * Persists in-progress batch state to localStorage and returns the next active batch snapshot
   * (or null when the batch finishes) so callers can sync it atomically to the server.
   */
  const recordAnswer = useCallback(
    (cardId: string, isCorrect: boolean): CramActiveBatch | null => {
      hasRecordedAnswerRef.current = true;
      const prev = batchStateRef.current;
      const cardIndex = prev.activeQueue.findIndex((c) => c.questionId === cardId);
      if (cardIndex === -1) return null;

      const card = prev.activeQueue[cardIndex];
      if (!card) return null;

      const nextQueue = [...prev.activeQueue];
      nextQueue.splice(cardIndex, 1);

      const nextMasteredInBatch = new Set(prev.masteredInBatch);
      const nextMissedIds = new Set(prev.missedIds);
      let nextQueuePointer = prev.queuePointer;

      if (isCorrect) {
        nextMasteredInBatch.add(cardId);

        const nextMasteredIds = new Set(masteredIdsRef.current);
        nextMasteredIds.add(cardId);
        masteredIdsRef.current = nextMasteredIds;
        setMasteredIds(nextMasteredIds);
        writeLocalCramMasteredIds(subjectCode, Array.from(nextMasteredIds));

        nextQueuePointer =
          nextQueue.length === 0
            ? 0
            : prev.queuePointer >= nextQueue.length
              ? nextQueue.length - 1
              : prev.queuePointer;
      } else {
        nextMissedIds.add(cardId);

        if (nextQueue.length === 0) {
          nextQueue.push(card);
          nextQueuePointer = 0;
        } else {
          const jitterOffset = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
          const targetIndex = Math.min(cardIndex + jitterOffset, nextQueue.length);
          nextQueue.splice(targetIndex, 0, card);
          nextQueuePointer = prev.queuePointer >= nextQueue.length ? 0 : prev.queuePointer;
        }
      }

      let nextActiveBatch: CramActiveBatch | null = null;
      if (nextQueue.length === 0) {
        clearLocalCramActiveBatch(subjectCode);
        clearLocalCramActiveEntries(subjectCode);
      } else {
        nextActiveBatch = {
          scope: currentScope,
          scopedQuestionIds: currentScope === "mistakes" ? scopedQuestionIds : undefined,
          batchQuestionIds: prev.currentBatch.map((q) => q.questionId),
          activeQueueIds: nextQueue.map((q) => q.questionId),
          queuePointer: nextQueuePointer,
          masteredInBatchIds: Array.from(nextMasteredInBatch),
          missedIds: Array.from(nextMissedIds),
          updatedAt: new Date().toISOString(),
        };
        writeLocalCramActiveBatch(subjectCode, nextActiveBatch);
      }

      const nextState: CramBatchRuntimeState = {
        ...prev,
        activeQueue: nextQueue,
        queuePointer: nextQueuePointer,
        masteredInBatch: nextMasteredInBatch,
        missedIds: nextMissedIds,
      };
      batchStateRef.current = nextState;
      setBatchState(nextState);

      return nextActiveBatch;
    },
    [subjectCode, currentScope, scopedQuestionIds]
  );

  /**
   * Advance to the next batch
   */
  const nextBatch = useCallback(() => {
    const prev = batchStateRef.current;
    const nextIndex = prev.batchIndex + 1;
    if (nextIndex * batchSize < prev.sessionPool.length) {
      const start = nextIndex * batchSize;
      const slice = prev.sessionPool.slice(start, start + batchSize);
      clearLocalCramActiveBatch(subjectCode);
      clearLocalCramActiveEntries(subjectCode);
      const nextState: CramBatchRuntimeState = {
        ...prev,
        batchIndex: nextIndex,
        currentBatch: slice,
        activeQueue: shuffleArray(slice),
        queuePointer: 0,
        masteredInBatch: new Set(),
        missedIds: new Set(),
        wasRestored: false,
      };
      batchStateRef.current = nextState;
      setBatchState(nextState);
    }
  }, [batchSize, subjectCode]);

  return {
    deckPool: activePool,
    masteredIds,
    currentBatch: batchState.currentBatch,
    activeQueue: batchState.activeQueue,
    queuePointer: batchState.queuePointer,
    currentCard,
    masteredInBatch: batchState.masteredInBatch,
    missedIds: batchState.missedIds,
    wasRestoredActiveBatch: batchState.wasRestored,
    batchIndex: batchState.batchIndex,
    totalBatches,
    isBatchCompleted,
    isSessionCompleted,
    recordAnswer,
    nextBatch,
  };
}
