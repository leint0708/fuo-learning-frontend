import { useEffect } from "react";

export interface UseWorkspaceShortcutsOptions {
  sortedOptionKeys: string[];
  isOptionsLocked: boolean;
  isContinueReady?: boolean;
  canSubmitMultiChoice?: boolean;
  feedbackResolvedAt?: number | null;
  hasVisualMedia?: boolean;
  isModalOpen?: boolean;
  onSelectOption: (key: string) => void;
  onSubmitMultiChoice?: () => void;
  onContinue?: () => void;
  onPrevQuestion?: () => void;
  onNextQuestion?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onOpenShortcuts?: () => void;
}

const SPACE_COOLDOWN_MS = 300;

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function hasOpenModalInDom(): boolean {
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
}

/**
 * Shared safe keyboard engine for Study (Cram/Learn) & Exam workspaces.
 * Enforces input/modal suppression guards and a 300ms Space advance cooldown.
 */
export function useWorkspaceShortcuts({
  sortedOptionKeys,
  isOptionsLocked,
  isContinueReady = false,
  canSubmitMultiChoice = false,
  feedbackResolvedAt = null,
  hasVisualMedia = false,
  isModalOpen = false,
  onSelectOption,
  onSubmitMultiChoice,
  onContinue,
  onPrevQuestion,
  onNextQuestion,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenShortcuts,
}: UseWorkspaceShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierSubmit =
        (event.ctrlKey || event.metaKey) && !event.altKey && event.key === "Enter";

      if (
        event.defaultPrevented ||
        event.altKey ||
        ((event.ctrlKey || event.metaKey) && !isModifierSubmit) ||
        isModalOpen ||
        hasOpenModalInDom() ||
        isEditableElement(document.activeElement) ||
        isEditableElement(event.target)
      ) {
        return;
      }

      const key = event.key;
      const activeTag = document.activeElement?.tagName;
      const isInteractiveFocused = activeTag === "BUTTON" || activeTag === "A";

      // Cheat-sheet trigger (?)
      if (key === "?" && onOpenShortcuts) {
        event.preventDefault();
        onOpenShortcuts();
        return;
      }

      // Diagram zoom shortcuts (+/-/0)
      if (hasVisualMedia) {
        if ((key === "+" || key === "=") && onZoomIn) {
          event.preventDefault();
          onZoomIn();
          return;
        }
        if (key === "-" && onZoomOut) {
          event.preventDefault();
          onZoomOut();
          return;
        }
        if (key === "0" && onResetZoom) {
          event.preventDefault();
          onResetZoom();
          return;
        }
      }

      // Prev / Next arrows
      if (key === "ArrowLeft" && onPrevQuestion) {
        event.preventDefault();
        onPrevQuestion();
        return;
      }

      if (key === "ArrowRight") {
        if (isContinueReady && onContinue) {
          event.preventDefault();
          onContinue();
          return;
        }
        if (onNextQuestion) {
          event.preventDefault();
          onNextQuestion();
          return;
        }
      }

      // Space: continue after evaluation with 300ms cooldown
      if (key === " " && isContinueReady && onContinue && !isInteractiveFocused) {
        const elapsed =
          feedbackResolvedAt !== null ? Date.now() - feedbackResolvedAt : SPACE_COOLDOWN_MS;
        if (elapsed >= SPACE_COOLDOWN_MS) {
          event.preventDefault();
          onContinue();
        }
        return;
      }

      // Enter: check multi-choice answer (Ctrl/Cmd+Enter works anywhere, plain Enter when not on a control)
      if (
        key === "Enter" &&
        canSubmitMultiChoice &&
        onSubmitMultiChoice &&
        (event.ctrlKey || event.metaKey || !isInteractiveFocused)
      ) {
        event.preventDefault();
        onSubmitMultiChoice();
        return;
      }

      // Option selection (1-8 / A-H)
      if (!isOptionsLocked) {
        if (/^[1-8]$/.test(key)) {
          const idx = Number.parseInt(key, 10) - 1;
          const mappedKey = sortedOptionKeys[idx];
          if (mappedKey) {
            event.preventDefault();
            onSelectOption(mappedKey);
          }
          return;
        }

        const upper = key.toUpperCase();
        if (/^[A-H]$/.test(upper) && sortedOptionKeys.includes(upper)) {
          event.preventDefault();
          onSelectOption(upper);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    sortedOptionKeys,
    isOptionsLocked,
    isContinueReady,
    canSubmitMultiChoice,
    feedbackResolvedAt,
    hasVisualMedia,
    isModalOpen,
    onSelectOption,
    onSubmitMultiChoice,
    onContinue,
    onPrevQuestion,
    onNextQuestion,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onOpenShortcuts,
  ]);
}
