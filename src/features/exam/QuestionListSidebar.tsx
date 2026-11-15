import React from "react";
import { QuestionNavigator } from "@/features/workspace/QuestionNavigator";

export interface QuestionListItem {
  id: string;
  number: number;
  isAnswered: boolean;
  isCurrent: boolean;
  isCorrect?: boolean | null;
}

export interface QuestionListSidebarProps {
  totalQuestions: number;
  questions: QuestionListItem[];
  activeQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  onPrevQuestion?: () => void;
  onNextQuestion?: () => void;
  answeredCount: number;
  className?: string;
  currentPage?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  pageSize?: number;
}

/**
 * Compatibility adapter delegating to shared QuestionNavigator.
 */
export const QuestionListSidebar: React.FC<QuestionListSidebarProps> = ({
  totalQuestions,
  questions,
  activeQuestionIndex,
  onSelectQuestion,
  onPrevQuestion,
  onNextQuestion,
  answeredCount,
  className,
}) => {
  return (
    <QuestionNavigator
      items={questions.map((q) => ({
        id: q.id,
        number: q.number,
        isAnswered: q.isAnswered,
        isCurrent: q.isCurrent,
        isCorrect: q.isCorrect ?? null,
      }))}
      activeIndex={activeQuestionIndex}
      answeredCount={answeredCount}
      totalCount={totalQuestions}
      onSelectQuestion={onSelectQuestion}
      onPrevQuestion={onPrevQuestion}
      onNextQuestion={onNextQuestion}
      supportsFreeJump={true}
      className={className}
    />
  );
};
