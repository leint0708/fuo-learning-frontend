import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Settings,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Zap,
  Brain,
  FileText,
  ChevronDown,
} from "lucide-react";
import { CockpitSettingsPopover } from "./CockpitSettingsPopover";
import type { WorkspaceSaveStatus } from "./types";

export interface CockpitHeaderModeOption {
  value: "cram" | "learn";
  label: string;
}

export interface CockpitHeaderProps {
  title: string;
  exitLabel: string;
  onExit: () => void;
  progressLabel: string;
  progressCurrent: number;
  progressTotal: number;
  progressCurrentBadge?: number;
  progressTotalBadge?: number;
  progressVariant?: "cram" | "learn" | "exam";
  learnActiveCount?: number;
  modeSubLegend?: React.ReactNode;
  modeSwitcher?: {
    currentMode: "cram" | "learn" | "exam";
    label: string;
    options?: CockpitHeaderModeOption[];
    onSelectMode?: (mode: "cram" | "learn") => void;
  };
  modeBadge?: {
    label: string;
    tone: "primary" | "accent" | "warning" | "neutral";
  };
  answerSourceToggle?: {
    ariaLabel: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
  };
  statusSlot?: React.ReactNode;
  saveStatus?: WorkspaceSaveStatus;
  onRetrySave?: () => void;
  onOpenShortcuts: () => void;
  onResetAction?: () => void;
  resetLabel?: string;
  primaryActionSlot?: React.ReactNode;
}

/**
 * Slim unified top utility bar following DESIGN.md tokens and 3-zone cockpit layout:
 * - Left: Exit button, Mode Switcher pill (Cram / Learn / Thi thử), optional Exam Timer
 * - Center: (current) ──── Progress Capsule ──── (total)
 * - Right: Save status, Primary CTA (Nộp bài), ⚙ Settings Popover (Feedback Mode + Shortcuts), ↻ Reset
 */
