import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  X,
  Bot,
  Users,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { resolveImageUrl } from "@/utils/imageUrl";
import { useZoomPan } from "@/hooks/useZoomPan";
import type { ReviewQuestionItem as ReviewItemType } from "@/types/review";

export interface ReviewContextBadge {
  label: string;
  tone?: "neutral" | "warning" | "success" | "danger";
}

export interface QuestionReviewItemProps {
  item: ReviewItemType;
  index: number;
  elementId?: string;
  isActive?: boolean;
  expandSignal?: { version: number; expanded: boolean };
  contextBadges?: ReviewContextBadge[];
  statusBadgeOverride?: { label: string; variant: "success" | "danger" | "warning" | "neutral" };
  firstSelectedLabel?: string | null;
  onOpenAiModal?: (item: ReviewItemType, displayNumber: number) => void;
  onFocusQuestion?: (displayNumber: number) => void;
}

function parseOptionSet(value?: string | null): Set<string> {
  if (!value) return new Set();
  const normalized = value.toUpperCase().replace(/[^A-Z]/g, "");
  return new Set(normalized.split("").filter(Boolean));
}

const QuestionReviewItemInner: React.FC<QuestionReviewItemProps> = ({
  item,
  index,
  elementId,
  isActive = false,
  expandSignal,
  contextBadges,
  statusBadgeOverride,
  firstSelectedLabel,
  onOpenAiModal,
  onFocusQuestion,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [retrySeed, setRetrySeed] = useState(0);

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
  } = useZoomPan({ minZoom: 0.5, maxZoom: 3.0, zoomStep: 0.25, initialZoom: 1.0 });

  const displayNumber = item.questionNumber > 0 ? item.questionNumber : index + 1;
  const resolvedSrc = resolveImageUrl(item.imageUrl);
  const showInteractiveDiagram = Boolean(resolvedSrc) && !imageError;

  const imageSrcWithRetry =
    resolvedSrc && retrySeed > 0
      ? `${resolvedSrc}${resolvedSrc.includes("?") ? "&" : "?"}retry=${retrySeed}`
      : resolvedSrc;

  useEffect(() => {
    setImageError(false);
    setIsImageLoading(Boolean(resolvedSrc));
  }, [resolvedSrc, item.questionIdCode, retrySeed]);

  useEffect(() => {
    if (expandSignal && expandSignal.version > 0) {
      setIsExpanded(expandSignal.expanded);
    }
  }, [expandSignal]);

  const isUserCorrect = item.isCorrect;
  const userChoice = item.selectedOptions || "Chưa chọn";
  const correctAnswer = item.correctAnswer || "";
  const selectedKeys = useMemo(() => parseOptionSet(item.selectedOptions), [item.selectedOptions]);
  const correctKeys = useMemo(() => parseOptionSet(correctAnswer), [correctAnswer]);

  const sortedOptions = useMemo(() => {
    if (!item.options) return [];
    return Object.entries(item.options).sort(([a], [b]) => a.localeCompare(b));
  }, [item.options]);

  const hasReadableOptionText = useMemo(
    () => sortedOptions.some(([, optionText]) => Boolean(optionText?.trim())),
    [sortedOptions]
  );

  const breakdownEntries = useMemo(() => {
    if (!item.optionByOptionAnalysis) return [];
    return Object.entries(item.optionByOptionAnalysis).sort(([a], [b]) => a.localeCompare(b));
  }, [item.optionByOptionAnalysis]);

  const hasCommunityData =
    Boolean(item.communityStats) && (item.communityStats?.validVoteCount ?? 0) > 0;
  const voteCount = item.communityStats?.validVoteCount ?? 0;
  const agreementPercent = Math.round((item.communityStats?.agreementRatio || 0) * 100);
  const trimmedQuestionText = item.questionText?.trim() || "";

  const handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomIn();
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomOut();
    } else if (e.key === "0") {
      e.preventDefault();
      resetZoom();
    }
  };

  return (
    <Card
      id={elementId}
      tabIndex={-1}
      onFocus={() => onFocusQuestion?.(displayNumber)}
      className={`scroll-mt-24 lg:scroll-mt-[216px] p-space-4 sm:p-space-5 bg-color-7 border-2 rounded-3xl shadow-sm space-y-space-3 sm:space-y-space-4 outline-none transition-colors duration-fast ${
        isActive
          ? "border-color-2 ring-4 ring-color-5/60"
          : "border-color-1 focus-visible:ring-4 focus-visible:ring-color-5"
      }`}
    >
      {/* Question Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-space-2 pb-space-3 border-b-2 border-color-6">
        <div className="flex flex-wrap items-center gap-space-2 min-w-0">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-text-xs border-2 border-color-1 tabular-nums shrink-0 ${
              isUserCorrect ? "bg-color-3 text-color-7" : "bg-color-4 text-color-1"
            }`}
          >
            {displayNumber}
          </span>
          <h3 className="font-bold text-text-base text-color-1 break-words">
            Câu {displayNumber} ({item.questionIdCode})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-space-1">
          {statusBadgeOverride ? (
            <Badge variant={statusBadgeOverride.variant} className="flex items-center gap-1 tabular-nums">
              <span>{statusBadgeOverride.label}</span>
            </Badge>
          ) : isUserCorrect ? (
            <Badge variant="success" className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Trả lời đúng</span>
            </Badge>
          ) : (
            <Badge variant="danger" className="flex items-center gap-1">
              <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Trả lời sai</span>
            </Badge>
          )}

          {hasCommunityData ? (
            <Badge variant="neutral" className="flex items-center gap-1 tabular-nums">
              <Users className="w-3.5 h-3.5 text-color-2 shrink-0" aria-hidden="true" />
              <span>
                Cộng đồng: {item.communityStats?.communityAnswer} ({agreementPercent}% ·{" "}
                {voteCount} lượt)
              </span>
            </Badge>
          ) : (
            <Badge variant="neutral" className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-color-2 shrink-0" aria-hidden="true" />
              <span>Nguồn: Đáp án AI (chưa có bình chọn)</span>
            </Badge>
          )}

          {contextBadges?.map((badge) => (
            <Badge
              key={badge.label}
              variant={badge.tone ?? "neutral"}
              className="tabular-nums"
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Text Stem (shown for text-only questions or whenever diagram loading fails) */}
      {!showInteractiveDiagram && trimmedQuestionText && (
        <div className="p-space-3 sm:p-space-4 bg-color-6/60 border-2 border-color-1/20 rounded-2xl">
          <p className="text-text-sm sm:text-text-base font-medium text-color-1 leading-relaxed whitespace-pre-wrap break-words">
            {trimmedQuestionText}
          </p>
        </div>
      )}

      {/* Diagram Error Fallback with Retry */}
      {resolvedSrc && imageError && (
        <div
          role="alert"
          className="p-space-3 sm:p-space-4 bg-color-4/15 border-2 border-color-4 rounded-2xl flex flex-wrap items-center justify-between gap-space-2"
        >
          <div className="flex items-center gap-space-2 min-w-0">
            <AlertTriangle className="w-5 h-5 text-color-1 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-text-xs sm:text-text-sm font-bold text-color-1">
                Không thể tải hình ảnh sơ đồ của câu {displayNumber}
              </p>
              <p className="text-text-xs text-color-1/80">
                {trimmedQuestionText
                  ? "Kiểm tra kết nối mạng hoặc nhấn thử tải lại ảnh. Nội dung văn bản vẫn được giữ nguyên bên trên."
                  : "Kiểm tra kết nối mạng hoặc nhấn thử tải lại ảnh."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setRetrySeed((s) => s + 1)}
            className="min-h-11 flex items-center gap-space-1 shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Thử tải lại ảnh</span>
          </Button>
        </div>
      )}

      {/* Question Diagram / Image with Zoom & Pan */}
      {showInteractiveDiagram && imageSrcWithRetry && (
        <div className="flex flex-col bg-color-6/40 border-2 border-color-1 rounded-2xl overflow-hidden shadow-2xs">
          {/* Canvas Viewport Area */}
          <div
            ref={containerRef}
            tabIndex={0}
            role="region"
            aria-label={`Sơ đồ câu hỏi ${displayNumber}, dùng phím + hoặc - để thu phóng`}
            onKeyDown={handleViewportKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onLostPointerCapture={handlePointerCancel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative flex items-center justify-center min-h-[220px] max-h-[460px] p-space-3 select-none overflow-hidden bg-color-6/30 outline-none focus-visible:ring-4 focus-visible:ring-color-5 ${
              isPanActive ? "touch-none" : "touch-pan-y"
            } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            {/* Zoom Level Indicator Tag */}
            <div className="absolute top-space-2 left-space-2 z-10 px-space-2 py-0.5 rounded-full bg-color-7 border-2 border-color-1 text-text-xs font-bold tabular-nums shadow-2xs">
              {Math.round(zoomLevel * 100)}%
            </div>

            {isImageLoading && (
              <div
                role="status"
                aria-live="polite"
                className="absolute inset-0 flex items-center justify-center bg-color-6/60 z-10"
              >
                <span className="px-space-3 py-space-1 rounded-full bg-color-7 border-2 border-color-1 text-text-xs font-bold text-color-1">
                  Đang tải hình ảnh...
                </span>
              </div>
            )}

            <div style={transformStyle} className="flex items-center justify-center max-w-full max-h-full">
              <img
                src={imageSrcWithRetry}
                alt={`Câu hỏi ${displayNumber}`}
                onLoad={() => setIsImageLoading(false)}
                onError={() => {
                  setIsImageLoading(false);
                  setImageError(true);
                }}
                className="max-h-72 w-auto object-contain rounded-xl pointer-events-none shadow-xs"
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Bottom Zoom Controls Bar */}
          <div className="px-space-3 py-space-1 border-t-2 border-color-1 bg-color-7 flex flex-wrap items-center justify-between gap-space-2">
            <span className="text-text-xs font-bold text-color-1/80 md:hidden">
              Chụm 2 ngón để thu phóng
            </span>
            <span className="text-text-xs font-bold text-color-1/80 hidden md:inline">
              Kéo để di chuyển • Ctrl + Cuộn chuột để thu phóng
            </span>
            <div className="flex flex-wrap items-center gap-space-1 ml-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={zoomIn}
                disabled={zoomLevel >= 3.0}
                className="min-h-11 flex items-center gap-1 px-space-2 sm:px-space-3 text-text-xs"
                title="Phóng to (Ctrl + Cuộn chuột lên)"
              >
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Phóng to</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
                className="min-h-11 flex items-center gap-1 px-space-2 sm:px-space-3 text-text-xs"
                title="Thu nhỏ (Ctrl + Cuộn chuột xuống)"
              >
                <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Thu nhỏ</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetZoom}
                className="min-h-11 flex items-center gap-1 px-space-2 sm:px-space-3 text-text-xs"
                title="Khôi phục kích thước gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kích thước gốc</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Option Text List OR Compact Key Strip (never duplicates both when options are present) */}
      {hasReadableOptionText ? (
        <ul aria-label="Danh sách các phương án" className="grid grid-cols-1 gap-space-1">
          {sortedOptions.map(([key, optionText]) => {
            const normalizedKey = key.toUpperCase();
            const isSelected = selectedKeys.has(normalizedKey);
            const isKeyCorrect = correctKeys.has(normalizedKey);

            let rowStyle = "bg-color-7 border-color-1/25 text-color-1";
            let statusTag: string | null = null;
            let statusIcon: React.ReactNode = null;

            if (isSelected && isKeyCorrect) {
              rowStyle = "bg-color-3/15 border-color-3 text-color-1 font-bold";
              statusTag = "Bạn chọn • Đúng";
              statusIcon = <Check className="w-4 h-4 text-color-3 shrink-0" aria-hidden="true" />;
            } else if (isSelected && !isKeyCorrect) {
              rowStyle = "bg-color-4/15 border-color-4 text-color-1 font-bold";
              statusTag = "Bạn chọn";
              statusIcon = <X className="w-4 h-4 text-color-1 shrink-0" aria-hidden="true" />;
            } else if (isKeyCorrect) {
              rowStyle = "bg-color-3/10 border-color-3 border-dashed text-color-1 font-bold";
              statusTag = "Đáp án đúng";
              statusIcon = <Check className="w-4 h-4 text-color-3 shrink-0" aria-hidden="true" />;
            }

            return (
              <li
                key={key}
                className={`px-space-3 py-space-2 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-space-2 text-text-xs sm:text-text-sm ${rowStyle}`}
              >
                <span className="min-w-0 flex-1 leading-snug break-words">
                  <span className="font-bold text-color-2 mr-space-1">{key}.</span>
                  <span>{optionText}</span>
                </span>
                {statusTag && (
                  <span className="inline-flex items-center gap-1 px-space-2 py-0.5 rounded-full bg-color-7 border border-color-1 text-text-xs font-bold text-color-1 shrink-0">
                    {statusIcon}
                    <span>{statusTag}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-2 p-space-3 bg-color-6 rounded-2xl border-2 border-color-1">
          <div className="flex items-center justify-between gap-space-2 px-space-3 py-space-1 bg-color-7 rounded-2xl border border-color-1/30 min-w-0">
            <span className="text-text-xs font-bold text-color-1/80">Đáp án bạn chọn:</span>
            <span
              className={`font-bold text-text-xs sm:text-text-sm px-space-2 py-0.5 rounded-full border-2 text-color-1 tabular-nums ${
                isUserCorrect
                  ? "bg-color-3/15 border-color-3"
                  : "bg-color-4/15 border-color-4"
              }`}
            >
              {userChoice}
            </span>
          </div>

          <div className="flex items-center justify-between gap-space-2 px-space-3 py-space-1 bg-color-7 rounded-2xl border border-color-1/30 min-w-0">
            <span className="text-text-xs font-bold text-color-1/80">Đáp án chuẩn:</span>
            <span className="font-bold text-text-xs sm:text-text-sm px-space-2 py-0.5 rounded-full border-2 border-color-3 bg-color-3/15 text-color-1 tabular-nums">
              {correctAnswer || "Chưa có"}
            </span>
          </div>
        </div>
      )}

      {/* Optional First-Attempt Note (used by Cram session review when user retried after mistakes) */}
      {firstSelectedLabel && (
        <div className="px-space-3 py-space-1 bg-color-5/20 border-2 border-color-1 rounded-2xl text-text-xs font-bold text-color-1">
          {firstSelectedLabel}
        </div>
      )}

      {/* AI Explanation Box */}
      <div className="p-space-3 sm:p-space-4 bg-color-6/60 border-2 border-color-1 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-space-2 mb-space-2">
          <div className="flex items-center gap-space-1 font-bold text-text-xs sm:text-text-sm text-color-2">
            <Bot className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Giải thích từ Trợ lý AI:</span>
          </div>

          <div className="flex flex-wrap items-center gap-space-2 ml-auto">
            {onOpenAiModal && (
              <button
                type="button"
                onClick={() => onOpenAiModal(item, displayNumber)}
                className="min-h-11 px-space-3 py-space-1 rounded-full border-2 border-color-1 bg-color-7 text-text-xs font-bold text-color-1 hover:bg-color-5 transition-colors inline-flex items-center gap-1 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5"
              >
                <Sparkles className="w-3.5 h-3.5 text-color-2 shrink-0" aria-hidden="true" />
                <span>Xem khung AI</span>
              </button>
            )}

            {breakdownEntries.length > 0 && (
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded((prev) => !prev)}
                className="min-h-11 px-space-2 text-text-xs font-bold text-color-2 hover:underline flex items-center gap-1 cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-color-5"
              >
                <span>{isExpanded ? "Thu gọn phân tích" : "Chi tiết từng phương án"}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-text-xs sm:text-text-sm text-color-1 font-medium leading-relaxed whitespace-pre-wrap break-words">
          {item.aiExplanation || "Chưa có diễn giải chi tiết cho câu hỏi này."}
        </p>

        {/* Expanded Option Breakdown (permutation-invariant multi-choice + AA contrast) */}
        {isExpanded && breakdownEntries.length > 0 && (
          <div className="mt-space-3 pt-space-3 border-t-2 border-color-1/15 grid grid-cols-1 sm:grid-cols-2 gap-space-2">
            {breakdownEntries.map(([opt, desc]) => {
              const normalizedOpt = opt.toUpperCase();
              const isOptionCorrect = correctKeys.has(normalizedOpt);
              const isOptionChosen = selectedKeys.has(normalizedOpt);

              return (
                <div
                  key={opt}
                  className={`p-space-3 rounded-2xl text-text-xs border-2 ${
                    isOptionCorrect
                      ? "bg-color-3/15 border-color-3 text-color-1 font-bold"
                      : isOptionChosen
                        ? "bg-color-4/15 border-color-4 text-color-1 font-medium"
                        : "bg-color-7 border-color-1/25 text-color-1"
                  }`}
                >
                  <div className="flex items-center justify-between gap-space-1 mb-space-1">
                    <span className="font-bold text-color-2">{opt}.</span>
                    {isOptionCorrect ? (
                      <span className="px-space-1 py-0.5 rounded-full bg-color-7 border border-color-3 text-text-xs font-bold text-color-1">
                        Đúng
                      </span>
                    ) : isOptionChosen ? (
                      <span className="px-space-1 py-0.5 rounded-full bg-color-7 border border-color-4 text-text-xs font-bold text-color-1">
                        Bạn chọn
                      </span>
                    ) : null}
                  </div>
                  <p className="leading-snug break-words">{desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export const QuestionReviewItem = React.memo(QuestionReviewItemInner);
