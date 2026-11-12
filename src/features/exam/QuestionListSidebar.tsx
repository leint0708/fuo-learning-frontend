import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

export interface QuestionListItem {
  id: string;
  number: number;
  isAnswered: boolean;
  isCurrent: boolean;
  isCorrect?: boolean | null; // For instant feedback mode
}

export interface QuestionListSidebarProps {
  totalQuestions: number;
  questions: QuestionListItem[];
  activeQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  // Direct Question Navigation
  onPrevQuestion?: () => void;
  onNextQuestion?: () => void;
  // Answer count
  answeredCount: number;
  className?: string;
  // Optional backwards-compatibility props
  currentPage?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  pageSize?: number;
}

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
  const canGoPrevious = activeQuestionIndex > 0;
  const canGoNext = activeQuestionIndex < totalQuestions - 1;

  return (
    <Card className={`flex flex-col h-full bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm p-space-4 ${className || ""}`}>
      {/* Title Header */}
      <div className="flex items-center justify-between mb-space-3 pb-space-2 border-b-2 border-color-6">
        <h4 className="font-bold text-text-sm text-color-1">Danh sách câu hỏi</h4>
        <span className="text-text-xs font-bold text-color-1/60">
          Tổng: {totalQuestions} câu
        </span>
      </div>

      {/* Unified Scrollable Question Number Grid (all questions displayed) */}
      <div className="flex-1 overflow-y-auto max-h-[360px] sm:max-h-[440px] p-1 pr-1.5 custom-scrollbar">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {questions.map((q, actualIndex) => {
            const isCurrent = actualIndex === activeQuestionIndex;

            let buttonClass =
              "bg-color-7 text-color-1 border-color-1 hover:bg-color-6 hover:border-color-2";

            if (isCurrent) {
              buttonClass =
                "bg-color-2 text-color-7 border-color-2 ring-2 ring-color-5 shadow-xs font-bold scale-105 z-10";
            } else if (q.isCorrect === true) {
              buttonClass = "bg-color-3 text-color-7 border-color-3 font-bold";
            } else if (q.isCorrect === false) {
              buttonClass = "bg-color-4 text-color-7 border-color-4 font-bold";
            } else if (q.isAnswered) {
              buttonClass = "bg-color-6 text-color-1 border-color-1 font-bold shadow-2xs";
            }

            return (
              <button
                key={q.id || actualIndex}
                type="button"
                onClick={() => onSelectQuestion(actualIndex)}
                className={`h-9 w-full flex items-center justify-center text-text-xs rounded-full border-2 transition-all duration-fast select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-color-5 active:scale-95 ${buttonClass}`}
                title={`Câu ${q.number} ${q.isAnswered ? "(Đã làm)" : "(Chưa làm)"}`}
              >
                {q.number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer: Completed Count & Direct Question Navigation Controls */}
      <div className="mt-space-4 pt-space-3 border-t-2 border-color-1 flex items-center justify-between gap-space-2">
        {/* Completed Progress Pill */}
        <div
          className="h-10 px-space-3 bg-color-6 border-2 border-color-1 rounded-full flex items-center justify-center font-bold text-text-xs text-color-1 shadow-xs truncate"
          title="Số câu đã hoàn thành"
        >
          <span>
            Số câu đã làm: {answeredCount}/{totalQuestions}
          </span>
        </div>

        {/* Direct Question Navigation Stepping Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onPrevQuestion}
            disabled={!canGoPrevious}
            aria-label="Câu trước"
            title="Chuyển đến câu hỏi trước"
            className="h-10 px-2.5 rounded-full border-2 border-color-1 bg-color-7 flex items-center justify-center gap-1 text-color-1 hover:bg-color-6 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-color-5 text-text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trước</span>
          </button>

          <button
            type="button"
            onClick={onNextQuestion}
            disabled={!canGoNext}
            aria-label="Câu sau"
            title="Chuyển đến câu hỏi tiếp theo"
            className="h-10 px-2.5 rounded-full border-2 border-color-1 bg-color-7 flex items-center justify-center gap-1 text-color-1 hover:bg-color-6 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-color-5 text-text-xs font-bold"
          >
            <span className="hidden sm:inline">Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};
