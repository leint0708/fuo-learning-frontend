import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, HelpCircle, Sliders } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CustomExamModal } from "./CustomExamModal";
import { getSubject, getSubjectExams } from "@/api/subjects";

export const SubjectDetailView: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);
  const [selectedExamMaxQuestions, setSelectedExamMaxQuestions] = useState<number>(50);

  const subjectCode = code || "MAD101";

  const { data: subject, isLoading: isSubjectLoading } = useQuery({
    queryKey: ["subject", subjectCode],
    queryFn: () => getSubject(subjectCode),
  });

  const { data: exams, isLoading: isExamsLoading } = useQuery({
    queryKey: ["subjectExams", subjectCode],
    queryFn: () => getSubjectExams(subjectCode),
  });

  const handleOpenConfigForExam = (examId?: string, maxQuestions?: number) => {
    setSelectedExamId(examId);
    if (maxQuestions) setSelectedExamMaxQuestions(maxQuestions);
    setIsCustomModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-space-4 sm:px-space-5 py-space-6 flex flex-col gap-space-6">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-xs font-bold text-color-1 hover:text-color-2 px-space-3 py-1 rounded-full border-2 border-color-1 bg-color-7 shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách môn học</span>
        </Link>
      </div>

      {/* Header Info Banner */}
      <Card className="p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-5">
        <div>
          <div className="flex items-center gap-space-2 mb-space-2">
            <h1 className="text-text-xl font-bold text-color-1">{subjectCode}</h1>
            <Badge variant="primary">Ngân hàng đề thi chính thức</Badge>
          </div>
          <h2 className="text-text-lg font-bold text-color-2 mb-space-2">
            {subject?.title || (isSubjectLoading ? "Đang tải..." : subjectCode)}
          </h2>
          <p className="text-text-xs text-color-1/70 max-w-2xl">
            {subject?.description || "Hệ thống tổng hợp các đề thi thử và đề thi học kỳ."}
          </p>
        </div>

        {/* Custom Exam Action */}
        <div className="shrink-0">
          <Button
            variant="accent"
            size="lg"
            onClick={() => handleOpenConfigForExam(exams?.[0]?.id, exams?.[0]?.totalQuestions || 50)}
            className="w-full md:w-auto flex items-center justify-center gap-space-2"
          >
            <Sliders className="w-5 h-5" />
            <span>Tùy chỉnh đề luyện thi mới</span>
          </Button>
        </div>
      </Card>

      {/* Exams List */}
      <div>
        <div className="flex justify-between items-center mb-space-4">
          <h3 className="text-text-lg font-bold text-color-1">Đề thi chuẩn học kỳ</h3>
          <span className="text-text-xs font-bold text-color-1/60">
            {exams?.length || 0} bộ đề khả dụng
          </span>
        </div>

        {isExamsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 bg-color-7 border-2 border-color-1 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : !exams || exams.length === 0 ? (
          <Card className="p-space-8 text-center bg-color-7 border-2 border-color-1 shadow-sm">
            <p className="text-text-sm font-bold text-color-1/70 mb-space-3">
              Chưa có đề thi chuẩn cho môn này.
            </p>
            <Button variant="primary" onClick={() => setIsCustomModalOpen(true)}>
              Tạo đề thi ngẫu nhiên từ ngân hàng câu hỏi
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
            {exams.map((exam) => (
              <Card
                key={exam.id}
                className="p-space-5 flex flex-col justify-between bg-color-7 border-2 border-color-1 shadow-sm hover:border-color-2 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-space-2 mb-space-2">
                    <h4 className="font-bold text-text-base text-color-1">{exam.code}</h4>
                    <Badge variant="neutral">Điểm đạt: {exam.passingScorePercentage}%</Badge>
                  </div>
                  <p className="text-text-xs text-color-1/70 mb-space-4">{exam.title}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-space-2 pt-space-3 border-t-2 border-color-6">
                  <div className="flex items-center gap-space-4 text-text-xs font-bold text-color-1/70">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-4 h-4 text-color-2" />
                      {exam.totalQuestions} câu
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-color-5" />
                      {exam.durationMinutes} phút
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenConfigForExam(exam.id, exam.totalQuestions)}
                    className="flex items-center gap-1"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Làm bài</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Custom Exam Configuration Modal */}
      <CustomExamModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        subjectCode={subjectCode}
        defaultExamId={selectedExamId || exams?.[0]?.id}
        maxAvailableQuestions={selectedExamMaxQuestions}
      />
    </div>
  );
};
