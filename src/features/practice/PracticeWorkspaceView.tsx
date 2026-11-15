import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Zap, Brain, Trophy, RotateCcw, Home } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PracticeQuestionCard } from "./PracticeQuestionCard";
import { CramBatchModal } from "./CramBatchModal";
import { LearnRoundSummaryModal } from "./LearnRoundSummaryModal";
import { useCramSession } from "@/hooks/useCramSession";
import { useLearnSession } from "@/hooks/useLearnSession";
import { getPracticeQuestions, checkPracticeAnswer } from "@/api/practice";
import { compareAnswers } from "@/utils/answerComparison";
import { getErrorMessage } from "@/utils/error";

export const PracticeWorkspaceView: React.FC = () => {
  const { code, mode } = useParams<{ code: string; mode: string }>();
  const navigate = useNavigate();

  const subjectCode = code || "MAD101";
  const practiceMode = mode === "learn" ? "learn" : "cram";

  // Fetch practice questions
  const {
    data: questions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["practiceQuestions", subjectCode],
    queryFn: () => getPracticeQuestions(subjectCode, 60),
    staleTime: 5 * 60 * 1000,
  });

  const validQuestions = questions || [];

  // Hooks for both modes (only the active mode is exercised)
  const cram = useCramSession({
    subjectCode,
    questions: validQuestions,
  });

  const learn = useLearnSession({
    subjectCode,
    questions: validQuestions,
  });

  // Current Card & Queue depending on mode
  const currentCard = practiceMode === "cram" ? cram.currentCard : learn.currentCard;
  const isSessionCompleted =
    practiceMode === "cram" ? cram.isSessionCompleted : learn.isSessionCompleted;

  // Active answer submission state
  const [selectedOptions, setSelectedOptions] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluatedResult, setEvaluatedResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null>(null);

  // Handle option selection
  const handleSelectOption = useCallback(
    (optionKey: string) => {
      if (!currentCard || evaluatedResult) return;

      const isMulti = currentCard.questionType === "multiple_choice";
      if (!isMulti) {
        setSelectedOptions(optionKey);
      } else {
        setSelectedOptions((prev) => {
          if (prev.includes(optionKey)) {
            return prev.replace(optionKey, "");
          }
          return prev + optionKey;
        });
      }
    },
    [currentCard, evaluatedResult]
  );

  // Evaluate answer
  const handleSubmitAnswer = useCallback(
    async (overrideSelection?: string) => {
      if (!currentCard || evaluatedResult || isEvaluating) return;

      const choiceToEvaluate = overrideSelection || selectedOptions;
      if (!choiceToEvaluate) return;

      setIsEvaluating(true);

      try {
        const result = await checkPracticeAnswer(currentCard.questionId, choiceToEvaluate);
        const isMatch = result.isCorrect || compareAnswers(choiceToEvaluate, result.correctAnswer);

        const outcome = {
          isCorrect: isMatch,
          correctAnswer: result.correctAnswer,
          explanation: result.aiExplanation,
        };

        setEvaluatedResult(outcome);

        // Record in respective session engine
        if (practiceMode === "cram") {
          cram.recordAnswer(currentCard.questionId, isMatch);
        } else {
          learn.recordAnswer(
            currentCard.questionId,
            choiceToEvaluate,
            result.correctAnswer,
            isMatch,
            result.aiExplanation
          );
        }
      } catch (err) {
        // Fallback local grading if network check fails
        const fallbackCorrect = (currentCard as any).correct_answer || "A";
        const isMatch = compareAnswers(choiceToEvaluate, fallbackCorrect);
        const outcome = {
          isCorrect: isMatch,
          correctAnswer: fallbackCorrect,
          explanation: "Kiểm tra offline thành công.",
        };

        setEvaluatedResult(outcome);

        if (practiceMode === "cram") {
          cram.recordAnswer(currentCard.questionId, isMatch);
        } else {
          learn.recordAnswer(
            currentCard.questionId,
            choiceToEvaluate,
            fallbackCorrect,
            isMatch
          );
        }
      } finally {
        setIsEvaluating(false);
      }
    },
    [currentCard, evaluatedResult, isEvaluating, selectedOptions, practiceMode, cram, learn]
  );

  // Advance to next card
  const handleNextCard = useCallback(() => {
    setSelectedOptions("");
    setEvaluatedResult(null);
  }, []);

  // Global Keyboard Navigation (Task T028)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // If card feedback is showing: Space or ArrowRight advances
      if (evaluatedResult) {
        if (e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          handleNextCard();
        }
        return;
      }

      // If answering question: keys 1-8 or A-H select options
      if (currentCard && !evaluatedResult && !isEvaluating) {
        const keyUpper = e.key.toUpperCase();
        const optionKeys = Object.keys(currentCard.options);

        // Numeric keys 1-8
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= optionKeys.length) {
          e.preventDefault();
          const targetKey = optionKeys[num - 1];
          if (targetKey) {
            handleSelectOption(targetKey);
            if (currentCard.questionType !== "multiple_choice") {
              handleSubmitAnswer(targetKey);
            }
          }
          return;
        }

        // Letter keys A-H
        if (optionKeys.includes(keyUpper)) {
          e.preventDefault();
          handleSelectOption(keyUpper);
          if (currentCard.questionType !== "multiple_choice") {
            handleSubmitAnswer(keyUpper);
          }
          return;
        }

        // Enter key for multi-choice submit
        if (e.key === "Enter" && selectedOptions.length > 0) {
          e.preventDefault();
          handleSubmitAnswer();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentCard,
    evaluatedResult,
    isEvaluating,
    selectedOptions,
    handleSelectOption,
    handleSubmitAnswer,
    handleNextCard,
  ]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full px-space-4 py-space-6 flex flex-col gap-space-4">
        <div className="h-14 bg-color-7 border-2 border-color-1 rounded-2xl animate-pulse" />
        <div className="h-96 bg-color-7 border-2 border-color-1 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || validQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto w-full px-space-4 py-space-8 text-center">
        <Card className="p-space-8 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col items-center gap-space-4">
          <h2 className="text-text-lg font-bold text-color-4">
            {getErrorMessage(error, "Không có câu hỏi luyện tập nào khả dụng cho môn này.")}
          </h2>
          <Button variant="primary" onClick={() => navigate(`/subjects/${subjectCode}`)}>
            Quay lại môn học
          </Button>
        </Card>
      </div>
    );
  }

  // Session Complete Celebration Screen
  if (isSessionCompleted) {
    return (
      <div className="max-w-xl mx-auto w-full px-space-4 py-space-8 text-center animate-in zoom-in-95 duration-fast">
        <Card className="p-space-8 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col items-center gap-space-4">
          <div className="w-20 h-20 rounded-full bg-color-5/20 border-2 border-color-1 flex items-center justify-center shadow-xs">
            <Trophy className="w-10 h-10 text-color-5" />
          </div>
          <h1 className="text-text-2xl font-bold text-color-1">
            Tuyệt vời! Bạn đã hoàn thành toàn bộ bài luyện! 🎓
          </h1>
          <p className="text-text-sm text-color-1/70 max-w-md">
            {practiceMode === "cram"
              ? `Bạn đã nhồi nhét thành công ${cram.deckPool.length} câu hỏi của môn ${subjectCode}.`
              : `Bạn đã ghi nhớ sâu sắc tất cả câu hỏi của môn ${subjectCode} vào bộ nhớ dài hạn.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-space-3 w-full pt-space-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                localStorage.removeItem(
                  practiceMode === "cram"
                    ? `fuo_cram_mastered_${subjectCode}`
                    : `fuo_learn_mastered_${subjectCode}`
                );
                window.location.reload();
              }}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-color-1 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện lại từ đầu</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/subjects/${subjectCode}`)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Về trang môn học</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-space-4 sm:px-space-5 py-space-5 flex flex-col gap-space-5">
      {/* Top Header Navigation */}
      <Card className="p-space-3 sm:p-space-4 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-3">
        <div className="flex items-center gap-space-3">
          <Link
            to={`/subjects/${subjectCode}`}
            className="p-2 rounded-full border-2 border-color-1 bg-color-6 hover:bg-color-7 transition-all shadow-xs"
            aria-label="Thoát bài luyện tập"
          >
            <ArrowLeft className="w-4 h-4 text-color-1" />
          </Link>

          <div>
            <div className="flex items-center gap-space-2">
              <h1 className="text-text-base font-bold text-color-1">
                {practiceMode === "cram" ? "Luyện thi cấp tốc" : "Học ghi nhớ"}
              </h1>
              <Badge variant={practiceMode === "cram" ? "primary" : "warning"}>
                {subjectCode}
              </Badge>
            </div>
            <span className="text-text-xs font-bold text-color-1/60">
              {practiceMode === "cram"
                ? `Batch ${cram.batchIndex + 1}/${cram.totalBatches} (${cram.activeQueue.length} câu còn lại trong nhóm)`
                : `Vòng ${learn.currentRoundNumber} (Câu ${learn.roundPointer + 1}/${learn.roundQueue.length})`}
            </span>
          </div>
        </div>

        {/* Progress & Badge */}
        <div className="flex items-center gap-space-4 min-w-[200px]">
          <div className="flex-1">
            <ProgressBar
              current={practiceMode === "cram" ? cram.masteredInBatch.size : learn.roundPointer}
              total={practiceMode === "cram" ? cram.currentBatch.length : learn.roundQueue.length}
              label={
                practiceMode === "cram"
                  ? `${cram.masteredInBatch.size}/${cram.currentBatch.length} câu`
                  : `${learn.roundPointer}/${learn.roundQueue.length} câu`
              }
            />
          </div>

          <div className="shrink-0 flex items-center gap-1 font-bold text-text-xs text-color-2">
            {practiceMode === "cram" ? (
              <Zap className="w-4 h-4 text-color-5 fill-color-5" />
            ) : (
              <Brain className="w-4 h-4 text-color-2" />
            )}
            <span>
              {practiceMode === "cram"
                ? `${cram.masteredIds.size} đã thuộc`
                : `${learn.graduatedPool.length} thành thạo`}
            </span>
          </div>
        </div>
      </Card>

      {/* Main Active Question Card */}
      {currentCard && (
        <PracticeQuestionCard
          question={currentCard}
          selectedOptions={selectedOptions}
          isEvaluating={isEvaluating}
          evaluatedResult={evaluatedResult}
          onSelectOption={handleSelectOption}
          onSubmitAnswer={(key) => handleSubmitAnswer(key)}
          onNextCard={handleNextCard}
        />
      )}

      {/* Modals */}
      {practiceMode === "cram" && (
        <CramBatchModal
          isOpen={cram.isBatchCompleted}
          batchNumber={cram.batchIndex + 1}
          totalBatches={cram.totalBatches}
          batchSize={cram.currentBatch.length}
          cumulativeMastered={cram.masteredIds.size}
          totalDeckSize={validQuestions.length}
          onContinueNextBatch={() => {
            cram.nextBatch();
            handleNextCard();
          }}
          onFinishSession={() => navigate(`/subjects/${subjectCode}`)}
        />
      )}

      {practiceMode === "learn" && (
        <LearnRoundSummaryModal
          isOpen={learn.isRoundCompleted}
          roundDiagnostic={learn.currentRoundDiagnostic}
          activePoolCount={learn.activePool.length}
          waitingCount={learn.waitingPool.length}
          graduatedCount={learn.graduatedPool.length}
          totalDeckSize={validQuestions.length}
          onContinueNextRound={() => {
            learn.nextRound();
            handleNextCard();
          }}
          onFinishSession={() => navigate(`/subjects/${subjectCode}`)}
        />
      )}
    </div>
  );
};

export default PracticeWorkspaceView;
