import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, RotateCcw, Home, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StudyCockpitShell } from "@/features/workspace/StudyCockpitShell";
import { CockpitHeader } from "@/features/workspace/CockpitHeader";
import { QuestionStage } from "@/features/workspace/QuestionStage";
import { FeedbackExplanationCard } from "@/features/workspace/FeedbackExplanationCard";
import { CockpitInspectorRail } from "@/features/workspace/CockpitInspectorRail";
import { ShortcutHelpModal } from "@/features/workspace/ShortcutHelpModal";
import { AiAnswerModal } from "@/features/exam/AiAnswerModal";
import { CramBatchModal } from "./CramBatchModal";
import { LearnRoundSummaryModal } from "./LearnRoundSummaryModal";
import { usePracticeWorkspaceAdapter } from "./usePracticeWorkspaceAdapter";
import { useZoomPan } from "@/hooks/useZoomPan";
import { useWorkspaceShortcuts } from "@/hooks/useWorkspaceShortcuts";
import { resolveImageUrl } from "@/utils/imageUrl";
import type { PracticeMode } from "@/types/practice";

interface PracticeCockpitSessionProps {
  subjectCode: string;
  practiceMode: PracticeMode;
  onTriggerRemountReset: () => void;
}

const PracticeCockpitSession: React.FC<PracticeCockpitSessionProps> = ({
  subjectCode,
  practiceMode,
  onTriggerRemountReset,
}) => {
  const navigate = useNavigate();
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isMobileNavigatorOpen, setIsMobileNavigatorOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [failedDiagramIds, setFailedDiagramIds] = useState<Record<string, boolean>>({});

  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const previousQuestionIdRef = useRef<string | null>(null);

  const zoomPan = useZoomPan({
    minZoom: 0.5,
    maxZoom: 3.0,
    zoomStep: 0.25,
    initialZoom: 1.0,
  });

  const adapter = usePracticeWorkspaceAdapter(
    subjectCode,
    practiceMode,
    onTriggerRemountReset
  );

  const resetPanRef = useRef(zoomPan.setPanOffset);
  resetPanRef.current = zoomPan.setPanOffset;

  const activeQuestionId = adapter.currentCard?.questionId ?? "";
  const hasVisualMedia =
    Boolean(resolveImageUrl(adapter.currentCard?.imageUrl)) &&
    !failedDiagramIds[activeQuestionId];

  // Move focus cleanly to question heading and reset diagram pan when advancing to a different card
  useEffect(() => {
    const activeId = adapter.currentCard?.questionId ?? null;
    if (previousQuestionIdRef.current !== activeId) {
      resetPanRef.current({ x: 0, y: 0 });
    }
    if (
      activeId &&
      previousQuestionIdRef.current &&
      previousQuestionIdRef.current !== activeId &&
      headingRef.current
    ) {
      headingRef.current.focus();
    }
    previousQuestionIdRef.current = activeId;
  }, [adapter.currentCard?.questionId]);

  const isEvaluated = adapter.evaluation?.status === "resolved";
  const currentCard = adapter.currentCard;
  const canContinue =
    isEvaluated ||
    (adapter.feedbackMode === "deferred" &&
      adapter.selectedOptions.length > 0 &&
      !adapter.isAdvancingDeferred);

  // Unified workspace keyboard shortcuts
  useWorkspaceShortcuts({
    sortedOptionKeys: adapter.sortedOptionKeys,
    isOptionsLocked:
      adapter.sessionStatus !== "ready" ||
      isEvaluated ||
      adapter.isEvaluating ||
      adapter.isAdvancingDeferred,
    isContinueReady: canContinue,
    canSubmitMultiChoice: Boolean(
      currentCard?.questionType === "multiple_choice" &&
        adapter.feedbackMode === "instant" &&
        adapter.selectedOptions &&
        !isEvaluated &&
        !adapter.isEvaluating
    ),
    feedbackResolvedAt: adapter.evaluation?.resolvedAt ?? null,
    hasVisualMedia,
    isModalOpen:
      adapter.sessionStatus !== "ready" ||
      isShortcutHelpOpen ||
      adapter.isAiModalOpen ||
      (practiceMode === "cram" && adapter.cram.isBatchCompleted) ||
      (practiceMode === "learn" && adapter.learn.isRoundCompleted),
    onSelectOption: adapter.selectOption,
    onSubmitMultiChoice: () => {
      void adapter.submitCheck();
    },
    onContinue: adapter.advanceNext,
    onZoomIn: zoomPan.zoomIn,
    onZoomOut: zoomPan.zoomOut,
    onResetZoom: zoomPan.resetZoom,
    onOpenShortcuts: () => setIsShortcutHelpOpen(true),
  });

  if (adapter.sessionStatus === "loading") {
    return (
      <div className="max-w-4xl mx-auto w-full px-space-4 py-space-6 flex flex-col gap-space-4">
        <div className="h-14 bg-color-7 border-2 border-color-1 rounded-2xl animate-pulse" />
        <div className="h-96 bg-color-7 border-2 border-color-1 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (adapter.sessionStatus === "error" || adapter.sessionStatus === "empty") {
    return (
      <div className="max-w-xl mx-auto w-full px-space-3 sm:px-space-4 py-space-5 sm:py-space-6 text-center">
        <Card className="p-space-4 sm:p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col items-center gap-space-4">
          <h1 className="text-text-lg font-bold text-color-1">
            {adapter.loadErrorMessage ||
              "Không có câu hỏi luyện tập nào khả dụng cho môn này."}
          </h1>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/subjects/${subjectCode}`)}
            className="min-h-11"
          >
            Quay lại môn học
          </Button>
        </Card>
      </div>
    );
  }

  if (adapter.sessionStatus === "completed") {
    return (
      <div className="max-w-xl mx-auto w-full px-space-3 sm:px-space-4 py-space-5 sm:py-space-6 text-center">
        <Card className="p-space-4 sm:p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col items-center gap-space-4">
          <div className="w-16 h-16 rounded-full bg-color-5 border-2 border-color-1 flex items-center justify-center text-color-1 shadow-xs">
            <Trophy className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-text-xl font-bold text-color-1">
            Tuyệt vời! Bạn đã hoàn thành toàn bộ bài luyện!
          </h1>
          <p className="text-text-sm font-medium text-color-1 max-w-md">
            {practiceMode === "cram"
              ? `Bạn đã ôn tập cấp tốc thành công ${adapter.cram.deckPool.length} câu hỏi của môn ${subjectCode}.`
              : `Bạn đã ghi nhớ sâu sắc tất cả câu hỏi của môn ${subjectCode} vào bộ nhớ dài hạn.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-space-3 w-full pt-space-2">
            <Button
              variant="secondary"
              size="md"
              onClick={adapter.resetPracticeSession}
              className="min-h-11 flex-1 flex items-center justify-center gap-space-2 border-2 border-color-1 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện lại từ đầu</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/subjects/${subjectCode}`)}
              className="min-h-11 flex-1 flex items-center justify-center gap-space-2"
            >
              <Home className="w-4 h-4" />
              <span>Về trang môn học</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <StudyCockpitShell
      hasVisualMedia={hasVisualMedia}
      header={
        <CockpitHeader
          title={adapter.descriptor.title}
          exitLabel={adapter.descriptor.exitLabel}
          onExit={() => navigate(adapter.descriptor.exitRoute)}
          progressLabel={
            practiceMode === "cram"
              ? `Tiến độ Cram: ${adapter.cram.masteredIds.size}/${adapter.deckSize} câu`
              : `Tiến độ Learn: ${adapter.learn.graduatedPool.length}/${adapter.deckSize} câu đã thuộc`
          }
          progressCurrent={
            practiceMode === "cram"
              ? adapter.cram.masteredIds.size
              : adapter.learn.graduatedPool.length
          }
          progressTotal={adapter.deckSize || adapter.progressTotal}
          progressCurrentBadge={
            practiceMode === "cram"
              ? adapter.cram.masteredIds.size
              : adapter.learn.graduatedPool.length
          }
          progressTotalBadge={adapter.deckSize || adapter.progressTotal}
          progressVariant={practiceMode}
          learnActiveCount={adapter.learn.activePool.length}
          modeSubLegend={
            practiceMode === "learn" ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-color-3 border border-color-1"
                    aria-hidden="true"
                  />
                  <span>Đã thuộc ({adapter.learn.graduatedPool.length})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-color-5 border border-color-1"
                    aria-hidden="true"
                  />
                  <span>Đang học ({adapter.learn.activePool.length})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-color-6 border border-color-1"
                    aria-hidden="true"
                  />
                  <span>Chưa học ({adapter.learn.waitingPool.length})</span>
                </span>
              </>
            ) : undefined
          }
          modeSwitcher={{
            currentMode: practiceMode,
            label: practiceMode === "cram" ? "Cram" : "Learn",
            options: [
              { value: "cram", label: "Luyện thi (Cram)" },
              { value: "learn", label: "Ghi nhớ (Learn)" },
            ],
            onSelectMode: (targetMode) => {
              if (targetMode !== practiceMode) {
                navigate(`/subjects/${subjectCode}/practice/${targetMode}`);
              }
            },
          }}
          answerSourceToggle={{
            ariaLabel: "Nguồn đáp án",
            value: adapter.benchmarkMode,
            options: [
              { value: "ai", label: "Đáp án AI" },
              { value: "community", label: "Cộng đồng" },
            ],
            onChange: (value) => {
              adapter.setBenchmarkMode(value === "community" ? "community" : "ai");
            },
          }}
          onOpenShortcuts={() => setIsShortcutHelpOpen(true)}
          onResetAction={() => setIsResetConfirmOpen(true)}
          resetLabel="Luyện lại từ đầu"
        />
      }
      stageContent={
        currentCard ? (
          <QuestionStage
            question={currentCard}
            badgeSlot={adapter.masteryBadge}
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
            selectedOptions={adapter.selectedOptions}
            feedbackMode={adapter.feedbackMode === "instant" ? "instant" : "post_exam"}
            evaluation={adapter.evaluation}
            isOptionsLocked={isEvaluated || adapter.isAdvancingDeferred}
            onSelectOption={adapter.selectOption}
          />
        ) : null
      }
      evaluationBanner={
        <FeedbackExplanationCard
          evaluation={adapter.evaluation}
          onContinue={isEvaluated ? adapter.advanceNext : undefined}
          onRetry={() => {
            void adapter.retryEvaluation();
          }}
        />
      }
      mobileInlineKeypad={
        currentCard &&
        (hasVisualMedia ||
          (currentCard.questionType === "multiple_choice" &&
            adapter.feedbackMode === "instant" &&
            !isEvaluated)) ? (
          <div className="bg-color-7 border-2 border-color-1 rounded-3xl p-space-3 flex flex-col gap-space-2 shadow-xs">
            {hasVisualMedia && (
              <div className="grid grid-cols-4 gap-space-1">
                {adapter.sortedOptionKeys.map((key) => {
                  const isSelected = adapter.selectedOptions.includes(key);
                  return (
                    <button
                      key={`mob-${key}`}
                      type="button"
                      disabled={isEvaluated || adapter.isAdvancingDeferred}
                      aria-pressed={isSelected}
                      aria-label={`Chọn nhanh ${key}`}
                      onClick={() => adapter.selectOption(key)}
                      className={`min-h-11 rounded-2xl border-2 font-bold text-text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-color-2 text-color-7 border-color-1"
                          : "bg-color-6 text-color-1 border-color-1 hover:bg-color-5/30"
                      }`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            )}
            {currentCard.questionType === "multiple_choice" &&
              adapter.feedbackMode === "instant" &&
              !isEvaluated && (
                <Button
                  variant="primary"
                  size="md"
                  isLoading={adapter.isEvaluating}
                  disabled={!adapter.selectedOptions || adapter.isAdvancingDeferred}
                  onClick={() => {
                    void adapter.submitCheck();
                  }}
                  className="min-h-11 w-full inline-flex items-center justify-center gap-space-1"
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {adapter.selectedOptions
                      ? `Xác nhận (${adapter.selectedOptions.length})`
                      : "Kiểm tra đáp án"}
                  </span>
                </Button>
              )}
          </div>
        ) : null
      }
      navigatorContent={
        currentCard ? (
          <CockpitInspectorRail
            mode={practiceMode}
            options={currentCard.options}
            sortedOptionKeys={adapter.sortedOptionKeys}
            selectedOptions={adapter.selectedOptions}
            questionType={currentCard.questionType}
            feedbackMode={adapter.feedbackMode === "instant" ? "instant" : "post_exam"}
            evaluation={adapter.evaluation}
            isLocked={isEvaluated || adapter.isAdvancingDeferred}
            isSubmitting={adapter.isEvaluating}
            allowsClear={adapter.feedbackMode === "deferred"}
            hasInlineCardOptions={!hasVisualMedia}
            onSelectOption={adapter.selectOption}
            onClearSelection={adapter.clearSelection}
            onSubmitMultiChoice={() => {
              void adapter.submitCheck();
            }}
            statsSummaryLabel={adapter.statsSummaryLabel}
            subProgressText={adapter.subProgressText}
            masteryBadge={adapter.masteryBadge}
            navigatorItems={adapter.navigatorItems}
            isMobileDrawerOpen={isMobileNavigatorOpen}
            onCloseMobileDrawer={() => setIsMobileNavigatorOpen(false)}
          />
        ) : null
      }
      mobileStatusLabel={adapter.subProgressText}
      canPrev={false}
      canNext={canContinue}
      onNext={adapter.advanceNext}
      onOpenMobileNavigator={() => setIsMobileNavigatorOpen(true)}
      onOpenAiAnalysis={adapter.openAiAnalysis}
      aiButtonLabel="AI Explanation"
      modals={
        <>
          {practiceMode === "cram" && (
            <CramBatchModal
              isOpen={adapter.cram.isBatchCompleted}
              batchNumber={adapter.cram.batchIndex + 1}
              totalBatches={adapter.cram.totalBatches}
              batchSize={adapter.cram.currentBatch.length}
              cumulativeMastered={adapter.cram.masteredIds.size}
              totalDeckSize={adapter.deckSize}
              onContinueNextBatch={adapter.continueNextBatch}
              onFinishSession={() => navigate(`/subjects/${subjectCode}`)}
            />
          )}

          {practiceMode === "learn" && (
            <LearnRoundSummaryModal
              isOpen={adapter.learn.isRoundCompleted}
              roundDiagnostic={adapter.learn.currentRoundDiagnostic}
              activePoolCount={adapter.learn.activePool.length}
              waitingCount={adapter.learn.waitingPool.length}
              graduatedCount={adapter.learn.graduatedPool.length}
              totalDeckSize={adapter.deckSize}
              onContinueNextRound={adapter.continueNextRound}
              onFinishSession={() => navigate(`/subjects/${subjectCode}`)}
            />
          )}

          {currentCard && (
            <AiAnswerModal
              isOpen={adapter.isAiModalOpen}
              onClose={adapter.closeAiAnalysis}
              questionNumber={currentCard.questionNumber}
              questionText={currentCard.questionText}
              imageUrl={currentCard.imageUrl}
              options={currentCard.options}
              selectedOption={adapter.selectedOptions || null}
              correctAnswer={adapter.aiModalState.aiChoice ?? ""}
              aiExplanation={adapter.aiModalState.aiExplanation ?? ""}
              optionByOptionAnalysis={adapter.aiModalState.optionByOptionAnalysis ?? undefined}
              isLoading={adapter.aiModalState.isLoading}
              errorMessage={adapter.aiModalState.errorMessage}
              onRetry={() => {
                void adapter.retryAiAnalysis();
              }}
            />
          )}

          <ShortcutHelpModal
            isOpen={isShortcutHelpOpen}
            onClose={() => setIsShortcutHelpOpen(false)}
            mode="practice"
            hasVisualMedia={hasVisualMedia}
          />

          <Modal
            isOpen={isResetConfirmOpen}
            onClose={() => setIsResetConfirmOpen(false)}
            title="Xác nhận đặt lại tiến độ"
            size="sm"
          >
            <div className="flex flex-col gap-space-4">
              <div className="flex items-start gap-space-3 p-space-4 rounded-2xl bg-color-5/25 border-2 border-color-1 text-color-1">
                <div className="w-10 h-10 rounded-full bg-color-5 text-color-1 border-2 border-color-1 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-space-1">
                  <p className="text-text-sm font-bold text-color-1">
                    Đặt lại toàn bộ tiến độ luyện tập?
                  </p>
                  <p className="text-text-xs font-medium text-color-1">
                    Hành động này sẽ xóa các câu đã thuộc của môn {subjectCode} trong chế độ này và bắt đầu lại từ đầu.
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-space-2 pt-space-2 border-t-2 border-color-6">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="min-h-11"
                >
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsResetConfirmOpen(false);
                    adapter.resetPracticeSession();
                  }}
                  className="min-h-11"
                >
                  Đặt lại tiến độ
                </Button>
              </div>
            </div>
          </Modal>
        </>
      }
    />
  );
};

export const PracticeWorkspaceView: React.FC = () => {
  const { code, mode } = useParams<{ code: string; mode: string }>();
  const subjectCode = code || "MAD101";
  const practiceMode: PracticeMode = mode === "learn" ? "learn" : "cram";
  const [sessionResetCounter, setSessionResetCounter] = useState(0);

  useEffect(() => {
    document.title = `${
      practiceMode === "cram" ? "Luyện thi cấp tốc" : "Học ghi nhớ"
    } - ${subjectCode} | FUO Learning`;
  }, [practiceMode, subjectCode]);

  return (
    <PracticeCockpitSession
      key={`${subjectCode}-${practiceMode}-${sessionResetCounter}`}
      subjectCode={subjectCode}
      practiceMode={practiceMode}
      onTriggerRemountReset={() => setSessionResetCounter((prev) => prev + 1)}
    />
  );
};

export default PracticeWorkspaceView;
