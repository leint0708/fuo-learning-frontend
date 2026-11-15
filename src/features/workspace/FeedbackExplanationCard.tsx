import React from "react";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { WorkspaceEvaluationResult } from "./types";

export interface FeedbackExplanationCardProps {
  evaluation: WorkspaceEvaluationResult | null;
  onContinue?: () => void;
  onRetry?: () => void;
  continueLabel?: string;
}

/**
 * Compact inline evaluation status card showing correctness and next-step controls.
 * Detailed AI rationale and per-option elimination live strictly inside AiAnswerModal on demand.
 */
export const FeedbackExplanationCard: React.FC<FeedbackExplanationCardProps> = ({
  evaluation,
  onContinue,
  onRetry,
  continueLabel = "Tiếp tục",
}) => {
  if (!evaluation || evaluation.status === "idle") {
    return null;
  }

  if (evaluation.status === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-space-4 rounded-2xl border-2 border-color-1 bg-color-6 text-color-1 flex items-center gap-space-3"
      >
        <span className="w-5 h-5 rounded-full border-2 border-color-2 border-t-transparent animate-spin shrink-0" />
        <span className="text-text-sm font-bold">Đang kiểm tra đáp án...</span>
      </div>
    );
  }

  if (evaluation.status === "error") {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="p-space-4 rounded-2xl border-2 border-color-1 bg-color-4/15 text-color-1 flex flex-col gap-space-3"
      >
        <div className="flex items-start gap-space-3">
          <span className="w-8 h-8 rounded-full bg-color-4 text-color-1 border border-color-1 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-space-1 min-w-0">
            <span className="text-text-sm font-bold text-color-1">
              Không thể kiểm tra đáp án lúc này
            </span>
            <p className="text-text-xs font-medium text-color-1">
              {evaluation.errorMessage || "Kết nối máy chủ bị gián đoạn. Vui lòng thử lại."}
            </p>
          </div>
        </div>

        {onRetry && (
          <Button
            variant="secondary"
            size="md"
            onClick={onRetry}
            className="min-h-11 w-full inline-flex items-center justify-center gap-space-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kiểm tra lại</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-space-4 rounded-2xl border-2 border-color-1 flex flex-col gap-space-3 transition-opacity duration-fast ${
        evaluation.isCorrect ? "bg-color-3/15 text-color-1" : "bg-color-4/15 text-color-1"
      }`}
    >
      <div className="flex items-center gap-space-3 min-w-0">
        <span
          className={`w-9 h-9 rounded-full border-2 border-color-1 flex items-center justify-center shrink-0 ${
            evaluation.isCorrect
              ? "bg-color-3 text-color-7"
              : "bg-color-4 text-color-1"
          }`}
        >
          {evaluation.isCorrect ? (
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          ) : (
            <XCircle className="w-5 h-5" aria-hidden="true" />
          )}
        </span>
        <span className="font-bold text-text-sm sm:text-text-base text-color-1 min-w-0 break-words">
          {evaluation.isCorrect
            ? "Chính xác! Giỏi lắm!"
            : `Chưa chính xác — Đáp án đúng: ${evaluation.correctAnswer ?? ""}`}
        </span>
      </div>

      {onContinue && (
        <Button
          variant="primary"
          size="md"
          onClick={onContinue}
          className="min-h-11 w-full inline-flex items-center justify-center gap-space-1 shadow-sm"
        >
          <span>{continueLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
