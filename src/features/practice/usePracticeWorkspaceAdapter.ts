import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPracticeQuestions, checkPracticeAnswer } from "@/api/practice";
import { useCramSession } from "@/hooks/useCramSession";
import { useLearnSession } from "@/hooks/useLearnSession";
import { compareAnswers } from "@/utils/answerComparison";
import { getErrorMessage } from "@/utils/error";
import type { Question } from "@/types/exam";
import type { PracticeMode } from "@/types/practice";
import type {
  WorkspaceCardBadge,
  WorkspaceEvaluationResult,
  WorkspaceNavigatorItem,
  WorkspaceSessionDescriptor,
} from "@/features/workspace/types";

interface PendingEvaluationCommit {
  cardId: string;
  selectedOptions: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface PracticeWorkspaceAdapterResult {
  descriptor: WorkspaceSessionDescriptor;
  sessionStatus: "loading" | "error" | "empty" | "ready" | "completed";
  loadErrorMessage: string | null;
  currentCard: Question | null;
  sortedOptionKeys: string[];
  masteryBadge: WorkspaceCardBadge | null;
  selectedOptions: string;
  evaluation: WorkspaceEvaluationResult | null;
  navigatorItems: WorkspaceNavigatorItem[];
  activeNavIndex: number;
  answeredCount: number;
  totalNavCount: number;
  progressCurrent: number;
  progressTotal: number;
  progressLabel: string;
  subProgressText: string;
  statsSummaryLabel: string;
  cram: ReturnType<typeof useCramSession>;
  learn: ReturnType<typeof useLearnSession>;
  deckSize: number;
  isEvaluating: boolean;
  selectOption: (optionKey: string) => void;
  clearSelection: () => void;
  submitCheck: (overrideSelection?: string) => Promise<void>;
  retryEvaluation: () => Promise<void>;
  advanceNext: () => void;
  continueNextBatch: () => void;
  continueNextRound: () => void;
  resetPracticeSession: () => void;
}

export function clearPracticeStorage(subjectCode: string, mode: PracticeMode): void {
  try {
    localStorage.removeItem(
      mode === "cram" ? `fuo_cram_mastered_${subjectCode}` : `fuo_learn_mastered_${subjectCode}`
    );
    localStorage.removeItem(`fuo_card_stats_${subjectCode}`);
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

/**
 * Practice session adapter preserving 100% of Cram & Learn heuristics while deferring
 * recordAnswer() mutations until explicit "Tiếp tục" so feedback stays pinned cleanly.
 */
export function usePracticeWorkspaceAdapter(
  subjectCode: string,
  practiceMode: PracticeMode,
  onTriggerRemountReset: () => void
): PracticeWorkspaceAdapterResult {
  const {
    data: questions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["practiceQuestions", subjectCode],
    queryFn: () => getPracticeQuestions(subjectCode, 60),
    staleTime: 5 * 60 * 1000,
  });

  const validQuestions = useMemo(() => questions ?? [], [questions]);

  const cram = useCramSession({
    subjectCode,
    questions: validQuestions,
  });

  const learn = useLearnSession({
    subjectCode,
    questions: validQuestions,
  });

  const engineCard = practiceMode === "cram" ? cram.currentCard : learn.currentCard;

  const [pinnedCard, setPinnedCard] = useState<Question | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string>("");
  const [evaluation, setEvaluation] = useState<WorkspaceEvaluationResult | null>(null);
  const [pendingCommit, setPendingCommit] = useState<PendingEvaluationCommit | null>(null);
  const [cramMissedIds, setCramMissedIds] = useState<Set<string>>(() => new Set());
  const lastAttemptedChoiceRef = useRef<string>("");

  // Keep user viewing pinnedCard until advanceNext commits the answer to engine
  const currentCard = pinnedCard ?? engineCard;

  const sortedOptionKeys = useMemo(() => {
    if (!currentCard?.options) return ["A", "B", "C", "D"];
    const keys = Object.keys(currentCard.options);
    return keys.length > 0 ? [...keys].sort((a, b) => a.localeCompare(b)) : ["A", "B", "C", "D"];
  }, [currentCard]);

  const submitCheck = useCallback(
    async (overrideSelection?: string) => {
      const targetCard = pinnedCard ?? engineCard;
      if (!targetCard) return;
      if (evaluation?.status === "loading" || evaluation?.status === "resolved") return;

      const choiceToEvaluate = overrideSelection ?? selectedOptions;
      if (!choiceToEvaluate) return;

      lastAttemptedChoiceRef.current = choiceToEvaluate;
      setPinnedCard(targetCard);
      setEvaluation({
        status: "loading",
        isCorrect: null,
        correctAnswer: null,
        aiExplanation: null,
      });

      try {
        const result = await checkPracticeAnswer(targetCard.questionId, choiceToEvaluate);
        const isMatch =
          result.isCorrect || compareAnswers(choiceToEvaluate, result.correctAnswer);

        setEvaluation({
          status: "resolved",
          isCorrect: isMatch,
          correctAnswer: result.correctAnswer,
          aiExplanation: result.aiExplanation,
          optionByOptionAnalysis: result.optionByOptionAnalysis ?? null,
          resolvedAt: Date.now(),
        });

        setPendingCommit({
          cardId: targetCard.questionId,
          selectedOptions: choiceToEvaluate,
          correctAnswer: result.correctAnswer,
          isCorrect: isMatch,
          explanation: result.aiExplanation,
        });
      } catch (err) {
        setEvaluation({
          status: "error",
          isCorrect: null,
          correctAnswer: null,
          aiExplanation: null,
          errorMessage: getErrorMessage(
            err,
            "Không thể kết nối máy chủ để chấm điểm. Vui lòng thử lại."
          ),
        });
      }
    },
    [pinnedCard, engineCard, evaluation?.status, selectedOptions]
  );

  const retryEvaluation = useCallback(async () => {
    const choice = lastAttemptedChoiceRef.current || selectedOptions;
    if (!choice) return;
    await submitCheck(choice);
  }, [selectedOptions, submitCheck]);

  const selectOption = useCallback(
    (optionKey: string) => {
      if (!currentCard) return;
      if (evaluation?.status === "loading" || evaluation?.status === "resolved") return;

      // Clear previous network error banner when user picks a fresh choice
      if (evaluation?.status === "error") {
        setEvaluation(null);
      }

      const isMulti = currentCard.questionType === "multiple_choice";
      if (!isMulti) {
        setSelectedOptions(optionKey);
        void submitCheck(optionKey);
        return;
      }

      setSelectedOptions((prev) => {
        if (prev.includes(optionKey)) {
          return prev.replace(optionKey, "");
        }
        return [...(prev + optionKey)].sort((a, b) => a.localeCompare(b)).join("");
      });
    },
    [currentCard, evaluation?.status, submitCheck]
  );

  const clearSelection = useCallback(() => {
    if (evaluation?.status === "loading" || evaluation?.status === "resolved") return;
    setSelectedOptions("");
  }, [evaluation?.status]);

  const clearCardTransientState = useCallback(() => {
    setPinnedCard(null);
    setPendingCommit(null);
    setSelectedOptions("");
    setEvaluation(null);
    lastAttemptedChoiceRef.current = "";
  }, []);

  const advanceNext = useCallback(() => {
    if (evaluation?.status !== "resolved" || !pendingCommit) return;

    if (practiceMode === "cram") {
      if (!pendingCommit.isCorrect) {
        setCramMissedIds((prev) => {
          const next = new Set(prev);
          next.add(pendingCommit.cardId);
          return next;
        });
      }
      cram.recordAnswer(pendingCommit.cardId, pendingCommit.isCorrect);
    } else {
      learn.recordAnswer(
        pendingCommit.cardId,
        pendingCommit.selectedOptions,
        pendingCommit.correctAnswer,
        pendingCommit.isCorrect,
        pendingCommit.explanation
      );
    }

    clearCardTransientState();
  }, [evaluation?.status, pendingCommit, practiceMode, cram, learn, clearCardTransientState]);

  const continueNextBatch = useCallback(() => {
    cram.nextBatch();
    clearCardTransientState();
  }, [cram, clearCardTransientState]);

  const continueNextRound = useCallback(() => {
    learn.nextRound();
    clearCardTransientState();
  }, [learn, clearCardTransientState]);

  const resetPracticeSession = useCallback(() => {
    clearPracticeStorage(subjectCode, practiceMode);
    clearCardTransientState();
    setCramMissedIds(new Set());
    onTriggerRemountReset();
  }, [subjectCode, practiceMode, clearCardTransientState, onTriggerRemountReset]);

  const masteryBadge = useMemo<WorkspaceCardBadge | null>(() => {
    if (!currentCard) return null;
    if (practiceMode === "cram") {
      if (cramMissedIds.has(currentCard.questionId)) {
        return { label: "Nhắc lại sau lỗi", tone: "warning" };
      }
      return null;
    }

    const stat = learn.stats[currentCard.questionId];
    if (!stat) return null;
    if (stat.wrongAttempts > 0) {
      return {
        label: `Nhắc lại sau lỗi • Chuỗi ${stat.consecutiveCorrect}/2`,
        tone: "warning",
      };
    }
    if (stat.consecutiveCorrect >= 1) {
      return { label: "Lần đầu đúng", tone: "accent" };
    }
    return null;
  }, [currentCard, practiceMode, cramMissedIds, learn.stats]);

  const navigatorItems = useMemo<WorkspaceNavigatorItem[]>(() => {
    if (practiceMode === "cram") {
      return cram.currentBatch.map((q) => {
        const isDone = cram.masteredInBatch.has(q.questionId);
        const isRequeued = !isDone && cramMissedIds.has(q.questionId);
        return {
          id: q.questionId,
          number: q.questionNumber,
          isAnswered: isDone,
          isCurrent: currentCard?.questionId === q.questionId,
          isCorrect: isDone ? true : null,
          isRequeued,
          streakText: isRequeued ? "Nhắc lại sau lỗi" : undefined,
        };
      });
    }

    return learn.activePool.map((q) => {
      const stat = learn.stats[q.questionId];
      const reviewEntry = learn.roundReviewItems.find(
        (item) => item.question.questionId === q.questionId
      );
      const isLearned = stat?.status === "learned";
      const isRequeued = !isLearned && (stat?.wrongAttempts ?? 0) > 0;
      const targetStreak = (stat?.wrongAttempts ?? 0) > 0 ? 2 : 1;

      return {
        id: q.questionId,
        number: q.questionNumber,
        isAnswered: Boolean(reviewEntry) || isLearned,
        isCurrent: currentCard?.questionId === q.questionId,
        isCorrect: reviewEntry ? reviewEntry.isCorrect : isLearned ? true : null,
        isRequeued,
        streakText: stat ? `Chuỗi ${stat.consecutiveCorrect}/${targetStreak}` : undefined,
      };
    });
  }, [
    practiceMode,
    cram.currentBatch,
    cram.masteredInBatch,
    cramMissedIds,
    learn.activePool,
    learn.stats,
    learn.roundReviewItems,
    currentCard?.questionId,
  ]);

  const activeNavIndex = Math.max(
    0,
    navigatorItems.findIndex((item) => item.isCurrent)
  );

  const isSessionCompleted =
    practiceMode === "cram" ? cram.isSessionCompleted : learn.isSessionCompleted;

  const sessionStatus: PracticeWorkspaceAdapterResult["sessionStatus"] = isLoading
    ? "loading"
    : error
      ? "error"
      : validQuestions.length === 0
        ? "empty"
        : isSessionCompleted
          ? "completed"
          : "ready";

  const progressCurrent =
    practiceMode === "cram" ? cram.masteredInBatch.size : learn.roundPointer;
  const progressTotal =
    practiceMode === "cram" ? cram.currentBatch.length : learn.roundQueue.length;
  const progressLabel = `${progressCurrent}/${Math.max(1, progressTotal)} câu`;

  const subProgressText =
    practiceMode === "cram"
      ? `Đợt ${cram.batchIndex + 1}/${cram.totalBatches} • Còn ${cram.activeQueue.length} thẻ`
      : `Vòng ${learn.currentRoundNumber} • Thẻ ${Math.min(
          learn.roundPointer + 1,
          Math.max(1, learn.roundQueue.length)
        )}/${Math.max(1, learn.roundQueue.length)}`;

  const statsSummaryLabel =
    practiceMode === "cram"
      ? `${cram.masteredIds.size} đã thuộc`
      : `${learn.graduatedPool.length} thành thạo`;

  const descriptor: WorkspaceSessionDescriptor = {
    mode: practiceMode,
    title: practiceMode === "cram" ? "Luyện thi cấp tốc" : "Học ghi nhớ",
    exitRoute: `/subjects/${subjectCode}`,
    exitLabel: "Thoát",
    supportsFreeNavigation: false,
    requiresExplicitContinue: true,
    allowsClearSelection: false,
  };

  return {
    descriptor,
    sessionStatus,
    loadErrorMessage: error
      ? getErrorMessage(error, "Không có câu hỏi luyện tập nào khả dụng cho môn này.")
      : null,
    currentCard,
    sortedOptionKeys,
    masteryBadge,
    selectedOptions,
    evaluation,
    navigatorItems,
    activeNavIndex,
    answeredCount:
      practiceMode === "cram"
        ? cram.masteredInBatch.size
        : learn.roundReviewItems.length,
    totalNavCount: navigatorItems.length,
    progressCurrent,
    progressTotal,
    progressLabel,
    subProgressText,
    statsSummaryLabel,
    cram,
    learn,
    deckSize: validQuestions.length,
    isEvaluating: evaluation?.status === "loading",
    selectOption,
    clearSelection,
    submitCheck,
    retryEvaluation,
    advanceNext,
    continueNextBatch,
    continueNextRound,
    resetPracticeSession,
  };
}
