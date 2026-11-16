import React, { useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  CheckSquare,
  CircleDot,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useZoomPan } from "@/hooks/useZoomPan";
import { resolveImageUrl } from "@/utils/imageUrl";
import type { FeedbackMode, Question } from "@/types/exam";
import type { WorkspaceCardBadge, WorkspaceEvaluationResult } from "./types";

export interface QuestionStageProps {
  question: Question;
  badgeSlot?: WorkspaceCardBadge | null;
  zoomPan?: ReturnType<typeof useZoomPan>;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
  onMediaAvailabilityChange?: (hasVisualMedia: boolean) => void;
  // Optional synced inline options inside the crisp white card for text-only stems
  selectedOptions?: string | null;
  feedbackMode?: FeedbackMode;
  evaluation?: WorkspaceEvaluationResult | null;
  isOptionsLocked?: boolean;
  onSelectOption?: (optionKey: string) => void;
}

/**
 * Shared White-Paper Question Card centered in the study canvas:
 * - Image questions render pan/zoom screenshot + subtle top-right zoom controls (no duplicated OCR stem)
 * - Text-only questions render crisp stem + divider + synced interactive option lines (A. B. C. D.)
 */
export const QuestionStage: React.FC<QuestionStageProps> = ({
  question,
  badgeSlot,
  zoomPan: externalZoomPan,
  headingRef,
  onMediaAvailabilityChange,
  selectedOptions = "",
  feedbackMode = "instant",
  evaluation,
  isOptionsLocked = false,
  onSelectOption,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [retrySeed, setRetrySeed] = useState(0);

  const internalZoomPan = useZoomPan({
    minZoom: 0.5,
    maxZoom: 3.0,
    zoomStep: 0.25,
    initialZoom: 1.0,
  });

  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    containerRef,
    transformStyle,
    isDragging,
    isPanActive,
  } = externalZoomPan ?? internalZoomPan;

  const resolvedSrc = resolveImageUrl(question.imageUrl);
  const showInteractiveDiagram = Boolean(resolvedSrc) && !imageError;

  useEffect(() => {
    setImageError(false);
    setIsImageLoading(true);
  }, [resolvedSrc, question.questionIdCode, retrySeed]);

  useEffect(() => {
    onMediaAvailabilityChange?.(showInteractiveDiagram);
  }, [showInteractiveDiagram, onMediaAvailabilityChange]);

  const badgeVariant =
    badgeSlot?.tone === "accent"
      ? "success"
      : badgeSlot?.tone === "warning"
        ? "warning"
        : badgeSlot?.tone === "danger"
          ? "danger"
          : badgeSlot?.tone === "primary"
            ? "primary"
            : "default";

  const imageSrcWithRetry =
    resolvedSrc && retrySeed > 0
      ? `${resolvedSrc}${resolvedSrc.includes("?") ? "&" : "?"}retry=${retrySeed}`
      : resolvedSrc;

  const sortedOptionKeys = Object.keys(question.options || {}).sort((a, b) =>
    a.localeCompare(b)
  );
  const currentSelection = selectedOptions ?? "";
  const isEvaluated =
    feedbackMode === "instant" &&
    evaluation?.status === "resolved" &&
    evaluation.correctAnswer !== null;

  const inlineOptionsList =
    onSelectOption && sortedOptionKeys.length > 0 ? (
      <div
        role="group"
        aria-label="Các phương án trả lời trong câu hỏi"
        className="pt-space-3 border-t border-color-6 flex flex-col gap-space-1.5"
      >
        {sortedOptionKeys.map((key) => {
          const text = question.options?.[key];
          const isSelected = currentSelection.includes(key);
          const isCorrectKey = isEvaluated && evaluation?.correctAnswer?.includes(key);

          let rowClass =
            "bg-color-7 text-color-1 border-transparent hover:bg-color-6 hover:border-color-1/40";
          let statusIcon: React.ReactNode = null;

          if (isEvaluated) {
            if (isSelected && isCorrectKey) {
              rowClass = "bg-color-3/15 text-color-1 border-color-3 font-bold";
              statusIcon = <Check className="w-4 h-4 text-color-3 shrink-0" aria-hidden="true" />;
            } else if (isSelected && !isCorrectKey) {
              rowClass = "bg-color-4/15 text-color-1 border-color-4 font-bold";
              statusIcon = <X className="w-4 h-4 text-color-1 shrink-0" aria-hidden="true" />;
            } else if (isCorrectKey) {
              rowClass = "bg-color-3/10 text-color-1 border-color-3 border-dashed font-bold";
              statusIcon = <Check className="w-4 h-4 text-color-3 shrink-0" aria-hidden="true" />;
            }
          } else if (isSelected) {
            rowClass = "bg-color-2/10 text-color-1 border-color-2 font-bold";
          }

          return (
            <button
              key={key}
              type="button"
              disabled={isOptionsLocked}
              aria-pressed={isSelected}
              aria-label={text ? `Đáp án ${key}: ${text}` : `Đáp án ${key}`}
              onClick={() => onSelectOption(key)}
              className={`min-h-11 w-full px-space-3 py-space-2 rounded-2xl border-2 flex items-center justify-between gap-space-2 text-left text-text-xs sm:text-text-sm transition-colors duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 disabled:cursor-default ${rowClass}`}
            >
              <span className="min-w-0 flex-1 leading-snug break-words">
                <span className="font-bold text-color-2 mr-space-1">{key}.</span>
                <span className="font-medium text-color-1">
                  {text || `Chọn phương án ${key}`}
                </span>
              </span>
              {statusIcon}
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <div className={`w-full flex flex-col gap-space-2 ${showInteractiveDiagram ? "flex-1 min-h-0" : ""}`}>
      {showInteractiveDiagram && imageSrcWithRetry ? (
        /* Full-bleed edge-to-edge diagram viewport: wraps cleanly on < sm so pills never collide with zoom controls */
        <section
          data-impeccable-ignore="hard-offset-shadow"
          aria-label={`Nội dung câu ${question.questionNumber}`}
          className="relative flex-1 min-h-[280px] sm:min-h-[420px] lg:min-h-[500px] w-full overflow-hidden rounded-2xl border-2 border-color-1 bg-color-7 flex flex-col"
        >
          {/* Non-overlapping header row on mobile (< sm); floating top overlay on sm+ */}
          <div className="relative sm:absolute sm:inset-x-0 sm:top-0 z-10 flex flex-wrap items-center justify-between gap-space-1.5 sm:gap-space-2 p-space-2 sm:p-space-3 bg-color-7/95 sm:bg-transparent border-b border-color-1/15 sm:border-b-0 sm:pointer-events-none">
            <div className="flex flex-wrap items-center gap-space-1.5 sm:gap-space-2 min-w-0">
              <div className="sm:pointer-events-auto inline-flex items-center gap-space-2 px-space-2.5 sm:px-space-3 py-space-1 rounded-full bg-color-7/95 border-2 border-color-1 shadow-2xs">
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-text-2xs sm:text-text-xs font-bold text-color-2 outline-none whitespace-nowrap"
                >
                  Câu {question.questionNumber} ({Math.round(zoomLevel * 100)}%)
                </h2>
              </div>

              <span className="sm:pointer-events-auto inline-flex items-center gap-space-1 px-space-2 sm:px-space-2.5 py-space-1 rounded-full bg-color-7/95 text-color-1 border border-color-1/40 text-text-2xs font-bold whitespace-nowrap">
                {question.questionType === "multiple_choice" ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-color-2" aria-hidden="true" />
                    <span>Nhiều đáp án</span>
                  </>
                ) : (
                  <>
                    <CircleDot className="w-3.5 h-3.5 text-color-2" aria-hidden="true" />
                    <span>Một đáp án</span>
                  </>
                )}
              </span>

              {badgeSlot && (
                <div className="sm:pointer-events-auto">
                  <Badge variant={badgeVariant}>{badgeSlot.label}</Badge>
                </div>
              )}
            </div>

            <div className="sm:pointer-events-auto flex items-center gap-space-1 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
                aria-label="Thu nhỏ"
                title="Thu nhỏ (-)"
                className="min-h-11 min-w-11 px-space-2 inline-flex items-center justify-center rounded-full shadow-2xs"
              >
                <ZoomOut className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetZoom}
                aria-label="Kích thước gốc"
                title="Kích thước gốc (0)"
                className="min-h-11 min-w-11 px-space-2 inline-flex items-center justify-center rounded-full shadow-2xs"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={zoomIn}
                disabled={zoomLevel >= 3.0}
                aria-label="Phóng to"
                title="Phóng to (+)"
                className="min-h-11 min-w-11 px-space-2 inline-flex items-center justify-center rounded-full shadow-2xs"
              >
                <ZoomIn className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Edge-to-edge Interactive Pan & Zoom Viewport */}
          <div
            ref={containerRef}
            data-testid="question-stage-viewport"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={`flex-1 w-full h-full min-h-[260px] sm:min-h-[420px] lg:min-h-[500px] overflow-hidden select-none bg-color-7 flex items-center justify-center p-space-2 sm:p-space-4 sm:pt-16 ${
              isPanActive ? "touch-none" : "touch-pan-y"
            } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center p-space-4">
                <div className="w-full h-full rounded-2xl bg-color-6 border-2 border-color-1 flex items-center justify-center text-text-xs font-bold text-color-1/75">
                  Đang tải hình ảnh câu hỏi...
                </div>
              </div>
            )}

            <div style={transformStyle} className="w-full h-full flex items-center justify-center">
              <img
                src={imageSrcWithRetry}
                alt={`Hình minh họa câu ${question.questionNumber} (${question.questionIdCode})`}
                onLoad={() => setIsImageLoading(false)}
                onError={() => {
                  setIsImageLoading(false);
                  setImageError(true);
                }}
                draggable={false}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl bg-color-7 pointer-events-none"
              />
            </div>
          </div>
        </section>
      ) : (
        /* White Paper Question Card for text-only stems and image error fallback */
        <section
          data-impeccable-ignore="hard-offset-shadow"
          aria-label={`Nội dung câu ${question.questionNumber}`}
          className="flex flex-col bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm overflow-hidden"
        >
          {/* Card Header Strip */}
          <div className="px-space-4 py-space-2 border-b-2 border-color-6 flex flex-wrap items-center justify-between gap-space-2 bg-color-6/60">
            <div className="flex flex-wrap items-center gap-space-2">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-text-xs sm:text-text-sm font-bold text-color-2 outline-none"
              >
                Câu {question.questionNumber}
              </h2>

              {question.questionIdCode && (
                <span className="text-[13px] font-bold text-color-1/70">
                  {question.questionIdCode}
                </span>
              )}

              {badgeSlot && <Badge variant={badgeVariant}>{badgeSlot.label}</Badge>}
            </div>

            <span className="inline-flex items-center gap-space-1 px-space-2 sm:px-space-3 py-0.5 rounded-full bg-color-7 text-color-1 border border-color-1 text-[12px] font-bold">
              {question.questionType === "multiple_choice" ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-color-2" aria-hidden="true" />
                  <span>Nhiều đáp án</span>
                </>
              ) : (
                <>
                  <CircleDot className="w-3.5 h-3.5 text-color-2" aria-hidden="true" />
                  <span>Một đáp án</span>
                </>
              )}
            </span>
          </div>

          {/* Text-Only Question Body: Crisp Stem + Synced Inline Options */}
          {!resolvedSrc && (
            <div className="p-space-4 sm:p-space-5 flex flex-col gap-space-4 bg-color-7">
              {question.questionText && (
                <p className="text-text-sm sm:text-text-base font-bold text-color-1 leading-relaxed whitespace-pre-wrap select-text">
                  {question.questionText}
                </p>
              )}

              {inlineOptionsList}
            </div>
          )}

          {resolvedSrc && imageError && (
            <div className="p-space-4 bg-color-7 flex flex-col gap-space-3">
              {question.questionText && (
                <p className="text-text-sm sm:text-text-base font-bold text-color-1 leading-relaxed whitespace-pre-wrap select-text">
                  {question.questionText}
                </p>
              )}
              {inlineOptionsList}
              <div className="p-space-4 rounded-2xl bg-color-5/20 border-2 border-color-1 text-center flex flex-col items-center gap-space-2">
                <div className="w-10 h-10 rounded-full bg-color-5 border-2 border-color-1 flex items-center justify-center text-color-1">
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="text-text-xs font-bold text-color-1">
                  Không tải được hình ảnh ({question.questionIdCode}). Vui lòng kiểm tra nội dung câu hỏi hoặc thử tải lại ảnh.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRetrySeed((prev) => prev + 1)}
                  className="min-h-11 inline-flex items-center gap-space-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Thử tải lại hình ảnh</span>
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
