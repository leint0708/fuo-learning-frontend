import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Question } from "@/types/exam";
import type {
  CardMasteryRecord,
  RoundReviewItem,
  RoundDiagnostic,
} from "@/types/practice";

export interface UseLearnSessionOptions {
  subjectCode: string;
  questions: Question[];
  initialGraduatedIds?: string[];
  syncedGraduatedIds?: string[];
  syncedStats?: Record<string, CardMasteryRecord>;
  maxActivePoolSize?: number;
}

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

export function useLearnSession({
  subjectCode,
  questions,
  initialGraduatedIds,
  syncedGraduatedIds,
  syncedStats,
  maxActivePoolSize = 7,
}: UseLearnSessionOptions) {
  const hasRecordedAnswerRef = useRef(false);

  // Load graduated IDs from localStorage
  const [graduatedIds, setGraduatedIds] = useState<Set<string>>(() => {
    const seed = syncedGraduatedIds ?? initialGraduatedIds;
    if (seed) return new Set(seed);
    try {
      const stored = localStorage.getItem(`fuo_learn_mastered_${subjectCode}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Card stats tracking
  const [stats, setStats] = useState<Record<string, CardMasteryRecord>>(() => {
    if (syncedStats) return syncedStats;
    try {
      const stored = localStorage.getItem(`fuo_card_stats_${subjectCode}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Initial partitioning: separate ungraduated questions into active pool (up to 7) and waiting pool
  const [pools, setPools] = useState<{
    waiting: Question[];
    active: Question[];
    graduated: Question[];
  }>(() => {
    const unmastered = questions.filter((q) => !graduatedIds.has(q.questionId));
    const active = unmastered.slice(0, maxActivePoolSize);
    const waiting = unmastered.slice(maxActivePoolSize);
    const graduated = questions.filter((q) => graduatedIds.has(q.questionId));
    return { waiting, active, graduated };
  });

  const [roundQueue, setRoundQueue] = useState<Question[]>(() => {
    return shuffleArray(pools.active);
  });
  const [roundPointer, setRoundPointer] = useState<number>(0);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const [roundReviewItems, setRoundReviewItems] = useState<RoundReviewItem[]>([]);
  const [currentRoundDiagnostic, setCurrentRoundDiagnostic] = useState<RoundDiagnostic | null>(null);

  const lastAppliedSyncKeyRef = useRef<string | null>(null);

  // Unified initialization & server-sync hydration effect (avoids stale closure overwrites)
  useEffect(() => {
    if (hasRecordedAnswerRef.current) return;

    if (syncedGraduatedIds) {
      const syncKey = `${questions.map((q) => q.questionId).join(",")}|${syncedGraduatedIds.join(",")}|${Object.keys(syncedStats ?? {}).length}`;
      if (lastAppliedSyncKeyRef.current === syncKey) return;
      lastAppliedSyncKeyRef.current = syncKey;

      const nextGraduatedSet = new Set(syncedGraduatedIds);
      setGraduatedIds(nextGraduatedSet);
      if (syncedStats) {
        setStats(syncedStats);
      }
      if (questions.length > 0) {
        const unmastered = questions.filter((q) => !nextGraduatedSet.has(q.questionId));
        const active = unmastered.slice(0, maxActivePoolSize);
        const waiting = unmastered.slice(maxActivePoolSize);
        const graduated = questions.filter((q) => nextGraduatedSet.has(q.questionId));
        setPools({ waiting, active, graduated });
        setRoundQueue(shuffleArray(active));
        setRoundPointer(0);
      }
      return;
    }

    if (
      questions.length > 0 &&
      pools.active.length === 0 &&
      pools.waiting.length === 0 &&
      pools.graduated.length === 0
    ) {
      const unmastered = questions.filter((q) => !graduatedIds.has(q.questionId));
      const active = unmastered.slice(0, maxActivePoolSize);
      const waiting = unmastered.slice(maxActivePoolSize);
      const graduated = questions.filter((q) => graduatedIds.has(q.questionId));
      setPools({ waiting, active, graduated });
      setRoundQueue(shuffleArray(active));
      setRoundPointer(0);
    }
  }, [
    syncedGraduatedIds,
    syncedStats,
    questions,
    graduatedIds,
    maxActivePoolSize,
    pools.active.length,
    pools.waiting.length,
    pools.graduated.length,
  ]);

  const currentCard: Question | null = useMemo(() => {
    if (roundPointer >= roundQueue.length) return null;
    return roundQueue[roundPointer] || null;
  }, [roundQueue, roundPointer]);

  const isRoundCompleted = roundPointer >= roundQueue.length && roundQueue.length > 0;
  const isSessionCompleted =
    questions.length > 0 &&
    pools.active.length === 0 &&
    pools.waiting.length === 0 &&
    pools.graduated.length > 0;

  const persistGraduatedIds = useCallback(
    (newGraduated: Set<string>, updatedStats: Record<string, CardMasteryRecord>) => {
      try {
        localStorage.setItem(
          `fuo_learn_mastered_${subjectCode}`,
          JSON.stringify(Array.from(newGraduated))
        );
        localStorage.setItem(
          `fuo_card_stats_${subjectCode}`,
          JSON.stringify(updatedStats)
        );
      } catch {
        // Safe quota catch
      }
    },
    [subjectCode]
  );

  /**
   * Records answer evaluation for current round card
   */
  const recordAnswer = useCallback(
    (
      cardId: string,
      selectedOptions: string,
      correctAnswer: string,
      isCorrect: boolean,
      explanation?: string
    ): CardMasteryRecord | null => {
      const question = roundQueue.find((q) => q.questionId === cardId);
      if (!question) return null;
      hasRecordedAnswerRef.current = true;

      const currentStat: CardMasteryRecord = stats[cardId] || {
        questionId: cardId,
        consecutiveCorrect: 0,
        wrongAttempts: 0,
        totalAttempts: 0,
        status: "learning",
      };

      let nextStreak = currentStat.consecutiveCorrect;
      let nextWrong = currentStat.wrongAttempts;
      let nextStatus = currentStat.status;

      if (isCorrect) {
        if (currentStat.wrongAttempts === 0) {
          // Pristine card: 1 correct answer graduates immediately
          nextStreak = 1;
          nextStatus = "learned";
        } else {
          // Previously missed: requires consecutiveCorrect >= 2
          nextStreak = currentStat.consecutiveCorrect + 1;
          if (nextStreak >= 2) {
            nextStatus = "learned";
          } else {
            nextStatus = "learning";
          }
        }
      } else {
        // Mistake: wipeout streak to 0, increment error count
        nextStreak = 0;
        nextWrong = currentStat.wrongAttempts + 1;
        nextStatus = "learning";
      }

      const updatedStat: CardMasteryRecord = {
        questionId: cardId,
        consecutiveCorrect: nextStreak,
        wrongAttempts: nextWrong,
        totalAttempts: currentStat.totalAttempts + 1,
        status: nextStatus,
        lastAnsweredAt: new Date().toISOString(),
      };

      const updatedStats = {
        ...stats,
        [cardId]: updatedStat,
      };
      setStats(updatedStats);

      if (nextStatus === "learned") {
        setGraduatedIds((prev) => {
          const next = new Set(prev);
          next.add(cardId);
          persistGraduatedIds(next, updatedStats);
          return next;
        });
      } else {
        try {
          localStorage.setItem(
            `fuo_card_stats_${subjectCode}`,
            JSON.stringify(updatedStats)
          );
        } catch {
          // Safe quota catch
        }
      }

      const reviewItem: RoundReviewItem = {
        question,
        selectedOptions,
        correctAnswer,
        isCorrect,
        consecutiveCorrect: nextStreak,
        wrongAttempts: nextWrong,
        status: nextStatus,
        explanation,
      };

      const nextReviewItems = [...roundReviewItems, reviewItem];
      setRoundReviewItems(nextReviewItems);

      const nextPointer = roundPointer + 1;
      setRoundPointer(nextPointer);

      // Check if round just finished
      if (nextPointer >= roundQueue.length) {
        const incorrectCount = nextReviewItems.filter((i) => !i.isCorrect).length;
        const totalCards = nextReviewItems.length;
        const errorRate = totalCards > 0 ? (incorrectCount / totalCards) * 100 : 0;

        setCurrentRoundDiagnostic({
          roundNumber: currentRoundNumber,
          totalCardsReviewed: totalCards,
          incorrectCount,
          correctCount: totalCards - incorrectCount,
          errorRate,
          items: nextReviewItems,
        });
      }

      return updatedStat;
    },
    [
      subjectCode,
      roundQueue,
      stats,
      roundReviewItems,
      roundPointer,
      currentRoundNumber,
      persistGraduatedIds,
    ]
  );

  /**
   * Advances to next round: filters graduated cards, refills active pool up to 7
   */
  const nextRound = useCallback(() => {
    setPools((prev) => {
      // Collect graduated IDs
      const newlyGraduatedIds = new Set(
        roundReviewItems.filter((i) => i.status === "learned").map((i) => i.question.questionId)
      );

      // Remaining cards still in learning
      const remainingActive = prev.active.filter((c) => !newlyGraduatedIds.has(c.questionId));
      const newlyGraduatedCards = prev.active.filter((c) => newlyGraduatedIds.has(c.questionId));

      // Calculate replenishment capacity
      const slotsAvailable = Math.max(0, maxActivePoolSize - remainingActive.length);
      const refillCards = prev.waiting.slice(0, slotsAvailable);
      const remainingWaiting = prev.waiting.slice(slotsAvailable);

      const nextActive = [...remainingActive, ...refillCards];
      const nextGraduated = [...prev.graduated, ...newlyGraduatedCards];

      // Assemble new round queue
      setRoundQueue(shuffleArray(nextActive));
      setRoundPointer(0);
      setRoundReviewItems([]);
      setCurrentRoundDiagnostic(null);
      setCurrentRoundNumber((r) => r + 1);

      return {
        waiting: remainingWaiting,
        active: nextActive,
        graduated: nextGraduated,
      };
    });
  }, [roundReviewItems, maxActivePoolSize]);

  return {
    waitingPool: pools.waiting,
    activePool: pools.active,
    graduatedPool: pools.graduated,
    roundQueue,
    roundPointer,
    currentCard,
    currentRoundNumber,
    roundReviewItems,
    currentRoundDiagnostic,
    isRoundCompleted,
    isSessionCompleted,
    stats,
    recordAnswer,
    nextRound,
  };
}
