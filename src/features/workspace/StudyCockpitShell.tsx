import React from "react";
import { List, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface StudyCockpitShellProps {
  header: React.ReactNode;
  banners?: React.ReactNode;
  hasVisualMedia: boolean;
  stageContent: React.ReactNode;
  choiceContent: React.ReactNode;
  navigatorContent: React.ReactNode;
  mobileStatusLabel: string;
  canPrev?: boolean;
  canNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onOpenMobileNavigator?: () => void;
  mobilePrimaryAction?: React.ReactNode;
  modals?: React.ReactNode;
}

/**
 * Unified distraction-free Operate cockpit layout:
 * - Adaptive 12-column split (lg+) when diagram media is present
 * - Centered single-column reading column for text-only stems
 * - Sticky <lg mobile bottom dock preserving thumb ergonomics
 */
export const StudyCockpitShell: React.FC<StudyCockpitShellProps> = ({
  header,
  banners,
  hasVisualMedia,
  stageContent,
  choiceContent,
  navigatorContent,
  mobileStatusLabel,
  canPrev = false,
  canNext = false,
  onPrev,
  onNext,
  onOpenMobileNavigator,
  mobilePrimaryAction,
  modals,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-color-6 text-color-1">
      {header}

      <div className="flex-1 w-full max-w-7xl mx-auto px-space-2 sm:px-space-4 py-space-4 pb-24 lg:pb-space-6 flex flex-col gap-space-4">
        {banners}

        {hasVisualMedia ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-3 lg:gap-space-4 items-start">
            <div className="md:col-span-7 flex flex-col gap-space-4 md:sticky md:top-[84px]">
              {stageContent}
            </div>

            <div className="md:col-span-5 flex flex-col gap-space-4 md:sticky md:top-[84px] md:max-h-[calc(100vh-148px)] lg:max-h-[calc(100vh-100px)] md:overflow-y-auto md:pr-space-1">
              {choiceContent}
              <div className="hidden lg:block">{navigatorContent}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-4 items-start">
            <div className="lg:col-span-8 flex flex-col gap-space-4 w-full max-w-3xl mx-auto lg:max-w-none">
              {stageContent}
              {choiceContent}
            </div>

            <div className="hidden lg:flex lg:col-span-4 flex-col gap-space-4 lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-space-1">
              {navigatorContent}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Dock (< lg) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-color-7 border-t-2 border-color-1 px-space-1 sm:px-space-2 py-space-1 flex items-center justify-between gap-space-1 sm:gap-space-2">
        <div className="flex items-center gap-space-1 shrink-0">
          {onPrev && (
            <Button
              variant="secondary"
              size="sm"
              disabled={!canPrev}
              aria-label="Câu trước"
              onClick={onPrev}
              className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          {onNext && (
            <Button
              variant="secondary"
              size="sm"
              disabled={!canNext}
              aria-label="Câu sau"
              onClick={onNext}
              className="min-h-11 min-w-11 p-0 flex items-center justify-center rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>

        {onOpenMobileNavigator && (
          <button
            type="button"
            onClick={onOpenMobileNavigator}
            className="min-h-11 min-w-0 max-w-[165px] sm:max-w-none px-space-2 sm:px-space-3 rounded-full bg-color-6 text-color-1 border-2 border-color-1 font-bold text-[13px] sm:text-text-xs inline-flex items-center gap-space-1 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 tabular-nums"
          >
            <List className="w-4 h-4 shrink-0" />
            <span className="truncate">{mobileStatusLabel}</span>
          </button>
        )}

        {mobilePrimaryAction && <div className="shrink-0">{mobilePrimaryAction}</div>}
      </div>

      {modals}
    </div>
  );
};
