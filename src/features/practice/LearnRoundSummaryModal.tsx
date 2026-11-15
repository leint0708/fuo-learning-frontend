import React, { useEffect } from "react";
import { ArrowRight, CheckCircle2, XCircle, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
  activePoolCount: _activePoolCount,
  waitingCount: _waitingCount,
  graduatedCount,
  totalDeckSize,
  onContinueNextRound,
  onFinishSession,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinueNextRound();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onFinishSession();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onContinueNextRound, onFinishSession]);

  if (!isOpen || !roundDiagnostic) return null;

  const errorRate = Math.round(roundDiagnostic.errorRate);

  // Determine feedback tier based on error rate
  let headline = "Xuất sắc! Hoàn hảo! 🌟";
  let description = "Tất cả câu hỏi trong vòng này đều được trả lời chính xác!";
  let tierStyle = "bg-color-3/15 border-color-3 text-color-3";

  if (errorRate > 0 && errorRate < 30) {
    headline = "Rất tốt! Tiếp tục nào! 🔥";
    description = "Bạn đang nắm rất chắc kiến thức, chỉ sai một vài câu nhỏ.";
    tierStyle = "bg-color-5/20 border-color-5 text-color-1";
  } else if (errorRate >= 30 && errorRate < 60) {
    headline = "Cố lên! Bạn đang tiến bộ! 💪";
    description = "Các câu sai sẽ được lặp lại trong vòng kế tiếp để củng cố bộ nhớ.";
    tierStyle = "bg-color-2/15 border-color-2 text-color-2";
  } else if (errorRate >= 60) {
    headline = "Đừng nản! Lặp lại là chìa khóa! 🧠";
    description = "Luyện tập ngắt quãng sẽ giúp não bộ ghi nhớ sâu sắc và bền vững hơn.";
    tierStyle = "bg-color-4/15 border-color-4 text-color-4";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-space-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-fast overflow-y-auto"
    >
      <div className="bg-color-7 text-color-1 w-full max-w-2xl rounded-3xl border-2 border-color-1 shadow-sm overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-fast">
        {/* Header */}
        <div className="flex items-center justify-between px-space-6 py-space-4 border-b-2 border-color-1 bg-color-6">
          <div className="flex items-center gap-space-2">
            <Brain className="w-6 h-6 text-color-2" />
            <h2 className="text-text-lg font-bold text-color-1">
              Tổng kết Vòng {roundDiagnostic.roundNumber}
            </h2>
          </div>
          <Badge variant="neutral">
            Tổng thành thạo: {graduatedCount}/{totalDeckSize}
          </Badge>
        </div>

        {/* Scrollable Content */}
        <div className="p-space-6 overflow-y-auto flex-1 flex flex-col gap-space-5">
          {/* Motivational Tier Card */}
          <div className={`p-space-5 rounded-2xl border-2 shadow-xs ${tierStyle}`}>
            <div className="flex justify-between items-start gap-2 mb-1">
              <h3 className="text-text-lg font-bold">{headline}</h3>
              <Badge variant="neutral">Tỷ lệ sai: {errorRate}%</Badge>
            </div>
            <p className="text-text-xs font-bold opacity-80">{description}</p>
          </div>

          {/* Audit Gallery */}
          <div>
            <h4 className="text-text-sm font-bold text-color-1 mb-space-3">
              Chi tiết câu hỏi trong vòng này ({roundDiagnostic.items.length} câu)
            </h4>
            <div className="flex flex-col gap-space-3">
              {roundDiagnostic.items.map((item, idx) => (
                <div
                  key={`${item.question.questionId}-${idx}`}
                  className={`p-space-4 rounded-2xl border-2 transition-all ${
                    item.isCorrect
                      ? "border-color-3/50 bg-color-3/5"
                      : "border-color-4/50 bg-color-4/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-space-3 mb-space-2">
                    <div className="flex items-start gap-2">
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-color-3 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-color-4 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="text-text-xs font-bold text-color-1/60 block">
                          Câu {item.question.questionNumber}
                        </span>
                        <p className="text-text-xs font-bold text-color-1 line-clamp-2">
                          {item.question.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {item.status === "learned" ? (
                        <span className="px-space-3 py-0.5 text-text-xs font-bold rounded-full bg-color-3 text-color-7 border border-color-1 shadow-xs">
                          Đã tốt nghiệp
                        </span>
                      ) : item.isCorrect ? (
                        <span className="px-space-3 py-0.5 text-text-xs font-bold rounded-full bg-color-5 text-color-1 border border-color-1 shadow-xs">
                          Đang tiến bộ
                        </span>
                      ) : (
                        <span className="px-space-3 py-0.5 text-text-xs font-bold rounded-full bg-color-4 text-color-7 border border-color-1 shadow-xs">
                          Cần lặp lại
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-text-xs font-bold text-color-1/80 pl-7 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Bạn chọn: <strong className={item.isCorrect ? "text-color-3" : "text-color-4"}>{item.selectedOptions}</strong>
                    </span>
                    <span>
                      Đáp án đúng: <strong className="text-color-3">{item.correctAnswer}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-space-4 border-t-2 border-color-1 bg-color-6 flex flex-col sm:flex-row items-center justify-end gap-space-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onFinishSession}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 border-2 border-color-1 shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Dừng học</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onContinueNextRound}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <span>Tiếp tục học vòng tiếp theo</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
