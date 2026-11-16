import React from "react";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  timeRemainingFormatted: string;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  timeRemainingFormatted,
  isSubmitting = false,
  submitError = null,
}) => {
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const hasUnanswered = unansweredCount > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận nộp bài thi" size="sm">
      <div className="flex flex-col gap-space-4">
        {submitError && (
          <div
            role="alert"
            aria-live="polite"
            className="p-space-3 bg-color-4/20 border-2 border-color-1 text-color-1 rounded-2xl flex items-start gap-space-2 text-text-xs font-bold"
          >
            <span className="w-6 h-6 rounded-full bg-color-4 text-color-1 border border-color-1 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" aria-hidden="true" />
            </span>
            <span>{submitError}</span>
          </div>
        )}

        {hasUnanswered ? (
          <div className="p-space-3 bg-color-5/20 border-2 border-color-1 text-color-1 rounded-2xl flex items-start gap-space-2 text-text-xs font-bold">
            <span className="w-6 h-6 rounded-full bg-color-5 text-color-1 border border-color-1 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <span>Bạn còn {unansweredCount} câu chưa trả lời.</span>
              <p className="font-medium mt-space-1 text-color-1">
                Các câu chưa làm sẽ không được tính điểm. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
              </p>
            </div>
          </div>
        ) : (
          <div className="p-space-3 bg-color-3/15 border-2 border-color-3 text-color-1 rounded-2xl flex items-center gap-space-2 text-text-xs font-bold">
            <span className="w-6 h-6 rounded-full bg-color-3 text-color-7 border border-color-1 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
            </span>
            <span>Tuyệt vời! Bạn đã hoàn thành tất cả {totalQuestions} câu hỏi.</span>
          </div>
        )}

        {/* Stats Preview */}
        <div className="p-space-3 sm:p-space-4 bg-color-6 border-2 border-color-1 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-space-3 text-center tabular-nums">
          <div>
            <div className="text-text-lg font-bold text-color-1">
              {answeredCount}/{totalQuestions}
            </div>
            <div className="text-text-xs font-bold text-color-1">Số câu đã làm</div>
          </div>
          <div>
            <div className="text-text-lg font-bold text-color-2 flex items-center justify-center gap-space-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{timeRemainingFormatted}</span>
            </div>
            <div className="text-text-xs font-bold text-color-1">Thời gian còn lại</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-space-3 pt-space-3 border-t-2 border-color-6">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-11"
          >
            Tiếp tục làm bài
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            isLoading={isSubmitting}
            className="min-h-11"
          >
            {submitError ? "Thử nộp lại" : "Nộp bài thi"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
