import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAttempt,
  saveAnswer,
  submitAttempt,
  checkInstantAnswer,
} from "@/api/attempts";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useExamUiStore } from "@/stores/examUiStore";
import { didFallbackToAi, getCommunityFallbackNotice } from "@/utils/answerComparison";
import { getErrorMessage } from "@/utils/error";
import {
  inferSubjectCode,
  getActiveExams,
  getEndedAttemptReason,
  markAttemptEnded,
  removeActiveExam,
  upsertActiveExam,
} from "@/utils/activeExams";
import type { BenchmarkMode, FeedbackMode, Question } from "@/types/exam";
import type {
  WorkspaceEvaluationResult,
  WorkspaceNavigatorItem,
  WorkspaceSaveStatus,
  WorkspaceTimerState,
} from "@/features/workspace/types";

interface CachedInstantResult {
  isCorrect: boolean;
  correctAnswer: string;
  aiExplanation: string;
  optionByOptionAnalysis?: Record<string, string>;
  communityFallbackNotice?: string | null;
}

interface CachedAiRationale {
  aiChoice: string;
  aiExplanation: string;
  optionByOptionAnalysis?: Record<string, string>;
}

export interface ExamWorkspaceAdapterResult {
  sessionStatus: "loading" | "error" | "ended" | "ready";
  endedReason: "completed" | "expired" | null;
  loadErrorMessage: string | null;
  examTitle: string;
  questions: Question[];
  currentQuestion: Question | null;
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  sortedOptionKeys: string[];
  selectedOptions: string;
  feedbackMode: FeedbackMode;
  setFeedbackMode: (mode: FeedbackMode) => void;
  benchmarkMode: BenchmarkMode;
  preferredBenchmarkMode: BenchmarkMode;
  answerSourceFallbackNotice: string | null;
  setBenchmarkMode: (mode: BenchmarkMode) => void;
  evaluation: WorkspaceEvaluationResult | null;
  saveStatus: WorkspaceSaveStatus;
  pendingSaveCount: number;
  timer: WorkspaceTimerState;
  navigatorItems: WorkspaceNavigatorItem[];
  isSubmitting: boolean;
  submitError: string | null;
  isAiModalOpen: boolean;
  isSubmitConfirmOpen: boolean;
  aiModalState: {
    aiChoice: string | null;
    aiExplanation: string | null;
    optionByOptionAnalysis: Record<string, string> | null;
    isLoading: boolean;
    errorMessage: string | null;
  };
  retryLoad: () => Promise<void>;
  selectOption: (optionKey: string) => Promise<void>;
  clearSelection: () => Promise<void>;
  submitMultiChoiceCheck: () => Promise<void>;
  retrySave: () => Promise<void>;
  jumpToQuestion: (index: number) => void;
  navigatePrev: () => void;
  navigateNext: () => void;
  openAiAnalysis: () => void;
  closeAiAnalysis: () => void;
  retryAiAnalysis: () => Promise<void>;
  openSubmitDialog: () => void;
  closeSubmitDialog: () => void;
  confirmSubmit: () => Promise<void>;
}

const DRAFT_STORAGE_PREFIX = "fuo_exam_draft_";

function readDraftMap(storageKey: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const safe: Record<string, string> = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === "string") {
        safe[key] = val;
      }
    }
    return safe;
  } catch {
    return {};
  }
}

function writeDraftMap(storageKey: string, draft: Record<string, string>): void {
  try {
    if (Object.keys(draft).length === 0) {
      window.localStorage.removeItem(storageKey);
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
    }
  } catch {
    // Ignore storage quota or restricted context errors
  }
}

/**
 * Exam attempt adapter connecting attempt persistence, countdown/elapsed timer, instant/post_exam modes,
 * non-blocking save telemetry, and always-accessible AI rationale without hardcoded answers.
 */
