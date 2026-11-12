import React from "react";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { FeedbackMode, QuestionType } from "@/types/exam";

export interface QuestionChoicePanelProps {
  options?: Record<string, string>; // e.g. { A: "...", B: "..." }
  selectedOption?: string | null; // e.g. "C" (supports single choice legacy)
  selectedOptions?: string | null; // e.g. "C" or "ACD" (supports multiple choice)
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

const CHOICE_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H"];

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
  // Determine active selected options string (e.g. "A" or "ACD")
  const currentSelection = selectedOptions ?? selectedOption ?? "";

  // Always display options A through H, incorporating any additional custom keys if present
  const customKeys = Object.keys(options).filter((k) => !CHOICE_KEYS.includes(k)).sort();
  const optionKeys = [...CHOICE_KEYS, ...customKeys];

  return (
    <Card className="p-space-4 bg-color-7 border-2 border-color-1 shadow-sm rounded-3xl">
      <div className="flex items-center justify-between mb-space-3">
        <h4 className="font-bold text-text-sm text-color-1">Questions Choice</h4>
        {feedbackMode === "instant" && instantResult && (
          <span
            className={`text-text-xs font-bold px-space-2 py-0.5 rounded-full border ${
              instantResult.isCorrect
                ? "bg-color-3/10 text-color-3 border-color-3"
                : "bg-color-4/10 text-color-4 border-color-4"
            }`}
          >
            {instantResult.isCorrect ? "✓ Chính xác" : `✗ Sai (Đáp án: ${instantResult.correctAnswer})`}
          </span>
        )}
      </div>

      {/* Grid of Choices: A -> H */}
      <div className="grid grid-cols-4 gap-space-2">
        {optionKeys.map((key) => {
          const isSelected = currentSelection.includes(key);
          const isInstantMode = feedbackMode === "instant";
          const isRevealed = isInstantMode && instantResult != null;
          const isCorrectInKey = isRevealed && instantResult.correctAnswer.includes(key);

          let buttonStyle =
            "bg-color-7 text-color-1 border-color-1 hover:bg-color-6 hover:border-color-2";
          let icon = null;

          if (isRevealed) {
            if (isSelected) {
              if (isCorrectInKey) {
                // Correct choice selected
                buttonStyle = "bg-color-3 text-color-7 border-color-3 shadow-xs ring-2 ring-color-3";
                icon = <Check className="w-4 h-4 ml-1" />;
              } else {
                // Incorrect choice selected
                buttonStyle = "bg-color-4 text-color-7 border-color-4 shadow-xs ring-2 ring-color-4";
                icon = <X className="w-4 h-4 ml-1" />;
              }
            } else if (isCorrectInKey) {
              // Highlight correct missing answer
              buttonStyle = "bg-color-3/20 text-color-3 border-color-3 border-dashed font-bold";
              icon = <Check className="w-4 h-4 ml-1" />;
            }
          } else if (isSelected) {
            // Selected in pending/standard mode
            buttonStyle = "bg-color-2 text-color-7 border-color-2 shadow-xs";
          }

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(key)}
              className={`h-11 flex items-center justify-center font-bold text-text-sm rounded-full border-2 transition-all duration-fast select-none cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 ${buttonStyle}`}
            >
              <span>{key}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Dedicated Check Answer Action for Multiple-Choice Questions in Instant Mode */}
      {questionType === "multiple_choice" && feedbackMode === "instant" && onCheckAnswer && (
        <div className="mt-space-3 pt-space-2 border-t border-color-6 flex justify-end">
          <button
            type="button"
            onClick={onCheckAnswer}
            disabled={disabled || !currentSelection}
            className="px-space-4 py-space-1.5 text-text-xs font-bold rounded-full bg-color-2 text-color-7 hover:bg-color-2/90 active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Kiểm tra
          </button>
        </div>
      )}
    </Card>
  );
};
