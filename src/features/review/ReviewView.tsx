import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Zap,
  Brain,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AiAnswerModal } from "@/features/exam/AiAnswerModal";
import { ResultScoreCard } from "./ResultScoreCard";
import { QuestionReviewItem } from "./QuestionReviewItem";
import { getAttemptReview } from "@/api/attempts";
import { getErrorMessage } from "@/utils/error";
import { inferSubjectCode } from "@/utils/activeExams";
import type { ReviewQuestionItem as ReviewItemType } from "@/types/review";

type FilterMode = "all" | "correct" | "incorrect";

function parseFilterMode(raw: string | null): FilterMode {
  if (raw === "correct" || raw === "incorrect") return raw;
  return "all";
}

function getReviewCardId(displayNumber: number): string {
  return `review-question-${displayNumber}`;
}

export const ReviewView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filterMode = parseFilterMode(searchParams.get("filter"));
  const [activeQuestionNumber, setActiveQuestionNumber] = useState<number | null>(null);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);
  const [expandSignal, setExpandSignal] = useState<{ version: number; expanded: boolean }>({
    version: 0,
    expanded: false,
  });
  const [aiModalTarget, setAiModalTarget] = useState<{
    item: ReviewItemType;
    displayNumber: number;
  } | null>(null);

  const safeAttemptId = attemptId?.trim() || "";

  const {
    data: review,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["attemptReview", safeAttemptId],
    queryFn: () => getAttemptReview(safeAttemptId),
    enabled: Boolean(safeAttemptId),
  });

  useEffect(() => {
    document.title = `Kết quả: ${review?.examTitle || "Bài thi"} | FUO Learning`;
  }, [review?.examTitle]);

  const setFilterMode = useCallback(
    (nextMode: FilterMode) => {
      const nextParams = new URLSearchParams(searchParams);
      if (nextMode === "all") {
        nextParams.delete("filter");
      } else {
        nextParams.set("filter", nextMode);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const indexedQuestions = useMemo(() => {
    const rawQuestions = review?.questions || [];
    return rawQuestions.map((item, originalIndex) => ({
      item,
      originalIndex,
      displayNumber: item.questionNumber > 0 ? item.questionNumber : originalIndex + 1,
    }));
  }, [review?.questions]);

  const filteredQuestions = useMemo(() => {
    return indexedQuestions.filter(({ item }) => {
      if (filterMode === "correct") return item.isCorrect;
      if (filterMode === "incorrect") return !item.isCorrect;
      return true;
    });
  }, [indexedQuestions, filterMode]);

  const wrongEntries = useMemo(
    () => indexedQuestions.filter(({ item }) => !item.isCorrect),
    [indexedQuestions]
  );

  const hasAnyBreakdown = useMemo(
    () =>
      indexedQuestions.some(
        ({ item }) =>
          Boolean(item.optionByOptionAnalysis) &&
          Object.keys(item.optionByOptionAnalysis || {}).length > 0
      ),
    [indexedQuestions]
  );

  const focusAndScrollToQuestion = useCallback((displayNumber: number) => {
    setActiveQuestionNumber(displayNumber);
    window.requestAnimationFrame(() => {
      const element = document.getElementById(getReviewCardId(displayNumber));
      if (!element) return;
      if (typeof element.scrollIntoView === "function") {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      element.focus({ preventScroll: true });
    });
  }, []);

  const handleSelectQuestionFromMap = useCallback(
    (displayNumber: number, isCorrect: boolean) => {
      const hiddenByFilter =
        (filterMode === "correct" && !isCorrect) ||
        (filterMode === "incorrect" && isCorrect);
      if (hiddenByFilter) {
        setFilterMode("all");
      }
      focusAndScrollToQuestion(displayNumber);
      setIsMobileMapOpen(false);
    },
    [filterMode, setFilterMode, focusAndScrollToQuestion]
  );

  const handleJumpNextIncorrect = useCallback(() => {
    const firstWrong = wrongEntries[0];
    if (!firstWrong) return;

    if (filterMode === "correct") {
      setFilterMode("incorrect");
      focusAndScrollToQuestion(firstWrong.displayNumber);
      return;
    }

    const currentIdx =
      activeQuestionNumber !== null
        ? wrongEntries.findIndex((entry) => entry.displayNumber > activeQuestionNumber)
        : -1;
    const nextEntry = (currentIdx >= 0 ? wrongEntries[currentIdx] : undefined) ?? firstWrong;
    focusAndScrollToQuestion(nextEntry.displayNumber);
  }, [wrongEntries, filterMode, setFilterMode, activeQuestionNumber, focusAndScrollToQuestion]);

  const handleToggleAllBreakdowns = useCallback(() => {
    setExpandSignal((prev) => ({
      version: prev.version + 1,
      expanded: !prev.expanded,
    }));
  }, []);

  // Keyboard shortcuts aligned with FUO's keyboard-first ergonomics
  useEffect(() => {
    if (indexedQuestions.length === 0 || aiModalTarget) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "1") {
        setFilterMode("all");
      } else if (key === "2") {
        setFilterMode("correct");
      } else if (key === "3") {
        setFilterMode("incorrect");
      } else if (key === "n" && wrongEntries.length > 0) {
        event.preventDefault();
        handleJumpNextIncorrect();
      } else if (key === "e" && hasAnyBreakdown) {
        event.preventDefault();
        handleToggleAllBreakdowns();
      } else if ((key === "j" || key === "k") && filteredQuestions.length > 0) {
        event.preventDefault();
        const currentPos = filteredQuestions.findIndex(
          (entry) => entry.displayNumber === activeQuestionNumber
        );
        const nextPos =
          key === "j"
            ? currentPos < 0
              ? 0
              : Math.min(filteredQuestions.length - 1, currentPos + 1)
            : currentPos <= 0
              ? 0
              : currentPos - 1;
        const targetEntry = filteredQuestions[nextPos];
        if (targetEntry) {
          focusAndScrollToQuestion(targetEntry.displayNumber);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    indexedQuestions.length,
    filteredQuestions,
    wrongEntries.length,
    hasAnyBreakdown,
    activeQuestionNumber,
    aiModalTarget,
    setFilterMode,
    handleJumpNextIncorrect,
    handleToggleAllBreakdowns,
    focusAndScrollToQuestion,
  ]);

  if (!safeAttemptId) {
    return (
      <div className="flex-1 flex items-center justify-center p-space-4 bg-color-6">
        <div
          role="alert"
          className="max-w-md w-full p-space-6 bg-color-7 border-2 border-color-4 text-center rounded-3xl shadow-sm space-y-space-3"
        >
          <h1 className="text-text-lg font-bold text-color-1">Liên kết kết quả không hợp lệ</h1>
          <p className="text-text-xs sm:text-text-sm text-color-1/80">
            Không tìm thấy mã lượt thi để hiển thị trang xem lại.
          </p>
          <Button variant="primary" onClick={() => navigate("/")} className="min-h-11">
            Về danh sách môn học
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex-1 flex items-center justify-center p-space-4 bg-color-6"
      >
        <div className="flex flex-col items-center gap-space-3 p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm">
          <div
            aria-hidden="true"
            className="w-10 h-10 border-4 border-color-2 border-t-transparent rounded-full animate-spin"
          />
          <p className="font-bold text-text-sm text-color-1">
            Đang chấm điểm và tổng hợp kết quả bài thi...
          </p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex-1 flex items-center justify-center p-space-4 bg-color-6">
        <div
          role="alert"
          className="max-w-md w-full p-space-6 bg-color-7 border-2 border-color-4 text-center rounded-3xl shadow-sm space-y-space-4"
        >
          <div>
            <h1 className="text-text-lg font-bold text-color-1 mb-space-1">
              Không thể tải kết quả bài thi
            </h1>
            <p className="text-text-xs sm:text-text-sm text-color-1/80">
              {error
                ? getErrorMessage(
                    error,
                    "Bài thi chưa hoàn thành hoặc kết quả hiện không khả dụng."
                  )
                : "Bài thi chưa hoàn thành hoặc kết quả hiện không khả dụng."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-space-2">
            <Button variant="primary" onClick={() => void refetch()} className="min-h-11">
              Thử lại
            </Button>
            <Button variant="secondary" onClick={() => navigate("/")} className="min-h-11">
              Về danh sách môn học
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = indexedQuestions.length;
  const correctCount = indexedQuestions.filter(({ item }) => item.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;
  const percentageScore =
    review.percentageScore ?? (totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0);
  const totalScore = (percentageScore / 100) * 10;
  const isPassed = review.isPassed ?? percentageScore >= 70.0;

  const subjectCode = inferSubjectCode(review.examTitle);
  const subjectRoute = subjectCode ? `/subjects/${encodeURIComponent(subjectCode)}` : "/";
  const cramRoute = subjectCode ? `/subjects/${encodeURIComponent(subjectCode)}/practice/cram` : "/";
  const learnRoute = subjectCode ? `/subjects/${encodeURIComponent(subjectCode)}/practice/learn` : "/";

  return (
    <div className="max-w-6xl mx-auto w-full px-space-3 sm:px-space-5 py-space-5 sm:py-space-6 flex flex-col gap-space-5 sm:gap-space-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-space-2">
        <Link
          to={subjectRoute}
          className="min-h-11 inline-flex items-center gap-2 text-text-xs font-bold text-color-1 hover:text-color-2 px-space-3 py-space-1 rounded-full border-2 border-color-1 bg-color-7 shadow-xs transition-all outline-none focus-visible:ring-4 focus-visible:ring-color-5"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{subjectCode ? `Về môn ${subjectCode}` : "Về danh sách môn học"}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-space-2">
          {subjectCode && wrongCount > 0 && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate(cramRoute)}
              className="min-h-11 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Ôn cấp tốc (Cram)</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(subjectRoute)}
            className="min-h-11 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{subjectCode ? `Chọn đề môn ${subjectCode}` : "Về danh sách môn học"}</span>
          </Button>
        </div>
      </div>

      {/* Main Score Card Banner */}
      <ResultScoreCard
        examTitle={review.examTitle}
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        percentageScore={percentageScore}
        totalScore={totalScore}
        isPassed={isPassed}
        durationSeconds={review.durationSeconds}
        submittedAt={review.submittedAt}
      />

      {totalQuestions === 0 ? (
        <Card className="p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm text-center max-w-2xl mx-auto w-full space-y-space-3">
          <h2 className="text-text-lg font-bold text-color-1">
            Bài thi này chưa có câu hỏi để xem lại
          </h2>
          <p className="text-text-xs sm:text-text-sm text-color-1/80">
            Hệ thống chưa ghi nhận danh sách câu hỏi cho lượt thi này.
          </p>
          <div className="pt-space-1">
            <Button variant="primary" onClick={() => navigate(subjectRoute)} className="min-h-11">
              {subjectCode ? `Quay lại môn ${subjectCode}` : "Về danh sách môn học"}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] items-start gap-space-5">
          {/* Left / Primary Review Stream */}
          <div className="min-w-0 space-y-space-4">
            {/* Sticky Filter & Quick Utility Toolbar */}
            <div className="sticky top-[74px] z-20 bg-color-6/95 backdrop-blur-xs py-space-2 -mx-space-1 px-space-1 space-y-space-2 border-b-2 border-color-1/10">
              <div className="flex flex-wrap items-center justify-between gap-space-2">
                <h2 className="text-text-lg font-bold text-color-1">
                  Xem lại câu hỏi và lời giải
                </h2>

                {/* Filter Pills */}
                <div
                  role="group"
                  aria-label="Lọc câu hỏi theo kết quả"
                  className="flex flex-wrap items-center gap-space-1 bg-color-7 p-1 border-2 border-color-1 rounded-2xl sm:rounded-full shadow-xs tabular-nums max-w-full"
                >
                  <button
                    type="button"
                    aria-pressed={filterMode === "all"}
                    onClick={() => setFilterMode("all")}
                    className={`min-h-11 px-space-3 py-space-1 rounded-full text-text-xs font-bold transition-all outline-none focus-visible:ring-4 focus-visible:ring-color-5 cursor-pointer ${
                      filterMode === "all"
                        ? "bg-color-2 text-color-7 shadow-xs"
                        : "text-color-1 hover:bg-color-6"
                    }`}
                  >
                    Tất cả ({totalQuestions})
                  </button>
                  <button
                    type="button"
                    aria-pressed={filterMode === "correct"}
                    onClick={() => setFilterMode("correct")}
                    className={`min-h-11 px-space-3 py-space-1 rounded-full text-text-xs font-bold transition-all flex items-center gap-1 outline-none focus-visible:ring-4 focus-visible:ring-color-5 cursor-pointer ${
                      filterMode === "correct"
                        ? "bg-color-3 text-color-7 shadow-xs"
                        : "text-color-1 hover:bg-color-3/15"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Đúng ({correctCount})</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={filterMode === "incorrect"}
                    onClick={() => setFilterMode("incorrect")}
                    className={`min-h-11 px-space-3 py-space-1 rounded-full text-text-xs font-bold transition-all flex items-center gap-1 outline-none focus-visible:ring-4 focus-visible:ring-color-5 cursor-pointer ${
                      filterMode === "incorrect"
                        ? "bg-color-4 text-color-1 border border-color-1 shadow-xs"
                        : "text-color-1 hover:bg-color-4/15"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Sai ({wrongCount})</span>
                  </button>
                </div>
              </div>

              {/* Quick Jump & Expand Utilities */}
              <div className="flex flex-wrap items-center justify-between gap-space-2">
                <div className="flex flex-wrap items-center gap-space-2">
                  {wrongCount > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleJumpNextIncorrect}
                      className="min-h-11 flex items-center gap-1 text-text-xs"
                    >
                      <span>Câu sai tiếp theo</span>
                      <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </Button>
                  )}

                  {hasAnyBreakdown && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleToggleAllBreakdowns}
                      className="min-h-11 flex items-center gap-1.5 text-text-xs"
                    >
                      {expandSignal.expanded ? (
                        <>
                          <ChevronsDownUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>Thu gọn tất cả phân tích</span>
                        </>
                      ) : (
                        <>
                          <ChevronsUpDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>Mở tất cả phân tích</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Mobile Collapsible Question Map Toggle */}
                <button
                  type="button"
                  aria-expanded={isMobileMapOpen}
                  onClick={() => setIsMobileMapOpen((prev) => !prev)}
                  className="lg:hidden min-h-11 px-space-3 py-space-1 rounded-full bg-color-7 border-2 border-color-1 text-text-xs font-bold text-color-1 inline-flex items-center gap-1.5 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5"
                >
                  <span>Bản đồ {totalQuestions} câu</span>
                  {isMobileMapOpen ? (
                    <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Mobile Question Map Drawer */}
              {isMobileMapOpen && (
                <div className="lg:hidden p-space-3 bg-color-7 border-2 border-color-1 rounded-2xl shadow-xs">
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto tabular-nums">
                    {indexedQuestions.map(({ item, displayNumber }) => (
                      <button
                        key={item.questionId || displayNumber}
                        type="button"
                        onClick={() => handleSelectQuestionFromMap(displayNumber, item.isCorrect)}
                        aria-label={`Đi tới câu ${displayNumber} (${item.isCorrect ? "đúng" : "sai"})`}
                        className={`min-h-11 rounded-xl border-2 font-bold text-text-xs flex items-center justify-center cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 ${
                          activeQuestionNumber === displayNumber ? "ring-2 ring-color-2" : ""
                        } ${
                          item.isCorrect
                            ? "bg-color-3 text-color-7 border-color-1"
                            : "bg-color-4/20 text-color-1 border-color-4"
                        }`}
                      >
                        {displayNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Questions List or Purposeful Empty Filtered State */}
            {filteredQuestions.length === 0 ? (
              <Card className="p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm text-center space-y-space-3">
                {filterMode === "incorrect" ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-color-3/15 border-2 border-color-3 text-color-3 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <h3 className="text-text-base sm:text-text-lg font-bold text-color-1">
                      Tuyệt vời! Bạn không sai câu nào trong bài thi này.
                    </h3>
                    <p className="text-text-xs sm:text-text-sm text-color-1/80">
                      Toàn bộ {totalQuestions} câu hỏi đều chính xác. Bạn có thể chuyển sang xem tất cả câu để ôn lại lời giải.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-color-4/15 border-2 border-color-4 text-color-1 flex items-center justify-center mx-auto">
                      <XCircle className="w-7 h-7 text-color-4" aria-hidden="true" />
                    </div>
                    <h3 className="text-text-base sm:text-text-lg font-bold text-color-1">
                      Chưa có câu trả lời đúng nào trong lượt thi này
                    </h3>
                    <p className="text-text-xs sm:text-text-sm text-color-1/80">
                      Hãy xem lại toàn bộ đáp án và lời giải AI để nắm lại các khái niệm cốt lõi.
                    </p>
                  </>
                )}

                <div className="flex flex-wrap items-center justify-center gap-space-2 pt-space-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setFilterMode("all")}
                    className="min-h-11"
                  >
                    Xem tất cả câu hỏi
                  </Button>
                  {subjectCode && filterMode === "correct" && (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => navigate(cramRoute)}
                      className="min-h-11 flex items-center gap-1.5"
                    >
                      <Zap className="w-4 h-4" aria-hidden="true" />
                      <span>Ôn cấp tốc (Cram)</span>
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-space-4">
                {filteredQuestions.map(({ item, originalIndex, displayNumber }) => (
                  <QuestionReviewItem
                    key={item.questionId || displayNumber}
                    item={item}
                    index={originalIndex}
                    elementId={getReviewCardId(displayNumber)}
                    isActive={activeQuestionNumber === displayNumber}
                    expandSignal={expandSignal}
                    onFocusQuestion={setActiveQuestionNumber}
                    onOpenAiModal={(q, num) => setAiModalTarget({ item: q, displayNumber: num })}
                  />
                ))}
              </div>
            )}

            {/* Bottom Momentum Action Card */}
            <Card className="p-space-4 sm:p-space-5 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-3">
              <div>
                <h3 className="text-text-base font-bold text-color-1">
                  Tiếp tục củng cố kiến thức
                </h3>
                <p className="text-text-xs text-color-1/80 mt-0.5">
                  {wrongCount > 0
                    ? `Củng cố nhanh phần kiến thức còn hổng sau ${wrongCount} câu sai.`
                    : "Duy trì phản xạ làm bài trước kỳ thi chính thức."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-space-2">
                {subjectCode && (
                  <>
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => navigate(cramRoute)}
                      className="min-h-11 flex items-center gap-1.5"
                    >
                      <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Ôn cấp tốc</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(learnRoute)}
                      className="min-h-11 flex items-center gap-1.5"
                    >
                      <Brain className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Học ghi nhớ</span>
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="min-h-11 flex items-center gap-1"
                >
                  <ArrowUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Lên đầu trang</span>
                </Button>
              </div>
            </Card>

            {/* Mobile Sticky Thumb-Zone Dock */}
            <div className="sticky bottom-space-2 z-20 lg:hidden flex items-center justify-between gap-space-1.5 p-space-1.5 bg-color-7 border-2 border-color-1 rounded-full shadow-sm">
              {wrongCount > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleJumpNextIncorrect}
                  className="min-h-11 flex-1 text-text-xs flex items-center justify-center gap-1"
                >
                  <span>Câu sai tiếp</span>
                  <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilterMode("all")}
                  className="min-h-11 flex-1 text-text-xs"
                >
                  Xem tất cả ({totalQuestions})
                </Button>
              )}

              {wrongCount > 0 && (
                <Button
                  type="button"
                  variant={filterMode === "incorrect" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setFilterMode(filterMode === "incorrect" ? "all" : "incorrect")}
                  className="min-h-11 text-text-xs"
                >
                  {filterMode === "incorrect" ? "Hiện tất cả" : `Chỉ câu sai (${wrongCount})`}
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Lên đầu trang"
                className="min-h-11 px-space-3"
              >
                <ArrowUp className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Right Sticky Question Navigator Rail (Desktop lg+) */}
          <aside
            aria-label="Điều hướng nhanh danh sách câu hỏi"
            className="hidden lg:block lg:sticky lg:top-[84px]"
          >
            <Card className="p-space-4 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm space-y-space-3">
              <div className="flex items-center justify-between gap-space-2 pb-space-2 border-b-2 border-color-6">
                <h3 className="text-text-sm font-bold text-color-1">
                  Bản đồ câu hỏi ({totalQuestions})
                </h3>
                <span className="text-text-xs font-bold text-color-1/80 tabular-nums">
                  {correctCount} đúng · {wrongCount} sai
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar tabular-nums">
                {indexedQuestions.map(({ item, displayNumber }) => (
                  <button
                    key={item.questionId || displayNumber}
                    type="button"
                    onClick={() => handleSelectQuestionFromMap(displayNumber, item.isCorrect)}
                    aria-label={`Câu ${displayNumber}: ${item.isCorrect ? "Đúng" : "Sai"}`}
                    className={`min-h-11 rounded-xl border-2 font-bold text-text-xs flex items-center justify-center transition-all cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 ${
                      activeQuestionNumber === displayNumber
                        ? "ring-2 ring-color-2 scale-[1.03]"
                        : ""
                    } ${
                      item.isCorrect
                        ? "bg-color-3 text-color-7 border-color-1 hover:opacity-90"
                        : "bg-color-4/20 text-color-1 border-color-4 hover:bg-color-4/35"
                    }`}
                  >
                    {displayNumber}
                  </button>
                ))}
              </div>

              <p className="text-text-xs text-color-1/75 leading-snug pt-space-1 border-t border-color-6">
                Phím tắt: <strong className="text-color-1">J/K</strong> chuyển câu •{" "}
                <strong className="text-color-1">N</strong> câu sai tiếp •{" "}
                <strong className="text-color-1">1/2/3</strong> lọc •{" "}
                <strong className="text-color-1">E</strong> phân tích
              </p>

              {subjectCode && (
                <div className="pt-space-2 border-t-2 border-color-6 flex flex-col gap-space-1.5">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => navigate(cramRoute)}
                    className="min-h-11 w-full flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Ôn cấp tốc (Cram)</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(learnRoute)}
                    className="min-h-11 w-full flex items-center justify-center gap-1.5"
                  >
                    <Brain className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Học ghi nhớ (Learn)</span>
                  </Button>
                </div>
              )}
            </Card>
          </aside>
        </div>
      )}

      {/* Shared AI Explanation Modal Parity */}
      <AiAnswerModal
        isOpen={Boolean(aiModalTarget)}
        onClose={() => setAiModalTarget(null)}
        questionNumber={aiModalTarget?.displayNumber ?? 1}
        questionCode={aiModalTarget?.item.questionIdCode}
        questionText={aiModalTarget?.item.questionText}
        imageUrl={aiModalTarget?.item.imageUrl}
        options={aiModalTarget?.item.options}
        selectedOption={aiModalTarget?.item.selectedOptions}
        correctAnswer={aiModalTarget?.item.correctAnswer}
        aiChoice={aiModalTarget?.item.correctAnswer}
        aiModel={aiModalTarget?.item.aiModel}
        aiExplanation={aiModalTarget?.item.aiExplanation}
        optionByOptionAnalysis={aiModalTarget?.item.optionByOptionAnalysis}
      />
    </div>
  );
};
