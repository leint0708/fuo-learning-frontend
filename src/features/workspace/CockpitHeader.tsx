import React from "react";
import { ArrowLeft, HelpCircle, Check, AlertCircle, Loader2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import type { WorkspaceSaveStatus } from "./types";

export interface CockpitHeaderProps {
  title: string;
  exitLabel: string;
  onExit: () => void;
  progressLabel: string;
  progressCurrent: number;
  progressTotal: number;
  modeBadge?: {
    label: string;
    tone: "primary" | "accent" | "warning" | "neutral";
  };
  statusSlot?: React.ReactNode;
  saveStatus?: WorkspaceSaveStatus;
  onRetrySave?: () => void;
  onOpenShortcuts: () => void;
  primaryActionSlot?: React.ReactNode;
}

/**
 * Compact sticky 56px+ Operate header replacing global Navbar inside active sessions.
 */
export const CockpitHeader: React.FC<CockpitHeaderProps> = ({
  title,
  exitLabel,
  onExit,
  progressLabel,
  progressCurrent,
  progressTotal,
  modeBadge,
  statusSlot,
  saveStatus = "idle",
  onRetrySave,
  onOpenShortcuts,
  primaryActionSlot,
}) => {
  const badgeVariant =
    modeBadge?.tone === "accent"
      ? "success"
      : modeBadge?.tone === "warning"
        ? "warning"
        : modeBadge?.tone === "primary"
          ? "primary"
          : "default";

  return (
    <header className="sticky top-0 z-30 bg-color-7 border-b-2 border-color-1 shadow-xs">
      <div className="max-w-7xl mx-auto px-space-2 sm:px-space-4 py-space-1 flex flex-wrap items-center justify-between gap-space-2 min-h-[56px]">
        {/* Left: Exit + Mode Badge + Primary Heading */}
        <div className="flex items-center gap-space-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onExit}
            aria-label={exitLabel}
            className="min-h-11 px-space-3 py-space-1 inline-flex items-center gap-space-1 rounded-full bg-color-6 text-color-1 border-2 border-color-1 font-bold text-text-xs hover:bg-color-5 transition-colors duration-fast cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{exitLabel}</span>
          </button>

          {modeBadge && (
            <Badge variant={badgeVariant} className="shrink-0 hidden md:inline-flex">
              {modeBadge.label}
            </Badge>
          )}

          <h1 className="text-text-sm sm:text-text-base font-bold text-color-1 truncate min-w-0">
            {title}
          </h1>
        </div>

        {/* Center/Compact Progress */}
        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[260px] order-3 sm:order-2">
          <ProgressBar
            current={progressCurrent}
            total={Math.max(1, progressTotal)}
            label={progressLabel}
          />
        </div>

        {/* Right: Save Status, Timer/Stats, Shortcuts (?), Primary CTA */}
        <div className="flex items-center gap-space-1 sm:gap-space-2 order-2 sm:order-3 shrink-0">
          {saveStatus !== "idle" && (
            <div role="status" aria-live="polite" className="shrink-0">
              {saveStatus === "saving" && (
                <span className="min-h-11 inline-flex items-center gap-space-1 px-space-2 rounded-full bg-color-6 text-color-1 border border-color-1 text-text-2xs font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden md:inline">Đang lưu...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="min-h-11 inline-flex items-center gap-space-1 px-space-2 rounded-full bg-color-3/15 text-color-1 border border-color-3 text-text-2xs font-bold">
                  <span className="w-5 h-5 rounded-full bg-color-3 text-color-7 inline-flex items-center justify-center">
                    <Check className="w-3 h-3" aria-hidden="true" />
                  </span>
                  <span className="hidden md:inline">Đã lưu</span>
                </span>
              )}
              {saveStatus === "error" && (
                <button
                  type="button"
                  onClick={onRetrySave}
                  className="min-h-11 inline-flex items-center gap-space-1 px-space-2 rounded-full bg-color-4 text-color-1 border-2 border-color-1 text-text-2xs font-bold cursor-pointer hover:opacity-90 outline-none focus-visible:ring-4 focus-visible:ring-color-5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Lỗi lưu — Thử lại</span>
                </button>
              )}
            </div>
          )}

          {statusSlot}

          <button
            type="button"
            onClick={onOpenShortcuts}
            aria-label="Phím tắt (?)"
            title="Phím tắt (?)"
            className="min-h-11 min-w-11 px-space-2 inline-flex items-center justify-center gap-space-1 rounded-full bg-color-7 text-color-1 border-2 border-color-1 hover:bg-color-6 font-bold text-text-xs cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-color-5"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden lg:inline">?</span>
          </button>

          {primaryActionSlot}
        </div>
      </div>
    </header>
  );
};
