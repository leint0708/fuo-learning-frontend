import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Zap, Brain, Trophy, RotateCcw, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StudyCockpitShell } from "@/features/workspace/StudyCockpitShell";
import { CockpitHeader } from "@/features/workspace/CockpitHeader";
import { QuestionStage } from "@/features/workspace/QuestionStage";
import { ChoiceOptionList } from "@/features/workspace/ChoiceOptionList";
import { FeedbackExplanationCard } from "@/features/workspace/FeedbackExplanationCard";
import { QuestionNavigator } from "@/features/workspace/QuestionNavigator";
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
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isMobileNavigatorOpen, setIsMobileNavigatorOpen] = useState(false);
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

  // Unified workspace keyboard shortcuts
  useWorkspaceShortcuts({
    sortedOptionKeys: adapter.sortedOptionKeys,
    isOptionsLocked:
      adapter.sessionStatus !== "ready" || isEvaluated || adapter.isEvaluating,
    isContinueReady: isEvaluated,
    canSubmitMultiChoice: Boolean(
      currentCard?.questionType === "multiple_choice" &&
        adapter.selectedOptions &&
        !isEvaluated &&
        !adapter.isEvaluating
    ),
    feedbackResolvedAt: adapter.evaluation?.resolvedAt ?? null,
    hasVisualMedia,
    isModalOpen:
      adapter.sessionStatus !== "ready" ||
      isShortcutHelpOpen ||
      isAiModalOpen ||
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
      <div className="max-w-xl mx-auto w-full px-space-4 py-space-8 text-center">
        <Card className="p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col items-center gap-space-4">
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
      <div className="max-w-xl mx-auto w-full px-space-4 py-space-8 text-center">
        <Card className="p-space-6 bg-color-7 border-2 border-color-1 shadow-sm flex flex-col items-center gap-space-4">
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
          progressLabel={adapter.progressLabel}
          progressCurrent={adapter.progressCurrent}
          progressTotal={adapter.progressTotal}
          modeBadge={{
            label: `${practiceMode === "cram" ? "Cấp tốc" : "Ghi nhớ"} • ${subjectCode}`,
            tone: practiceMode === "cram" ? "warning" : "accent",
          }}
          statusSlot={
            <div className="flex items-center gap-space-2">
              <span className="text-text-xs font-bold text-color-1 tabular-nums">
                {adapter.subProgressText}
              </span>
              <span className="inline-flex items-center gap-space-1 px-space-3 py-space-1 rounded-full bg-color-6 border-2 border-color-1 text-text-xs font-bold text-color-1 tabular-nums">
                {practiceMode === "cram" ? (
                  <span className="w-5 h-5 rounded-full bg-color-5 text-color-1 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                ) : (
                  <Brain className="w-4 h-4 text-color-2" aria-hidden="true" />
                )}
                <span>{adapter.statsSummaryLabel}</span>
              </span>
            </div>
          }
          onOpenShortcuts={() => setIsShortcutHelpOpen(true)}
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
          />
        ) : null
      }
      choiceContent={
        currentCard ? (
          <div className="flex flex-col gap-space-4">
            <ChoiceOptionList
              options={currentCard.options}
              selectedOptions={adapter.selectedOptions}
              questionType={currentCard.questionType}
              feedbackMode="instant"
              evaluation={adapter.evaluation}
              isLocked={isEvaluated}
              isSubmitting={adapter.isEvaluating}
              onSelectOption={adapter.selectOption}
              onSubmitMultiChoice={() => {
                void adapter.submitCheck();
              }}
            />

            <FeedbackExplanationCard
              evaluation={adapter.evaluation}
              onContinue={isEvaluated ? adapter.advanceNext : undefined}
              onRetry={() => {
                void adapter.retryEvaluation();
              }}
              onOpenAiModal={isEvaluated ? () => setIsAiModalOpen(true) : undefined}
            />
          </div>
        ) : null
      }
      navigatorContent={
        <QuestionNavigator
          title={practiceMode === "cram" ? "Danh sách thẻ đợt này" : "Nhóm thẻ đang học"}
          items={adapter.navigatorItems}
          activeIndex={adapter.activeNavIndex}
          answeredCount={adapter.answeredCount}
          totalCount={adapter.totalNavCount}
          onSelectQuestion={() => undefined}
          supportsFreeJump={false}
          isMobileDrawerOpen={isMobileNavigatorOpen}
          onOpenMobileDrawer={() => setIsMobileNavigatorOpen(true)}
          onCloseMobileDrawer={() => setIsMobileNavigatorOpen(false)}
        />
      }
      mobileStatusLabel={`${adapter.subProgressText}`}
      canPrev={false}
      canNext={isEvaluated}
      onNext={adapter.advanceNext}
      onOpenMobileNavigator={() => setIsMobileNavigatorOpen(true)}
      mobilePrimaryAction={
        isEvaluated ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAiModalOpen(true)}
            aria-label="Xem giải thích AI"
            className="min-h-11 inline-flex items-center gap-space-1"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI</span>
          </Button>
        ) : currentCard?.questionType === "multiple_choice" ? (
          <Button
            variant="primary"
            size="sm"
            disabled={!adapter.selectedOptions || adapter.isEvaluating}
            onClick={() => {
              void adapter.submitCheck();
            }}
            className="min-h-11"
          >
            Kiểm tra
          </Button>
        ) : null
      }
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
              isOpen={isAiModalOpen}
              onClose={() => setIsAiModalOpen(false)}
              questionNumber={currentCard.questionNumber}
              questionText={currentCard.questionText}
              imageUrl={currentCard.imageUrl}
              options={currentCard.options}
              selectedOption={adapter.selectedOptions || null}
              correctAnswer={adapter.evaluation?.correctAnswer ?? ""}
              aiExplanation={adapter.evaluation?.aiExplanation ?? ""}
              optionByOptionAnalysis={adapter.evaluation?.optionByOptionAnalysis ?? undefined}
            />
          )}

          <ShortcutHelpModal
            isOpen={isShortcutHelpOpen}
            onClose={() => setIsShortcutHelpOpen(false)}
            mode="practice"
            hasVisualMedia={hasVisualMedia}
          />
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
