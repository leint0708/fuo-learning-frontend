import React from "react";
import { CheckCircle2, Sparkles, AlertCircle, BookOpen, Layers } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { CramSessionEndReason, CramSessionScope } from "@/types/practice";

export interface CramReviewSummaryCardProps {
  subjectCode: string;
  endReason: CramSessionEndReason;
  scope: CramSessionScope;
  totalPracticed: number;
  firstTryCorrectCount: number;
  hadMistakesCount: number;
  masteredInSessionCount: number;
  cumulativeMasteredCount: number;
  totalDeckSize: number;
  completedAt: string;
}

function formatCompletedTime(iso?: string): string {
  if (!iso) return "Vừa xong";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Vừa xong";
  return parsed.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const CramReviewSummaryCard: React.FC<CramReviewSummaryCardProps> = ({
  subjectCode,
  endReason,
  scope,
  totalPracticed,
  firstTryCorrectCount,
  hadMistakesCount,
  masteredInSessionCount,
  cumulativeMasteredCount,
  totalDeckSize,
  completedAt,
}) => {
  const firstTryPercent =
    totalPracticed > 0 ? Math.round((firstTryCorrectCount / totalPracticed) * 100) : 0;
  const normalizedDeckTotal = Math.max(totalDeckSize, cumulativeMasteredCount, totalPracticed, 1);
  const hasZeroMistakes = hadMistakesCount === 0 && totalPracticed > 0;

  const badgeLabel =
    endReason === "completed"
      ? scope === "mistakes"
        ? "HOÀN THÀNH ÔN CÂU TỪNG SAI"
        : "HOÀN THÀNH PHIÊN CẤP TỐC"
      : endReason === "batch_stop"
        ? "HOÀN THÀNH ĐỢT ÔN TẬP"
        : "TỔNG KẾT PHIÊN ÔN TẬP";

  const headline =
    scope === "mistakes"
      ? `Ôn lại câu từng sai — ${subjectCode}`
      : `Tổng kết phiên luyện cấp tốc — ${subjectCode}`;

  const summaryText = hasZeroMistakes
    ? `Xuất sắc! Bạn vượt qua toàn bộ ${totalPracticed} câu trong phiên mà không mắc lỗi nào (ghi nhận lúc ${formatCompletedTime(completedAt)}).`
    : `Bạn đã luyện ${totalPracticed} câu trong phiên này (${masteredInSessionCount} câu đã thuộc, ${hadMistakesCount} câu từng sai cần chú ý • lúc ${formatCompletedTime(completedAt)}).`;

  return (
    <Card className="p-space-4 md:p-space-5 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm text-center w-full">
      {/* Hero Icon */}
      <div className="inline-flex items-center justify-center mb-space-2">
        {hasZeroMistakes ? (
          <div className="w-16 h-16 rounded-full bg-color-3/15 text-color-3 flex items-center justify-center border-2 border-color-3 shadow-xs">
            <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-color-5/25 text-color-1 flex items-center justify-center border-2 border-color-1 shadow-xs">
            <Sparkles className="w-9 h-9 text-color-2" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-space-2">
        <Badge
          variant={hasZeroMistakes ? "success" : "primary"}
          className="text-text-xs sm:text-text-sm px-space-3 sm:px-space-4 py-1 text-center"
        >
          {badgeLabel}
        </Badge>
      </div>

      <h1 className="text-text-lg sm:text-text-xl font-bold text-color-1 mb-space-1 text-balance">
        {headline}
      </h1>
      <p className="text-text-xs sm:text-text-sm text-color-1/80 mb-space-4 max-w-2xl mx-auto">
        {summaryText}
      </p>

      {/* 4-Column Responsive KPI Strip (matches ResultScoreCard 2-col -> 4-col @md) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-2 sm:gap-space-3 pt-space-4 border-t-2 border-color-6 tabular-nums">
        <div className="p-space-2 sm:p-space-3 bg-color-6 rounded-2xl border-2 border-color-1/15 min-w-0">
          <div className="text-text-xs font-bold text-color-1/80 flex items-center justify-center gap-space-1">
            <BookOpen className="w-4 h-4 text-color-2 shrink-0" aria-hidden="true" />
            <span>Đã ôn trong phiên</span>
          </div>
          <div className="text-text-lg sm:text-text-xl font-bold text-color-2 mt-space-1">
            {totalPracticed} câu
          </div>
        </div>

        <div className="p-space-2 sm:p-space-3 bg-color-6 rounded-2xl border-2 border-color-1/15 min-w-0">
          <div className="text-text-xs font-bold text-color-1/80 flex items-center justify-center gap-space-1">
            <CheckCircle2 className="w-4 h-4 text-color-3 shrink-0" aria-hidden="true" />
            <span>Đúng ngay lần đầu</span>
          </div>
          <div className="text-text-lg sm:text-text-xl font-bold text-color-3 mt-space-1">
            {firstTryCorrectCount}/{totalPracticed} ({firstTryPercent}%)
          </div>
        </div>

        <div className="p-space-2 sm:p-space-3 bg-color-6 rounded-2xl border-2 border-color-1/15 min-w-0">
          <div className="text-text-xs font-bold text-color-1/80 flex items-center justify-center gap-space-1">
            <AlertCircle className="w-4 h-4 text-color-4 shrink-0" aria-hidden="true" />
            <span>Từng làm sai</span>
          </div>
          <div className="text-text-lg sm:text-text-xl font-bold text-color-1 mt-space-1">
            {hadMistakesCount} câu
          </div>
        </div>

        <div className="p-space-2 sm:p-space-3 bg-color-6 rounded-2xl border-2 border-color-1/15 min-w-0">
          <div className="text-text-xs font-bold text-color-1/80 flex items-center justify-center gap-space-1">
            <Layers className="w-4 h-4 text-color-1 shrink-0" aria-hidden="true" />
            <span>Tiến độ tổng môn</span>
          </div>
          <div className="text-text-lg sm:text-text-xl font-bold text-color-1 mt-space-1">
            {cumulativeMasteredCount}/{normalizedDeckTotal}
          </div>
        </div>
      </div>
    </Card>
  );
};
