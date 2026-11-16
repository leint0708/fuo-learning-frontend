import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getActiveExams,
  removeActiveExam,
  type ActiveExamRecord,
} from "@/utils/activeExams";

export interface ActiveExamsSectionProps {
  subjectCode?: string;
}

function formatRemainingTime(expiresAt: string | null): string {
  if (!expiresAt) return "Không giới hạn";
  const diffMs = Date.parse(expiresAt) - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) return "Sắp hết giờ";
  const totalMinutes = Math.ceil(diffMs / 60000);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `Còn ~${hours}g ${mins}p` : `Còn ~${hours}g`;
  }
  return `Còn ~${totalMinutes} phút`;
}

/**
 * Displays in-progress exam attempts left mid-session so students can resume directly
 * from either the Subject Catalog (/) or Subject Detail (/subjects/:code).
 */
export const ActiveExamsSection: React.FC<ActiveExamsSectionProps> = ({ subjectCode }) => {
  const [activeExams, setActiveExams] = useState<ActiveExamRecord[]>(() =>
    getActiveExams(subjectCode)
  );
  const [, setTimeTick] = useState(0);

  useEffect(() => {
    setActiveExams(getActiveExams(subjectCode));
  }, [subjectCode]);

  useEffect(() => {
    if (activeExams.length === 0) return;
    const timerId = window.setInterval(() => {
      setTimeTick((prev) => prev + 1);
    }, 30000);
    return () => window.clearInterval(timerId);
  }, [activeExams.length]);

  if (activeExams.length === 0) {
    return null;
  }

  const handleDismiss = (attemptId: string) => {
    removeActiveExam(attemptId);
    setActiveExams(getActiveExams(subjectCode));
  };

  return (
    <section
      aria-label="Bài thi đang làm dở"
      className="flex flex-col gap-space-3"
    >
      <div className="flex items-center justify-between gap-space-2">
        <div className="flex items-center gap-space-2">
          <Clock className="w-5 h-5 text-color-2" aria-hidden="true" />
          <h2 className="text-text-base sm:text-text-lg font-bold text-color-1">
            Bài thi đang làm dở
          </h2>
        </div>
        <span className="text-text-xs font-bold text-color-1/80 tabular-nums">
          {activeExams.length} bài thi
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-3">
        {activeExams.map((exam) => (
          <Card
            key={exam.attemptId}
            className="p-space-4 bg-color-5/20 border-2 border-color-1 rounded-3xl shadow-xs flex flex-col justify-between gap-space-3"
          >
            <div className="flex items-start justify-between gap-space-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-space-2 mb-space-1">
                  {exam.subjectCode && (
                    <Badge variant="primary">{exam.subjectCode}</Badge>
                  )}
                  <Badge variant={exam.feedbackMode === "instant" ? "success" : "default"}>
                    {exam.feedbackMode === "instant" ? "Chấm tức thì" : "Thi chuẩn"}
                  </Badge>
                </div>
                <h3 className="text-text-sm sm:text-text-base font-bold text-color-1 truncate">
                  {exam.examTitle}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleDismiss(exam.attemptId)}
                aria-label={`Ẩn bài thi ${exam.examTitle} khỏi danh sách đang làm`}
                title="Bỏ qua bài thi này"
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full text-color-1 hover:bg-color-7 border border-transparent hover:border-color-1 transition-colors cursor-pointer shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-color-5"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-space-2 pt-space-2 border-t border-color-1/30">
              <div className="flex flex-wrap items-center gap-space-3 text-text-xs font-bold text-color-1 tabular-nums">
                <span>
                  Đã làm {exam.answeredCount}/{exam.totalQuestions} câu
                </span>
                <span>{formatRemainingTime(exam.expiresAt)}</span>
              </div>

              <Link
                to={`/attempts/${exam.attemptId}`}
                className="min-h-11 px-space-4 py-space-2 rounded-full bg-color-2 text-color-7 border-2 border-color-1 font-bold text-text-xs inline-flex items-center gap-space-1 shadow-xs hover:bg-color-2/90 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-color-5"
              >
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>Tiếp tục làm bài</span>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
