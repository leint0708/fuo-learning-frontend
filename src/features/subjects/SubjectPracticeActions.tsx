import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Brain, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface SubjectPracticeActionsProps {
  subjectCode: string;
  totalBankQuestions: number;
  cramMasteredCount?: number;
  learnGraduatedCount?: number;
  onLaunchCram?: () => void;
  onLaunchLearn?: () => void;
  className?: string;
}

export const SubjectPracticeActions: React.FC<SubjectPracticeActionsProps> = ({
  subjectCode,
  totalBankQuestions,
  cramMasteredCount = 0,
  learnGraduatedCount = 0,
  onLaunchCram,
  onLaunchLearn,
  className = "",
}) => {
  const navigate = useNavigate();
  const isDisabled = totalBankQuestions <= 0;

  const cramPercentage =
    totalBankQuestions > 0
      ? Math.min(100, Math.round((cramMasteredCount / totalBankQuestions) * 100))
      : 0;

  const learnPercentage =
    totalBankQuestions > 0
      ? Math.min(100, Math.round((learnGraduatedCount / totalBankQuestions) * 100))
      : 0;

  const handleCramClick = () => {
    if (onLaunchCram) {
      onLaunchCram();
    } else {
      navigate(`/subjects/${encodeURIComponent(subjectCode)}/practice/cram`);
    }
  };

  const handleLearnClick = () => {
    if (onLaunchLearn) {
      onLaunchLearn();
    } else {
      navigate(`/subjects/${encodeURIComponent(subjectCode)}/practice/learn`);
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-space-4 ${className}`}>
      {/* Cram Mode Card */}
      <Card
        data-impeccable-ignore="hard-offset-shadow"
        className="p-space-5 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-space-2 mb-space-3">
            <div className="w-10 h-10 rounded-full bg-color-5/20 border-2 border-color-1 flex items-center justify-center text-color-1 shadow-xs shrink-0">
              <Zap className="w-5 h-5 text-color-5 fill-color-5" />
            </div>
            <Badge variant="warning">Ôn tập siêu tốc</Badge>
          </div>

          <h3 className="text-text-base font-bold text-color-1 mb-space-1">
            Luyện thi cấp tốc
          </h3>
          <p className="text-text-xs text-color-1/75 mb-space-4 leading-relaxed font-medium">
            Chia câu hỏi thành nhóm 10 câu, lặp lại liên tục cho đến khi bạn thuộc 100% không còn lỗi sai nào.
          </p>
        </div>

        <div className="pt-space-3 border-t-2 border-color-6 mt-auto flex flex-col gap-space-3">
          {/* Progress metric */}
          <div>
            <div className="flex justify-between items-center text-text-xs font-bold text-color-1 mb-space-1">
              <span id={`cram-status-${subjectCode}`}>
                {isDisabled
                  ? "Chưa có câu hỏi luyện tập"
                  : `${cramMasteredCount}/${totalBankQuestions} câu đã thuộc`}
              </span>
              <span className="tabular-nums text-color-2">{cramPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-color-6 border border-color-1/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-color-5 transition-all duration-300"
                style={{ width: `${cramPercentage}%` }}
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={isDisabled}
            onClick={handleCramClick}
            aria-label="Luyện thi cấp tốc"
            aria-describedby={`cram-status-${subjectCode}`}
            className="w-full flex items-center justify-center gap-space-2 shadow-xs hover:shadow-sm"
          >
            <Zap className="w-4 h-4 text-color-5 fill-color-5" />
            <span>Bắt đầu luyện ngay</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>
      </Card>

      {/* Learn Mode Card */}
      <Card
        data-impeccable-ignore="hard-offset-shadow"
        className="p-space-5 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between gap-space-2 mb-space-3">
            <div className="w-10 h-10 rounded-full bg-color-3/20 border-2 border-color-1 flex items-center justify-center text-color-3 shadow-xs shrink-0">
              <Brain className="w-5 h-5 text-color-3" />
            </div>
            <Badge variant="success">Khoa học Leitner</Badge>
          </div>

          <h3 className="text-text-base font-bold text-color-1 mb-space-1">
            Học ghi nhớ
          </h3>
          <p className="text-text-xs text-color-1/75 mb-space-4 leading-relaxed font-medium">
            Hàng đợi 7 câu hỏi thích ứng theo trí nhớ làm việc. Tự động lặp lại ngắt quãng để ghi nhớ sâu sắc bền vững.
          </p>
        </div>

        <div className="pt-space-3 border-t-2 border-color-6 mt-auto flex flex-col gap-space-3">
          {/* Progress metric */}
          <div>
            <div className="flex justify-between items-center text-text-xs font-bold text-color-1 mb-space-1">
              <span id={`learn-status-${subjectCode}`}>
                {isDisabled
                  ? "Chưa có câu hỏi luyện tập"
                  : `${learnGraduatedCount}/${totalBankQuestions} câu thành thạo`}
              </span>
              <span className="tabular-nums text-color-3">{learnPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-color-6 border border-color-1/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-color-3 transition-all duration-300"
                style={{ width: `${learnPercentage}%` }}
              />
            </div>
          </div>

          <Button
            variant="accent"
            size="md"
            disabled={isDisabled}
            onClick={handleLearnClick}
            aria-label="Học ghi nhớ"
            aria-describedby={`learn-status-${subjectCode}`}
            className="w-full flex items-center justify-center gap-space-2 shadow-xs hover:shadow-sm"
          >
            <Brain className="w-4 h-4 text-color-7" />
            <span>Bắt đầu học ngay</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
