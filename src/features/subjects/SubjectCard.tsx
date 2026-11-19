import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CheckCircle2, Layers } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSubjectLocalProgress, type SubjectLocalProgress } from "@/utils/practiceProgress";
import type { Subject } from "@/types/catalog";

export interface SubjectCardProps {
  subject: Subject;
  progress?: SubjectLocalProgress;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, progress }) => {
  const [imgError, setImgError] = useState(false);

  const localProgress = useMemo(
    () => getSubjectLocalProgress(subject.code),
    [subject.code]
  );
  const { cramCount, learnCount, hasProgress } = progress ?? localProgress;

  const progressLabel =
    learnCount >= cramCount && learnCount > 0
      ? `Thành thạo ${learnCount} câu (Learn)`
      : `Đã thuộc ${cramCount} câu (Cram)`;

  const showImage = Boolean(subject.iconUrl) && !imgError;

  return (
    <Link
      to={`/subjects/${encodeURIComponent(subject.code)}`}
      aria-label={`Mở môn ${subject.code} — ${subject.title} (${subject.totalExams} bộ đề thi)`}
      className="group block h-full min-w-0 rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-color-5"
    >
      <Card
        data-impeccable-ignore="hard-offset-shadow"
        className="flex flex-col justify-between h-full min-w-0 p-space-4 sm:p-space-5 transition-all duration-fast group-hover:border-color-2 group-hover:-translate-y-1 group-hover:shadow-md group-active:translate-y-0 group-active:shadow-sm"
      >
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-space-2 mb-space-3">
            <div className="w-12 h-12 rounded-full bg-color-2/10 text-color-2 flex items-center justify-center border-2 border-color-1 shadow-xs shrink-0 overflow-hidden font-black text-text-xs tracking-tight">
              {showImage ? (
                <img
                  src={subject.iconUrl as string}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span aria-hidden="true">{subject.code.slice(0, 3)}</span>
              )}
            </div>
            <Badge
              variant={subject.totalExams > 0 ? "primary" : "neutral"}
              className="text-text-2xs sm:text-text-xs tabular-nums shrink-0"
            >
              {subject.totalExams > 0 ? `${subject.totalExams} bộ đề thi` : "Chưa có đề thi"}
            </Badge>
          </div>

          <h3 className="text-text-lg font-bold text-color-1 mb-space-1 break-words">
            {subject.code}
          </h3>
          <p className="text-text-sm font-bold text-color-2 mb-space-2 line-clamp-2 break-words">
            {subject.title}
          </p>
          <p className="text-text-xs text-color-1/75 line-clamp-2 mb-space-4 break-words">
            {subject.description ||
              "Ngân hàng câu hỏi trắc nghiệm, luyện cấp tốc và thi thử học kỳ."}
          </p>
        </div>

        <div className="pt-space-3 border-t-2 border-color-6 flex flex-wrap items-center justify-between gap-space-2 mt-auto">
          <span
            className={`text-text-xs font-bold flex items-center gap-space-1 min-w-0 ${
              hasProgress ? "text-color-3" : "text-color-1/80"
            }`}
          >
            {hasProgress ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{progressLabel}</span>
              </>
            ) : (
              <>
                <Layers
                  className="w-4 h-4 text-color-2 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">Thi thử · Cram · Learn</span>
              </>
            )}
          </span>

          <span
            data-impeccable-ignore="hard-offset-shadow"
            className="inline-flex items-center justify-center font-bold tracking-wide rounded-full border-2 border-color-1 px-space-3 py-space-1 text-text-xs bg-color-7 text-color-1 shadow-xs group-hover:bg-color-5 transition-colors duration-fast shrink-0"
          >
            <span>Vào ôn tập</span>
            <ChevronRight
              className="w-4 h-4 ml-space-1 group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </span>
        </div>
      </Card>
    </Link>
  );
};
