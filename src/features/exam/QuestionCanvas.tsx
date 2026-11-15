import React from "react";
import { QuestionStage } from "@/features/workspace/QuestionStage";
import type { QuestionType } from "@/types/exam";

export interface QuestionCanvasProps {
  questionNumber: number;
  questionCode: string;
  questionType?: QuestionType;
  imageUrl: string | null;
  questionTextFallback: string;
}

/**
 * Compatibility adapter delegating to shared QuestionStage.
 */
export const QuestionCanvas: React.FC<QuestionCanvasProps> = ({
  questionNumber,
  questionCode,
  questionType = "single_choice",
  imageUrl,
  questionTextFallback,
}) => {
  return (
    <QuestionStage
      question={{
        questionId: questionCode,
        questionIdCode: questionCode,
        questionNumber,
        questionType,
        questionText: questionTextFallback,
        options: {},
        imageUrl,
      }}
    />
  );
};
