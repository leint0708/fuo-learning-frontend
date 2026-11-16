import React, { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, CheckSquare, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useZoomPan } from "@/hooks/useZoomPan";
import { resolveImageUrl } from "@/utils/imageUrl";
import type { Question } from "@/types/exam";
import type { WorkspaceCardBadge } from "./types";

export interface QuestionStageProps {
  question: Question;
  badgeSlot?: WorkspaceCardBadge | null;
  zoomPan?: ReturnType<typeof useZoomPan>;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
  onMediaAvailabilityChange?: (hasVisualMedia: boolean) => void;
}

/**
 * Shared Question Presentation Stage across Study & Exam workspaces.
 * Renders interactive pan/zoom/pinch for diagrams and clean selectable text for text-only stems.
 */
export const QuestionStage: React.FC<QuestionStageProps> = ({
  question,
  badgeSlot,
  zoomPan: externalZoomPan,
  headingRef,
  onMediaAvailabilityChange,
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

  return (
    <section
      data-impeccable-ignore="hard-offset-shadow"
      aria-label={`Nội dung câu ${question.questionNumber}`}
      className="flex flex-col bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm overflow-hidden"
    >
      {/* Question Stem Header */}
      <div className="px-space-4 py-space-3 border-b-2 border-color-6 flex flex-wrap items-center justify-between gap-space-2 bg-color-7">
        <div className="flex flex-wrap items-center gap-space-2">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-text-sm font-bold text-color-1 outline-none"
          >
            <Badge variant="primary">
              Câu {question.questionNumber}
              {showInteractiveDiagram ? ` (${Math.round(zoomLevel * 100)}%)` : ""}
            </Badge>
          </h2>

          {!showInteractiveDiagram && question.questionIdCode && (
            <span className="text-text-xs font-bold text-color-1/75">
              {question.questionIdCode}
            </span>
          )}

          {badgeSlot && <Badge variant={badgeVariant}>{badgeSlot.label}</Badge>}
        </div>

        <span className="inline-flex items-center gap-space-1 px-space-3 py-space-1 rounded-full bg-color-6 text-color-1 border-2 border-color-1 text-text-2xs font-bold">
          {question.questionType === "multiple_choice" ? (
            <>
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Nhiều đáp án</span>
            </>
          ) : (
            <>
              <CircleDot className="w-3.5 h-3.5" />
              <span>Một đáp án</span>
            </>
          )}
        </span>
      </div>

      {/* Stem Copy (Shown for Text-Only Questions When No Image Is Present) */}
      {question.questionText && !resolvedSrc && (
        <div className="px-space-4 pt-space-3 pb-space-3 border-b border-color-6 bg-color-7">
          <p className="text-text-sm sm:text-text-base font-bold text-color-1 leading-relaxed whitespace-pre-wrap select-text">
            {question.questionText}
          </p>
        </div>
      )}

      {/* Interactive Diagram Canvas OR Outside-Drag Image Retry Fallback */}
      {showInteractiveDiagram && imageSrcWithRetry && (
        <>
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
            className={`relative min-h-[200px] max-h-[38vh] sm:min-h-[260px] sm:max-h-[45vh] md:min-h-[380px] md:max-h-[60vh] overflow-hidden select-none bg-color-6/60 flex items-start justify-center p-space-2 sm:p-space-4 ${
              isPanActive ? "touch-none" : "touch-pan-y"
            } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center p-space-6">
                <div className="w-full h-full rounded-2xl bg-color-6 border-2 border-color-1 flex items-center justify-center text-text-xs font-bold text-color-1/75">
                  Đang tải hình ảnh câu hỏi...
                </div>
              </div>
            )}

            <div style={transformStyle} className="w-full flex justify-center">
              <img
                src={imageSrcWithRetry}
                alt={`Hình minh họa câu ${question.questionNumber} (${question.questionIdCode})`}
                onLoad={() => setIsImageLoading(false)}
                onError={() => {
                  setIsImageLoading(false);
                  setImageError(true);
                }}
                draggable={false}
                className="max-w-full h-auto rounded-2xl border-2 border-color-1 bg-color-7 shadow-xs pointer-events-none"
              />
            </div>
          </div>

          {/* Bottom Diagram Controls */}
          <div className="px-space-3 sm:px-space-4 py-space-2 border-t-2 border-color-1 bg-color-7 flex flex-wrap items-center justify-between gap-space-2">
            <span className="text-text-2xs font-bold text-color-1/75 md:hidden">
              Chụm 2 ngón để phóng to / thu nhỏ
            </span>
            <span className="text-text-2xs font-bold text-color-1/75 hidden md:inline">
              Kéo để di chuyển • Ctrl + Cuộn hoặc chụm ngón tay để phóng to / thu nhỏ
            </span>
            <div className="flex flex-wrap items-center gap-space-2 mx-auto md:mx-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={zoomIn}
                disabled={zoomLevel >= 3.0}
                aria-label="Phóng to"
                title="Phóng to (+)"
                className="min-h-11 flex items-center gap-space-1"
              >
                <ZoomIn className="w-4 h-4" />
                <span>Phóng to</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
                aria-label="Thu nhỏ"
                title="Thu nhỏ (-)"
                className="min-h-11 flex items-center gap-space-1"
              >
                <ZoomOut className="w-4 h-4" />
                <span>Thu nhỏ</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={resetZoom}
                aria-label="Kích thước gốc"
                title="Kích thước gốc (0)"
                className="min-h-11 flex items-center gap-space-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Kích thước gốc</span>
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Image Error Fallback Outside Drag Capture (Text Remains 100% Selectable) */}
      {resolvedSrc && imageError && (
        <div className="p-space-5 bg-color-6/50 flex flex-col items-center text-center gap-space-3">
          <div className="w-11 h-11 rounded-full bg-color-5 text-color-1 border-2 border-color-1 flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          {question.questionText && (
            <p className="text-text-sm sm:text-text-base font-bold text-color-1 leading-relaxed max-w-2xl whitespace-pre-wrap select-text">
              {question.questionText}
            </p>
          )}
          <span className="text-text-xs font-bold text-color-1">
            Không tải được hình ảnh ({question.questionIdCode}).
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setImageError(false);
              setIsImageLoading(true);
              setRetrySeed((prev) => prev + 1);
            }}
            className="min-h-11 inline-flex items-center gap-space-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử tải lại hình ảnh</span>
          </Button>
        </div>
      )}
    </section>
  );
};
