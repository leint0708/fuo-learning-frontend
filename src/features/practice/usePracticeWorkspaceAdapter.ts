import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPracticeQuestions, checkPracticeAnswer } from "@/api/practice";
import { useCramSession } from "@/hooks/useCramSession";
import { useLearnSession } from "@/hooks/useLearnSession";
import { compareAnswers, getCommunityFallbackNotice } from "@/utils/answerComparison";
import { getErrorMessage } from "@/utils/error";
import type { BenchmarkMode, Question } from "@/types/exam";
import type { PracticeMode } from "@/types/practice";
import type {
  WorkspaceCardBadge,
  WorkspaceEvaluationResult,
  WorkspaceNavigatorItem,
  WorkspaceSessionDescriptor,
} from "@/features/workspace/types";

export type PracticeFeedbackMode = "instant" | "deferred";

interface CachedAiRationale {
  aiChoice: string;
  aiExplanation: string;
  optionByOptionAnalysis?: Record<string, string>;
}

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
  feedbackMode: PracticeFeedbackMode;
  benchmarkMode: BenchmarkMode;
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
  isAdvancingDeferred: boolean;
  isAiModalOpen: boolean;
  aiModalState: {
    aiChoice: string | null;
    aiExplanation: string | null;
    optionByOptionAnalysis: Record<string, string> | null;
    isLoading: boolean;
    errorMessage: string | null;
  };
  setFeedbackMode: (mode: PracticeFeedbackMode) => void;
  setBenchmarkMode: (mode: BenchmarkMode) => void;
  selectOption: (optionKey: string) => void;
  clearSelection: () => void;
  submitCheck: (overrideSelection?: string) => Promise<void>;
  retryEvaluation: () => Promise<void>;
  advanceNext: () => void;
  openAiAnalysis: () => void;
  closeAiAnalysis: () => void;
  retryAiAnalysis: () => Promise<void>;
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
  const [feedbackMode, setFeedbackModeState] = useState<PracticeFeedbackMode>("instant");
  const [benchmarkMode, setBenchmarkMode] = useState<BenchmarkMode>("ai");
  const [evaluation, setEvaluation] = useState<WorkspaceEvaluationResult | null>(null);
  const [pendingCommit, setPendingCommit] = useState<PendingEvaluationCommit | null>(null);
  const [cramMissedIds, setCramMissedIds] = useState<Set<string>>(() => new Set());
  const [isAdvancingDeferred, setIsAdvancingDeferred] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiExplanations, setAiExplanations] = useState<Record<string, CachedAiRationale>>({});
  const [aiLoadingIds, setAiLoadingIds] = useState<Record<string, boolean>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});
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
        const result = await checkPracticeAnswer(
          targetCard.questionId,
          choiceToEvaluate,
          benchmarkMode
        );
        const isMatch =
          result.isCorrect || compareAnswers(choiceToEvaluate, result.correctAnswer);
        const communityFallbackNotice = getCommunityFallbackNotice(
          benchmarkMode,
          result.communityStats
        );

        setEvaluation({
          status: "resolved",
          isCorrect: isMatch,
          correctAnswer: result.correctAnswer,
          aiExplanation: result.aiExplanation,
          optionByOptionAnalysis: result.optionByOptionAnalysis ?? null,
          communityFallbackNotice,
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
    [pinnedCard, engineCard, evaluation?.status, selectedOptions, benchmarkMode]
  );

  const retryEvaluation = useCallback(async () => {
    const choice = lastAttemptedChoiceRef.current || selectedOptions;
    if (!choice) return;
    await submitCheck(choice);
  }, [selectedOptions, submitCheck]);

  const setFeedbackMode = useCallback(
    (nextMode: PracticeFeedbackMode) => {
      setFeedbackModeState(nextMode);
      if (
        nextMode === "instant" &&
        selectedOptions &&
        !evaluation &&
        currentCard &&
        currentCard.questionType !== "multiple_choice"
      ) {
        void submitCheck(selectedOptions);
      }
    },
    [selectedOptions, evaluation, currentCard, submitCheck]
  );

  const selectOption = useCallback(
    (optionKey: string) => {
      if (!currentCard) return;
      if (evaluation?.status === "loading" || evaluation?.status === "resolved") return;
      if (isAdvancingDeferred) return;

      // Clear previous network error banner when user picks a fresh choice
      if (evaluation?.status === "error") {
        setEvaluation(null);
      }

      const isMulti = currentCard.questionType === "multiple_choice";
      if (!isMulti) {
        setSelectedOptions(optionKey);
        if (feedbackMode === "instant") {
          void submitCheck(optionKey);
        }
        return;
      }

      setSelectedOptions((prev) => {
        if (prev.includes(optionKey)) {
          return prev.replace(optionKey, "");
        }
        return [...(prev + optionKey)].sort((a, b) => a.localeCompare(b)).join("");
      });
    },
    [currentCard, evaluation?.status, isAdvancingDeferred, feedbackMode, submitCheck]
  );

  const clearSelection = useCallback(() => {
    if (evaluation?.status === "loading" || evaluation?.status === "resolved" || isAdvancingDeferred) {
      return;
    }
    setSelectedOptions("");
  }, [evaluation?.status, isAdvancingDeferred]);

  const clearCardTransientState = useCallback(() => {
    setPinnedCard(null);
    setPendingCommit(null);
    setSelectedOptions("");
    setEvaluation(null);
    setIsAiModalOpen(false);
    lastAttemptedChoiceRef.current = "";
  }, []);

  const commitToEngine = useCallback(
    (commit: PendingEvaluationCommit) => {
      if (practiceMode === "cram") {
        if (!commit.isCorrect) {
          setCramMissedIds((prev) => {
            const next = new Set(prev);
            next.add(commit.cardId);
            return next;
          });
        }
        cram.recordAnswer(commit.cardId, commit.isCorrect);
      } else {
        learn.recordAnswer(
          commit.cardId,
          commit.selectedOptions,
          commit.correctAnswer,
          commit.isCorrect,
          commit.explanation
        );
      }
    },
    [practiceMode, cram, learn]
  );

  const advanceNext = useCallback(() => {
    if (evaluation?.status === "resolved" && pendingCommit) {
      commitToEngine(pendingCommit);
      clearCardTransientState();
      return;
    }

    if (feedbackMode === "deferred" && currentCard && selectedOptions && !isAdvancingDeferred) {
      const targetCard = currentCard;
      const choice = selectedOptions;
      lastAttemptedChoiceRef.current = choice;
      setIsAdvancingDeferred(true);
      setEvaluation(null);

      void (async () => {
        try {
          const result = await checkPracticeAnswer(targetCard.questionId, choice, benchmarkMode);
          const isMatch =
            result.isCorrect || compareAnswers(choice, result.correctAnswer);
          commitToEngine({
            cardId: targetCard.questionId,
            selectedOptions: choice,
            correctAnswer: result.correctAnswer,
            isCorrect: isMatch,
            explanation: result.aiExplanation,
          });
          clearCardTransientState();
        } catch (err) {
          setEvaluation({
            status: "error",
            isCorrect: null,
            correctAnswer: null,
            aiExplanation: null,
            errorMessage: getErrorMessage(
              err,
              "Không thể kết nối máy chủ để ghi nhận câu trả lời. Vui lòng thử lại."
            ),
          });
        } finally {
          setIsAdvancingDeferred(false);
        }
      })();
    }
  }, [
    evaluation?.status,
    pendingCommit,
    feedbackMode,
    benchmarkMode,
    currentCard,
    selectedOptions,
    isAdvancingDeferred,
    commitToEngine,
    clearCardTransientState,
  ]);

  const fetchAiForQuestion = useCallback(async (qId: string, probeOption: string) => {
    setAiLoadingIds((prev) => ({ ...prev, [qId]: true }));
    setAiErrors((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });

    try {
      const res = await checkPracticeAnswer(qId, probeOption, benchmarkMode);
      setAiExplanations((prev) => ({
        ...prev,
        [qId]: {
          aiChoice: res.correctAnswer,
          aiExplanation: res.aiExplanation,
          optionByOptionAnalysis: res.optionByOptionAnalysis,
        },
      }));
    } catch (err) {
      setAiErrors((prev) => ({
        ...prev,
        [qId]: getErrorMessage(err, "Không thể kết nối dịch vụ AI. Vui lòng thử lại."),
      }));
    } finally {
      setAiLoadingIds((prev) => ({ ...prev, [qId]: false }));
    }
  }, [benchmarkMode]);

  const openAiAnalysis = useCallback(() => {
    setIsAiModalOpen(true);
    if (!currentCard) return;
    const qId = currentCard.questionId;
    const hasResolvedForCurrentCard =
      evaluation?.status === "resolved" && pinnedCard?.questionId === qId;
    if (!hasResolvedForCurrentCard && !aiExplanations[qId] && !aiLoadingIds[qId]) {
      const probeOption = selectedOptions || sortedOptionKeys[0] || "A";
      void fetchAiForQuestion(qId, probeOption);
    }
  }, [
    currentCard,
    evaluation?.status,
    pinnedCard?.questionId,
    aiExplanations,
    aiLoadingIds,
    selectedOptions,
    sortedOptionKeys,
    fetchAiForQuestion,
  ]);

  const closeAiAnalysis = useCallback(() => {
    setIsAiModalOpen(false);
  }, []);

  const retryAiAnalysis = useCallback(async () => {
    if (!currentCard) return;
    const qId = currentCard.questionId;
    const probeOption = selectedOptions || sortedOptionKeys[0] || "A";
    await fetchAiForQuestion(qId, probeOption);
  }, [currentCard, selectedOptions, sortedOptionKeys, fetchAiForQuestion]);

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
    allowsClearSelection: feedbackMode === "deferred",
  };

  const resolvedForCurrentCard =
    currentCard &&
    evaluation?.status === "resolved" &&
    pinnedCard?.questionId === currentCard.questionId
      ? evaluation
      : null;
  const cachedAi = currentCard ? aiExplanations[currentCard.questionId] : undefined;

  const aiModalState = {
    aiChoice: resolvedForCurrentCard?.correctAnswer ?? cachedAi?.aiChoice ?? null,
    aiExplanation: resolvedForCurrentCard?.aiExplanation ?? cachedAi?.aiExplanation ?? null,
    optionByOptionAnalysis:
      resolvedForCurrentCard?.optionByOptionAnalysis ?? cachedAi?.optionByOptionAnalysis ?? null,
    isLoading: currentCard ? Boolean(aiLoadingIds[currentCard.questionId]) : false,
    errorMessage: currentCard ? aiErrors[currentCard.questionId] ?? null : null,
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
    feedbackMode,
    benchmarkMode,
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
    isAdvancingDeferred,
    isAiModalOpen,
    aiModalState,
    setFeedbackMode,
    setBenchmarkMode,
    selectOption,
    clearSelection,
    submitCheck,
    retryEvaluation,
    advanceNext,
    openAiAnalysis,
    closeAiAnalysis,
    retryAiAnalysis,
    continueNextBatch,
    continueNextRound,
    resetPracticeSession,
  };
}