export function useExamWorkspaceAdapter(safeAttemptId: string): ExamWorkspaceAdapterResult {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const draftStorageKey = `${DRAFT_STORAGE_PREFIX}${safeAttemptId}`;
  const endedLocallyReason = getEndedAttemptReason(safeAttemptId);
  const endedLocally = endedLocallyReason !== null;

  const {
    currentQuestionIndex,
    setQuestionIndex,
    isAiModalOpen,
    openAiModal,
    closeAiModal,
    isSubmitConfirmOpen,
    openSubmitConfirm,
    closeSubmitConfirm,
    feedbackMode,
    setFeedbackMode,
    benchmarkMode: preferredBenchmarkMode,
    setBenchmarkMode: persistPreferredBenchmarkMode,
    resetSessionState,
  } = useExamUiStore();

  // Isolate question index between attempts & restore persisted feedbackMode across page reloads
  useEffect(() => {
    resetSessionState();
    const persisted = getActiveExams().find((item) => item.attemptId === safeAttemptId);
    if (persisted?.feedbackMode) {
      setFeedbackMode(persisted.feedbackMode);
    }
  }, [safeAttemptId, resetSessionState, setFeedbackMode]);

  const {
    data: attempt,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["attempt", safeAttemptId],
    queryFn: () => getAttempt(safeAttemptId),
    enabled: Boolean(safeAttemptId) && !endedLocally,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [instantResults, setInstantResults] = useState<Record<string, CachedInstantResult>>({});
  const [instantErrors, setInstantErrors] = useState<Record<string, string>>({});
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);

  const [aiExplanations, setAiExplanations] = useState<Record<string, CachedAiRationale>>({});
  const [aiLoadingIds, setAiLoadingIds] = useState<Record<string, boolean>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});

  const [saveStatus, setSaveStatus] = useState<WorkspaceSaveStatus>("idle");
  const [failedSaves, setFailedSaves] = useState<Record<string, string>>({});
  const failedSavesRef = useRef<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fallbackQuestionId, setFallbackQuestionId] = useState<string | null>(null);

  const updateFailedSaves = useCallback(
    (updater: (prev: Record<string, string>) => Record<string, string>) => {
      const next = updater(failedSavesRef.current);
      failedSavesRef.current = next;
      setFailedSaves(next);
      writeDraftMap(draftStorageKey, next);
      return next;
    },
    [draftStorageKey]
  );

  // Hydrate initial selections from attempt payload + any recovered offline drafts
  useEffect(() => {
    if (attempt?.examTitle) {
      document.title = `${attempt.examTitle} | FUO Learning`;
    } else {
      document.title = "Phòng thi trực tuyến | FUO Learning";
    }

    if (attempt?.questions) {
      const initialMap: Record<string, string> = {};
      attempt.questions.forEach((q) => {
        if (q.selectedOptions) {
          initialMap[q.questionId] = q.selectedOptions;
        }
      });

      const localDraft = safeAttemptId ? readDraftMap(draftStorageKey) : {};
      const validIds = new Set(attempt.questions.map((q) => q.questionId));
      const pendingDrafts: Record<string, string> = {};

      for (const [qId, selected] of Object.entries(localDraft)) {
        if (!validIds.has(qId)) continue;
        pendingDrafts[qId] = selected;
        if (selected) {
          initialMap[qId] = selected;
        } else {
          delete initialMap[qId];
        }
      }

      setUserAnswers(initialMap);
      if (Object.keys(pendingDrafts).length > 0) {
        failedSavesRef.current = pendingDrafts;
        setFailedSaves(pendingDrafts);
        setSaveStatus("error");
      }
    }
  }, [attempt, safeAttemptId, draftStorageKey]);

  const flushFailedSaves = useCallback(async () => {
    const entries = Object.entries(failedSavesRef.current);
    if (entries.length === 0) return;

    setSaveStatus("saving");
    for (const [questionId, selected] of entries) {
      await saveAnswer(safeAttemptId, questionId, selected);
      updateFailedSaves((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
    setSaveStatus("saved");
  }, [safeAttemptId, updateFailedSaves]);

  const confirmSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await flushFailedSaves();
      await submitAttempt(safeAttemptId);
      markAttemptEnded(safeAttemptId);
      removeActiveExam(safeAttemptId);
      updateFailedSaves(() => ({}));
      queryClient.removeQueries({ queryKey: ["attempt", safeAttemptId] });
      closeSubmitConfirm();
      navigate(`/attempts/${safeAttemptId}/review`, { replace: true });
    } catch (err) {
      if (Object.keys(failedSavesRef.current).length > 0) {
        setSaveStatus("error");
      }
      setSubmitError(
        getErrorMessage(err, "Nộp bài thi thất bại. Vui lòng kiểm tra mạng và thử lại.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [safeAttemptId, flushFailedSaves, updateFailedSaves, queryClient, closeSubmitConfirm, navigate]);

  const isUntimed = attempt?.timeRemainingSeconds === null;
  const { formattedTime, formattedElapsed, isWarning, isExpired } = useExamTimer({
    initialSeconds: isUntimed ? null : (attempt?.timeRemainingSeconds ?? 3600),
    isUntimed: isUntimed || Boolean(attempt && attempt.status !== "in_progress"),
    onExpire: () => {
      if (!attempt || attempt.status !== "in_progress") return;
      void confirmSubmit();
    },
  });

  const questions = useMemo(() => attempt?.questions ?? [], [attempt?.questions]);
  const clampedIndex = Math.min(currentQuestionIndex, Math.max(0, questions.length - 1));
  const currentQuestion = questions[clampedIndex] ?? null;
  const currentQuestionId = currentQuestion?.questionId ?? null;
  const totalQuestions = questions.length;

  useEffect(() => {
    setFallbackQuestionId(null);
  }, [safeAttemptId, currentQuestionId]);

  const isCurrentQuestionFallback =
    preferredBenchmarkMode === "community" &&
    currentQuestionId !== null &&
    fallbackQuestionId === currentQuestionId;
  const benchmarkMode: BenchmarkMode = isCurrentQuestionFallback
    ? "ai"
    : preferredBenchmarkMode;
  const answerSourceFallbackNotice = isCurrentQuestionFallback
    ? "Câu này chưa có đáp án cộng đồng — tạm chuyển sang Đáp án AI. Sang câu sau sẽ tự động quay lại Cộng đồng."
    : null;

  const setBenchmarkMode = useCallback(
    (mode: BenchmarkMode) => {
      persistPreferredBenchmarkMode(mode);
      if (mode === "ai") {
        setFallbackQuestionId(null);
      }
    },
    [persistPreferredBenchmarkMode]
  );

  const answeredCount = useMemo(
    () => Object.values(userAnswers).filter((val) => val.length > 0).length,
    [userAnswers]
  );

  const sortedOptionKeys = useMemo(() => {
    if (!currentQuestion?.options) return ["A", "B", "C", "D"];
    const keys = Object.keys(currentQuestion.options);
    return keys.length > 0 ? [...keys].sort((a, b) => a.localeCompare(b)) : ["A", "B", "C", "D"];
  }, [currentQuestion]);

  const persistAnswer = useCallback(
    async (questionId: string, selected: string) => {
      setSaveStatus("saving");
      try {
        await saveAnswer(safeAttemptId, questionId, selected);
        const remaining = updateFailedSaves((prev) => {
          if (!(questionId in prev)) return prev;
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
        setSaveStatus(Object.keys(remaining).length === 0 ? "saved" : "error");
      } catch {
        updateFailedSaves((prev) => ({
          ...prev,
          [questionId]: selected,
        }));
        setSaveStatus("error");
      }
    },
    [safeAttemptId, updateFailedSaves]
  );

  const retrySave = useCallback(async () => {
    try {
      await flushFailedSaves();
    } catch {
      setSaveStatus("error");
    }
  }, [flushFailedSaves]);

  const evaluateInstantAnswer = useCallback(async (qId: string, selected: string) => {
    setEvaluatingQuestionId(qId);
    setInstantErrors((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    try {
      const result = await checkInstantAnswer(qId, selected, preferredBenchmarkMode);
      if (
        didFallbackToAi(
          preferredBenchmarkMode,
          result.communityStats,
          result.benchmarkSource
        )
      ) {
        setFallbackQuestionId(qId);
      }
      const communityFallbackNotice = getCommunityFallbackNotice(
        preferredBenchmarkMode,
        result.communityStats,
        result.benchmarkSource
      );
      setInstantResults((prev) => ({
        ...prev,
        [qId]: {
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          aiExplanation: result.aiExplanation,
          optionByOptionAnalysis: result.optionByOptionAnalysis,
          communityFallbackNotice,
        },
      }));
      setAiExplanations((prev) => ({
        ...prev,
        [qId]: {
          aiChoice: result.correctAnswer,
          aiExplanation: result.aiExplanation,
          optionByOptionAnalysis: result.optionByOptionAnalysis,
        },
      }));
    } catch (err) {
      setInstantErrors((prev) => ({
        ...prev,
        [qId]: getErrorMessage(
          err,
          "Không thể kiểm tra đáp án lúc này. Bạn vẫn có thể tiếp tục làm bài."
        ),
      }));
    } finally {
      setEvaluatingQuestionId((prev) => (prev === qId ? null : prev));
    }
  }, [preferredBenchmarkMode]);

  const selectOption = useCallback(
    async (optionKey: string) => {
      if (!currentQuestion || isExpired || isSubmitting) return;
      const qId = currentQuestion.questionId;
      const isMulti = currentQuestion.questionType === "multiple_choice";

      let newSelected: string;
      if (isMulti) {
        const prev = userAnswers[qId] || "";
        if (prev.includes(optionKey)) {
          newSelected = prev.split("").filter((k) => k !== optionKey).sort().join("");
        } else {
          newSelected = [...prev.split("").filter(Boolean), optionKey].sort().join("");
        }
      } else {
        newSelected = optionKey;
      }

      setUserAnswers((prev) => {
        const next = { ...prev };
        if (newSelected) {
          next[qId] = newSelected;
        } else {
          delete next[qId];
        }
        return next;
      });

      if (feedbackMode === "instant" && !isMulti) {
        void evaluateInstantAnswer(qId, newSelected);
      } else if (isMulti && instantResults[qId]) {
        setInstantResults((prev) => {
          const next = { ...prev };
          delete next[qId];
          return next;
        });
      }

      await persistAnswer(qId, newSelected);
    },
    [
      currentQuestion,
      isExpired,
      isSubmitting,
      userAnswers,
      feedbackMode,
      instantResults,
      evaluateInstantAnswer,
      persistAnswer,
    ]
  );

  const clearSelection = useCallback(async () => {
    if (!currentQuestion || isExpired || isSubmitting) return;
    const qId = currentQuestion.questionId;

    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setInstantResults((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setFallbackQuestionId((prev) => (prev === qId ? null : prev));

    await persistAnswer(qId, "");
  }, [currentQuestion, isExpired, isSubmitting, persistAnswer]);

  const submitMultiChoiceCheck = useCallback(async () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    const selected = userAnswers[qId] || "";
    if (!selected) return;
    await evaluateInstantAnswer(qId, selected);
  }, [currentQuestion, userAnswers, evaluateInstantAnswer]);

  const fetchAiForQuestion = useCallback(
    async (qId: string, selected: string) => {
      setAiLoadingIds((prev) => ({ ...prev, [qId]: true }));
      setAiErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });

      try {
        const res = await checkInstantAnswer(qId, selected, preferredBenchmarkMode);
        if (
          didFallbackToAi(
            preferredBenchmarkMode,
            res.communityStats,
            res.benchmarkSource
          )
        ) {
          setFallbackQuestionId(qId);
        }
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
          [qId]: getErrorMessage(
            err,
            "Không thể kết nối dịch vụ AI. Vui lòng thử lại."
          ),
        }));
      } finally {
        setAiLoadingIds((prev) => ({ ...prev, [qId]: false }));
      }
    },
    [preferredBenchmarkMode]
  );

  const openAiAnalysis = useCallback(() => {
    openAiModal();
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    if (!aiExplanations[qId] && !instantResults[qId] && !aiLoadingIds[qId]) {
      const probeOption = userAnswers[qId] || sortedOptionKeys[0] || "A";
      void fetchAiForQuestion(qId, probeOption);
    }
  }, [
    openAiModal,
    currentQuestion,
    aiExplanations,
    instantResults,
    aiLoadingIds,
    fetchAiForQuestion,
    userAnswers,
    sortedOptionKeys,
  ]);

  const retryAiAnalysis = useCallback(async () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    const probeOption = userAnswers[qId] || sortedOptionKeys[0] || "A";
    await fetchAiForQuestion(qId, probeOption);
  }, [currentQuestion, fetchAiForQuestion, userAnswers, sortedOptionKeys]);

  useEffect(() => {
    if (!attempt || !safeAttemptId) return;
    if (attempt.status !== "in_progress") {
      markAttemptEnded(
        safeAttemptId,
        attempt.status === "expired" ? "expired" : "completed"
      );
      removeActiveExam(safeAttemptId);
      return;
    }
    if (isExpired) {
      removeActiveExam(safeAttemptId);
      return;
    }
    upsertActiveExam({
      attemptId: attempt.attemptId,
      examId: attempt.examId,
      examTitle: attempt.examTitle,
      subjectCode: inferSubjectCode(attempt.examId, attempt.examTitle),
      totalQuestions: attempt.questions.length,
      answeredCount,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      feedbackMode,
      updatedAt: new Date().toISOString(),
    });
  }, [attempt, safeAttemptId, isExpired, answeredCount, feedbackMode]);

  const currentInstant = currentQuestion ? instantResults[currentQuestion.questionId] : undefined;
  const currentInstantError = currentQuestion ? instantErrors[currentQuestion.questionId] : undefined;

  const evaluation: WorkspaceEvaluationResult | null = currentQuestion
    ? evaluatingQuestionId === currentQuestion.questionId
      ? {
          status: "loading",
          isCorrect: null,
          correctAnswer: null,
          aiExplanation: null,
        }
      : currentInstant
        ? {
            status: "resolved",
            isCorrect: currentInstant.isCorrect,
            correctAnswer: currentInstant.correctAnswer,
            aiExplanation: currentInstant.aiExplanation,
            optionByOptionAnalysis: currentInstant.optionByOptionAnalysis ?? null,
            communityFallbackNotice: currentInstant.communityFallbackNotice ?? null,
          }
        : currentInstantError
          ? {
              status: "error",
              isCorrect: null,
              correctAnswer: null,
              aiExplanation: null,
              errorMessage: currentInstantError,
            }
          : null
    : null;

  const navigatorItems = useMemo<WorkspaceNavigatorItem[]>(() => {
    return questions.map((q, idx) => {
      const isAnswered = Boolean(userAnswers[q.questionId]);
      const instantCheck = instantResults[q.questionId];
      return {
        id: q.questionId,
        number: idx + 1,
        isAnswered,
        isCurrent: idx === clampedIndex,
        isCorrect:
          feedbackMode === "instant" && instantCheck ? instantCheck.isCorrect : null,
      };
    });
  }, [questions, userAnswers, instantResults, clampedIndex, feedbackMode]);

  const currentAi = currentQuestion ? aiExplanations[currentQuestion.questionId] : undefined;
  const aiModalState = {
    aiChoice: currentInstant?.correctAnswer ?? currentAi?.aiChoice ?? null,
    aiExplanation: currentInstant?.aiExplanation ?? currentAi?.aiExplanation ?? null,
    optionByOptionAnalysis:
      currentInstant?.optionByOptionAnalysis ?? currentAi?.optionByOptionAnalysis ?? null,
    isLoading: currentQuestion ? Boolean(aiLoadingIds[currentQuestion.questionId]) : false,
    errorMessage: currentQuestion ? aiErrors[currentQuestion.questionId] ?? null : null,
  };

  const endedReason: ExamWorkspaceAdapterResult["endedReason"] =
    endedLocallyReason ??
    (attempt && attempt.status !== "in_progress"
      ? attempt.status === "expired"
        ? "expired"
        : "completed"
      : null);

  const sessionStatus: ExamWorkspaceAdapterResult["sessionStatus"] = endedReason
    ? "ended"
    : isLoading
      ? "loading"
      : error || !currentQuestion
        ? "error"
        : "ready";

  return {
    sessionStatus,
    endedReason,
    loadErrorMessage: error
      ? getErrorMessage(
          error,
          "Đề thi có thể đã kết thúc hoặc không tìm thấy phiên làm bài hợp lệ."
        )
      : "Đề thi có thể đã kết thúc hoặc không tìm thấy phiên làm bài hợp lệ.",
    examTitle: attempt?.examTitle || "Phòng thi trực tuyến",
    questions,
    currentQuestion,
    currentIndex: clampedIndex,
    totalQuestions,
    answeredCount,
    sortedOptionKeys,
    selectedOptions: currentQuestion ? userAnswers[currentQuestion.questionId] || "" : "",
    feedbackMode,
    setFeedbackMode,
    benchmarkMode,
    preferredBenchmarkMode,
    answerSourceFallbackNotice,
    setBenchmarkMode,
    evaluation,
    saveStatus,
    pendingSaveCount: Object.keys(failedSaves).length,
    timer: {
      isUntimed,
      formattedTime,
      formattedElapsed,
      isWarning,
      isExpired,
    },
    navigatorItems,
    isSubmitting,
    submitError,
    isAiModalOpen,
    isSubmitConfirmOpen,
    aiModalState,
    retryLoad: async () => {
      await refetch();
    },
    selectOption,
    clearSelection,
    submitMultiChoiceCheck,
    retrySave,
    jumpToQuestion: (idx) => {
      setFallbackQuestionId(null);
      setQuestionIndex(Math.max(0, Math.min(totalQuestions - 1, idx)));
    },
    navigatePrev: () => {
      setFallbackQuestionId(null);
      setQuestionIndex(Math.max(0, clampedIndex - 1));
    },
    navigateNext: () => {
      setFallbackQuestionId(null);
      setQuestionIndex(Math.min(totalQuestions - 1, clampedIndex + 1));
    },
    openAiAnalysis,
    closeAiAnalysis: closeAiModal,
    retryAiAnalysis,
    openSubmitDialog: () => {
      setSubmitError(null);
      openSubmitConfirm();
    },
    closeSubmitDialog: closeSubmitConfirm,
    confirmSubmit,
  };
}
