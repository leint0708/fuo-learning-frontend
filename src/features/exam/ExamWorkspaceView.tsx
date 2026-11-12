import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, Send, ShieldCheck, Sparkles } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { QuestionCanvas } from "./QuestionCanvas";
import { QuestionListSidebar } from "./QuestionListSidebar";
import { QuestionChoicePanel } from "./QuestionChoicePanel";
import { AiAnswerModal } from "./AiAnswerModal";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useExamUiStore } from "@/stores/examUiStore";
import {
  getAttempt,
  saveAnswer,
  submitAttempt,
  checkInstantAnswer,
} from "@/api/attempts";

export const ExamWorkspaceView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const {
    currentQuestionIndex,
    setQuestionIndex,
    activePage,
    setActivePage,
    nextPage,
    prevPage,
    isAiModalOpen,
    openAiModal,
    closeAiModal,
    isSubmitConfirmOpen,
    openSubmitConfirm,
    closeSubmitConfirm,
    feedbackMode,
    benchmarkMode,
    setBenchmarkMode,
  } = useExamUiStore();

  const safeAttemptId = attemptId || "att_mock_100";

  // Fetch active attempt data
  const {
    data: attempt,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["attempt", safeAttemptId],
    queryFn: () => getAttempt(safeAttemptId),
  });

  // Local answers state (questionId -> selectedOptions)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  // Instant feedback cache (questionId -> { isCorrect, correctAnswer, aiExplanation, analysis })
  const [instantResults, setInstantResults] = useState<
    Record<
      string,
      {
        isCorrect: boolean;
        correctAnswer: string;
        aiExplanation: string;
        optionByOptionAnalysis?: Record<string, string>;
      }
    >
  >({});
  const [aiExplanations, setAiExplanations] = useState<
    Record<
      string,
      {
        aiChoice: string;
        aiExplanation: string;
        optionByOptionAnalysis?: Record<string, string>;
      }
    >
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial answers from loaded attempt
  useEffect(() => {
    if (attempt?.questions) {
      const initialMap: Record<string, string> = {};
      attempt.questions.forEach((q) => {
        if (q.selectedOptions) {
          initialMap[q.questionId] = q.selectedOptions;
        }
      });
      setUserAnswers(initialMap);
    }
  }, [attempt]);

  // Handle auto-submit on timer expire
  const handleTimeExpire = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await submitAttempt(safeAttemptId);
      navigate(`/attempts/${safeAttemptId}/review`, { replace: true });
    } catch {
      alert("Hết giờ làm bài! Bài thi đã được tự động nộp.");
      navigate(`/attempts/${safeAttemptId}/review`, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }, [safeAttemptId, navigate]);

  // Countdown timer
  const { formattedTime, isWarning } = useExamTimer({
    initialSeconds: attempt?.timeRemainingSeconds ?? 3600,
    onExpire: handleTimeExpire,
  });

  const questions = attempt?.questions || [];
  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / 25));

  // Sync active page when current question changes
  useEffect(() => {
    const expectedPage = Math.floor(currentQuestionIndex / 25) + 1;
    setActivePage(expectedPage);
  }, [currentQuestionIndex, setActivePage]);

  // Eagerly prefetch real AI explanation for current question without requiring user choice
  useEffect(() => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    if (aiExplanations[qId] || instantResults[qId]) return;

    checkInstantAnswer(qId, "")
      .then((res) => {
        setAiExplanations((prev) => ({
          ...prev,
          [qId]: {
            aiChoice: res.correctAnswer,
            aiExplanation: res.aiExplanation,
            optionByOptionAnalysis: res.optionByOptionAnalysis,
          },
        }));
      })
      .catch(() => {
        // Fallback for offline/mock environments
        setAiExplanations((prev) => ({
          ...prev,
          [qId]: {
            aiChoice: "C",
            aiExplanation:
              "Đáp án đúng là C. Phân tích các bước suy luận toán rời rạc và luật tương đương.",
          },
        }));
      });
  }, [currentQuestion?.questionId, aiExplanations, instantResults]);

  // Evaluate instant answer against backend/mock
  const evaluateInstantAnswer = async (qId: string, selected: string) => {
    try {
      const result = await checkInstantAnswer(qId, selected);
      setInstantResults((prev) => ({
        ...prev,
        [qId]: {
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          aiExplanation: result.aiExplanation,
          optionByOptionAnalysis: result.optionByOptionAnalysis,
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
    } catch {
      // Fallback for mock/offline testing
      const isMockCorrect = selected === "C" || selected === "ACD";
      setInstantResults((prev) => ({
        ...prev,
        [qId]: {
          isCorrect: isMockCorrect,
          correctAnswer: "C",
          aiExplanation:
            "Đáp án đúng là C. Phân tích các bước suy luận toán rời rạc và luật tương đương.",
        },
      }));
    }
  };

  // Handle answer choice selection (supporting both single and multiple-choice)
  const handleSelectOption = async (optionKey: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    const isMulti = currentQuestion.questionType === "multiple_choice";

    let newSelected: string;
    if (isMulti) {
      const prev = userAnswers[qId] || "";
      if (prev.includes(optionKey)) {
        // Toggle off
        newSelected = prev.split("").filter((k) => k !== optionKey).sort().join("");
      } else {
        // Toggle on
        newSelected = [...prev.split("").filter((k) => k), optionKey].sort().join("");
      }
    } else {
      newSelected = optionKey;
    }

    // Update local answers buffer immediately (free re-selection supported)
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: newSelected,
    }));

    // If single-choice in instant feedback mode, check answer immediately
    if (feedbackMode === "instant" && !isMulti) {
      await evaluateInstantAnswer(qId, newSelected);
    } else if (isMulti && instantResults[qId]) {
      // If user modified a previously evaluated multi-choice answer, clear instant result until they re-check
      setInstantResults((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }

    // Persist answer to backend in background
    try {
      await saveAnswer(safeAttemptId, qId, newSelected);
    } catch (e) {
      console.warn("Background save warning:", e);
    }
  };

  // Multiple-choice dedicated check handler in instant mode
  const handleCheckMultipleChoice = async () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    const selected = userAnswers[qId] || "";
    if (!selected) return;
    await evaluateInstantAnswer(qId, selected);
  };

  // Submit test
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitAttempt(safeAttemptId);
      closeSubmitConfirm();
      navigate(`/attempts/${safeAttemptId}/review`, { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nộp bài thi thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-color-6">
        <div className="flex flex-col items-center gap-space-3 p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm">
          <div className="w-10 h-10 border-4 border-color-2 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-text-sm text-color-1">Đang tải phòng thi và câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-space-4">
        <div className="max-w-md p-space-6 bg-color-7 border-2 border-color-4 text-center rounded-3xl shadow-sm">
          <h3 className="text-text-lg font-bold text-color-4 mb-2">Không thể tải bài thi</h3>
          <p className="text-text-xs text-color-1/70 mb-space-4">
            Đề thi có thể đã kết thúc hoặc không tìm thấy phiên làm bài hợp lệ.
          </p>
          <Button variant="primary" onClick={() => navigate("/")}>
            Quay về danh sách môn học
          </Button>
        </div>
      </div>
    );
  }

  // Build question items for sidebar
  const sidebarItems = questions.map((q, idx) => {
    const isAnswered = !!userAnswers[q.questionId];
    const instantCheck = instantResults[q.questionId];
    return {
      id: q.questionId,
      number: idx + 1,
      isAnswered,
      isCurrent: idx === currentQuestionIndex,
      isCorrect: feedbackMode === "instant" && instantCheck ? instantCheck.isCorrect : null,
    };
  });

  const currentInstant = instantResults[currentQuestion.questionId];

  return (
    <div className="max-w-7xl mx-auto w-full px-space-3 sm:px-space-5 py-space-4 flex flex-col gap-space-4 flex-1">
      {/* Top Header Row matching Sketch: Progress Bar (left), Timer (center-right), Benchmark Badge (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-3 items-center">
        {/* Progress Bar (Left Column top) */}
        <div className="lg:col-span-6 bg-color-7 p-space-3 rounded-2xl border-2 border-color-1 shadow-sm flex items-center">
          <ProgressBar
            current={answeredCount}
            total={totalQuestions}
            label={attempt?.examTitle || "Tiến độ bài thi"}
          />
        </div>

        {/* Timer Box */}
        <div
          className={`lg:col-span-2 h-full flex items-center justify-center p-space-3 rounded-2xl border-2 border-color-1 shadow-sm font-bold text-text-sm ${
            isWarning
              ? "bg-color-4 text-color-7 animate-pulse border-color-4"
              : "bg-color-7 text-color-1"
          }`}
        >
          <span>{formattedTime}</span>
        </div>

        {/* Benchmark toggle box ("Answers should follow commu or AI opt") */}
        <div className="lg:col-span-4 h-full flex items-center justify-between px-space-4 py-space-2 rounded-2xl border-2 border-color-1 bg-color-7 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setBenchmarkMode(benchmarkMode === "ai" ? "community" : "ai")
            }
            className="flex items-center gap-1.5 text-text-xs font-bold text-color-1 hover:text-color-2 transition-colors cursor-pointer text-left"
            title="Nhấn để đổi nguồn đối chiếu"
          >
            <ShieldCheck className="w-4 h-4 text-color-2 shrink-0" />
            <span className="truncate">
              Answers: {benchmarkMode === "ai" ? "Theo AI chuẩn" : "Theo cộng đồng"}
            </span>
          </button>

          <Button
            variant="danger"
            size="sm"
            onClick={openSubmitConfirm}
            className="shrink-0 flex items-center gap-1 ml-space-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </Button>
        </div>
      </div>

      {/* Main Dual-Column Content matching Sketch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-4 flex-1 items-start">
        {/* Left Column: Big Question Canvas + Zoom Tools */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
          <QuestionCanvas
            questionNumber={currentQuestionIndex + 1}
            questionCode={currentQuestion.questionIdCode}
            questionType={currentQuestion.questionType}
            imageUrl={currentQuestion.imageUrl}
            questionTextFallback={currentQuestion.questionText}
          />
        </div>

        {/* Right Column: Question List, Question Choice, View AI Answers */}
        <div className="lg:col-span-4 flex flex-col gap-space-4">
          {/* Question List Sidebar */}
          <QuestionListSidebar
            totalQuestions={totalQuestions}
            questions={sidebarItems}
            activeQuestionIndex={currentQuestionIndex}
            onSelectQuestion={(idx) => setQuestionIndex(idx)}
            currentPage={activePage}
            onPrevPage={prevPage}
            onNextPage={() => nextPage(totalPages)}
            answeredCount={answeredCount}
            pageSize={25}
          />

          {/* Question Choice Panel */}
          <QuestionChoicePanel
            options={currentQuestion.options}
            selectedOptions={userAnswers[currentQuestion.questionId] || null}
            questionType={currentQuestion.questionType}
            onSelectOption={handleSelectOption}
            onCheckAnswer={handleCheckMultipleChoice}
            feedbackMode={feedbackMode}
            instantResult={currentInstant}
          />

          {/* View AI Answers Action Button (Always viewable at all times) */}
          <div className="bg-color-7 p-space-2 rounded-2xl border-2 border-color-1 shadow-sm text-center">
            <Button
              variant="accent"
              size="md"
              onClick={openAiModal}
              className="w-full flex items-center justify-center gap-space-2 shadow-xs"
            >
              <Bot className="w-5 h-5 text-color-5" />
              <span className="font-bold">View AI Answers</span>
              <Sparkles className="w-4 h-4 text-color-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Persistent AI Answers Modal */}
      <AiAnswerModal
        isOpen={isAiModalOpen}
        onClose={closeAiModal}
        questionNumber={currentQuestionIndex + 1}
        questionCode={currentQuestion.questionIdCode}
        aiChoice={
          currentInstant?.correctAnswer ||
          aiExplanations[currentQuestion.questionId]?.aiChoice ||
          "C"
        }
        aiModel="gemini-3-flash-preview"
        aiExplanation={
          currentInstant?.aiExplanation ||
          aiExplanations[currentQuestion.questionId]?.aiExplanation ||
          "Bước 1: Xác định điều kiện bài toán.\nBước 2: Áp dụng định lý tương đương logic.\nBước 3: Kết luận phương án đúng."
        }
        optionByOptionAnalysis={
          currentInstant?.optionByOptionAnalysis ||
          aiExplanations[currentQuestion.questionId]?.optionByOptionAnalysis
        }
      />

      {/* Submit Confirmation Dialog */}
      <SubmitConfirmModal
        isOpen={isSubmitConfirmOpen}
        onClose={closeSubmitConfirm}
        onConfirm={handleConfirmSubmit}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        timeRemainingFormatted={formattedTime}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
