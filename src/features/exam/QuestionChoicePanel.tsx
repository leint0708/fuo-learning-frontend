import React from "react";
import { ChoiceOptionList } from "@/features/workspace/ChoiceOptionList";
import type { FeedbackMode, QuestionType } from "@/types/exam";

export interface QuestionChoicePanelProps {
  options?: Record<string, string>;
  selectedOption?: string | null;
  selectedOptions?: string | null;
  questionType?: QuestionType;
  onSelectOption: (optionKey: string) => void;
  onCheckAnswer?: () => void;
  feedbackMode: FeedbackMode;
  instantResult?: {
    isCorrect: boolean;
    correctAnswer: string;
  } | null;
  disabled?: boolean;
}

/**
 * Compatibility adapter delegating to shared ChoiceOptionList.
 */
export const QuestionChoicePanel: React.FC<QuestionChoicePanelProps> = ({
  options = {},
  selectedOption,
  selectedOptions,
  questionType = "single_choice",
  onSelectOption,
  onCheckAnswer,
  feedbackMode,
  instantResult,
  disabled = false,
}) => {
  const currentSelection = selectedOptions ?? selectedOption ?? "";

  return (
    <ChoiceOptionList
      options={options}
      selectedOptions={currentSelection}
      questionType={questionType}
      feedbackMode={feedbackMode}
      evaluation={
        instantResult
          ? {
              status: "resolved",
              isCorrect: instantResult.isCorrect,
              correctAnswer: instantResult.correctAnswer,
              aiExplanation: null,
            }
          : null
      }
      isLocked={disabled}
      onSelectOption={onSelectOption}
      onSubmitMultiChoice={onCheckAnswer}
    />
  );
};
