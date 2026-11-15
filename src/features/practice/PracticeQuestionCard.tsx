import React from "react";
import { QuestionStage } from "@/features/workspace/QuestionStage";
import { ChoiceOptionList } from "@/features/workspace/ChoiceOptionList";
import { FeedbackExplanationCard } from "@/features/workspace/FeedbackExplanationCard";
import type { Question } from "@/types/exam";
import type { WorkspaceCardBadge, WorkspaceEvaluationResult } from "@/features/workspace/types";

export interface PracticeQuestionCardProps {
  question: Question;
  selectedOptions: string;
  isEvaluating: boolean;
  evaluatedResult: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
    optionByOptionAnalysis?: Record<string, string> | null;
  } | null;
  errorMessage?: string | null;
  badgeSlot?: WorkspaceCardBadge | null;
  onSelectOption: (optionKey: string) => void;
  onSubmitAnswer: (optionKey?: string) => void;
  onNextCard: () => void;
  onRetry?: () => void;
}

/**
 * Practice card wrapper composing QuestionStage (pan/zoom), ChoiceOptionList, and FeedbackExplanationCard.
 */
export const PracticeQuestionCard: React.FC<PracticeQuestionCardProps> = ({
  question,
  selectedOptions,
  isEvaluating,
  evaluatedResult,
  errorMessage,
  badgeSlot,
  onSelectOption,
  onSubmitAnswer,
  onNextCard,
  onRetry,
}) => {
  const evaluation: WorkspaceEvaluationResult | null = isEvaluating
    ? {
        status: "loading",
        isCorrect: null,
        correctAnswer: null,
        aiExplanation: null,
      }
    : evaluatedResult
      ? {
          status: "resolved",
          isCorrect: evaluatedResult.isCorrect,
          correctAnswer: evaluatedResult.correctAnswer,
          aiExplanation: evaluatedResult.explanation ?? null,
          optionByOptionAnalysis: evaluatedResult.optionByOptionAnalysis ?? null,
        }
      : errorMessage
        ? {
            status: "error",
            isCorrect: null,
            correctAnswer: null,
            aiExplanation: null,
            errorMessage,
          }
        : null;

  const isMulti = question.questionType === "multiple_choice";

  return (
    <div className="w-full flex flex-col gap-space-4">
      <QuestionStage question={question} badgeSlot={badgeSlot} />

      <ChoiceOptionList
        options={question.options}
        selectedOptions={selectedOptions}
        questionType={question.questionType}
        feedbackMode="instant"
        evaluation={evaluation}
        isLocked={evaluatedResult !== null}
        isSubmitting={isEvaluating}
        onSelectOption={(key) => {
          onSelectOption(key);
          if (!isMulti) {
            onSubmitAnswer(key);
          }
        }}
        onSubmitMultiChoice={() => onSubmitAnswer()}
      />

      <FeedbackExplanationCard
        evaluation={evaluation}
        onContinue={onNextCard}
        onRetry={onRetry}
      />
    </div>
  );
};
