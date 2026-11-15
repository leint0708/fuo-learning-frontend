import React from "react";
import { Check, X, Eraser, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { FeedbackMode, QuestionType } from "@/types/exam";
import type { WorkspaceEvaluationResult } from "./types";

export interface ChoiceOptionListProps {
  options?: Record<string, string>;
  selectedOptions?: string | null;
  questionType?: QuestionType;
  feedbackMode: FeedbackMode;
  evaluation?: WorkspaceEvaluationResult | null;
  isLocked?: boolean;
  isSubmitting?: boolean;
  allowsClear?: boolean;
  showContinueAction?: boolean;
  onSelectOption: (optionKey: string) => void;
  onClearSelection?: () => void;
  onSubmitMultiChoice?: () => void;
  onContinue?: () => void;
}

const DEFAULT_FALLBACK_KEYS = ["A", "B", "C", "D"];

/**
 * Unified Answer Option Picker displaying full option text + key badge + keyboard hint.
 * Enforces WCAG AA token pairings strictly within color-1..color-7 and min-h-11 touch targets.
 */
export const ChoiceOptionList: React.FC<ChoiceOptionListProps> = ({
  options = {},
  selectedOptions = "",
  questionType = "single_choice",
  feedbackMode,
  evaluation,
  isLocked = false,
  isSubmitting = false,
  allowsClear = false,
  showContinueAction = false,
  onSelectOption,
  onClearSelection,
  onSubmitMultiChoice,
  onContinue,
}) => {
  const currentSelection = selectedOptions ?? "";
  const optionEntries = Object.keys(options);
  const sortedKeys =
    optionEntries.length > 0
      ? [...optionEntries].sort((a, b) => a.localeCompare(b))
      : DEFAULT_FALLBACK_KEYS;

  const isEvaluated =
    feedbackMode === "instant" &&
    evaluation?.status === "resolved" &&
    evaluation.correctAnswer !== null;

  const isMultiChoice =
    questionType === "multiple_choice" ||
    (isEvaluated && (evaluation?.correctAnswer?.length ?? 0) > 1);

  return (
    <Card className="p-space-4 bg-color-7 border-2 border-color-1 shadow-sm rounded-3xl flex flex-col gap-space-3">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-space-2">
        <h3 className="font-bold text-text-sm text-color-1">Lựa chọn đáp án</h3>

        <div className="flex items-center gap-space-2">
          {allowsClear && currentSelection.length > 0 && !isLocked && onClearSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              aria-label="Bỏ chọn"
              className="min-h-11 px-space-2 text-text-xs font-bold text-color-1 border border-color-1"
            >
              <Eraser className="w-4 h-4 mr-space-1" />
              <span>Bỏ chọn</span>
            </Button>
          )}

          {isEvaluated && (
            <span
              role="status"
              aria-live="polite"
              className={`inline-flex items-center gap-space-1 px-space-3 py-space-1 rounded-full border-2 text-text-xs font-bold ${
                evaluation.isCorrect
                  ? "bg-color-3 text-color-7 border-color-1"
                  : "bg-color-4 text-color-1 border-color-1"
              }`}
            >
              {evaluation.isCorrect ? "✓ Chính xác" : "✗ Chưa chính xác"}
            </span>
          )}
        </div>
      </div>

      {/* Options List */}
      <div
        role="group"
        aria-label="Các phương án trả lời"
        className="flex flex-col gap-space-2"
      >
        {sortedKeys.map((key, idx) => {
          const text = options[key];
          const isSelected = currentSelection.includes(key);
          const isCorrectKey = isEvaluated && evaluation.correctAnswer?.includes(key);

          let rowStyle =
            "bg-color-7 text-color-1 border-color-1 hover:bg-color-6 hover:border-color-2";
          let keyBadgeStyle = "bg-color-6 text-color-1 border-color-1";
          let statusIcon: React.ReactNode = null;

          if (isEvaluated) {
            if (isSelected && isCorrectKey) {
              rowStyle = "bg-color-3 text-color-7 border-color-1 shadow-xs";
              keyBadgeStyle = "bg-color-7 text-color-1 border-color-1";
              statusIcon = <Check className="w-4 h-4 shrink-0" aria-hidden="true" />;
            } else if (isSelected && !isCorrectKey) {
              rowStyle = "bg-color-4 text-color-1 border-color-1 shadow-xs";
              keyBadgeStyle = "bg-color-7 text-color-1 border-color-1";
              statusIcon = <X className="w-4 h-4 shrink-0" aria-hidden="true" />;
            } else if (isCorrectKey) {
              rowStyle = "bg-color-3/15 text-color-1 border-color-3 border-dashed shadow-xs";
              keyBadgeStyle = "bg-color-3 text-color-7 border-color-1";
              statusIcon = (
                <span className="w-6 h-6 rounded-full bg-color-3 text-color-7 inline-flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              );
            } else {
              rowStyle = "bg-color-6/60 text-color-1 border-color-1/60";
            }
          } else if (isSelected) {
            rowStyle = "bg-color-2 text-color-7 border-color-1 shadow-xs";
            keyBadgeStyle = "bg-color-7 text-color-1 border-color-1";
          }

          const accessibleLabel = text ? `Đáp án ${key}: ${text}` : `Đáp án ${key}`;

          return (
            <button
              key={key}
              type="button"
              disabled={isLocked || isSubmitting}
              aria-pressed={isSelected}
              aria-label={accessibleLabel}
              onClick={() => onSelectOption(key)}
              className={`min-h-11 w-full px-space-3 py-space-2 rounded-2xl border-2 flex items-center justify-between gap-space-2 text-left transition-all duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 disabled:cursor-not-allowed active:translate-y-0.5 ${rowStyle}`}
            >
              <div className="flex items-start gap-space-2 min-w-0 flex-1">
                <span
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-text-xs shrink-0 ${keyBadgeStyle}`}
                >
                  {key}
                </span>

                {text ? (
                  <span className="text-text-xs sm:text-text-sm font-bold leading-snug pt-0.5 break-words">
                    {text}
                  </span>
                ) : (
                  <span className="text-text-xs font-bold leading-snug pt-1">
                    Chọn phương án {key}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-space-2 shrink-0">
                {statusIcon}
                {idx < 8 && (
                  <span
                    aria-hidden="true"
                    className="hidden sm:inline-flex items-center justify-center px-space-1 rounded-full bg-color-6 text-color-1 border border-color-1 text-text-2xs font-bold tabular-nums"
                  >
                    {idx + 1}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Multi-Choice Submit Check CTA (Instant Mode Before Evaluation) */}
      {isMultiChoice && feedbackMode === "instant" && !isEvaluated && onSubmitMultiChoice && (
        <div className="pt-space-2 border-t border-color-6 flex justify-end">
          <Button
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isLocked || !currentSelection}
            onClick={onSubmitMultiChoice}
            className="min-h-11 w-full sm:w-auto flex items-center justify-center gap-space-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kiểm tra đáp án</span>
          </Button>
        </div>
      )}

      {/* Continue / Next Card CTA (Practice Post-Evaluation) */}
      {showContinueAction && isEvaluated && onContinue && (
        <div className="pt-space-2 border-t border-color-6 flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={onContinue}
            className="min-h-11 w-full sm:w-auto flex items-center justify-center gap-space-1"
          >
            <span>Tiếp tục</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};
