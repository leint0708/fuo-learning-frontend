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
  durationSeconds: number;
}

export const ResultScoreCard: React.FC<ResultScoreCardProps> = ({
  examTitle,
  totalQuestions,
  correctCount,
  percentageScore,
  totalScore,
  isPassed,
  durationSeconds,
}) => {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return (
    <Card className="p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm text-center max-w-3xl mx-auto w-full">
      {/* Pass/Fail Hero Icon */}
      <div className="inline-flex items-center justify-center mb-space-3">
        {isPassed ? (
          <div className="w-16 h-16 rounded-full bg-color-3/15 text-color-3 flex items-center justify-center border-2 border-color-3 shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-color-4/15 text-color-4 flex items-center justify-center border-2 border-color-4 shadow-xs">
            <XCircle className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* Pass / Fail Status Badge */}
      <div className="mb-space-2">
        <Badge
          variant={isPassed ? "success" : "danger"}
          className="text-text-sm px-space-4 py-1"
        >
          {isPassed ? "KẾT QUẢ: ĐẠT TIÊU CHUẨN (PASSED)" : "KẾT QUẢ: CHƯA ĐẠT (FAILED)"}
        </Badge>
      </div>

      <h2 className="text-text-xl font-bold text-color-1 mb-space-1">{examTitle}</h2>
      <p className="text-text-xs text-color-1/70 mb-space-5">
        Tiêu chuẩn vượt qua môn: tối thiểu 70.0% tổng điểm
      </p>

      {/* Score Grid Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-3 pt-space-4 border-t-2 border-color-6">
        <div className="p-space-3 bg-color-6 rounded-2xl border border-color-1/30">
          <div className="text-text-xs font-bold text-color-1/60 flex items-center justify-center gap-1">
            <Award className="w-4 h-4 text-color-2" /> Điểm số
          </div>
          <div className="text-text-xl font-bold text-color-2 mt-1">
            {totalScore.toFixed(1)}/10
          </div>
        </div>

        <div className="p-space-3 bg-color-6 rounded-2xl border border-color-1/30">
          <div className="text-text-xs font-bold text-color-1/60">Tỷ lệ chính xác</div>
          <div
            className={`text-text-xl font-bold mt-1 ${
              isPassed ? "text-color-3" : "text-color-4"
            }`}
          >
            {percentageScore.toFixed(1)}%
          </div>
        </div>

        <div className="p-space-3 bg-color-6 rounded-2xl border border-color-1/30">
          <div className="text-text-xs font-bold text-color-1/60 flex items-center justify-center gap-1">
            <HelpCircle className="w-4 h-4 text-color-5" /> Số câu đúng
          </div>
          <div className="text-text-xl font-bold text-color-1 mt-1">
            {correctCount}/{totalQuestions}
          </div>
        </div>

        <div className="p-space-3 bg-color-6 rounded-2xl border border-color-1/30">
          <div className="text-text-xs font-bold text-color-1/60 flex items-center justify-center gap-1">
            <Clock className="w-4 h-4 text-color-1" /> Thời gian làm
          </div>
          <div className="text-text-xl font-bold text-color-1 mt-1">
            {minutes}p {seconds}s
          </div>
        </div>
      </div>
    </Card>
  );
};
