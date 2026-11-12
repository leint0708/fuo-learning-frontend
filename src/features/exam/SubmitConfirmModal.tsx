import React from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
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
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  timeRemainingFormatted,
  isSubmitting = false,
}) => {
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const hasUnanswered = unansweredCount > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận nộp bài thi" size="sm">
      <div className="space-y-space-4">
        {hasUnanswered ? (
          <div className="p-space-3 bg-color-5/15 border-2 border-color-5 text-color-1 rounded-2xl flex items-start gap-space-2 text-text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-color-5 shrink-0 mt-0.5" />
            <div>
              <span>Bạn còn </span>
              <span className="text-color-4 font-bold">{unansweredCount} câu chưa trả lời</span>.
              <p className="font-normal mt-0.5 text-color-1/80">
                Các câu chưa làm sẽ không được tính điểm. Bạn có chắc chắn muốn nộp bài ngay bây giờ?
              </p>
            </div>
          </div>
        ) : (
          <div className="p-space-3 bg-color-3/15 border-2 border-color-3 text-color-3 rounded-2xl flex items-center gap-space-2 text-text-xs font-bold">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Tuyệt vời! Bạn đã hoàn thành tất cả {totalQuestions} câu hỏi.</span>
          </div>
        )}

        {/* Stats Preview */}
        <div className="p-space-4 bg-color-6 border-2 border-color-1 rounded-2xl grid grid-cols-2 gap-space-3 text-center">
          <div>
            <div className="text-text-lg font-bold text-color-1">
              {answeredCount}/{totalQuestions}
            </div>
            <div className="text-text-xs font-bold text-color-1/60">Số câu đã làm</div>
          </div>
          <div>
            <div className="text-text-lg font-bold text-color-2 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" />
              {timeRemainingFormatted}
            </div>
            <div className="text-text-xs font-bold text-color-1/60">Thời gian còn lại</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-space-3 pt-space-3 border-t-2 border-color-6">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Tiếp tục làm bài
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            isLoading={isSubmitting}
          >
            Nộp bài thi
          </Button>
        </div>
      </div>
    </Modal>
  );
};
