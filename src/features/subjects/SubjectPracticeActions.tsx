import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-space-3 ${className}`}>
      {/* Cram Mode Action */}
      <div className="flex flex-col gap-1">
        <Button
          variant="primary"
          size="md"
          disabled={isDisabled}
          onClick={handleCramClick}
          className="flex items-center justify-center gap-2 border-2 border-color-1 shadow-xs hover:shadow-sm"
          aria-label="Luyện thi cấp tốc"
        >
          <Zap className="w-4 h-4 text-color-5" />
          <span>Luyện thi cấp tốc</span>
        </Button>
        <span className="text-text-xs font-bold text-color-1/70 text-center">
          {isDisabled
            ? "Chưa có câu hỏi luyện tập"
            : `${cramMasteredCount}/${totalBankQuestions} câu đã thuộc`}
        </span>
      </div>

      {/* Learn Mode Action */}
      <div className="flex flex-col gap-1">
        <Button
          variant="accent"
          size="md"
          disabled={isDisabled}
          onClick={handleLearnClick}
          className="flex items-center justify-center gap-2 border-2 border-color-1 shadow-xs hover:shadow-sm"
          aria-label="Học ghi nhớ"
        >
          <Brain className="w-4 h-4 text-color-2" />
          <span>Học ghi nhớ</span>
        </Button>
        <span className="text-text-xs font-bold text-color-1/70 text-center">
          {isDisabled
            ? "Chưa có câu hỏi luyện tập"
            : `${learnGraduatedCount}/${totalBankQuestions} câu thành thạo`}
        </span>
      </div>
    </div>
  );
};
