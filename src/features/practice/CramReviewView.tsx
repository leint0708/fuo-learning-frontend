import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Play,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AiAnswerModal } from "@/features/exam/AiAnswerModal";
import { QuestionReviewItem, type ReviewContextBadge } from "@/features/review/QuestionReviewItem";
import { CramReviewSummaryCard } from "./CramReviewSummaryCard";
import { clearPracticeStorage } from "./usePracticeWorkspaceAdapter";
import {
  loadCramSessionSnapshot,
  saveCramMistakeDrill,
  clearCramSessionSnapshot,
  clearCramMistakeDrill,
} from "@/utils/cramSessionStorage";
import type { CramSessionQuestionEntry } from "@/types/practice";
import type { ReviewQuestionItem as ReviewItemType } from "@/types/review";

type CramFilterMode = "all" | "first_try" | "mistakes";

function parseCramFilterMode(raw: string | null): CramFilterMode {
  if (raw === "first_try" || raw === "mistakes") return raw;
  return "all";
}

function getCramCardId(displayNumber: number): string {
  return `cram-review-question-${displayNumber}`;
}

function toReviewItem(entry: CramSessionQuestionEntry): ReviewItemType {
  return {
    ...entry.question,
    selectedOptions: entry.lastSelectedOptions,
    correctAnswer: entry.correctAnswer,
    isCorrect: !entry.hadMistakes && entry.isMasteredInSession,
    aiExplanation: entry.aiExplanation,
    aiModel: null,
    optionByOptionAnalysis: entry.optionByOptionAnalysis,
    communityStats: entry.communityStats,
  };
}

