import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { WorkspaceNavigatorItem } from "./types";

export interface QuestionNavigatorProps {
  title?: string;
  items: WorkspaceNavigatorItem[];
  activeIndex: number;
  answeredCount: number;
  totalCount: number;
  onSelectQuestion: (index: number) => void;
  onPrevQuestion?: () => void;
  onNextQuestion?: () => void;
  supportsFreeJump?: boolean;
  isMobileDrawerOpen?: boolean;
  onOpenMobileDrawer?: () => void;
  onCloseMobileDrawer?: () => void;
  className?: string;
}

/**
 * Accessible question navigator (>=44px pills, semantic <nav>, safe boundary focus handling).
 */
export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  title = "Danh sách câu hỏi",
  items,
  activeIndex,
  answeredCount,
  totalCount,
  onSelectQuestion,
  onPrevQuestion,
  onNextQuestion,
  supportsFreeJump = true,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
  className,
}) => {
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const prevBtnRef = useRef<HTMLButtonElement | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeItemRef.current && typeof activeItemRef.current.scrollIntoView === "function") {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  const handlePrevClick = () => {
    if (activeIndex === 1 && nextBtnRef.current) {
      nextBtnRef.current.focus();
    }
    onPrevQuestion?.();
  };

  const handleNextClick = () => {
    if (activeIndex === items.length - 2 && prevBtnRef.current) {
      prevBtnRef.current.focus();
    }
    onNextQuestion?.();
  };

  const renderGridBody = (onPick?: (idx: number) => void) => (
    <div className="flex flex-col gap-space-3">
      <div className="flex items-center justify-between gap-space-2">
        <span className="font-bold text-text-sm text-color-1">{title}</span>
        <span className="text-text-xs font-bold text-color-1/80 tabular-nums">
          Tổng: {totalCount} câu
        </span>
      </div>

      <div className="overflow-y-auto max-h-[260px] p-space-1">
        <div className="grid grid-cols-5 gap-space-1">
          {items.map((item, index) => {
            let statusClass =
              "bg-color-7 text-color-1 border-color-1 hover:bg-color-6";
            if (item.isCurrent) {
              statusClass =
                "bg-color-2 text-color-7 border-color-1 ring-2 ring-color-5 font-bold shadow-xs";
            } else if (item.isCorrect === true) {
              statusClass = "bg-color-3 text-color-7 border-color-1 shadow-xs";
            } else if (item.isCorrect === false) {
              // Dark ink on coral for WCAG AA contrast (5.20:1)
              statusClass = "bg-color-4 text-color-1 border-color-1 font-bold shadow-xs";
            } else if (item.isRequeued) {
              statusClass = "bg-color-5 text-color-1 border-color-1 font-bold shadow-xs";
            } else if (item.isAnswered) {
              statusClass = "bg-color-6 text-color-1 border-color-1 font-bold shadow-2xs";
            }

            const disabled = !supportsFreeJump && !item.isCurrent;
            const statusText = item.isCurrent
              ? "Đang xem"
              : item.isCorrect === true
                ? "Trả lời đúng"
                : item.isCorrect === false
                  ? "Chưa đúng"
                  : item.isRequeued
                    ? "Cần ôn lại"
                    : item.isAnswered
                      ? "Đã trả lời"
                      : "Chưa làm";

            return (
              <button
                key={item.id}
                ref={item.isCurrent ? activeItemRef : undefined}
                type="button"
                disabled={disabled}
                aria-current={item.isCurrent ? "step" : undefined}
                aria-label={`Câu ${item.number} (${statusText})${item.streakText ? ` — ${item.streakText}` : ""}`}
                onClick={() => {
                  onSelectQuestion(index);
                  onPick?.(index);
                }}
                className={`min-h-11 w-full rounded-full border-2 flex items-center justify-center font-bold text-text-xs transition-all duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 disabled:opacity-60 disabled:cursor-default tabular-nums ${statusClass}`}
              >
                {item.number}
              </button>
            );
          })}
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-text-2xs font-bold text-color-1 pt-space-1">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-color-2 border border-color-1" aria-hidden="true" />
            <span>Đang xem</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-color-6 border border-color-1" aria-hidden="true" />
            <span>Đã trả lời</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-color-3 border border-color-1" aria-hidden="true" />
            <span>Đúng</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-color-4 border border-color-1" aria-hidden="true" />
            <span>Chưa đúng</span>
          </span>
          {!supportsFreeJump && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-color-5 border border-color-1" aria-hidden="true" />
              <span>Cần ôn lại</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary & Prev/Next Row */}
      <div className="pt-space-2 border-t-2 border-color-1 flex flex-wrap items-center justify-between gap-space-2">
        <span className="min-h-11 px-space-3 bg-color-6 border-2 border-color-1 rounded-full inline-flex items-center font-bold text-text-xs text-color-1 shadow-xs tabular-nums">
          Số câu đã làm: {answeredCount}/{totalCount}
        </span>

        {supportsFreeJump && (
          <div className="flex items-center gap-space-2">
            <Button
              ref={prevBtnRef as React.RefObject<HTMLButtonElement>}
              variant="secondary"
              size="sm"
              disabled={activeIndex <= 0}
              aria-label="Câu trước"
              title="Câu trước (←)"
              onClick={handlePrevClick}
              className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              ref={nextBtnRef as React.RefObject<HTMLButtonElement>}
              variant="secondary"
              size="sm"
              disabled={activeIndex >= totalCount - 1}
              aria-label="Câu sau"
              title="Câu sau (→)"
              onClick={handleNextClick}
              className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <nav aria-label={title} className={className}>
        <Card className="bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm p-space-4">
          {renderGridBody()}
        </Card>
      </nav>

      {/* Accessible Mobile Drawer Modal */}
      {onCloseMobileDrawer && (
        <Modal
          isOpen={isMobileDrawerOpen}
          onClose={onCloseMobileDrawer}
          title={title}
          size="md"
        >
          <div className="flex flex-col gap-space-3">
            {renderGridBody(() => onCloseMobileDrawer())}
            <Button
              variant="secondary"
              size="md"
              onClick={onCloseMobileDrawer}
              className="min-h-11 w-full inline-flex items-center justify-center gap-space-1"
            >
              <List className="w-4 h-4" />
              <span>Đóng danh sách</span>
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};
