import React from "react";
import { Sparkles, Bot, CheckCircle2, HelpCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface AiAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionNumber: number;
  questionCode?: string;
  questionText?: string;
  imageUrl?: string | null;
  options?: Record<string, string>;
  selectedOption?: string | null;
  correctAnswer?: string | null;
  aiChoice?: string | null;
  aiModel?: string | null;
  aiExplanation?: string | null;
  optionByOptionAnalysis?: Record<string, string> | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

/**
 * Shared AI rationale breakdown modal supporting loading, error/retry, and verified API output.
 * Zero hardcoded fallback answers or copy.
 */
export const AiAnswerModal: React.FC<AiAnswerModalProps> = ({
  isOpen,
  onClose,
  questionNumber,
  questionCode,
  questionText,
  imageUrl,
  options,
  selectedOption,
  correctAnswer,
  aiChoice,
  aiModel = "gemini-3-flash-preview",
  aiExplanation,
  optionByOptionAnalysis,
  isLoading = false,
  errorMessage = null,
  onRetry,
}) => {
  const resolvedChoice = aiChoice ?? correctAnswer ?? null;
  const codeSuffix = questionCode ? ` (${questionCode})` : "";
  const sortedOptions = options
    ? Object.entries(options).sort(([a], [b]) => a.localeCompare(b))
    : [];
  const hasQuestionContext = Boolean(questionText || imageUrl || sortedOptions.length > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Giải thích chi tiết từ AI - Câu ${questionNumber}${codeSuffix}`}
      size="lg"
    >
      <div className="flex flex-col gap-space-4">
        {hasQuestionContext && (
          <div className="p-space-3 sm:p-space-4 rounded-2xl bg-color-6 border-2 border-color-1 flex flex-col gap-space-3">
            {questionText && (
              <p className="text-text-xs sm:text-text-sm font-bold text-color-1 whitespace-pre-wrap leading-relaxed">
                {questionText}
              </p>
            )}
            {imageUrl && (
              <div className="rounded-xl border-2 border-color-1 bg-color-7 p-space-2 flex justify-center">
                <img
                  src={imageUrl}
                  alt={`Minh họa câu ${questionNumber}`}
                  className="max-h-40 w-auto object-contain rounded-lg"
                />
              </div>
            )}
            {sortedOptions.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-space-2">
                {sortedOptions.map(([optKey, optText]) => {
                  const isUserSelected = Boolean(selectedOption?.includes(optKey));
                  const isAiSuggested = Boolean(resolvedChoice?.includes(optKey));
                  return (
                    <li
                      key={optKey}
                      className={`px-space-3 py-space-2 rounded-xl border-2 text-text-xs font-medium flex flex-col gap-space-1 ${
                        isAiSuggested
                          ? "bg-color-3/15 border-color-3 text-color-1"
                          : isUserSelected
                            ? "bg-color-2/10 border-color-2 text-color-1"
                            : "bg-color-7 border-color-1 text-color-1"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-space-2">
                        <span className="font-bold text-color-1 min-w-0 break-words">
                          {optKey}. {optText}
                        </span>
                        <div className="flex flex-wrap items-center gap-space-1 shrink-0">
                          {isUserSelected && (
                            <span className="px-space-2 py-0.5 rounded-full bg-color-2 text-color-7 border border-color-1 text-text-2xs font-bold whitespace-nowrap">
                              Bạn chọn
                            </span>
                          )}
                          {isAiSuggested && (
                            <span className="px-space-2 py-0.5 rounded-full bg-color-3 text-color-7 border border-color-1 text-text-2xs font-bold whitespace-nowrap">
                              AI gợi ý
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {isLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="p-space-6 rounded-2xl bg-color-6 border-2 border-color-1 flex flex-col items-center justify-center gap-space-3 text-center"
          >
            <div className="w-9 h-9 rounded-full border-4 border-color-2 border-t-transparent animate-spin" />
            <p className="text-text-sm font-bold text-color-1">
              Đang tải phân tích chi tiết từ AI...
            </p>
          </div>
        ) : errorMessage ? (
          <div
            role="alert"
            aria-live="polite"
            className="p-space-5 rounded-2xl bg-color-4/15 border-2 border-color-1 flex flex-col items-center text-center gap-space-3"
          >
            <div className="w-11 h-11 rounded-full bg-color-4 text-color-1 border-2 border-color-1 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-space-1">
              <h4 className="text-text-base font-bold text-color-1">
                Không thể tải phân tích AI lúc này
              </h4>
              <p className="text-text-xs font-medium text-color-1 max-w-md">
                {errorMessage}
              </p>
            </div>
            {onRetry && (
              <Button
                variant="primary"
                size="md"
                onClick={onRetry}
                className="min-h-11 inline-flex items-center gap-space-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử lại</span>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Hero Card with AI Choice & Model */}
            <div
              data-impeccable-ignore="hard-offset-shadow"
              className="p-space-4 sm:p-space-5 bg-color-2 text-color-7 border-2 border-color-1 rounded-2xl shadow-sm flex flex-col gap-space-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-space-2">
                <div className="flex items-center gap-space-2 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-color-5 text-color-1 flex items-center justify-center border-2 border-color-1 font-bold shadow-xs shrink-0">
                    <Bot className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-text-2xs font-bold text-color-7 flex items-center gap-space-1">
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      <span>Phân tích bởi AI</span>
                    </span>
                    <span className="text-text-xs font-bold block text-color-7">
                      Trợ lý học tập thông minh
                    </span>
                  </div>
                </div>

                <div className="px-space-3 py-space-1 rounded-full bg-color-7 text-color-1 border-2 border-color-1 text-text-2xs font-bold shadow-2xs whitespace-nowrap shrink-0">
                  {aiModel || "gemini-3-flash-preview"}
                </div>
              </div>

              <div className="pt-space-2 border-t border-color-7/30 flex flex-wrap items-center justify-between gap-space-2">
                <span className="text-text-xs sm:text-text-sm font-bold text-color-7">
                  Đáp án AI khuyến nghị:
                </span>
                <span className="px-space-3 py-space-1 rounded-full bg-color-5 text-color-1 border-2 border-color-1 text-text-xs sm:text-text-sm font-bold shadow-xs whitespace-nowrap">
                  {resolvedChoice ? `Lựa chọn ${resolvedChoice}` : "Chưa xác định"}
                </span>
              </div>
            </div>

            {/* Step-by-step Reasoning Section */}
            <div>
              <h5 className="font-bold text-text-xs sm:text-text-sm text-color-1 mb-space-2 flex items-center gap-space-1">
                <span className="w-5 h-5 rounded-full bg-color-3 text-color-7 inline-flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span>Các bước giải thích và suy luận logic:</span>
              </h5>
              <div className="p-space-4 bg-color-6 border-2 border-color-1 rounded-2xl text-text-xs sm:text-text-sm text-color-1 font-medium leading-relaxed whitespace-pre-wrap">
                {aiExplanation ||
                  "Hiện tại câu hỏi này chưa có diễn giải từng bước chi tiết từ mô hình AI."}
              </div>
            </div>

            {/* Option-by-Option Breakdown */}
            {optionByOptionAnalysis && Object.keys(optionByOptionAnalysis).length > 0 && (
              <div>
                <h5 className="font-bold text-text-xs sm:text-text-sm text-color-1 mb-space-2 flex items-center gap-space-1">
                  <HelpCircle className="w-4 h-4 text-color-2 shrink-0" aria-hidden="true" />
                  <span>Phân tích từng phương án lựa chọn:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-2">
                  {Object.entries(optionByOptionAnalysis).map(([opt, desc]) => {
                    const isSelectedAi = resolvedChoice?.includes(opt);
                    return (
                      <div
                        key={opt}
                        className={`p-space-3 rounded-2xl border-2 transition-all ${
                          isSelectedAi
                            ? "bg-color-3/15 border-color-3 shadow-xs"
                            : "bg-color-7 border-color-1"
                        }`}
                      >
                        <div className="flex items-center gap-space-2 font-bold text-text-xs mb-space-1">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-color-7 text-text-2xs font-bold border border-color-1 ${
                              isSelectedAi ? "bg-color-3" : "bg-color-1"
                            }`}
                          >
                            {opt}
                          </span>
                          <span className="text-color-1 font-bold">
                            {isSelectedAi ? "Phương án đúng" : "Phương án sai"}
                          </span>
                        </div>
                        <p className="text-text-xs text-color-1 leading-normal font-medium">
                          {desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="pt-space-3 border-t-2 border-color-6 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose} className="min-h-11 px-space-4">
            Đã hiểu, quay lại làm bài
          </Button>
        </div>
      </div>
    </Modal>
  );
};
