import React, { useEffect, useRef } from "react";
import { Trophy, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

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
  batchSize,
  cumulativeMastered,
  totalDeckSize,
  onContinueNextBatch,
  onFinishSession,
}) => {
  const continueBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Move initial focus inside dialog onto the safe primary continue button
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
        // Respect explicit stop / close button focus so Enter/Space activates it cleanly
        return;
      }

      e.preventDefault();
      onContinueNextBatch();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onContinueNextBatch]);

  const percentage = Math.round((cumulativeMastered / Math.max(1, totalDeckSize)) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onContinueNextBatch}
      title={`Hoàn thành Đợt ${batchNumber}/${totalBatches}!`}
      size="sm"
    >
      <div className="flex flex-col text-center gap-space-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-color-5 border-2 border-color-1 flex items-center justify-center text-color-1 shadow-xs">
          <Trophy className="w-7 h-7" aria-hidden="true" />
        </div>

        <p className="text-text-sm font-medium text-color-1">
          Bạn đã ghi nhớ toàn bộ {batchSize} câu hỏi trong đợt vừa rồi mà không còn lỗi sai nào.
        </p>

        {/* Progress Card */}
        <div className="p-space-4 rounded-2xl bg-color-6 border-2 border-color-1 shadow-xs text-left">
          <div className="flex justify-between items-center text-text-xs font-bold text-color-1 mb-space-2">
            <span>Tiến độ tổng môn học:</span>
            <span className="text-color-2 font-bold tabular-nums">
              {cumulativeMastered}/{totalDeckSize} câu
            </span>
          </div>
          <div className="w-full bg-color-7 border-2 border-color-1 rounded-full h-3 overflow-hidden">
            <div
              className="bg-color-3 h-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-text-xs font-bold text-color-1 mt-space-2 block tabular-nums">
            {percentage}% ngân hàng câu hỏi đã thuộc
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-space-3">
          <Button
            ref={continueBtnRef as React.RefObject<HTMLButtonElement>}
            data-continue-action="true"
            variant="primary"
            size="lg"
            onClick={onContinueNextBatch}
            className="min-h-11 w-full flex items-center justify-center gap-space-2"
          >
            <span>Tiếp tục Đợt tiếp theo</span>
            <ArrowRight className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onFinishSession}
            className="min-h-11 w-full flex items-center justify-center gap-space-1 border-2 border-color-1 shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Dừng bài luyện tập</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