export const CockpitHeader: React.FC<CockpitHeaderProps> = ({
  title,
  exitLabel,
  onExit,
  progressLabel,
  progressCurrent,
  progressTotal,
  progressCurrentBadge,
  progressTotalBadge,
  progressVariant,
  learnActiveCount = 0,
  modeSubLegend,
  modeSwitcher,
  answerSourceToggle,
  statusSlot,
  saveStatus = "idle",
  onRetrySave,
  onOpenShortcuts,
  onResetAction,
  resetLabel = "Làm lại từ đầu",
  primaryActionSlot,
}) => {
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isModeMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModeMenuOpen(false);
    };
    const onMouse = (e: MouseEvent) => {
      if (
        modeMenuRef.current &&
        e.target instanceof Node &&
        !modeMenuRef.current.contains(e.target)
      ) {
        setIsModeMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouse);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouse);
    };
  }, [isModeMenuOpen]);

  const safeTotal = Math.max(1, progressTotal);
  const clampedCurrent = Math.min(safeTotal, Math.max(0, progressCurrent));
  const percentage = Math.min(100, Math.max(0, Math.round((clampedCurrent / safeTotal) * 100)));
  const learnActivePct = Math.min(
    100 - percentage,
    Math.max(0, Math.round((Math.max(0, learnActiveCount) / safeTotal) * 100))
  );
  const segmentCount = Math.max(1, Math.min(12, Math.ceil(safeTotal / 10)));
  const itemsPerSegment = safeTotal / segmentCount;
  const leftNumber = progressCurrentBadge ?? progressCurrent;
  const rightNumber = progressTotalBadge ?? progressTotal;
  const leftBadgeToneClass =
    progressVariant === "learn" ? "bg-color-3 text-color-7" : "bg-color-2 text-color-7";

  const hasDropdown =
    Boolean(modeSwitcher?.options?.length) && Boolean(modeSwitcher?.onSelectMode);

  const renderModeIcon = () => {
    if (modeSwitcher?.currentMode === "cram") {
      return <Zap className="w-4 h-4 text-color-5 fill-color-5 shrink-0" aria-hidden="true" />;
    }
    if (modeSwitcher?.currentMode === "learn") {
      return <Brain className="w-4 h-4 text-color-2 shrink-0" aria-hidden="true" />;
    }
    return <FileText className="w-4 h-4 text-color-3 shrink-0" aria-hidden="true" />;
  };

  return (
    <header className="sticky top-0 z-30 bg-color-7 border-b-2 border-color-1 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-space-2 sm:px-space-4 py-space-1 flex flex-wrap lg:flex-nowrap items-center justify-between gap-space-1.5 sm:gap-space-2 min-h-[54px] sm:min-h-[60px]">
        {/* Left: Exit + Mode Pill/Dropdown + Timer Slot */}
        <div className="flex items-center gap-space-1 sm:gap-space-2 min-w-0">
          <button
            type="button"
            onClick={onExit}
            aria-label={exitLabel}
            title={exitLabel}
            className="min-h-11 px-space-2 sm:px-space-3 inline-flex items-center gap-space-1 rounded-full bg-color-6 text-color-1 border-2 border-color-1 font-bold text-text-2xs sm:text-text-xs hover:bg-color-5 transition-colors duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden xl:inline">{exitLabel}</span>
          </button>

          {modeSwitcher ? (
            <div ref={modeMenuRef} className="relative shrink-0">
              {hasDropdown ? (
                <>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isModeMenuOpen}
                    onClick={() => setIsModeMenuOpen((prev) => !prev)}
                    className="min-h-11 px-space-3 inline-flex items-center gap-space-1.5 rounded-full bg-color-6 text-color-1 border-2 border-color-1 font-bold text-[13px] sm:text-text-xs hover:bg-color-7 transition-colors cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5"
                  >
                    {renderModeIcon()}
                    <span>{modeSwitcher.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </button>
                  {isModeMenuOpen && (
                    <div
                      role="menu"
                      data-impeccable-ignore="hard-offset-shadow"
                      className="absolute left-0 top-full mt-space-1 w-52 z-50 bg-color-7 border-2 border-color-1 rounded-2xl shadow-sm p-space-1 flex flex-col gap-space-1"
                    >
                      {modeSwitcher.options?.map((opt) => {
                        const isActive = opt.value === modeSwitcher.currentMode;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setIsModeMenuOpen(false);
                              modeSwitcher.onSelectMode?.(opt.value);
                            }}
                            className={`min-h-11 w-full px-space-3 rounded-xl text-left text-text-xs font-bold flex items-center justify-between gap-space-2 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-color-5 ${
                              isActive
                                ? "bg-color-2 text-color-7"
                                : "text-color-1 hover:bg-color-6"
                            }`}
                          >
                            <span className="inline-flex items-center gap-space-2">
                              {opt.value === "cram" ? (
                                <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
                              ) : (
                                <Brain className="w-4 h-4 shrink-0" aria-hidden="true" />
                              )}
                              <span>{opt.label}</span>
                            </span>
                            {isActive && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="min-h-11 px-space-3 inline-flex items-center gap-space-1.5 rounded-full bg-color-6 text-color-1 border-2 border-color-1 font-bold text-[13px] sm:text-text-xs">
                  {renderModeIcon()}
                  <span>{modeSwitcher.label}</span>
                </div>
              )}
            </div>
          ) : (
            <h1 className="text-text-xs sm:text-text-sm font-bold text-color-1 truncate min-w-0">
              {title}
            </h1>
          )}

          {statusSlot}
        </div>

        {/* Hidden Accessible Heading if modeSwitcher replaced visible title */}
        {modeSwitcher && <h1 className="sr-only">{title}</h1>}

        {/* Center: Mode-Specific Progress Bar */}
        <div className="w-full lg:flex-1 lg:max-w-lg order-3 lg:order-2 flex items-center gap-space-1.5 sm:gap-space-2 px-space-1">
          <span
            className={`min-w-7 h-7 sm:min-w-8 sm:h-8 px-space-1.5 sm:px-space-2 rounded-full ${leftBadgeToneClass} border-2 border-color-1 text-text-2xs sm:text-[13px] font-bold inline-flex items-center justify-center tabular-nums shrink-0 shadow-2xs`}
          >
            {leftNumber}
          </span>

          {progressVariant === "cram" || progressVariant === "exam" ? (
            <div
              role="progressbar"
              aria-label={progressLabel}
              aria-valuenow={progressCurrent}
              aria-valuemin={0}
              aria-valuemax={safeTotal}
              data-progress-variant={progressVariant}
              className="flex-1 flex items-center gap-1.5"
            >
              {Array.from({ length: segmentCount }, (_, idx) => {
                const start = idx * itemsPerSegment;
                const fillRatio = Math.min(
                  1,
                  Math.max(0, (clampedCurrent - start) / itemsPerSegment)
                );
                const fillPct = Math.round(fillRatio * 100);
                return (
                  <div
                    key={idx}
                    data-segment-index={idx}
                    className="flex-1 h-2.5 bg-color-6 border border-color-1 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-color-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          ) : progressVariant === "learn" ? (
            <div
              role="progressbar"
              aria-label={progressLabel}
              aria-valuenow={progressCurrent}
              aria-valuemin={0}
              aria-valuemax={safeTotal}
              data-progress-variant="learn"
              className="flex-1 h-3 bg-color-6 border-2 border-color-1 rounded-full overflow-hidden p-0.5 flex"
            >
              {percentage > 0 && (
                <div
                  data-learn-segment="mastered"
                  className="h-full bg-color-3 transition-all duration-300 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              )}
              {learnActivePct > 0 && (
                <div
                  data-learn-segment="active"
                  className="h-full bg-color-5 transition-all duration-300 ease-out"
                  style={{ width: `${learnActivePct}%` }}
                />
              )}
            </div>
          ) : (
            <div
              role="progressbar"
              aria-label={progressLabel}
              aria-valuenow={progressCurrent}
              aria-valuemin={0}
              aria-valuemax={safeTotal}
              className="flex-1 h-3.5 bg-color-6 border-2 border-color-1 rounded-full overflow-hidden p-0.5"
            >
              <div
                className="h-full bg-color-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}

          <span className="min-w-7 h-7 sm:min-w-8 sm:h-8 px-space-1.5 sm:px-space-2 rounded-full bg-color-6 text-color-1 border-2 border-color-1 text-text-2xs sm:text-[13px] font-bold inline-flex items-center justify-center tabular-nums shrink-0">
            {rightNumber}
          </span>
        </div>

        {/* Right: Save Status, Nộp bài CTA, ⚙ Settings Popover, ↻ Reset */}
        <div className="flex items-center gap-space-1 sm:gap-space-2 order-2 lg:order-3 shrink-0">
          {saveStatus !== "idle" && (
            <div role="status" aria-live="polite" className="shrink-0">
              {saveStatus === "saving" && (
                <span className="min-h-11 inline-flex items-center gap-space-1 px-space-2 rounded-full bg-color-6 text-color-1 border border-color-1 text-text-2xs font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span className="hidden xl:inline">Đang lưu...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="min-h-11 inline-flex items-center gap-space-1 px-space-2 rounded-full bg-color-3/15 text-color-1 border border-color-3 text-text-2xs font-bold">
                  <span className="w-5 h-5 rounded-full bg-color-3 text-color-7 inline-flex items-center justify-center">
                    <Check className="w-3 h-3" aria-hidden="true" />
                  </span>
                  <span className="hidden xl:inline">Đã lưu</span>
                </span>
              )}
              {saveStatus === "error" && (
                <button
                  type="button"
                  onClick={onRetrySave}
                  className="min-h-11 inline-flex items-center gap-space-1 px-space-2 rounded-full bg-color-4 text-color-1 border-2 border-color-1 text-text-2xs font-bold cursor-pointer hover:opacity-90 outline-none focus-visible:ring-4 focus-visible:ring-color-5"
                >
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Lỗi lưu — Thử lại</span>
                </button>
              )}
            </div>
          )}

          {primaryActionSlot}

          <div className="relative">
            <button
              type="button"
              data-settings-trigger="true"
              aria-label="Cài đặt phiên làm bài"
              aria-expanded={isSettingsOpen}
              title="Cài đặt & Phím tắt"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full bg-color-7 text-color-1 border-2 border-color-1 hover:bg-color-6 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-colors"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>

            <CockpitSettingsPopover
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              answerSourceToggle={answerSourceToggle}
              onOpenShortcuts={onOpenShortcuts}
            />
          </div>

          {onResetAction && (
            <button
              type="button"
              aria-label={resetLabel}
              title={resetLabel}
              onClick={onResetAction}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full bg-color-7 text-color-1 border-2 border-color-1 hover:bg-color-6 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {modeSubLegend && (
        <div className="max-w-[1600px] mx-auto px-space-2 sm:px-space-4 pb-space-1.5 flex flex-wrap items-center gap-x-space-3 gap-y-0.5 text-[11px] sm:text-text-2xs font-bold text-color-1/85">
          {modeSubLegend}
        </div>
      )}
    </header>
  );
};
