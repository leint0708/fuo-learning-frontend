import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, XCircle, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { RoundDiagnostic } from "@/types/practice";

export interface LearnRoundSummaryModalProps {
  isOpen: boolean;
  roundDiagnostic: RoundDiagnostic | null;
  activePoolCount: number;
  waitingCount: number;
  graduatedCount: number;
  totalDeckSize: number;
  onContinueNextRound: () => void;
  onFinishSession: () => void;
}

export const LearnRoundSummaryModal: React.FC<LearnRoundSummaryModalProps> = ({
  isOpen,
  roundDiagnostic,
  activePoolCount,
  waitingCount,
  graduatedCount,
  totalDeckSize,
  onContinueNextRound,
  onFinishSession,
}) => {
  const continueBtnRef = useRef<HTMLButtonElement | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setExpandedItems({});
  }, [roundDiagnostic?.roundNumber, isOpen]);

  useEffect(() => {
    if (!isOpen || !roundDiagnostic) return;

    if (continueBtnRef.current && typeof continueBtnRef.current.focus === "function") {
      continueBtnRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key !== "Enter" && e.key !== " ") return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        activeEl.tagName === "BUTTON" &&
        activeEl.dataset.continueAction !== "true"
      ) {
        return;
      }

      e.preventDefault();
      onContinueNextRound();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, roundDiagnostic, onContinueNextRound]);

  if (!roundDiagnostic) return null;

  const errorRate = Math.round(roundDiagnostic.errorRate);

  let headline = "Xuất sắc! Hoàn hảo!";
  let description = "Tất cả câu hỏi trong vòng này đều được trả lời chính xác!";
  let tierStyle = "bg-color-3/15 border-color-3 text-color-1";

  if (errorRate > 0 && errorRate < 30) {
    headline = "Rất tốt! Tiếp tục nào!";
    description = "Bạn đang nắm rất chắc kiến thức, chỉ sai một vài câu nhỏ.";
    tierStyle = "bg-color-5/20 border-color-1 text-color-1";
  } else if (errorRate >= 30 && errorRate < 60) {
    headline = "Cố lên! Bạn đang tiến bộ!";
    description = "Các câu sai sẽ được lặp lại trong vòng kế tiếp để củng cố bộ nhớ.";
    tierStyle = "bg-color-2/10 border-color-2 text-color-1";
  } else if (errorRate >= 60) {
    headline = "Đừng nản! Lặp lại là chìa khóa!";
    description = "Luyện tập ngắt quãng sẽ giúp não bộ ghi nhớ sâu sắc và bền vững hơn.";
    tierStyle = "bg-color-4/15 border-color-1 text-color-1";
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onContinueNextRound}
      title={`Tổng kết Vòng ${roundDiagnostic.roundNumber}`}
      size="lg"
    >
      <div className="flex flex-col gap-space-4">
        <div className="flex flex-wrap items-center justify-between gap-space-2">
          <div className="flex items-center gap-space-2 text-text-sm font-bold text-color-1">
            <Brain className="w-5 h-5 text-color-2" aria-hidden="true" />
            <span>Tổng kết chẩn đoán vòng học</span>
          </div>
          <div className="flex flex-wrap items-center gap-space-2">
            <Badge variant="neutral">
              Đang ôn: {activePoolCount} • Chờ lượt: {waitingCount}
            </Badge>
            <Badge variant="neutral">
              Tổng thành thạo: {graduatedCount}/{totalDeckSize}
            </Badge>
          </div>
        </div>

        {/* Motivational Tier Card */}
        <div className={`p-space-4 rounded-2xl border-2 shadow-xs ${tierStyle}`}>
          <div className="flex flex-wrap justify-between items-start gap-space-2 mb-space-1">
            <h4 className="text-text-base sm:text-text-lg font-bold text-color-1">{headline}</h4>
            <Badge variant="neutral">Tỷ lệ sai: {errorRate}%</Badge>
          </div>
          <p className="text-text-xs font-bold text-color-1">{description}</p>
        </div>

        {/* Audit Gallery */}
        <div>
          <h4 className="text-text-sm font-bold text-color-1 mb-space-3">
            Chi tiết câu hỏi trong vòng này ({roundDiagnostic.items.length} câu)
          </h4>
          <div className="flex flex-col gap-space-3">
            {roundDiagnostic.items.map((item, idx) => {
              const isExpanded = Boolean(expandedItems[idx]);
              return (
                <div
                  key={`${item.question.questionId}-${idx}`}
                  className={`p-space-4 rounded-2xl border-2 transition-all ${
                    item.isCorrect
                      ? "border-color-3 bg-color-3/10"
                      : "border-color-1 bg-color-4/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-space-3 mb-space-2">
                    <div className="flex items-start gap-space-2 min-w-0 flex-1">
                      <span
                        className={`w-7 h-7 rounded-full border border-color-1 flex items-center justify-center shrink-0 mt-0.5 ${
                          item.isCorrect
                            ? "bg-color-3 text-color-7"
                            : "bg-color-4 text-color-1"
                        }`}
                      >
                        {item.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <XCircle className="w-4 h-4" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-text-xs font-bold text-color-1/80 block">
                          Câu {item.question.questionNumber}
                        </span>
                        <p
                          className={`text-text-xs font-bold text-color-1 ${
                            isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
                          }`}
                        >
                          {item.question.questionText}
                        </p>
                        {item.question.questionText.length > 90 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedItems((prev) => ({
                                ...prev,
                                [idx]: !prev[idx],
                              }))
                            }
                            className="mt-space-1 min-h-11 px-space-2 text-text-2xs font-bold text-color-2 underline cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-color-5 rounded-md"
                          >
                            {isExpanded ? "Thu gọn" : "Xem đầy đủ"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {item.status === "learned" ? (
                        <span className="px-space-3 py-space-1 text-text-xs font-bold rounded-full bg-color-3 text-color-7 border border-color-1 shadow-xs">
                          Đã tốt nghiệp
                        </span>
                      ) : item.isCorrect ? (
                        <span className="px-space-3 py-space-1 text-text-xs font-bold rounded-full bg-color-5 text-color-1 border border-color-1 shadow-xs">
                          Đang tiến bộ
                        </span>
                      ) : (
                        <span className="px-space-3 py-space-1 text-text-xs font-bold rounded-full bg-color-4 text-color-1 border border-color-1 shadow-xs">
                          Cần lặp lại
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-text-xs font-bold text-color-1 pl-9 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Bạn chọn: <strong>{item.selectedOptions}</strong>
                    </span>
                    <span>
                      Đáp án đúng: <strong>{item.correctAnswer}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-space-3 border-t-2 border-color-1 flex flex-col sm:flex-row items-center justify-end gap-space-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onFinishSession}
            className="min-h-11 w-full sm:w-auto flex items-center justify-center gap-space-1 border-2 border-color-1 shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Dừng học</span>
          </Button>

          <Button
            ref={continueBtnRef as React.RefObject<HTMLButtonElement>}
            data-continue-action="true"
            variant="primary"
            size="md"
            onClick={onContinueNextRound}
            className="min-h-11 w-full sm:w-auto flex items-center justify-center gap-space-2"
          >
            <span>Tiếp tục học vòng tiếp theo</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
