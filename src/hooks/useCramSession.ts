import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Question } from "@/types/exam";

export interface UseCramSessionOptions {
  subjectCode: string;
  questions: Question[];
  initialMasteredIds?: string[];
  scopedQuestionIds?: string[];
  batchSize?: number;
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

export function useCramSession({
  subjectCode,
  questions,
  initialMasteredIds,
  scopedQuestionIds,
  batchSize = 10,
}: UseCramSessionOptions) {
  // Load previously mastered card IDs from localStorage or prop
  const [masteredIds, setMasteredIds] = useState<Set<string>>(() => {
    if (initialMasteredIds) return new Set(initialMasteredIds);
    try {
      const stored = localStorage.getItem(`fuo_cram_mastered_${subjectCode}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Eligible pool for the current session: scoped mistake drill OR unmastered cards
  const deckPool = useMemo(() => {
    if (scopedQuestionIds && scopedQuestionIds.length > 0) {
      const scopedSet = new Set(scopedQuestionIds);
      return questions.filter((q) => scopedSet.has(q.questionId));
    }
    return questions.filter((q) => !masteredIds.has(q.questionId));
  }, [questions, masteredIds, scopedQuestionIds]);

  // Stable session pool reference for slicing batches
  const sessionPoolRef = useRef<Question[]>([]);
  if (sessionPoolRef.current.length === 0 && deckPool.length > 0) {
    sessionPoolRef.current = deckPool;
  }

  const activePool = sessionPoolRef.current.length > 0 ? sessionPoolRef.current : deckPool;
  const totalBatches = Math.max(1, Math.ceil(activePool.length / batchSize));

  const [batchIndex, setBatchIndex] = useState<number>(0);
  const [currentBatch, setCurrentBatch] = useState<Question[]>(() => {
    const initialSlice = activePool.slice(0, batchSize);
    return initialSlice;
  });
  const [activeQueue, setActiveQueue] = useState<Question[]>(() => {
    const initialSlice = activePool.slice(0, batchSize);
    return shuffleArray(initialSlice);
  });
  const [queuePointer, setQueuePointer] = useState<number>(0);
  const [masteredInBatch, setMasteredInBatch] = useState<Set<string>>(new Set());

  // Initialize batch when questions or batchIndex change if needed
  useEffect(() => {
    if (currentBatch.length === 0 && activePool.length > 0) {
      const slice = activePool.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
      setCurrentBatch(slice);
      setActiveQueue(shuffleArray(slice));
      setQueuePointer(0);
      setMasteredInBatch(new Set());
    }
  }, [activePool, batchIndex, batchSize, currentBatch.length]);

  // Sync masteredIds to localStorage
  const persistMasteredIds = useCallback(
    (newMastered: Set<string>) => {
      try {
        localStorage.setItem(
          `fuo_cram_mastered_${subjectCode}`,
          JSON.stringify(Array.from(newMastered))
        );
      } catch {
        // Safe fallback if storage quota exceeded
      }
    },
    [subjectCode]
  );

  const currentCard: Question | null = useMemo(() => {
    if (activeQueue.length === 0) return null;
    const clampedIndex = Math.min(queuePointer, activeQueue.length - 1);
    return activeQueue[clampedIndex] || null;
  }, [activeQueue, queuePointer]);

  const isBatchCompleted =
    currentBatch.length > 0 && masteredInBatch.size >= currentBatch.length;

  const isSessionCompleted =
    activePool.length > 0 &&
    isBatchCompleted &&
    (batchIndex + 1) * batchSize >= activePool.length;

  /**
   * Handles user answer submission:
   * - If correct: remove card from activeQueue, add to masteredInBatch
   * - If wrong: near-distance jitter re-insertion (2 to 4 slots ahead)
   */
  const recordAnswer = useCallback(
    (cardId: string, isCorrect: boolean) => {
      setActiveQueue((prevQueue) => {
        const cardIndex = prevQueue.findIndex((c) => c.questionId === cardId);
        if (cardIndex === -1) return prevQueue;

        const card = prevQueue[cardIndex];
        if (!card) return prevQueue;
        const nextQueue = [...prevQueue];
        nextQueue.splice(cardIndex, 1);

        if (isCorrect) {
          // Correct answer: card is removed from activeQueue
          setMasteredInBatch((prev) => {
            const next = new Set(prev);
            next.add(cardId);
            return next;
          });

          setMasteredIds((prev) => {
            const next = new Set(prev);
            next.add(cardId);
            persistMasteredIds(next);
            return next;
          });

          // Clamp pointer
          setQueuePointer((prev) => {
            if (nextQueue.length === 0) return 0;
            return prev >= nextQueue.length ? nextQueue.length - 1 : prev;
          });

          return nextQueue;
        } else {
          // Incorrect answer: Near-Distance Jitter (J = 2 to 4)
          if (nextQueue.length === 0) {
            // Only 1 card in batch: re-insert immediately at index 0
            setQueuePointer(0);
            return [card];
          }

          const jitterOffset = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
          const targetIndex = Math.min(cardIndex + jitterOffset, nextQueue.length);

          nextQueue.splice(targetIndex, 0, card);

          // Advance pointer to the next card in queue
          setQueuePointer((prev) => {
            if (prev >= nextQueue.length) return 0;
            return prev;
          });

          return nextQueue;
        }
      });
    },
    [persistMasteredIds]
  );

  /**
   * Advance to the next batch
   */
  const nextBatch = useCallback(() => {
    const nextIndex = batchIndex + 1;
    if (nextIndex * batchSize < activePool.length) {
      setBatchIndex(nextIndex);
      const start = nextIndex * batchSize;
      const slice = activePool.slice(start, start + batchSize);
      setCurrentBatch(slice);
      setActiveQueue(shuffleArray(slice));
      setQueuePointer(0);
      setMasteredInBatch(new Set());
    }
  }, [activePool, batchIndex, batchSize]);

  return {
    deckPool: activePool,
    masteredIds,
    currentBatch,
    activeQueue,
    queuePointer,
    currentCard,
    masteredInBatch,
    batchIndex,
    totalBatches,
    isBatchCompleted,
    isSessionCompleted,
    recordAnswer,
    nextBatch,
  };
}
