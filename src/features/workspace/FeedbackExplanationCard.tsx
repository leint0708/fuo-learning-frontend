import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { WorkspaceEvaluationResult } from "./types";

export interface FeedbackExplanationCardProps {
  evaluation: WorkspaceEvaluationResult | null;
  onContinue?: () => void;
  onRetry?: () => void;
  onOpenAiModal?: () => void;
  continueLabel?: string;
}

/**
 * Shared inline evaluation banner, retry recovery, AI rationale, and option-by-option breakdown.
 * Enforces WCAG AA tokens strictly within color-1..color-7 and >=44px touch targets.
 */
export const FeedbackExplanationCard: React.FC<FeedbackExplanationCardProps> = ({
  evaluation,
  onContinue,
  onRetry,
  onOpenAiModal,
  continueLabel = "Tiếp tục",
}) => {
  const evaluationKey =
    evaluation?.status === "resolved"
      ? `${evaluation.isCorrect}:${evaluation.correctAnswer ?? ""}:${evaluation.aiExplanation ?? ""}`
      : "";
  const [prevEvaluationKey, setPrevEvaluationKey] = useState(evaluationKey);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(
    () => evaluation?.status === "resolved" && evaluation.isCorrect === false
  );

  if (evaluationKey !== prevEvaluationKey) {
    setPrevEvaluationKey(evaluationKey);
    if (evaluation?.status === "resolved") {
      setIsBreakdownExpanded(evaluation.isCorrect === false);
    }
  }

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
        className="p-space-4 rounded-2xl border-2 border-color-1 bg-color-4/15 text-color-1 flex flex-col sm:flex-row sm:items-center justify-between gap-space-3"
      >
        <div className="flex items-start gap-space-3">
          <span className="w-8 h-8 rounded-full bg-color-4 text-color-1 border border-color-1 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-space-1">
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
            className="min-h-11 shrink-0 inline-flex items-center justify-center gap-space-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kiểm tra lại</span>
          </Button>
        )}
      </div>
    );
  }

  const analysisEntries = Object.entries(evaluation.optionByOptionAnalysis ?? {});

  return (
    <div
      className="flex flex-col gap-space-3 transition-opacity duration-fast"
      aria-live="polite"
    >
      {/* Status Banner */}
      <div
        role="status"
        className={`p-space-4 rounded-2xl border-2 border-color-1 flex flex-col sm:flex-row sm:items-center justify-between gap-space-3 ${
          evaluation.isCorrect ? "bg-color-3/15 text-color-1" : "bg-color-4/15 text-color-1"
        }`}
      >
        <div className="flex items-center gap-space-3">
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
          <span className="font-bold text-text-sm sm:text-text-base text-color-1">
            {evaluation.isCorrect
              ? "Chính xác! Giỏi lắm!"
              : `Chưa chính xác — Đáp án đúng: ${evaluation.correctAnswer ?? ""}`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-space-2 shrink-0">
          {onOpenAiModal && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenAiModal}
              className="min-h-11 inline-flex items-center justify-center gap-space-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>Xem giải thích AI</span>
            </Button>
          )}

          {onContinue && (
            <Button
              variant="primary"
              size="md"
              onClick={onContinue}
              className="min-h-11 inline-flex items-center justify-center gap-space-1 shadow-sm"
            >
              <span>{continueLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Inline AI / Detailed Explanation */}
      {evaluation.aiExplanation && (
        <div className="p-space-4 rounded-2xl bg-color-6 border-2 border-color-1 text-color-1 shadow-xs flex items-start gap-space-3">
          <span className="w-8 h-8 rounded-full bg-color-5 text-color-1 border border-color-1 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-bold block text-text-xs text-color-2 mb-space-1">
              Giải thích chi tiết:
            </span>
            <p className="text-text-xs sm:text-text-sm font-medium text-color-1 leading-relaxed whitespace-pre-wrap">
              {evaluation.aiExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Expandable Option-by-Option Breakdown */}
      {analysisEntries.length > 0 && (
        <div className="rounded-2xl bg-color-7 border-2 border-color-1 overflow-hidden">
          <button
            type="button"
            aria-expanded={isBreakdownExpanded}
            onClick={() => setIsBreakdownExpanded((prev) => !prev)}
            className="min-h-11 w-full px-space-4 py-space-2 bg-color-6 border-b border-color-1 flex items-center justify-between text-left text-text-xs font-bold text-color-1 hover:bg-color-7 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-color-5"
          >
            <span>Phân tích từng đáp án ({analysisEntries.length})</span>
            {isBreakdownExpanded ? (
              <ChevronUp className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" />
            )}
          </button>

          {isBreakdownExpanded && (
            <div className="p-space-3 grid grid-cols-1 sm:grid-cols-2 gap-space-2">
              {analysisEntries.map(([optKey, rationale]) => {
                const isCorrectKey = evaluation.correctAnswer?.includes(optKey);
                return (
                  <div
                    key={optKey}
                    className={`p-space-3 rounded-xl border-2 text-text-xs leading-relaxed ${
                      isCorrectKey
                        ? "bg-color-3/15 border-color-3 text-color-1"
                        : "bg-color-6/60 border-color-1/40 text-color-1"
                    }`}
                  >
                    <div className="flex items-center gap-space-2 mb-space-1">
                      <span
                        className={`px-space-2 py-0.5 rounded-full font-bold text-text-2xs border border-color-1 ${
                          isCorrectKey
                            ? "bg-color-3 text-color-7"
                            : "bg-color-7 text-color-1"
                        }`}
                      >
                        Đáp án {optKey}
                      </span>
                      {isCorrectKey && (
                        <span className="font-bold text-text-2xs text-color-1">Đúng</span>
                      )}
                    </div>
                    <p className="font-medium text-color-1">{rationale}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
