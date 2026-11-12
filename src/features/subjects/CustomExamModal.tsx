import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sliders, Clock, HelpCircle, Eye, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { FeedbackMode, BenchmarkMode } from "@/types/exam";
import { startExamAttempt } from "@/api/attempts";
import { useExamUiStore } from "@/stores/examUiStore";

export interface CustomExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectCode: string;
  defaultExamId?: string;
  maxAvailableQuestions?: number;
}

export const CustomExamModal: React.FC<CustomExamModalProps> = ({
  isOpen,
  onClose,
  subjectCode,
  defaultExamId,
  maxAvailableQuestions = 50,
}) => {
  const navigate = useNavigate();
  const { setFeedbackMode, setBenchmarkMode } = useExamUiStore();

  const [questionCount, setQuestionCount] = useState<number>(Math.min(20, maxAvailableQuestions));
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [isUntimed, setIsUntimed] = useState<boolean>(false);
  const [feedbackModeState, setFeedbackModeState] = useState<FeedbackMode>("instant");
  const [benchmarkModeState, setBenchmarkModeState] = useState<BenchmarkMode>("ai");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartExam = async () => {
    setIsLoading(true);
    setError(null);

    // Save preferences to global store
    setFeedbackMode(feedbackModeState);
    setBenchmarkMode(benchmarkModeState);

    try {
      // Use existing exam id or default
      const examIdToStart = defaultExamId || `custom-${subjectCode}`;
      const attempt = await startExamAttempt(examIdToStart, {
        questionCount,
        durationMinutes: isUntimed ? null : durationMinutes,
        feedbackMode: feedbackModeState,
        benchmarkMode: benchmarkModeState,
      });

      onClose();
      navigate(`/attempts/${attempt.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể khởi tạo bài thi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tùy chỉnh đề luyện thi - ${subjectCode}`}
      size="md"
    >
      <div className="space-y-space-5">
        {error && (
          <div className="p-space-3 bg-color-4/10 border-2 border-color-4 text-color-4 rounded-2xl text-text-xs font-bold">
            {error}
          </div>
        )}

        {/* Question Count Setting */}
        <div>
          <label className="flex items-center justify-between text-text-xs font-bold text-color-1 mb-2">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-color-2" />
              Số lượng câu hỏi
            </span>
            <span className="text-color-2 font-bold">{questionCount} câu</span>
          </label>
          <input
            type="range"
            min={5}
            max={Math.max(5, maxAvailableQuestions)}
            step={5}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full accent-color-2 cursor-pointer h-2 bg-color-6 rounded-lg"
          />
          <div className="flex justify-between text-text-xs text-color-1/50 mt-1 font-bold">
            <span>5 câu</span>
            <span>Tối đa: {maxAvailableQuestions} câu</span>
          </div>
        </div>

        {/* Time Limit Setting */}
        <div>
          <label className="flex items-center justify-between text-text-xs font-bold text-color-1 mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-color-2" />
              Thời gian làm bài
            </span>
            <span className="text-color-2 font-bold">
              {isUntimed ? "Không giới hạn" : `${durationMinutes} phút`}
            </span>
          </label>

          <div className="flex items-center gap-space-2 mb-2">
            <button
              type="button"
              onClick={() => setIsUntimed(!isUntimed)}
              className={`px-space-3 py-1 rounded-full text-text-xs font-bold border-2 transition-all ${
                isUntimed
                  ? "bg-color-2 text-color-7 border-color-2 shadow-xs"
                  : "bg-color-7 text-color-1 border-color-1 hover:bg-color-6"
              }`}
            >
              {isUntimed ? "✓ Không giới hạn thời gian" : "Thi có hẹn giờ"}
            </button>
          </div>

          {!isUntimed && (
            <div className="grid grid-cols-4 gap-space-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-1.5 rounded-full text-text-xs font-bold border-2 transition-all ${
                    durationMinutes === mins
                      ? "bg-color-2 text-color-7 border-color-2 shadow-xs"
                      : "bg-color-7 text-color-1 border-color-1 hover:bg-color-6"
                  }`}
                >
                  {mins} phút
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Mode */}
        <div>
          <label className="flex items-center gap-1.5 text-text-xs font-bold text-color-1 mb-2">
            <Eye className="w-4 h-4 text-color-2" />
            Chế độ xem đáp án
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-3">
            <button
              type="button"
              onClick={() => setFeedbackModeState("instant")}
              className={`p-space-3 rounded-2xl border-2 text-left transition-all ${
                feedbackModeState === "instant"
                  ? "border-color-3 bg-color-3/10 shadow-sm"
                  : "border-color-1 bg-color-7 hover:bg-color-6"
              }`}
            >
              <div className="font-bold text-text-sm text-color-1">Xem đáp án ngay</div>
              <div className="text-text-xs text-color-1/70 mt-1">
                Hiển thị đúng/sai và lời giải ngay sau khi chọn đáp án (có thể đổi lại).
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFeedbackModeState("post_exam")}
              className={`p-space-3 rounded-2xl border-2 text-left transition-all ${
                feedbackModeState === "post_exam"
                  ? "border-color-2 bg-color-2/10 shadow-sm"
                  : "border-color-1 bg-color-7 hover:bg-color-6"
              }`}
            >
              <div className="font-bold text-text-sm text-color-1">Xem sau khi nộp bài</div>
              <div className="text-text-xs text-color-1/70 mt-1">
                Mô phỏng thi thực tế; chỉ chấm điểm và xem lời giải sau khi nộp bài thi.
              </div>
            </button>
          </div>
        </div>

        {/* Benchmark Mode */}
        <div>
          <label className="flex items-center gap-1.5 text-text-xs font-bold text-color-1 mb-2">
            <ShieldCheck className="w-4 h-4 text-color-2" />
            Nguồn đối chiếu đáp án chuẩn
          </label>
          <div className="grid grid-cols-2 gap-space-3">
            <button
              type="button"
              onClick={() => setBenchmarkModeState("ai")}
              className={`p-space-3 rounded-2xl border-2 text-left transition-all ${
                benchmarkModeState === "ai"
                  ? "border-color-2 bg-color-2/10 shadow-sm"
                  : "border-color-1 bg-color-7 hover:bg-color-6"
              }`}
            >
              <div className="font-bold text-text-xs text-color-1">Đáp án AI chuẩn</div>
              <div className="text-text-xs text-color-1/60">Mô hình AI giải chi tiết</div>
            </button>

            <button
              type="button"
              onClick={() => setBenchmarkModeState("community")}
              className={`p-space-3 rounded-2xl border-2 text-left transition-all ${
                benchmarkModeState === "community"
                  ? "border-color-5 bg-color-5/10 shadow-sm"
                  : "border-color-1 bg-color-7 hover:bg-color-6"
              }`}
            >
              <div className="font-bold text-text-xs text-color-1">Biểu quyết cộng đồng</div>
              <div className="text-text-xs text-color-1/60">Tự động dùng AI nếu thiếu dữ liệu</div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-space-3 pt-space-4 border-t-2 border-color-1">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleStartExam}
            isLoading={isLoading}
            className="flex items-center gap-1"
          >
            <Sliders className="w-4 h-4" />
            <span>Bắt đầu làm bài</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
