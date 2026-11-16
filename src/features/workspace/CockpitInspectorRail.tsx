import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Check,
  Eraser,
  CheckCircle2,
  XCircle,
  Zap,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { FeedbackMode, QuestionType } from "@/types/exam";
import type {
  WorkspaceCardBadge,
  WorkspaceEvaluationResult,
  WorkspaceNavigatorItem,
} from "./types";

export interface CockpitInspectorRailProps {
  mode: "cram" | "learn" | "exam";
  title?: string;
  options?: Record<string, string>;
  sortedOptionKeys: string[];
  selectedOptions?: string | null;
  questionType?: QuestionType;
  feedbackMode: FeedbackMode;
  evaluation?: WorkspaceEvaluationResult | null;
  isLocked?: boolean;
  isSubmitting?: boolean;
  allowsClear?: boolean;
  hasInlineCardOptions?: boolean;
  onSelectOption: (optionKey: string) => void;
  onClearSelection?: () => void;
  onSubmitMultiChoice?: () => void;
  // Practice mastery metadata
  statsSummaryLabel?: string;
  subProgressText?: string;
  masteryBadge?: WorkspaceCardBadge | null;
  // Exam question grid props
  navigatorItems?: WorkspaceNavigatorItem[];
  answeredCount?: number;
  totalQuestions?: number;
  onSelectQuestion?: (index: number) => void;
  // Desktop collapse & mobile drawer controls
  onCollapseDesktop?: () => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

/**
 * Unified right inspector rail across Cram, Learn, and Exam:
 * - Practice: Real session Mastery/Repetition summary card + expandable active pool items
 * - Shared: Compact A-H keypad synchronized with central card + ✓ Xác nhận CTA for multi-choice
 * - Exam: Numbered 5-column Question Grid (X/N đã trả lời)
 */
export const CockpitInspectorRail: React.FC<CockpitInspectorRailProps> = ({
  mode,
  title,
  options = {},
  sortedOptionKeys,
  selectedOptions = "",
  questionType = "single_choice",
  feedbackMode,
  evaluation,
  isLocked = false,
  isSubmitting = false,
  allowsClear = false,
  hasInlineCardOptions = false,
  onSelectOption,
  onClearSelection,
  onSubmitMultiChoice,
  statsSummaryLabel,
  subProgressText,
  masteryBadge,
  navigatorItems = [],
  answeredCount = 0,
  totalQuestions = 0,
  onSelectQuestion,
  onCollapseDesktop,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
}) => {
  const [isPoolExpanded, setIsPoolExpanded] = useState(false);

  const currentSelection = selectedOptions ?? "";
  const isEvaluated =
    feedbackMode === "instant" &&
    evaluation?.status === "resolved" &&
    evaluation.correctAnswer !== null;

  const isMultiChoice =
    questionType === "multiple_choice" ||
    (isEvaluated && (evaluation?.correctAnswer?.length ?? 0) > 1);

  const resolvedTitle =
    title || (mode === "exam" ? "Đáp án & Câu hỏi" : "Thông tin câu hỏi:");

  const renderKeypad = (idPrefix: string) => (
    <div className="flex flex-col gap-space-2">
      <div className="flex items-center justify-between gap-space-2">
        <div className="flex items-center gap-space-2">
          <span className="text-text-xs font-bold text-color-1">Đáp án:</span>
          {isMultiChoice && (
            <span className="inline-flex items-center gap-0.5 px-space-2 py-0.5 rounded-full bg-color-5 text-color-1 border border-color-1 text-[12px] font-bold shadow-2xs">
              {currentSelection.length > 0 ? `${currentSelection.length}✓` : "Nhiều✓"}
            </span>
          )}
        </div>

        {allowsClear && currentSelection.length > 0 && !isLocked && onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Bỏ chọn"
            className="min-h-11 px-space-2 text-[13px] font-bold text-color-1 hover:text-color-2 underline cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-color-5 rounded-full inline-flex items-center gap-1"
          >
            <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Bỏ chọn</span>
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Bảng chọn nhanh đáp án"
        className="grid grid-cols-4 gap-space-1"
      >
        {sortedOptionKeys.map((key, idx) => {
          const text = options[key];
          const isSelected = currentSelection.includes(key);
          const isCorrectKey = isEvaluated && evaluation.correctAnswer?.includes(key);

          let keyStyle = "bg-color-6 text-color-1 border-color-1 hover:bg-color-5/30";
          if (isEvaluated) {
            if (isSelected && isCorrectKey) {
              keyStyle = "bg-color-3 text-color-7 border-color-1 shadow-xs";
            } else if (isSelected && !isCorrectKey) {
              keyStyle = "bg-color-4 text-color-1 border-color-1 shadow-xs";
            } else if (isCorrectKey) {
              keyStyle = "bg-color-3/20 text-color-1 border-color-3 border-dashed shadow-xs";
            } else {
              keyStyle = "bg-color-6/60 text-color-1/70 border-color-1/50";
            }
          } else if (isSelected) {
            keyStyle = "bg-color-2 text-color-7 border-color-1 shadow-xs";
          }

          // Keep accessible label distinct when inline options already expose "Đáp án X: text"
          const buttonAriaLabel = hasInlineCardOptions
            ? `Phím đáp án ${key}`
            : text
              ? `Đáp án ${key}: ${text}`
              : `Đáp án ${key}`;

          return (
            <button
              key={`${idPrefix}-${key}`}
              type="button"
              disabled={isLocked || isSubmitting}
              aria-pressed={isSelected}
              aria-label={buttonAriaLabel}
              onClick={() => onSelectOption(key)}
              className={`relative min-h-11 rounded-2xl border-2 flex items-center justify-center font-bold text-text-sm transition-all duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 disabled:cursor-not-allowed active:translate-y-0.5 ${keyStyle}`}
            >
              <span>{key}</span>
              {idx < 8 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1.5 text-[10px] leading-none font-bold opacity-75 tabular-nums"
                >
                  {idx + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isMultiChoice && feedbackMode === "instant" && !isEvaluated && onSubmitMultiChoice && (
        <Button
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          disabled={isLocked || !currentSelection}
          onClick={onSubmitMultiChoice}
          className="min-h-11 w-full inline-flex items-center justify-center gap-space-1 mt-space-1"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          <span>
            {currentSelection.length > 0
              ? `Xác nhận (${currentSelection.length})`
              : "Kiểm tra đáp án"}
          </span>
        </Button>
      )}
    </div>
  );

  const renderPracticeMasteryCard = () => (
    <div className="flex flex-col gap-space-2 p-space-3 bg-color-6 border-2 border-color-1 rounded-2xl">
      <div className="flex items-center justify-between gap-space-2">
        <span className="text-[13px] font-bold text-color-1/80 flex items-center gap-1">
          {mode === "cram" ? (
            <Zap className="w-4 h-4 text-color-5 fill-color-5" aria-hidden="true" />
          ) : (
            <Brain className="w-4 h-4 text-color-2" aria-hidden="true" />
          )}
          <span>{mode === "cram" ? "Tiến độ cấp tốc" : "Nhóm thẻ đang học"}</span>
        </span>
        {statsSummaryLabel && (
          <Badge variant={mode === "cram" ? "warning" : "success"}>
            {statsSummaryLabel}
          </Badge>
        )}
      </div>

      {subProgressText && (
        <div className="text-text-xs font-bold text-color-1 tabular-nums">
          {subProgressText}
        </div>
      )}

      {masteryBadge && (
        <div className="pt-space-1">
          <Badge
            variant={
              masteryBadge.tone === "warning"
                ? "warning"
                : masteryBadge.tone === "accent"
                  ? "success"
                  : "primary"
            }
          >
            {masteryBadge.label}
          </Badge>
        </div>
      )}

      {navigatorItems.length > 0 && (
        <div className="pt-space-1 border-t border-color-1/20">
          <button
            type="button"
            aria-expanded={isPoolExpanded}
            onClick={() => setIsPoolExpanded((prev) => !prev)}
            className="min-h-11 w-full flex items-center justify-between text-[13px] font-bold text-color-1 hover:text-color-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-color-5 rounded-xl px-space-1"
          >
            <span>
              {mode === "cram"
                ? `Thẻ trong đợt (${navigatorItems.length})`
                : `Trạng thái nhóm thẻ (${navigatorItems.length})`}
            </span>
            {isPoolExpanded ? (
              <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
          </button>

          {isPoolExpanded && (
            <div className="grid grid-cols-5 gap-1 pt-space-2">
              {navigatorItems.map((item) => {
                let pillClass = "bg-color-7 text-color-1 border-color-1";
                if (item.isCurrent) {
                  pillClass = "bg-color-2 text-color-7 border-color-1 ring-2 ring-color-5";
                } else if (item.isCorrect === true) {
                  pillClass = "bg-color-3 text-color-7 border-color-1";
                } else if (item.isRequeued || item.isCorrect === false) {
                  pillClass = "bg-color-5 text-color-1 border-color-1";
                }
                return (
                  <span
                    key={item.id}
                    title={item.streakText || `Câu ${item.number}`}
                    className={`h-8 rounded-full border text-[12px] font-bold flex items-center justify-center tabular-nums ${pillClass}`}
                  >
                    {item.number}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderExamQuestionGrid = (onPickClose?: () => void) => (
    <div className="flex flex-col gap-space-2 pt-space-2 border-t-2 border-color-6">
      <div className="flex items-center justify-between gap-space-2">
        <span className="text-[13px] font-bold text-color-1 tabular-nums">
          Câu hỏi ({answeredCount}/{totalQuestions} đã trả lời):
        </span>
      </div>

      <nav aria-label="Danh sách câu hỏi" className="overflow-y-auto max-h-[280px] p-0.5">
        <div className="grid grid-cols-5 gap-space-1">
          {navigatorItems.map((item, idx) => {
            let statusClass =
              "bg-color-7 text-color-1 border-color-1 hover:bg-color-6";
            if (item.isCurrent) {
              statusClass =
                "bg-color-2 text-color-7 border-color-1 ring-2 ring-color-5 font-bold shadow-xs";
            } else if (item.isCorrect === true) {
              statusClass = "bg-color-3 text-color-7 border-color-1 shadow-xs";
            } else if (item.isCorrect === false) {
              statusClass = "bg-color-4 text-color-1 border-color-1 font-bold shadow-xs";
            } else if (item.isAnswered) {
              statusClass = "bg-color-6 text-color-1 border-color-1 font-bold shadow-2xs";
            }

            const statusText = item.isCurrent
              ? "Đang xem"
              : item.isCorrect === true
                ? "Trả lời đúng"
                : item.isCorrect === false
                  ? "Chưa đúng"
                  : item.isAnswered
                    ? "Đã trả lời"
                    : "Chưa làm";

            return (
              <button
                key={item.id}
                type="button"
                aria-current={item.isCurrent ? "step" : undefined}
                aria-label={`Câu ${item.number} (${statusText})`}
                onClick={() => {
                  onSelectQuestion?.(idx);
                  onPickClose?.();
                }}
                className={`min-h-11 w-full rounded-2xl border-2 flex items-center justify-center font-bold text-[13px] transition-all duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 tabular-nums ${statusClass}`}
              >
                {item.number}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold text-color-1 pt-space-1">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-color-2 border border-color-1" aria-hidden="true" />
          <span>Đang xem</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-color-6 border border-color-1" aria-hidden="true" />
          <span>Đã làm</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-color-3" aria-hidden="true" />
          <span>Đúng</span>
        </span>
        {feedbackMode === "instant" && (
          <span className="inline-flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-color-4" aria-hidden="true" />
            <span>Chưa đúng</span>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        aria-label={resolvedTitle}
        data-impeccable-ignore="hard-offset-shadow"
        className="w-full bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm p-space-4 flex flex-col gap-space-3"
      >
        <div className="flex items-center justify-between gap-space-2">
          <h2 className="text-text-sm font-bold text-color-1">{resolvedTitle}</h2>
          {onCollapseDesktop && (
            <button
              type="button"
              onClick={onCollapseDesktop}
              aria-label="Thu gọn bảng thông tin"
              className="min-h-11 px-space-2 -mr-space-2 rounded-full text-[13px] font-bold text-color-1/80 hover:text-color-1 hover:bg-color-6 inline-flex items-center gap-0.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-color-5"
            >
              <span>Thu gọn</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {(mode === "cram" || mode === "learn") && renderPracticeMasteryCard()}

        {renderKeypad("desktop")}

        {mode === "exam" && renderExamQuestionGrid()}
      </aside>

      {/* Mobile / Tablet Portaled Drawer */}
      {onCloseMobileDrawer && (
        <Modal
          isOpen={isMobileDrawerOpen}
          onClose={onCloseMobileDrawer}
          title={mode === "exam" ? "Bảng điều hướng & Đáp án" : "Thông tin & Chọn đáp án"}
          size="md"
        >
          <div className="flex flex-col gap-space-4">
            {(mode === "cram" || mode === "learn") && renderPracticeMasteryCard()}
            {renderKeypad("drawer")}
            {mode === "exam" && renderExamQuestionGrid(onCloseMobileDrawer)}
          </div>
        </Modal>
      )}
    </>
  );
};
