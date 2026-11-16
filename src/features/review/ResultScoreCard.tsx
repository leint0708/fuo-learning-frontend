import React from "react";
import { CheckCircle2, XCircle, Clock, Award, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface ResultScoreCardProps {
  examTitle: string;
  totalQuestions: number;
  correctCount: number;
  percentageScore: number;
  totalScore: number;
  isPassed: boolean;
  durationSeconds?: number | null;
  submittedAt?: string;
}

function formatDurationLabel(seconds: number): string {
  if (seconds === 0) return "< 1 giây";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}p ${secs}s`;
}

function formatSubmittedTime(submittedAt?: string): string {
  if (!submittedAt) return "Hoàn thành";
  const parsed = new Date(submittedAt);
  if (Number.isNaN(parsed.getTime())) return "Hoàn thành";
  return parsed.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ResultScoreCard: React.FC<ResultScoreCardProps> = ({
  examTitle,
  totalQuestions,
  correctCount,
  percentageScore,
  totalScore,
  isPassed,
  durationSeconds,
  submittedAt,
}) => {
  const hasDuration =
    typeof durationSeconds === "number" &&
    Number.isFinite(durationSeconds) &&
    durationSeconds >= 0;
  const submittedTimeLabel = formatSubmittedTime(submittedAt);
  const wrongCount = Math.max(0, totalQuestions - correctCount);

  const diagnosticSummary = isPassed
    ? wrongCount === 0
      ? `Hoàn hảo! Bạn trả lời đúng toàn bộ ${totalQuestions} câu hỏi (chuẩn đạt tối thiểu 70.0%).`
      : `Vượt chuẩn tối thiểu 70.0% — còn ${wrongCount} câu chưa đúng cần rà soát bên dưới.`
    : wrongCount > 0
      ? `Còn ${wrongCount} câu chưa đúng so với mức đạt tối thiểu 70.0%. Hãy kiểm tra lỗi sai hoặc ôn cấp tốc ngay.`
      : "Tiêu chuẩn vượt qua môn: tối thiểu 70.0% tổng điểm.";

  return (
    <Card className="p-space-4 sm:p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm text-center max-w-4xl mx-auto w-full">
      {/* Pass/Fail Hero Icon */}
      <div className="inline-flex items-center justify-center mb-space-3">
        {isPassed ? (
          <div className="w-16 h-16 rounded-full bg-color-3/15 text-color-3 flex items-center justify-center border-2 border-color-3 shadow-xs">
            <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-color-4/15 text-color-1 flex items-center justify-center border-2 border-color-4 shadow-xs">
            <XCircle className="w-10 h-10 text-color-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Pass / Fail Status Badge */}
      <div className="mb-space-2">
        <Badge
          variant={isPassed ? "success" : "danger"}
          className="text-text-xs sm:text-text-sm px-space-3 sm:px-space-4 py-1 text-center"
        >
          {isPassed ? "KẾT QUẢ: ĐẠT TIÊU CHUẨN" : "KẾT QUẢ: CHƯA ĐẠT"}
        </Badge>
      </div>

      <h1 className="text-text-lg sm:text-text-xl font-bold text-color-1 mb-space-1 text-balance">
        {examTitle}
      </h1>
      <p className="text-text-xs sm:text-text-sm text-color-1/80 mb-space-4 sm:mb-space-5 max-w-2xl mx-auto">
        {diagnosticSummary}
      </p>

      {/* Score Grid Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-2 sm:gap-space-3 pt-space-4 border-t-2 border-color-6 tabular-nums">
        <div className="p-space-2 sm:p-space-3 bg-color-6 rounded-2xl border-2 border-color-1/20 min-w-0">
          <div className="text-text-xs font-bold text-color-1/80 flex items-center justify-center gap-space-1">
            <Award className="w-4 h-4 text-color-2 shrink-0" aria-hidden="true" />
            <span>Điểm số</span>
          </div>
          <div className="text-text-lg sm:text-text-xl font-bold text-color-2 mt-space-1">
            {totalScore.toFixed(1)}/10
          </div>
        </div>

        <div className="p-space-2 sm:p-space-3 bg-color-6 rounded-2xl border-2 border-color-1/20 min-w-0">
          <div className="text-text-xs font-bold text-color-1/80">Tỷ lệ chính xác</div>
          <div
            className={`text-text-lg sm:text-text-xl font-bold mt-space-1 ${
              isPassed ? "text-color-3" : "text-color-1"
            }`}
          >
            {percentageScore.toFixed(1)}%
          </div>
        </div>

        <div className="p-space-2 sm:p-space-3 bg-color-6 rounded-2xl border-2 border-color-1/20 min-w-0">
          <div className="text-text-xs font-bold text-color-1/80 flex items-center justify-center gap-space-1">
            <HelpCircle className="w-4 h-4 text-color-5 shrink-0" aria-hidden="true" />
            <span>Số câu đúng</span>
          </div>
          <div className="text-text-lg sm:text-text-xl font-bold text-color-1 mt-space-1">
            {correctCount}/{totalQuestions}
          </div>
        </div>

        <div className="p-space-2 sm:p-space-3 bg-color-6 rounded-2xl border-2 border-color-1/20 min-w-0">
          <div className="text-text-xs font-bold text-color-1/80 flex items-center justify-center gap-space-1">
            <Clock className="w-4 h-4 text-color-1 shrink-0" aria-hidden="true" />
            <span>{hasDuration ? "Thời gian làm" : "Nộp bài lúc"}</span>
          </div>
          <div className="text-text-lg sm:text-text-xl font-bold text-color-1 mt-space-1">
            {hasDuration ? formatDurationLabel(durationSeconds!) : submittedTimeLabel}
          </div>
        </div>
      </div>
    </Card>
  );
};
