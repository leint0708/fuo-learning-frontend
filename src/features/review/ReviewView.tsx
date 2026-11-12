import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResultScoreCard } from "./ResultScoreCard";
import { QuestionReviewItem } from "./QuestionReviewItem";
import { getAttemptReview } from "@/api/attempts";

export const ReviewView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<"all" | "correct" | "incorrect">("all");

  const safeAttemptId = attemptId || "att_mock_100";

  const { data: review, isLoading, error } = useQuery({
    queryKey: ["attemptReview", safeAttemptId],
    queryFn: () => getAttemptReview(safeAttemptId),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-color-6">
        <div className="flex flex-col items-center gap-space-3 p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm">
          <div className="w-10 h-10 border-4 border-color-2 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-text-sm text-color-1">Đang tính điểm và tổng hợp kết quả...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex-1 flex items-center justify-center p-space-4">
        <div className="max-w-md p-space-6 bg-color-7 border-2 border-color-4 text-center rounded-3xl shadow-sm">
          <h3 className="text-text-lg font-bold text-color-4 mb-2">Không tìm thấy kết quả</h3>
          <p className="text-text-xs text-color-1/70 mb-space-4">
            Bài thi chưa hoàn thành hoặc kết quả không tồn tại.
          </p>
          <Button variant="primary" onClick={() => navigate("/")}>
            Quay về danh sách môn học
          </Button>
        </div>
      </div>
    );
  }

  const questions = review.questions || [];
  const totalQuestions = questions.length;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const percentageScore = review.percentageScore ?? (totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0);
  const totalScore = (percentageScore / 100) * 10;
  const isPassed = review.isPassed ?? percentageScore >= 70.0;

  const filteredQuestions = questions.filter((q) => {
    if (filterMode === "correct") return q.isCorrect;
    if (filterMode === "incorrect") return !q.isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto w-full px-space-3 sm:px-space-5 py-space-6 flex flex-col gap-space-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-xs font-bold text-color-1 hover:text-color-2 px-space-3 py-1 rounded-full border-2 border-color-1 bg-color-7 shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về danh sách môn học</span>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Luyện lại đề này</span>
        </Button>
      </div>

      {/* Main Score Card Banner */}
      <ResultScoreCard
        examTitle={review.examTitle}
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        percentageScore={percentageScore}
        totalScore={totalScore}
        isPassed={isPassed}
        durationSeconds={1250}
      />

      {/* Filter Tabs & Review List */}
      <div className="space-y-space-4">
        <div className="flex flex-wrap items-center justify-between gap-space-3 pt-space-2">
          <h3 className="text-text-lg font-bold text-color-1">Xem lại câu hỏi và lời giải</h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-space-1 bg-color-7 p-1 border-2 border-color-1 rounded-full shadow-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-space-3 py-1 rounded-full text-text-xs font-bold transition-all ${
                filterMode === "all"
                  ? "bg-color-2 text-color-7 shadow-xs"
                  : "text-color-1 hover:bg-color-6"
              }`}
            >
              Tất cả ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("correct")}
              className={`px-space-3 py-1 rounded-full text-text-xs font-bold transition-all flex items-center gap-1 ${
                filterMode === "correct"
                  ? "bg-color-3 text-color-7 shadow-xs"
                  : "text-color-3 hover:bg-color-6"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đúng ({correctCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("incorrect")}
              className={`px-space-3 py-1 rounded-full text-text-xs font-bold transition-all flex items-center gap-1 ${
                filterMode === "incorrect"
                  ? "bg-color-4 text-color-7 shadow-xs"
                  : "text-color-4 hover:bg-color-6"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Sai ({totalQuestions - correctCount})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-space-4">
          {filteredQuestions.map((item, idx) => (
            <QuestionReviewItem key={item.questionId || idx} item={item} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};
