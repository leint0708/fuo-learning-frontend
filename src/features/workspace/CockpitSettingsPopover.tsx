import React, { useEffect, useRef } from "react";
import { Keyboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CockpitSettingsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  answerSourceToggle?: {
    ariaLabel: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    fallbackNote?: string | null;
  };
  onOpenShortcuts: () => void;
}

/**
 * Anchored Settings popover inside CockpitHeader housing answer-source switching
 * (Đáp án AI vs Cộng đồng) and keyboard shortcut help without crowding the slim top bar.
 */
export const CockpitSettingsPopover: React.FC<CockpitSettingsPopoverProps> = ({
  isOpen,
  onClose,
  answerSourceToggle,
  onOpenShortcuts,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        const trigger = (e.target as HTMLElement).closest?.('[data-settings-trigger="true"]');
        if (!trigger) {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Cài đặt phiên làm bài"
      data-impeccable-ignore="hard-offset-shadow"
      className="absolute right-0 top-full mt-space-2 w-72 sm:w-80 z-50 bg-color-7 text-color-1 border-2 border-color-1 rounded-3xl shadow-sm p-space-4 flex flex-col gap-space-4"
    >
      {answerSourceToggle && (
        <div className="flex flex-col gap-space-2">
          <div className="flex items-center gap-space-1 text-text-xs font-bold text-color-1">
            <Sparkles className="w-4 h-4 text-color-2 shrink-0" aria-hidden="true" />
            <span>{answerSourceToggle.ariaLabel}</span>
          </div>
          <div
            role="group"
            aria-label={answerSourceToggle.ariaLabel}
            className="grid grid-cols-2 gap-space-1 p-1 rounded-full border-2 border-color-1 bg-color-6"
          >
            {answerSourceToggle.options.map((opt) => {
              const isSelected = opt.value === answerSourceToggle.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => answerSourceToggle.onChange(opt.value)}
                  className={`min-h-11 px-space-2 rounded-full text-[13px] sm:text-text-xs font-bold transition-colors duration-fast cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-color-5 whitespace-nowrap ${
                    isSelected
                      ? "bg-color-2 text-color-7 shadow-2xs"
                      : "bg-transparent text-color-1 hover:bg-color-7"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {answerSourceToggle.fallbackNote && (
            <p
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-color-1 bg-color-6 px-space-2 py-space-2 text-text-2xs font-medium text-color-1 leading-snug"
            >
              {answerSourceToggle.fallbackNote}
            </p>
          )}
        </div>
      )}

      <div className="pt-space-2 border-t-2 border-color-6 flex flex-col gap-space-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onClose();
            onOpenShortcuts();
          }}
          className="min-h-11 w-full inline-flex items-center justify-center gap-space-2"
        >
          <Keyboard className="w-4 h-4 text-color-2" aria-hidden="true" />
          <span>Xem phím tắt (?)</span>
        </Button>
      </div>
    </div>
  );
};