export const CramReviewView: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const subjectCode = (code || "MAD101").toUpperCase();
  const filterMode = parseCramFilterMode(searchParams.get("filter"));

  const [activeQuestionNumber, setActiveQuestionNumber] = useState<number | null>(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(false);
  const [expandSignal, setExpandSignal] = useState<{ version: number; expanded: boolean }>({
    version: 0,
    expanded: false,
  });
  const [aiModalTarget, setAiModalTarget] = useState<{
    item: ReviewItemType;
    displayNumber: number;
  } | null>(null);

  const snapshot = useMemo(() => loadCramSessionSnapshot(subjectCode), [subjectCode]);

  useEffect(() => {
    document.title = `Ôn lại phiên Cram - ${subjectCode} | FUO Learning`;
  }, [subjectCode]);

  const setFilterMode = useCallback(
    (nextMode: CramFilterMode) => {
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

  const indexedEntries = useMemo(() => {
    const rawEntries = snapshot?.entries ?? [];
    return rawEntries.map((entry, idx) => {
      const reviewItem = toReviewItem(entry);
      const displayNumber =
        entry.question.questionNumber > 0 ? entry.question.questionNumber : entry.sessionOrder || idx + 1;
      return {
        entry,
        reviewItem,
        originalIndex: idx,
        displayNumber,
      };
    });
  }, [snapshot]);

  const firstTryEntries = useMemo(
    () => indexedEntries.filter(({ entry }) => !entry.hadMistakes && entry.isMasteredInSession),
    [indexedEntries]
  );

  const mistakeEntries = useMemo(
    () => indexedEntries.filter(({ entry }) => entry.hadMistakes),
    [indexedEntries]
  );

  const filteredEntries = useMemo(() => {
    if (filterMode === "first_try") return firstTryEntries;
    if (filterMode === "mistakes") return mistakeEntries;
    return indexedEntries;
  }, [filterMode, indexedEntries, firstTryEntries, mistakeEntries]);

  const hasAnyBreakdown = useMemo(
    () =>
      indexedEntries.some(
        ({ entry }) =>
          Boolean(entry.optionByOptionAnalysis) &&
          Object.keys(entry.optionByOptionAnalysis || {}).length > 0
      ),
    [indexedEntries]
  );

  const focusAndScrollToQuestion = useCallback((displayNumber: number) => {
    setActiveQuestionNumber(displayNumber);
    window.requestAnimationFrame(() => {
      const element = document.getElementById(getCramCardId(displayNumber));
      if (!element) return;
      if (typeof element.scrollIntoView === "function") {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      element.focus({ preventScroll: true });
    });
  }, []);

  const handleSelectQuestionFromMap = useCallback(
    (displayNumber: number, hadMistakes: boolean, isFirstTry: boolean) => {
      const hiddenByFilter =
        (filterMode === "first_try" && !isFirstTry) ||
        (filterMode === "mistakes" && !hadMistakes);
      if (hiddenByFilter) {
        setFilterMode("all");
        setStatusAnnouncement(`Đã chuyển về bộ lọc Tất cả để hiển thị Câu ${displayNumber}.`);
      }
      focusAndScrollToQuestion(displayNumber);
      setIsMobileMapOpen(false);
    },
    [filterMode, setFilterMode, focusAndScrollToQuestion]
  );

  const handleJumpNextMistake = useCallback(() => {
    const firstMistake = mistakeEntries[0];
    if (!firstMistake) return;

    if (filterMode === "first_try") {
      setFilterMode("mistakes");
      setStatusAnnouncement(`Đã chuyển sang bộ lọc Từng sai tại Câu ${firstMistake.displayNumber}.`);
      focusAndScrollToQuestion(firstMistake.displayNumber);
      return;
    }

    const currentIdx =
      activeQuestionNumber !== null
        ? mistakeEntries.findIndex((item) => item.displayNumber > activeQuestionNumber)
        : -1;
    const nextEntry = (currentIdx >= 0 ? mistakeEntries[currentIdx] : undefined) ?? firstMistake;
    focusAndScrollToQuestion(nextEntry.displayNumber);
  }, [mistakeEntries, filterMode, setFilterMode, activeQuestionNumber, focusAndScrollToQuestion]);

  const handleToggleAllBreakdowns = useCallback(() => {
    setExpandSignal((prev) => ({
      version: prev.version + 1,
      expanded: !prev.expanded,
    }));
  }, []);

  useEffect(() => {
    if (indexedEntries.length === 0 || aiModalTarget) return;

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
        setFilterMode("first_try");
      } else if (key === "3") {
        setFilterMode("mistakes");
      } else if (key === "n" && mistakeEntries.length > 0) {
        event.preventDefault();
        handleJumpNextMistake();
      } else if (key === "e" && hasAnyBreakdown) {
        event.preventDefault();
        handleToggleAllBreakdowns();
      } else if (key === "a" && filteredEntries.length > 0) {
        event.preventDefault();
        const active =
          filteredEntries.find((e) => e.displayNumber === activeQuestionNumber) ??
          filteredEntries[0];
        if (active) {
          setAiModalTarget({ item: active.reviewItem, displayNumber: active.displayNumber });
        }
      } else if ((key === "j" || key === "k") && filteredEntries.length > 0) {
        event.preventDefault();
        const currentPos = filteredEntries.findIndex(
          (e) => e.displayNumber === activeQuestionNumber
        );
        const nextPos =
          key === "j"
            ? currentPos < 0
              ? 0
              : Math.min(filteredEntries.length - 1, currentPos + 1)
            : currentPos <= 0
              ? 0
              : currentPos - 1;
        const nextTarget = filteredEntries[nextPos];
        if (nextTarget) {
          focusAndScrollToQuestion(nextTarget.displayNumber);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    indexedEntries.length,
    filteredEntries,
    mistakeEntries.length,
    hasAnyBreakdown,
    activeQuestionNumber,
    aiModalTarget,
    setFilterMode,
    handleJumpNextMistake,
    handleToggleAllBreakdowns,
    focusAndScrollToQuestion,
  ]);

  const subjectRoute = `/subjects/${encodeURIComponent(subjectCode)}`;
  const cramRoute = `/subjects/${encodeURIComponent(subjectCode)}/practice/cram`;
  const mistakeDrillRoute = `${cramRoute}?scope=mistakes`;

  const handleLaunchMistakeDrill = () => {
    const ids = mistakeEntries.map(({ entry }) => entry.question.questionId);
    saveCramMistakeDrill(subjectCode, ids);
    navigate(mistakeDrillRoute);
  };

  const handleResetAndRestartCram = () => {
    clearPracticeStorage(subjectCode, "cram");
    clearCramSessionSnapshot(subjectCode);
    clearCramMistakeDrill(subjectCode);
    navigate(cramRoute);
  };

  if (!snapshot || indexedEntries.length === 0) {
    return (
      <div className="max-w-xl mx-auto w-full px-space-3 sm:px-space-4 py-space-5 sm:py-space-6 text-center">
        <Card className="p-space-4 sm:p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm flex flex-col items-center gap-space-4">
          <h1 className="text-text-lg font-bold text-color-1">
            Chưa có phiên ôn tập cấp tốc nào được ghi nhận
          </h1>
          <p className="text-text-xs sm:text-text-sm text-color-1/80">
            Hãy bắt đầu ôn tập cấp tốc cho môn {subjectCode} và trả lời ít nhất 1 câu để xem tổng kết chi tiết tại đây.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-space-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(cramRoute)}
              className="min-h-11 flex items-center gap-space-1"
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
              <span>Bắt đầu luyện cấp tốc</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(subjectRoute)}
              className="min-h-11"
            >
              Về trang môn học
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalPracticed = indexedEntries.length;
  const firstTryCount = firstTryEntries.length;
  const hadMistakesCount = mistakeEntries.length;
  const masteredInSessionCount = indexedEntries.filter(
    ({ entry }) => entry.isMasteredInSession
  ).length;
  const hasRemainingDeckCards = snapshot.cumulativeMasteredCount < snapshot.totalDeckSize;

  return (
    <div className="max-w-6xl mx-auto w-full px-space-3 sm:px-space-5 py-space-4 sm:py-space-6 flex flex-col gap-space-4 sm:gap-space-5">
      <div className="sr-only" aria-live="polite">
        {statusAnnouncement}
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-space-2">
        <Link
          to={subjectRoute}
          className="min-h-11 inline-flex items-center gap-space-1 text-text-xs font-bold text-color-1 hover:text-color-2 px-space-3 py-space-1 rounded-full border-2 border-color-1 bg-color-7 shadow-xs transition-all outline-none focus-visible:ring-4 focus-visible:ring-color-5"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Về trang môn học</span>
        </Link>

        <div className="flex flex-wrap items-center gap-space-2">
          {hadMistakesCount > 0 && (
            <Button
              variant="accent"
              size="sm"
              onClick={handleLaunchMistakeDrill}
              className="min-h-11 flex items-center gap-space-1"
            >
              <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Luyện lại {hadMistakesCount} câu từng sai</span>
            </Button>
          )}

          {hasRemainingDeckCards ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(cramRoute)}
              className="min-h-11 flex items-center gap-space-1"
            >
              <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Tiếp tục đợt chưa học</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetAndRestartCram}
              className="min-h-11 flex items-center gap-space-1"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Luyện lại từ đầu</span>
            </Button>
          )}
        </div>
      </div>

      {/* Session Summary Hero */}
      <CramReviewSummaryCard
        subjectCode={subjectCode}
        endReason={snapshot.endReason}
        scope={snapshot.scope}
        totalPracticed={totalPracticed}
        firstTryCorrectCount={firstTryCount}
        hadMistakesCount={hadMistakesCount}
        masteredInSessionCount={masteredInSessionCount}
        cumulativeMasteredCount={snapshot.cumulativeMasteredCount}
        totalDeckSize={snapshot.totalDeckSize}
        completedAt={snapshot.completedAt}
      />

      {/* Main 2-Column Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] items-start gap-space-5">
        <div className="min-w-0 space-y-space-4">
          {/* Sticky Toolbar on Desktop, Flow on Mobile/Tablet */}
          <div className="relative lg:sticky lg:top-[66px] z-20 bg-color-6/95 lg:backdrop-blur-sm py-space-2 -mx-space-2 px-space-2 border-b-2 border-color-1/10 space-y-space-2">
            <div className="flex flex-wrap items-center justify-between gap-space-2">
              <h2 className="text-text-lg font-bold text-color-1">
                Các câu hỏi đã luyện trong phiên
              </h2>

              <div
                role="group"
                aria-label="Lọc câu hỏi đã luyện theo mức độ chính xác"
                className="flex flex-wrap items-center gap-space-1 bg-color-7 p-space-1 border-2 border-color-1 rounded-2xl sm:rounded-full shadow-xs tabular-nums max-w-full"
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
                  Tất cả ({totalPracticed})
                </button>
                <button
                  type="button"
                  aria-pressed={filterMode === "first_try"}
                  onClick={() => setFilterMode("first_try")}
                  className={`min-h-11 px-space-3 py-space-1 rounded-full text-text-xs font-bold transition-all flex items-center gap-1 outline-none focus-visible:ring-4 focus-visible:ring-color-5 cursor-pointer ${
                    filterMode === "first_try"
                      ? "bg-color-3 text-color-7 shadow-xs"
                      : "text-color-1 hover:bg-color-3/15"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Đúng ngay ({firstTryCount})</span>
                </button>
                <button
                  type="button"
                  aria-pressed={filterMode === "mistakes"}
                  onClick={() => setFilterMode("mistakes")}
                  className={`min-h-11 px-space-3 py-space-1 rounded-full text-text-xs font-bold transition-all flex items-center gap-1 outline-none focus-visible:ring-4 focus-visible:ring-color-5 cursor-pointer ${
                    filterMode === "mistakes"
                      ? "bg-color-4 text-color-1 border border-color-1 shadow-xs"
                      : "text-color-1 hover:bg-color-4/15"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Từng sai ({hadMistakesCount})</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-space-2">
              <div className="flex flex-wrap items-center gap-space-2">
                {hadMistakesCount > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleJumpNextMistake}
                    className="min-h-11 flex items-center gap-1 text-text-xs"
                  >
                    <span>Câu từng sai tiếp theo</span>
                    <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </Button>
                )}

                {hasAnyBreakdown && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleToggleAllBreakdowns}
                    className="min-h-11 flex items-center gap-space-1 text-text-xs"
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

              <button
                type="button"
                aria-expanded={isMobileMapOpen}
                onClick={() => setIsMobileMapOpen((prev) => !prev)}
                className="lg:hidden min-h-11 px-space-3 py-space-1 rounded-full bg-color-7 border-2 border-color-1 text-text-xs font-bold text-color-1 inline-flex items-center gap-space-1 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5"
              >
                <span>Bản đồ {totalPracticed} câu</span>
                {isMobileMapOpen ? (
                  <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
              </button>
            </div>

            {isMobileMapOpen && (
              <div className="lg:hidden p-space-3 bg-color-7 border-2 border-color-1 rounded-2xl shadow-xs">
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-space-1 max-h-48 overflow-y-auto tabular-nums">
                  {indexedEntries.map(({ entry, displayNumber }) => {
                    const isFirstTry = !entry.hadMistakes && entry.isMasteredInSession;
                    return (
                      <button
                        key={entry.question.questionId || displayNumber}
                        type="button"
                        onClick={() =>
                          handleSelectQuestionFromMap(
                            displayNumber,
                            entry.hadMistakes,
                            isFirstTry
                          )
                        }
                        aria-label={`Đi tới câu ${displayNumber} (${entry.hadMistakes ? "từng sai" : "đúng ngay"})`}
                        className={`min-h-11 rounded-xl border-2 font-bold text-text-xs flex items-center justify-center cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 ${
                          activeQuestionNumber === displayNumber ? "ring-2 ring-color-2" : ""
                        } ${
                          isFirstTry
                            ? "bg-color-3 text-color-7 border-color-1"
                            : "bg-color-4/20 text-color-1 border-color-4"
                        }`}
                      >
                        {displayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Empty Filter State or Cards */}
          {filteredEntries.length === 0 ? (
            <Card className="p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm text-center space-y-space-3">
              {filterMode === "mistakes" ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-color-3/15 border-2 border-color-3 text-color-3 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-text-base sm:text-text-lg font-bold text-color-1">
                    Không có câu từng sai trong phiên này!
                  </h3>
                  <p className="text-text-xs sm:text-text-sm text-color-1/80">
                    Toàn bộ {totalPracticed} câu đều được trả lời đúng ngay từ lần đầu.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-color-5/25 border-2 border-color-1 text-color-1 flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-text-base sm:text-text-lg font-bold text-color-1">
                    Chưa có câu nào đúng ngay ở lần thử đầu
                  </h3>
                  <p className="text-text-xs sm:text-text-sm text-color-1/80">
                    Mọi câu trong phiên này đều cần nhắc lại — hãy xem lại lời giải hoặc luyện lại các câu từng sai.
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
                {hadMistakesCount > 0 && filterMode === "first_try" && (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleLaunchMistakeDrill}
                    className="min-h-11 flex items-center gap-space-1"
                  >
                    <Zap className="w-4 h-4" aria-hidden="true" />
                    <span>Luyện lại {hadMistakesCount} câu từng sai</span>
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-space-4">
              {filteredEntries.map(({ entry, reviewItem, originalIndex, displayNumber }) => {
                const contextBadges: ReviewContextBadge[] = [];
                if (entry.hadMistakes) {
                  contextBadges.push({
                    label: `Sai ${entry.mistakeCount} lần`,
                    tone: "warning",
                  });
                }
                contextBadges.push({
                  label: entry.isMasteredInSession ? "Đã thuộc trong phiên" : "Chưa thuộc",
                  tone: entry.isMasteredInSession ? "success" : "danger",
                });

                const statusBadgeOverride = !entry.hadMistakes
                  ? { label: "Đúng ngay", variant: "success" as const }
                  : entry.isMasteredInSession
                    ? { label: `Từng sai (${entry.mistakeCount} lần)`, variant: "warning" as const }
                    : { label: "Chưa hoàn thành", variant: "danger" as const };

                const firstSelectedLabel =
                  entry.hadMistakes && entry.firstSelectedOptions !== entry.lastSelectedOptions
                    ? `Lựa chọn đầu tiên chưa đúng: ${entry.firstSelectedOptions} → Sửa đúng: ${entry.lastSelectedOptions}`
                    : null;

                return (
                  <QuestionReviewItem
                    key={entry.question.questionId || displayNumber}
                    item={reviewItem}
                    index={originalIndex}
                    elementId={getCramCardId(displayNumber)}
                    isActive={activeQuestionNumber === displayNumber}
                    expandSignal={expandSignal}
                    statusBadgeOverride={statusBadgeOverride}
                    contextBadges={contextBadges}
                    firstSelectedLabel={firstSelectedLabel}
                    onFocusQuestion={setActiveQuestionNumber}
                    onOpenAiModal={(q, num) => setAiModalTarget({ item: q, displayNumber: num })}
                  />
                );
              })}
            </div>
          )}

          {/* Bottom Momentum Action Card */}
          <Card className="p-space-4 sm:p-space-5 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-3">
            <div>
              <h3 className="text-text-base font-bold text-color-1">
                Bước tiếp theo sau phiên ôn
              </h3>
              <p className="text-text-xs text-color-1/80 mt-0.5">
                {hadMistakesCount > 0
                  ? `Còn ${hadMistakesCount} câu từng sai trong phiên này — luyện lại ngay để khóa chắc kiến thức.`
                  : "Không có lỗi sai nào! Bạn có thể học đợt tiếp theo hoặc quay về môn học."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-space-2">
              {hadMistakesCount > 0 && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleLaunchMistakeDrill}
                  className="min-h-11 flex items-center gap-space-1"
                >
                  <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Luyện lại câu từng sai</span>
                </Button>
              )}

              {hasRemainingDeckCards ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(cramRoute)}
                  className="min-h-11 flex items-center gap-space-1"
                >
                  <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Tiếp tục đợt chưa học</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleResetAndRestartCram}
                  className="min-h-11 flex items-center gap-space-1"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Luyện lại từ đầu</span>
                </Button>
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

          {/* Mobile Single Sticky Thumb Dock (<lg) */}
          <div className="sticky bottom-space-2 z-20 lg:hidden flex items-center justify-between gap-space-1 p-space-1 bg-color-7 border-2 border-color-1 rounded-full shadow-sm">
            {hadMistakesCount > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleJumpNextMistake}
                className="min-h-11 flex-1 text-text-xs flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <span>Từng sai tiếp</span>
                <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFilterMode("all")}
                className="min-h-11 flex-1 text-text-xs whitespace-nowrap"
              >
                Xem tất cả ({totalPracticed})
              </Button>
            )}

            {hadMistakesCount > 0 && (
              <Button
                type="button"
                variant={filterMode === "mistakes" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilterMode(filterMode === "mistakes" ? "all" : "mistakes")}
                className="min-h-11 text-text-xs whitespace-nowrap"
              >
                {filterMode === "mistakes" ? "Hiện tất cả" : `Từng sai (${hadMistakesCount})`}
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Lên đầu trang"
              className="min-h-11 px-space-3 flex items-center gap-1 text-text-xs whitespace-nowrap"
            >
              <ArrowUp className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Đầu trang</span>
            </Button>
          </div>
        </div>

        {/* Right Sticky Navigator Rail (Desktop lg+, aligned cleanly at top-[74px]) */}
        <aside
          aria-label="Điều hướng nhanh câu hỏi trong phiên"
          className="hidden lg:block lg:sticky lg:top-[74px]"
        >
          <Card className="p-space-4 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm space-y-space-3">
            <div className="flex items-center justify-between gap-space-2 pb-space-2 border-b-2 border-color-6">
              <h3 className="text-text-sm font-bold text-color-1">
                Bản đồ phiên ({totalPracticed})
              </h3>
              <span className="text-text-xs font-bold text-color-1/80 tabular-nums">
                {firstTryCount} đúng ngay · {hadMistakesCount} từng sai
              </span>
            </div>

            <div className="grid grid-cols-5 gap-space-1 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar tabular-nums">
              {indexedEntries.map(({ entry, displayNumber }) => {
                const isFirstTry = !entry.hadMistakes && entry.isMasteredInSession;
                return (
                  <button
                    key={entry.question.questionId || displayNumber}
                    type="button"
                    onClick={() =>
                      handleSelectQuestionFromMap(displayNumber, entry.hadMistakes, isFirstTry)
                    }
                    aria-label={`Câu ${displayNumber}: ${entry.hadMistakes ? "Từng sai" : "Đúng ngay"}`}
                    className={`min-h-11 rounded-xl border-2 font-bold text-text-xs flex items-center justify-center transition-all cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 ${
                      activeQuestionNumber === displayNumber ? "ring-2 ring-color-2 scale-[1.03]" : ""
                    } ${
                      isFirstTry
                        ? "bg-color-3 text-color-7 border-color-1 hover:opacity-90"
                        : "bg-color-4/20 text-color-1 border-color-4 hover:bg-color-4/35"
                    }`}
                  >
                    {displayNumber}
                  </button>
                );
              })}
            </div>

            <p className="text-text-xs text-color-1/75 leading-snug pt-space-2 border-t-2 border-color-6">
              Phím tắt: <strong className="text-color-1">J/K</strong> chuyển câu •{" "}
              <strong className="text-color-1">N</strong> câu từng sai •{" "}
              <strong className="text-color-1">A</strong> khung AI •{" "}
              <strong className="text-color-1">1/2/3</strong> lọc •{" "}
              <strong className="text-color-1">E</strong> phân tích
            </p>
          </Card>
        </aside>
      </div>

      {/* Shared AI Modal Parity */}
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

export default CramReviewView;
