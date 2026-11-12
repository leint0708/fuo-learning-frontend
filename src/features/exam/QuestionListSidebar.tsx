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
  // Pagination
  currentPage: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  // Answer count
  answeredCount: number;
  pageSize?: number;
}

export const QuestionListSidebar: React.FC<QuestionListSidebarProps> = ({
  totalQuestions,
  questions,
  activeQuestionIndex,
  onSelectQuestion,
  currentPage,
  onPrevPage,
  onNextPage,
  answeredCount,
  pageSize = 25,
}) => {
  const isSinglePage = totalQuestions <= pageSize;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));

  // Determine slice of questions for current page
  const startIndex = (currentPage - 1) * pageSize;
  const currentQuestions = questions.slice(startIndex, startIndex + pageSize);

  return (
    <Card className="flex flex-col h-full bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm p-space-4">
      {/* Title */}
      <div className="flex items-center justify-between mb-space-3 pb-space-2 border-b-2 border-color-6">
        <h4 className="font-bold text-text-sm text-color-1">Question List</h4>
        <span className="text-text-xs font-bold text-color-1/60">
          Tổng: {totalQuestions} câu
        </span>
      </div>

      {/* Question Number Buttons Grid */}
      <div className="flex-1 overflow-y-auto max-h-[300px] sm:max-h-[380px] p-1">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {currentQuestions.map((q, idx) => {
            const actualIndex = startIndex + idx;
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

      {/* Bottom Footer: Adaptive Completion Box & Navigation */}
      <div className="mt-space-4 pt-space-3 border-t-2 border-color-1">
        {isSinglePage ? (
          /* Case 1: Single Page (<= 50 questions) -> Accounts for ALL space in format "Số câu đã làm: x/n" */
          <div className="w-full h-11 px-space-3 bg-color-6 border-2 border-color-1 rounded-full flex items-center justify-center font-bold text-text-xs text-color-1 shadow-xs text-center">
            <span>
              Số câu đã làm: {answeredCount}/{totalQuestions}
            </span>
          </div>
        ) : (
          /* Case 2: Multi-Page (> 50 questions) -> Displays "x/n" and 3-box navigation */
          <div className="flex items-center justify-between gap-space-2">
            {/* Box 1: Completed counter "x/n" */}
            <div
              className="h-10 px-space-3 bg-color-6 border-2 border-color-1 rounded-full flex items-center justify-center font-bold text-text-xs text-color-1 shrink-0 shadow-xs"
              title="Số câu đã hoàn thành"
            >
              <span>
                {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Three Box Navigation Group: [x/n page], [<], [>] */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Box 1: Page indicator "x/n page" */}
              <div className="h-10 min-w-[76px] px-space-3 bg-color-7 border-2 border-color-1 rounded-full flex items-center justify-center font-bold text-[12px] text-color-1 shadow-xs whitespace-nowrap">
                <span>
                  {currentPage}/{totalPages} page
                </span>
              </div>

              {/* Box 2: Previous Page button */}
              <button
                type="button"
                onClick={onPrevPage}
                disabled={currentPage <= 1}
                aria-label="Trang trước"
                className="w-10 h-10 rounded-full border-2 border-color-1 bg-color-7 flex items-center justify-center text-color-1 hover:bg-color-6 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-color-5"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Box 3: Next Page button */}
              <button
                type="button"
                onClick={onNextPage}
                disabled={currentPage >= totalPages}
                aria-label="Trang sau"
                className="w-10 h-10 rounded-full border-2 border-color-1 bg-color-7 flex items-center justify-center text-color-1 hover:bg-color-6 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-color-5"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
