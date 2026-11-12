import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Award } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Subject } from "@/types/catalog";

export interface SubjectCardProps {
  subject: Subject;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const navigate = useNavigate();

  return (
    <Card
      interactive
      onClick={() => navigate(`/subjects/${subject.code}`)}
      className="flex flex-col justify-between h-full bg-color-7 border-2 border-color-1 shadow-sm hover:border-color-2 transition-all p-space-5"
    >
      <div>
        <div className="flex items-center justify-between gap-space-2 mb-space-3">
          <div className="w-12 h-12 rounded-full bg-color-2/10 text-color-2 flex items-center justify-center border-2 border-color-1 shadow-xs shrink-0 font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <Badge variant="primary" className="text-text-xs">
            {subject.totalExams} bộ đề thi
          </Badge>
        </div>

        <h3 className="text-text-lg font-bold text-color-1 mb-1">{subject.code}</h3>
        <p className="text-text-sm font-bold text-color-2 mb-space-2">{subject.title}</p>
        <p className="text-text-xs text-color-1/70 line-clamp-2 mb-space-4">
          {subject.description || "Tài liệu và ngân hàng câu hỏi ôn thi chi tiết."}
        </p>
      </div>

      <div className="pt-space-3 border-t-2 border-color-6 flex items-center justify-between mt-auto">
        <span className="text-text-xs font-bold text-color-1/60 flex items-center gap-1">
          <Award className="w-4 h-4 text-color-5" /> Chuẩn ngân hàng đề
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/subjects/${subject.code}`);
          }}
          className="group"
        >
          <span>Xem đề thi</span>
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};
