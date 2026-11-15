import React, { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, ZoomIn, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Question } from "@/types/exam";

export interface PracticeQuestionCardProps {
  question: Question;
  selectedOptions: string;
  isEvaluating: boolean;
  evaluatedResult: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string;
  } | null;
  onSelectOption: (optionKey: string) => void;
  onSubmitAnswer: (optionKey?: string) => void;
  onNextCard: () => void;
}

export const PracticeQuestionCard: React.FC<PracticeQuestionCardProps> = ({
  question,
  selectedOptions,
  isEvaluating,
  evaluatedResult,
  onSelectOption,
  onSubmitAnswer,
  onNextCard,
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const isMultiChoice =
    question.questionType === "multiple_choice" ||
    (evaluatedResult ? evaluatedResult.correctAnswer.length > 1 : false);

  const isEvaluated = evaluatedResult !== null;

  return (
    <div className="w-full flex flex-col gap-space-4">
      <Card className="p-space-5 sm:p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col gap-space-5">
        {/* Question Header */}
        <div className="flex items-center justify-between gap-space-2 border-b-2 border-color-6 pb-space-3">
          <div className="flex items-center gap-space-2">
            <Badge variant="primary">Câu {question.questionNumber}</Badge>
            <span className="text-text-xs font-bold text-color-1/60">
              {question.questionIdCode}
            </span>
          </div>
          {isMultiChoice && (
            <Badge variant="neutral">Chọn nhiều đáp án</Badge>
          )}
        </div>

        {/* Question Prompt */}
        <div className="text-text-base sm:text-text-lg font-bold text-color-1 leading-relaxed">
          {question.questionText}
        </div>

        {/* Question Diagram / Image preview if present */}
        {question.imageUrl && (
          <div className="relative group max-w-xl mx-auto rounded-2xl overflow-hidden border-2 border-color-1 bg-color-6 shadow-xs">
            <img
              src={question.imageUrl}
              alt={`Hình ảnh câu hỏi ${question.questionNumber}`}
              className="w-full max-h-72 object-contain cursor-pointer transition-transform duration-fast group-hover:scale-[1.02]"
              onClick={() => setIsImageModalOpen(true)}
            />
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="absolute bottom-2 right-2 p-1.5 rounded-full bg-color-7/90 border border-color-1 shadow-xs hover:bg-color-7 text-color-1 text-text-xs font-bold flex items-center gap-1"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Phóng to</span>
            </button>
          </div>
        )}

        {/* Options List */}
        <div className="grid grid-cols-1 gap-space-3 pt-space-2">
          {Object.entries(question.options).map(([key, text], idx) => {
            const isSelected = selectedOptions.includes(key);
            let optionStyle = "border-color-1 bg-color-7 text-color-1 hover:border-color-2 hover:bg-color-6";

            if (isEvaluated) {
              const isOptionCorrect = evaluatedResult.correctAnswer.includes(key);
              if (isOptionCorrect) {
                optionStyle = "border-color-3 bg-color-3/15 text-color-1 ring-2 ring-color-3";
              } else if (isSelected && !isOptionCorrect) {
                optionStyle = "border-color-4 bg-color-4/15 text-color-1 ring-2 ring-color-4";
              } else {
                optionStyle = "border-color-1/40 bg-color-6/40 text-color-1/50 opacity-60";
              }
            } else if (isSelected) {
              optionStyle = "border-color-2 bg-color-2/10 text-color-2 ring-2 ring-color-2 shadow-xs";
            }

            return (
              <button
                key={key}
                type="button"
                disabled={isEvaluated || isEvaluating}
                onClick={() => {
                  if (isEvaluated || isEvaluating) return;
                  onSelectOption(key);
                  if (!isMultiChoice) {
                    // Single choice immediate check passing key directly
                    onSubmitAnswer(key);
                  }
                }}
                className={`p-space-3 sm:p-space-4 rounded-2xl border-2 text-left font-bold text-text-sm transition-all duration-fast flex items-center justify-between gap-space-3 cursor-pointer disabled:cursor-default ${optionStyle}`}
              >
                <div className="flex items-center gap-space-3">
                  <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-text-xs font-bold shrink-0">
                    {key}
                  </span>
                  <span>{text}</span>
                </div>

                <span className="text-text-xs text-color-1/40 font-bold hidden sm:inline">
                  [{idx + 1}]
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-choice Submit Action */}
        {isMultiChoice && !isEvaluated && (
          <div className="pt-space-2 flex justify-end">
            <Button
              variant="primary"
              size="md"
              disabled={selectedOptions.length === 0 || isEvaluating}
              onClick={() => onSubmitAnswer()}
              className="flex items-center gap-2"
            >
              <span>Kiểm tra đáp án</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Live Evaluation Feedback Result */}
        {isEvaluated && (
          <div className="flex flex-col gap-space-4 pt-space-2 border-t-2 border-color-6 animate-in fade-in duration-fast">
            <div
              className={`p-space-4 rounded-2xl border-2 flex items-center justify-between gap-space-3 ${
                evaluatedResult.isCorrect
                  ? "bg-color-3/15 border-color-3 text-color-3"
                  : "bg-color-4/15 border-color-4 text-color-4"
              }`}
            >
              <div className="flex items-center gap-space-2">
                {evaluatedResult.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-color-3 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-color-4 shrink-0" />
                )}
                <span className="font-bold text-text-base">
                  {evaluatedResult.isCorrect
                    ? "Chính xác! Giỏi lắm! 🎉"
                    : `Chưa chính xác ❌ — Đáp án đúng: ${evaluatedResult.correctAnswer}`}
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={onNextCard}
                className="shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* AI / Expert Explanation */}
            {evaluatedResult.explanation && (
              <div className="p-space-4 rounded-2xl bg-color-6 border-2 border-color-1 text-color-1 text-text-xs font-bold leading-relaxed shadow-xs flex items-start gap-space-3">
                <Sparkles className="w-5 h-5 text-color-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-text-xs text-color-2 mb-1">
                    Giải thích chi tiết:
                  </span>
                  <p>{evaluatedResult.explanation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Fullscreen Image Preview Modal */}
      {isImageModalOpen && question.imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-space-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-fast"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-color-7 rounded-3xl border-2 border-color-1 p-space-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 mb-2 border-b-2 border-color-6">
              <span className="text-text-xs font-bold">Hình ảnh phóng to - {question.questionIdCode}</span>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 rounded-full border border-color-1 hover:bg-color-6"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={question.imageUrl}
              alt={question.questionIdCode}
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
