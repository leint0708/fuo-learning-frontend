import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  Send,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StudyCockpitShell } from "@/features/workspace/StudyCockpitShell";
import { CockpitHeader } from "@/features/workspace/CockpitHeader";
import { QuestionStage } from "@/features/workspace/QuestionStage";
import { ChoiceOptionList } from "@/features/workspace/ChoiceOptionList";
import { FeedbackExplanationCard } from "@/features/workspace/FeedbackExplanationCard";
import { QuestionNavigator } from "@/features/workspace/QuestionNavigator";
import { ShortcutHelpModal } from "@/features/workspace/ShortcutHelpModal";
import { AiAnswerModal } from "./AiAnswerModal";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { useExamWorkspaceAdapter } from "./useExamWorkspaceAdapter";
import { useZoomPan } from "@/hooks/useZoomPan";
import { useWorkspaceShortcuts } from "@/hooks/useWorkspaceShortcuts";
import { resolveImageUrl } from "@/utils/imageUrl";

/**
 * Unified Exam Operate cockpit built over shared workspace primitives.
 * Preserves timed/untimed tracking, instant & post_exam modes, live save telemetry,
 * free question jump, and always-available lazy AI rationale without hardcoded answers.
 */
export const ExamWorkspaceView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const safeAttemptId = attemptId || "att_mock_100";

  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isMobileNavigatorOpen, setIsMobileNavigatorOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [failedDiagramIds, setFailedDiagramIds] = useState<Record<string, boolean>>({});

  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const previousQuestionIdRef = useRef<string | null>(null);

  const zoomPan = useZoomPan({
    minZoom: 0.5,
    maxZoom: 3.0,
    zoomStep: 0.25,
    initialZoom: 1.0,
  });

  const resetPanRef = useRef(zoomPan.setPanOffset);
  resetPanRef.current = zoomPan.setPanOffset;

  const adapter = useExamWorkspaceAdapter(safeAttemptId);

  const activeQuestion = adapter.currentQuestion;
  const activeQuestionId = activeQuestion?.questionId ?? "";
  const hasVisualMedia =
    Boolean(resolveImageUrl(activeQuestion?.imageUrl)) &&
    !failedDiagramIds[activeQuestionId];

  useEffect(() => {
    if (adapter.examTitle) {
      document.title = `${adapter.examTitle} | FUO Learning`;
    } else {
      document.title = "Phòng thi trực tuyến | FUO Learning";
    }
  }, [adapter.examTitle]);

  useEffect(() => {
    const currentId = activeQuestion?.questionId ?? null;
    if (previousQuestionIdRef.current !== currentId) {
      resetPanRef.current({ x: 0, y: 0 });
    }
    if (
      currentId &&
      previousQuestionIdRef.current &&
      previousQuestionIdRef.current !== currentId &&
      headingRef.current
    ) {
      headingRef.current.focus();
    }
    previousQuestionIdRef.current = currentId;
  }, [activeQuestion?.questionId]);

  useWorkspaceShortcuts({
    sortedOptionKeys: adapter.sortedOptionKeys,
    isOptionsLocked:
      adapter.sessionStatus !== "ready" || adapter.timer.isExpired || adapter.isSubmitting,
    isContinueReady: false,
    canSubmitMultiChoice: Boolean(
      adapter.feedbackMode === "instant" &&
        activeQuestion?.questionType === "multiple_choice" &&
        adapter.selectedOptions
    ),
    hasVisualMedia,
    isModalOpen:
      adapter.sessionStatus !== "ready" ||
      isShortcutHelpOpen ||
      isExitConfirmOpen ||
      adapter.isAiModalOpen ||
      adapter.isSubmitConfirmOpen ||
      isMobileNavigatorOpen,
    onSelectOption: (optionKey) => {
      void adapter.selectOption(optionKey);
    },
    onSubmitMultiChoice: () => {
      void adapter.submitMultiChoiceCheck();
    },
    onPrevQuestion: adapter.navigatePrev,
    onNextQuestion: adapter.navigateNext,
    onZoomIn: zoomPan.zoomIn,
    onZoomOut: zoomPan.zoomOut,
    onResetZoom: zoomPan.resetZoom,
    onOpenShortcuts: () => setIsShortcutHelpOpen(true),
  });

  if (adapter.sessionStatus === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center bg-color-6 p-space-4">
        <div
          role="status"
          aria-live="polite"
          data-impeccable-ignore="hard-offset-shadow"
          className="flex flex-col items-center gap-space-3 p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm"
        >
          <div className="w-10 h-10 border-4 border-color-2 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-text-sm text-color-1">
            Đang tải phòng thi và câu hỏi...
          </p>
        </div>
      </div>
    );
  }

  if (adapter.sessionStatus === "error" || !activeQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-color-6 p-space-4">
        <Card className="max-w-md w-full p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl text-center shadow-sm flex flex-col gap-space-4">
          <div
            role="alert"
            aria-live="polite"
            className="flex flex-col items-center gap-space-2"
          >
            <div className="w-12 h-12 rounded-full bg-color-4 text-color-1 border-2 border-color-1 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-text-lg font-bold text-color-1">
              Không thể tải bài thi
            </h1>
            <p className="text-text-xs font-medium text-color-1">
              {adapter.loadErrorMessage}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-space-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                void adapter.retryLoad();
              }}
              className="min-h-11 flex-1 inline-flex items-center justify-center gap-space-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/")}
              className="min-h-11 flex-1"
            >
              Quay về danh sách môn học
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <StudyCockpitShell
      hasVisualMedia={hasVisualMedia}
      banners={
        adapter.submitError ? (
          <div
            role="alert"
            aria-live="polite"
            className="p-space-3 rounded-2xl bg-color-4/15 border-2 border-color-1 flex flex-wrap items-center justify-between gap-space-2 text-color-1"
          >
            <div className="flex items-center gap-space-2 text-text-xs sm:text-text-sm font-bold">
              <span className="w-7 h-7 rounded-full bg-color-4 text-color-1 border border-color-1 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              </span>
              <span>{adapter.submitError}</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              isLoading={adapter.isSubmitting}
              onClick={() => {
                void adapter.confirmSubmit();
              }}
              className="min-h-11 inline-flex items-center gap-space-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử nộp lại</span>
            </Button>
          </div>
        ) : null
      }
      header={
        <CockpitHeader
          title={adapter.examTitle}
          exitLabel="Thoát phòng thi"
          onExit={() => setIsExitConfirmOpen(true)}
          progressLabel="Tiến độ bài thi"
          progressCurrent={adapter.answeredCount}
          progressTotal={adapter.totalQuestions}
          modeToggle={{
            ariaLabel: "Chế độ chấm điểm",
            value: adapter.feedbackMode,
            options: [
              { value: "instant", label: "Chấm tức thì" },
              { value: "post_exam", label: "Thi chuẩn" },
            ],
            onChange: (value) => {
              adapter.setFeedbackMode(value === "instant" ? "instant" : "post_exam");
            },
          }}
          saveStatus={adapter.saveStatus}
          onRetrySave={() => {
            void adapter.retrySave();
          }}
          statusSlot={
            <div
              data-testid="exam-timer-box"
              role={adapter.timer.isWarning ? "status" : undefined}
              aria-live={adapter.timer.isWarning ? "polite" : undefined}
              className={`min-h-11 px-space-2 sm:px-space-3 py-space-1 rounded-full border-2 border-color-1 inline-flex items-center gap-space-1 font-bold text-[13px] sm:text-text-xs tabular-nums shrink-0 ${
                adapter.timer.isWarning
                  ? "bg-color-4 text-color-1 animate-pulse"
                  : adapter.timer.isUntimed
                    ? "bg-color-6 text-color-1"
                    : "bg-color-7 text-color-1"
              }`}
            >
              <Clock
                className={`w-4 h-4 shrink-0 ${
                  adapter.timer.isWarning ? "text-color-1" : "text-color-2"
                }`}
                aria-hidden="true"
              />
              <span>
                {adapter.timer.isUntimed
                  ? `Không giới hạn • ${adapter.timer.formattedElapsed}`
                  : adapter.timer.formattedTime}
              </span>
            </div>
          }
          onOpenShortcuts={() => setIsShortcutHelpOpen(true)}
          primaryActionSlot={
            <Button
              variant="danger"
              size="sm"
              onClick={adapter.openSubmitDialog}
              className="min-h-11 inline-flex items-center gap-space-1"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài</span>
            </Button>
          }
        />
      }
      stageContent={
        <QuestionStage
          question={activeQuestion}
          zoomPan={zoomPan}
          headingRef={headingRef}
          onMediaAvailabilityChange={(available) => {
            if (!activeQuestionId) return;
            setFailedDiagramIds((prev) => {
              const currentlyFailed = Boolean(prev[activeQuestionId]);
              if (currentlyFailed === !available) return prev;
              return { ...prev, [activeQuestionId]: !available };
            });
          }}
        />
      }
      choiceContent={
        <div className="flex flex-col gap-space-4">
          <ChoiceOptionList
            options={activeQuestion.options}
            selectedOptions={adapter.selectedOptions}
            questionType={activeQuestion.questionType}
            feedbackMode={adapter.feedbackMode}
            evaluation={adapter.evaluation}
            isLocked={adapter.timer.isExpired || adapter.isSubmitting}
            allowsClear={true}
            onSelectOption={(key) => {
              void adapter.selectOption(key);
            }}
            onClearSelection={() => {
              void adapter.clearSelection();
            }}
            onSubmitMultiChoice={() => {
              void adapter.submitMultiChoiceCheck();
            }}
          />

          {adapter.feedbackMode === "instant" && adapter.evaluation && (
            <FeedbackExplanationCard
              evaluation={adapter.evaluation}
              onRetry={() => {
                void adapter.submitMultiChoiceCheck();
              }}
            />
          )}

          <div className="hidden md:flex bg-color-7 p-space-3 rounded-2xl border-2 border-color-1 flex-wrap items-center justify-between gap-space-2">
            <span className="text-text-xs font-bold text-color-1">
              Phân tích chi tiết &amp; loại trừ đáp án
            </span>
            <Button
              variant="secondary"
              size="md"
              onClick={adapter.openAiAnalysis}
              className="min-h-11 inline-flex items-center gap-space-1 shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-color-5 text-color-1 inline-flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              <span>Xem giải thích AI</span>
            </Button>
          </div>
        </div>
      }
      navigatorContent={
        <QuestionNavigator
          title="Danh sách câu hỏi"
          items={adapter.navigatorItems}
          activeIndex={adapter.currentIndex}
          answeredCount={adapter.answeredCount}
          totalCount={adapter.totalQuestions}
          onSelectQuestion={(idx) => {
            adapter.jumpToQuestion(idx);
            setIsMobileNavigatorOpen(false);
          }}
          onPrevQuestion={adapter.navigatePrev}
          onNextQuestion={adapter.navigateNext}
          supportsFreeJump={true}
          isMobileDrawerOpen={isMobileNavigatorOpen}
          onOpenMobileDrawer={() => setIsMobileNavigatorOpen(true)}
          onCloseMobileDrawer={() => setIsMobileNavigatorOpen(false)}
        />
      }
      mobileStatusLabel={`${adapter.currentIndex + 1}/${adapter.totalQuestions} • ${adapter.answeredCount} đã làm`}
      canPrev={adapter.currentIndex > 0}
      canNext={adapter.currentIndex < adapter.totalQuestions - 1}
      onPrev={adapter.navigatePrev}
      onNext={adapter.navigateNext}
      onOpenMobileNavigator={() => setIsMobileNavigatorOpen(true)}
      mobilePrimaryAction={
        <Button
          variant="secondary"
          size="sm"
          onClick={adapter.openAiAnalysis}
          aria-label="Phân tích AI"
          className="min-h-11 inline-flex items-center gap-space-1"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI</span>
        </Button>
      }
      modals={
        <>
          <AiAnswerModal
            isOpen={adapter.isAiModalOpen}
            onClose={adapter.closeAiAnalysis}
            questionNumber={adapter.currentIndex + 1}
            questionCode={activeQuestion.questionIdCode}
            questionText={activeQuestion.questionText}
            imageUrl={activeQuestion.imageUrl}
            options={activeQuestion.options}
            selectedOption={adapter.selectedOptions || null}
            aiChoice={adapter.aiModalState.aiChoice}
            aiModel="gemini-3-flash-preview"
            aiExplanation={adapter.aiModalState.aiExplanation}
            optionByOptionAnalysis={adapter.aiModalState.optionByOptionAnalysis}
            isLoading={adapter.aiModalState.isLoading}
            errorMessage={adapter.aiModalState.errorMessage}
            onRetry={() => {
              void adapter.retryAiAnalysis();
            }}
          />

          <Modal
            isOpen={isExitConfirmOpen}
            onClose={() => setIsExitConfirmOpen(false)}
            title="Xác nhận thoát phòng thi"
            size="sm"
          >
            <div className="flex flex-col gap-space-4">
              <div className="flex items-start gap-space-3 p-space-4 rounded-2xl bg-color-5/25 border-2 border-color-1 text-color-1">
                <div className="w-10 h-10 rounded-full bg-color-5 text-color-1 border-2 border-color-1 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-space-1">
                  <p className="text-text-sm font-bold text-color-1">
                    Bạn có chắc muốn rời khỏi phòng thi lúc này?
                  </p>
                  <p className="text-text-xs font-medium text-color-1">
                    {adapter.timer.isUntimed
                      ? "Phiên làm bài chưa được nộp. Bạn có thể quay lại tiếp tục sau."
                      : `Đồng hồ làm bài (${adapter.timer.formattedTime}) vẫn tiếp tục chạy trên hệ thống ngay cả khi bạn rời trang.`}
                  </p>
                </div>
              </div>

              {adapter.pendingSaveCount > 0 && (
                <div
                  role="alert"
                  className="p-space-3 rounded-2xl bg-color-4/15 border-2 border-color-1 text-color-1 flex flex-wrap items-center justify-between gap-space-2"
                >
                  <span className="text-text-xs font-bold">
                    Cảnh báo: Còn {adapter.pendingSaveCount} đáp án chưa đồng bộ lên máy chủ.
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void adapter.retrySave();
                    }}
                    className="min-h-11 shrink-0"
                  >
                    Lưu lại ngay
                  </Button>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-space-2 pt-space-2 border-t-2 border-color-6">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setIsExitConfirmOpen(false);
                    navigate("/");
                  }}
                  className="min-h-11 inline-flex items-center justify-center gap-space-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Rời phòng thi</span>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsExitConfirmOpen(false)}
                  className="min-h-11"
                >
                  Tiếp tục làm bài
                </Button>
              </div>
            </div>
          </Modal>

          <SubmitConfirmModal
            isOpen={adapter.isSubmitConfirmOpen}
            onClose={adapter.closeSubmitDialog}
            onConfirm={() => {
              void adapter.confirmSubmit();
            }}
            totalQuestions={adapter.totalQuestions}
            answeredCount={adapter.answeredCount}
            timeRemainingFormatted={
              adapter.timer.isUntimed
                ? `Không giới hạn (${adapter.timer.formattedElapsed})`
                : adapter.timer.formattedTime
            }
            isSubmitting={adapter.isSubmitting}
            submitError={adapter.submitError}
          />

          <ShortcutHelpModal
            isOpen={isShortcutHelpOpen}
            onClose={() => setIsShortcutHelpOpen(false)}
            mode="exam"
            hasVisualMedia={hasVisualMedia}
          />
        </>
      }
    />
  );
};

export default ExamWorkspaceView;
