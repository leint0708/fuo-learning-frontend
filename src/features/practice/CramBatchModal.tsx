import React, { useEffect } from "react";
import { Trophy, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CramBatchModalProps {
  isOpen: boolean;
  batchNumber: number;
  totalBatches: number;
  batchSize: number;
  cumulativeMastered: number;
  totalDeckSize: number;
  onContinueNextBatch: () => void;
  onFinishSession: () => void;
}

export const CramBatchModal: React.FC<CramBatchModalProps> = ({
  isOpen,
  batchNumber,
  totalBatches,
  batchSize: _batchSize,
  cumulativeMastered,
  totalDeckSize,
  onContinueNextBatch,
  onFinishSession,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinueNextBatch();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onFinishSession();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onContinueNextBatch, onFinishSession]);

  if (!isOpen) return null;

  const percentage = Math.round((cumulativeMastered / Math.max(1, totalDeckSize)) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-space-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-fast"
    >
      <div className="bg-color-7 text-color-1 w-full max-w-md rounded-3xl border-2 border-color-1 shadow-sm overflow-hidden flex flex-col p-space-6 text-center animate-in zoom-in-95 duration-fast">
        {/* Celebration Trophy Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-color-5/20 border-2 border-color-1 flex items-center justify-center text-color-1 mb-space-4 shadow-xs">
          <Trophy className="w-8 h-8 text-color-5" />
        </div>

        {/* Milestone Headline */}
        <h2 className="text-text-xl font-bold text-color-1 mb-space-1">
          Hoàn thành Batch {batchNumber}/{totalBatches}! 🎉
        </h2>
        <p className="text-text-sm text-color-1/70 mb-space-4">
          Bạn đã ghi nhớ toàn bộ câu hỏi trong nhóm vừa rồi mà không còn lỗi sai nào.
        </p>

        {/* Progress Card */}
        <div className="p-space-4 rounded-2xl bg-color-6 border-2 border-color-1 shadow-xs mb-space-5">
          <div className="flex justify-between items-center text-text-xs font-bold text-color-1 mb-2">
            <span>Tiến độ tổng môn học:</span>
            <span className="text-color-2 font-bold">{cumulativeMastered}/{totalDeckSize} câu</span>
          </div>
          <div className="w-full bg-color-7 border-2 border-color-1 rounded-full h-3 overflow-hidden">
            <div
              className="bg-color-3 h-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-text-xs font-bold text-color-3 mt-1.5 block">
            {percentage}% ngân hàng câu hỏi đã thuộc
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-space-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onContinueNextBatch}
            className="w-full flex items-center justify-center gap-2"
          >
            <span>Tiếp tục Batch tiếp theo</span>
            <ArrowRight className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onFinishSession}
            className="w-full flex items-center justify-center gap-2 border-2 border-color-1 shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Dừng bài luyện tập</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
