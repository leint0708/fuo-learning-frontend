import React from "react";
import { List, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface StudyCockpitShellProps {
  header: React.ReactNode;
  banners?: React.ReactNode;
  hasVisualMedia?: boolean;
  stageContent: React.ReactNode;
  evaluationBanner?: React.ReactNode;
  mobileInlineKeypad?: React.ReactNode;
  navigatorContent: React.ReactNode;
  mobileStatusLabel: string;
  canPrev?: boolean;
  canNext?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onOpenMobileNavigator?: () => void;
  onOpenAiAnalysis?: () => void;
  aiButtonLabel?: string;
  modals?: React.ReactNode;
}

/**
 * Unified 3-zone Neo-Brutalist Study & Exam Cockpit:
 * - Slim top utility bar
 * - Fit-to-screen Question Stage inside framed canvas + floating bottom-center AI Explanation pill
 * - Permanent right inspector rail (lg+) & bottom navigation bar (< Câu trước | drawer | Câu tiếp >)
 */
export const StudyCockpitShell: React.FC<StudyCockpitShellProps> = ({
  header,
  banners,
  hasVisualMedia = false,
  stageContent,
  evaluationBanner,
  mobileInlineKeypad,
  navigatorContent,
  mobileStatusLabel,
  canPrev = false,
  canNext = false,
  prevLabel = "Câu trước",
  nextLabel = "Câu tiếp",
  onPrev,
  onNext,
  onOpenMobileNavigator,
  onOpenAiAnalysis,
  aiButtonLabel = "AI Explanation",
  modals,
}) => {
  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden flex flex-col bg-color-6 text-color-1">
      {header}

      {/* Main 2-Column Workspace Frame */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-space-2 sm:px-space-4 py-space-3 flex flex-col lg:flex-row gap-space-3 min-h-0">
        {/* Left/Center Main Canvas */}
        <section
          aria-label="Không gian câu hỏi"
          className="flex-1 min-w-0 lg:min-h-0 lg:overflow-hidden bg-color-7/70 border-2 border-color-1 rounded-3xl p-space-3 sm:p-space-4 flex flex-col justify-between gap-space-2 sm:gap-space-3 shadow-xs"
        >
          {banners && <div className="w-full shrink-0">{banners}</div>}

          <div
            className={
              hasVisualMedia
                ? "w-full flex-1 flex flex-col gap-space-2 min-h-0 lg:overflow-hidden"
                : "w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center gap-space-3 min-h-0 lg:overflow-y-auto custom-scrollbar"
            }
          >
            {stageContent}

            {evaluationBanner && <div className="shrink-0">{evaluationBanner}</div>}

            {/* Mobile/Tablet inline keypad (< lg) so options stay 1 tap away */}
            {mobileInlineKeypad && <div className="lg:hidden shrink-0">{mobileInlineKeypad}</div>}
          </div>

          {/* Floating Bottom-Center AI Explanation Pill inside Canvas */}
          {onOpenAiAnalysis && (
            <div className="w-full shrink-0 flex items-center justify-between gap-space-2 pt-space-1">
              <div className="hidden sm:block flex-1" aria-hidden="true" />
              <Button
                variant="primary"
                size="md"
                onClick={onOpenAiAnalysis}
                aria-label={aiButtonLabel}
                className="min-h-11 px-space-5 mx-auto sm:mx-0 inline-flex items-center gap-space-2 border-2 border-color-1 shadow-sm shrink-0"
              >
                <span className="w-6 h-6 rounded-full bg-color-5 text-color-1 border border-color-1 inline-flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span>{aiButtonLabel}</span>
              </Button>
              <div className="hidden sm:block flex-1" aria-hidden="true" />
            </div>
          )}
        </section>

        {/* Right Permanent Inspector Rail (Desktop lg+) */}
        <div className="hidden lg:flex w-[320px] xl:w-[340px] shrink-0 lg:min-h-0 lg:max-h-full lg:overflow-y-auto custom-scrollbar items-start">
          <div className="w-full">{navigatorContent}</div>
        </div>
      </div>

      {/* Unified Bottom Navigation Dock */}
      <footer className="sticky bottom-0 z-20 shrink-0 bg-color-7 border-t-2 border-color-1 px-space-2 sm:px-space-4 py-space-1.5 sm:py-space-2 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-space-1.5 sm:gap-space-2 min-w-0">
          <Button
            variant="secondary"
            size="sm"
            disabled={!canPrev}
            onClick={onPrev}
            className={`min-h-11 px-space-2.5 sm:px-space-4 text-text-2xs sm:text-text-xs items-center gap-space-1 shrink-0 ${
              !onPrev ? "hidden sm:inline-flex" : "inline-flex"
            }`}
          >
            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{prevLabel}</span>
          </Button>

          {/* Desktop Shortcut Hint */}
          <span className="hidden lg:inline text-[13px] font-bold text-color-1/75 text-center truncate">
            ← → để chuyển câu • 1-8 hoặc a-h để chọn đáp án
          </span>

          {/* Mobile / Tablet Portaled Drawer Trigger */}
          {onOpenMobileNavigator && (
            <button
              type="button"
              onClick={onOpenMobileNavigator}
              className="lg:hidden min-h-11 flex-1 sm:flex-initial min-w-0 px-space-2.5 sm:px-space-3 rounded-full bg-color-6 text-color-1 border-2 border-color-1 font-bold text-text-2xs sm:text-text-xs inline-flex items-center justify-center gap-space-1 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 tabular-nums"
            >
              <List className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{mobileStatusLabel}</span>
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            disabled={!canNext}
            onClick={onNext}
            className="min-h-11 px-space-2.5 sm:px-space-4 text-text-2xs sm:text-text-xs inline-flex items-center gap-space-1 shrink-0"
          >
            <span>{nextLabel}</span>
            <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Button>
        </div>
      </footer>

      {modals}
    </div>
  );
};
