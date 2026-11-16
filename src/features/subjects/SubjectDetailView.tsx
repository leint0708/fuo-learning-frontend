import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  Sliders,
  RotateCcw,
  Play,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CustomExamModal } from "./CustomExamModal";
import { SubjectPracticeActions } from "./SubjectPracticeActions";
import { ActiveExamsSection } from "./ActiveExamsSection";
import { getSubject, getSubjectExams } from "@/api/subjects";
import { getErrorMessage } from "@/utils/error";
import { getSubjectLocalProgress } from "@/utils/practiceProgress";

export const SubjectDetailView: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);
  const [isCustomExamMode, setIsCustomExamMode] = useState<boolean>(true);
  const [fixedExamQuestions, setFixedExamQuestions] = useState<number>(50);
  const [selectedExamDuration, setSelectedExamDuration] = useState<number | undefined>(undefined);

  const subjectCode = code || "MAD101";

  const {
    data: subject,
    isLoading: isSubjectLoading,
    isError: isSubjectError,
    error: subjectError,
    refetch: refetchSubject,
  } = useQuery({
    queryKey: ["subject", subjectCode],
    queryFn: () => getSubject(subjectCode),
  });

  const {
    data: exams,
    isLoading: isExamsLoading,
    error: examsError,
    refetch: refetchExams,
  } = useQuery({
    queryKey: ["subjectExams", subjectCode],
    queryFn: () => getSubjectExams(subjectCode),
  });

  useEffect(() => {
    document.title = `${subjectCode} - ${subject?.title || "Ngân hàng đề thi"} | FUO Learning`;
  }, [subjectCode, subject?.title]);

  // Calculate total questions available in the subject question bank
  const totalBankQuestions =
    exams && exams.length > 0
      ? exams.reduce((sum, e) => sum + e.totalQuestions, 0)
      : 0;

  const { cramCount: cramMasteredCount, learnCount: learnGraduatedCount } =
    React.useMemo(() => getSubjectLocalProgress(subjectCode), [subjectCode]);

  const handleOpenNewCustomExam = () => {
    setSelectedExamId(undefined);
    setIsCustomExamMode(true);
    setSelectedExamDuration(undefined);
    setIsCustomModalOpen(true);
  };

  const handleOpenStandardExam = (
    examId: string,
    questionsCount: number,
    durationMinutes?: number
  ) => {
    setSelectedExamId(examId);
    setIsCustomExamMode(false);
    setFixedExamQuestions(questionsCount);
    setSelectedExamDuration(durationMinutes);
    setIsCustomModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-space-4 sm:px-space-5 py-space-6 flex flex-col gap-space-6">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="min-h-11 inline-flex items-center gap-space-2 text-text-xs font-bold text-color-1 hover:text-color-2 px-space-3 py-space-1 rounded-full border-2 border-color-1 bg-color-7 shadow-xs transition-all outline-none focus-visible:ring-4 focus-visible:ring-color-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách môn học</span>
        </Link>
      </div>

      {/* Non-blocking alert if subject metadata failed to load */}
      {isSubjectError && !isSubjectLoading && (
        <div
          role="alert"
          className="p-space-3 rounded-2xl bg-color-4/15 border-2 border-color-4 text-color-1 flex flex-wrap items-center justify-between gap-space-2"
        >
          <span className="text-text-xs font-bold">
            {getErrorMessage(subjectError, "Không thể tải thông tin chi tiết môn học.")}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void refetchSubject();
            }}
            className="min-h-11 inline-flex items-center gap-space-1 shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* Subject Hero Header */}
      <Card
        data-impeccable-ignore="hard-offset-shadow"
        className="p-space-4 sm:p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-4 sm:gap-space-5"
      >
        <div className="space-y-space-2 min-w-0">
          <div className="flex flex-wrap items-center gap-space-2">
            <span className="text-text-xl sm:text-text-2xl font-black text-color-1 tracking-tight">
              {subjectCode}
            </span>
            <Badge variant="primary">Ngân hàng đề thi chính thức</Badge>
          </div>
          <h1 className="text-text-lg font-bold text-color-2">
            {subject?.title || (isSubjectLoading ? "Đang tải dữ liệu môn học..." : subjectCode)}
          </h1>
          <p className="text-text-xs text-color-1/75 max-w-2xl leading-relaxed">
            {subject?.description ||
              "Hệ thống tổng hợp các đề thi thử và đề thi học kỳ chuẩn Đại học FPT."}
          </p>
        </div>

        {/* Quick Meta Counters */}
        <div className="shrink-0 w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center justify-around md:justify-start gap-space-3 bg-color-6/40 border-2 border-color-1 rounded-3xl p-space-3 shadow-xs">
          <div className="flex items-center gap-space-2 px-space-2">
            <BookOpen className="w-4 h-4 text-color-2" />
            <div className="text-left">
              <div className="text-text-2xs uppercase tracking-wider text-color-1/60 font-bold">
                Số bộ đề
              </div>
              <div className="text-text-sm font-black text-color-1 tabular-nums">
                {exams?.length || 0}
              </div>
            </div>
          </div>
          <div className="w-px h-8 bg-color-1/20" />
          <div className="flex items-center gap-space-2 px-space-2">
            <HelpCircle className="w-4 h-4 text-color-2" />
            <div className="text-left">
              <div className="text-text-2xs uppercase tracking-wider text-color-1/60 font-bold">
                Tổng câu hỏi
              </div>
              <div className="text-text-sm font-black text-color-1 tabular-nums">
                {totalBankQuestions}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <ActiveExamsSection subjectCode={subjectCode} />

      {/* Section 1: Smart Practice Hub */}
      <section className="flex flex-col gap-space-3">
        <div>
          <div className="flex items-center gap-space-2">
            <Sparkles className="w-5 h-5 text-color-5 fill-color-5" />
            <h2 className="text-text-lg font-bold text-color-1">
              Trung tâm Luyện tập &amp; Ghi nhớ
            </h2>
          </div>
          <p className="text-text-xs text-color-1/70 mt-0.5">
            Phương pháp ôn luyện chủ động: Vòng lặp cấp tốc 10 câu (Cram) hoặc Trí nhớ ngắt quãng Leitner (Learn).
          </p>
        </div>

        <SubjectPracticeActions
          subjectCode={subjectCode}
          totalBankQuestions={totalBankQuestions}
          cramMasteredCount={cramMasteredCount}
          learnGraduatedCount={learnGraduatedCount}
        />
      </section>

      {/* Section 2: Semester Exams Hub */}
      <section className="flex flex-col gap-space-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-3">
          <div>
            <h2 className="text-text-lg font-bold text-color-1">
              Ngân hàng Đề thi Học kỳ
            </h2>
            <p className="text-text-xs text-color-1/70 mt-0.5">
              Các bộ đề thi chuẩn định dạng FE/PE. Nhấn &ldquo;Vào thi&rdquo; để tùy chỉnh thời gian, chế độ và bắt đầu làm bài.
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={handleOpenNewCustomExam}
            aria-label="Tùy chỉnh đề thi tự do từ ngân hàng câu hỏi"
            className="flex items-center justify-center gap-space-2 self-start sm:self-auto shrink-0 border-2 border-color-1 shadow-xs hover:shadow-sm"
          >
            <Sliders className="w-4 h-4" />
            <span>Tùy chỉnh đề thi</span>
          </Button>
        </div>

        {isExamsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 bg-color-7 border-2 border-color-1 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : examsError ? (
          <div
            role="alert"
            className="text-center p-space-6 bg-color-7 border-2 border-color-4 text-color-1 rounded-3xl font-bold flex flex-col items-center gap-space-3 shadow-sm"
          >
            <p className="text-color-1 text-text-sm">
              {getErrorMessage(
                examsError,
                "Không thể tải danh sách đề thi. Vui lòng thử lại sau."
              )}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchExams()}
              className="flex items-center gap-space-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử tải lại</span>
            </Button>
          </div>
        ) : !exams || exams.length === 0 ? (
          <Card
            data-impeccable-ignore="hard-offset-shadow"
            className="p-space-5 sm:p-space-6 text-center bg-color-7 border-2 border-color-1 shadow-sm"
          >
            <p className="text-text-sm font-bold text-color-1/75 mb-space-3">
              Chưa có đề thi chuẩn cho môn này.
            </p>
            <Button variant="primary" onClick={handleOpenNewCustomExam}>
              Tạo đề thi ngẫu nhiên từ ngân hàng câu hỏi
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
            {exams.map((exam) => (
              <Card
                key={exam.id}
                data-impeccable-ignore="hard-offset-shadow"
                className="p-space-5 flex flex-col justify-between bg-color-7 border-2 border-color-1 shadow-sm hover:border-color-2 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-space-2 mb-space-2">
                    <h3 className="font-bold text-text-base text-color-1">{exam.code}</h3>
                    <Badge variant="neutral">Điểm đạt: {exam.passingScorePercentage}%</Badge>
                  </div>
                  <p className="text-text-xs text-color-1/75 mb-space-4 leading-relaxed font-medium">
                    {exam.title}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-space-3 pt-space-3 border-t-2 border-color-6">
                  {/* Meta Specs */}
                  <div className="flex items-center gap-space-4 text-text-xs font-bold text-color-1/80 tabular-nums">
                    <span className="flex items-center gap-space-1">
                      <HelpCircle className="w-4 h-4 text-color-2" />
                      {exam.totalQuestions} câu
                    </span>
                    <span className="flex items-center gap-space-1">
                      <Clock className="w-4 h-4 text-color-2" />
                      {exam.durationMinutes} phút
                    </span>
                  </div>

                  {/* Single Vào thi Entry Launching Config Modal */}
                  <div className="flex items-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleOpenStandardExam(
                          exam.id,
                          exam.totalQuestions,
                          exam.durationMinutes
                        )
                      }
                      aria-label={`Vào thi đề ${exam.code} - ${exam.title}`}
                      className="min-h-11 flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Vào thi</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Custom Exam Configuration Modal */}
      <CustomExamModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        subjectCode={subjectCode}
        defaultExamId={selectedExamId || exams?.[0]?.id}
        maxAvailableQuestions={totalBankQuestions}
        isCustomExam={isCustomExamMode}
        fixedQuestionCount={fixedExamQuestions}
        defaultDurationMinutes={selectedExamDuration}
      />
    </div>
  );
};
