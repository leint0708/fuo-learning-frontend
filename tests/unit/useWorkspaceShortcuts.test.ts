import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWorkspaceShortcuts } from "@/hooks/useWorkspaceShortcuts";

describe("useWorkspaceShortcuts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("maps 1-8 and A-H only to sortedOptionKeys", () => {
    const onSelectOption = vi.fn();
    renderHook(() =>
      useWorkspaceShortcuts({
        sortedOptionKeys: ["A", "B", "C", "D"],
        isOptionsLocked: false,
        onSelectOption,
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "7" })); // out of range
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "F" })); // not in A-D

    expect(onSelectOption).toHaveBeenNthCalledWith(1, "B");
    expect(onSelectOption).toHaveBeenNthCalledWith(2, "C");
    expect(onSelectOption).toHaveBeenCalledTimes(2);
  });

  it("enforces 300ms cooldown on Space after evaluation resolves so rapid double-taps cannot ambush modals", () => {
    const onContinue = vi.fn();
    vi.setSystemTime(new Date(10000));

    const { rerender } = renderHook(
      ({ resolvedAt }: { resolvedAt: number | null }) =>
        useWorkspaceShortcuts({
          sortedOptionKeys: ["A", "B"],
          isOptionsLocked: resolvedAt !== null,
          isContinueReady: resolvedAt !== null,
          feedbackResolvedAt: resolvedAt,
          onSelectOption: vi.fn(),
          onContinue,
        }),
      { initialProps: { resolvedAt: 10000 as number | null } }
    );

    // Immediate Space within 300ms -> blocked
    vi.setSystemTime(new Date(10150));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(onContinue).not.toHaveBeenCalled();

    // After 300ms -> allowed
    vi.setSystemTime(new Date(10350));
    rerender({ resolvedAt: 10000 });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("suppresses all shortcuts when a modal dialog or editable input is active", () => {
    const onSelectOption = vi.fn();
    const onOpenShortcuts = vi.fn();
    renderHook(() =>
      useWorkspaceShortcuts({
        sortedOptionKeys: ["A", "B"],
        isOptionsLocked: false,
        onSelectOption,
        onOpenShortcuts,
      })
    );

    // Active dialog in DOM
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    document.body.appendChild(dialog);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    expect(onSelectOption).not.toHaveBeenCalled();
    expect(onOpenShortcuts).not.toHaveBeenCalled();

    dialog.remove();

    // Active input focus
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(onSelectOption).not.toHaveBeenCalled();
  });

  it("supports arrow navigation and canvas zoom shortcuts when visual media is active", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onResetZoom = vi.fn();
    const onOpenShortcuts = vi.fn();

    renderHook(() =>
      useWorkspaceShortcuts({
        sortedOptionKeys: ["A", "B"],
        isOptionsLocked: false,
        hasVisualMedia: true,
        onSelectOption: vi.fn(),
        onPrevQuestion: onPrev,
        onNextQuestion: onNext,
        onZoomIn,
        onZoomOut,
        onResetZoom,
        onOpenShortcuts,
      })
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "+" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "-" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onResetZoom).toHaveBeenCalledTimes(1);
    expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
  });

  it("allows Ctrl+Enter to submit multi-choice even while an option button has focus", () => {
    const onSubmitMultiChoice = vi.fn();
    renderHook(() =>
      useWorkspaceShortcuts({
        sortedOptionKeys: ["A", "B", "C"],
        isOptionsLocked: false,
        canSubmitMultiChoice: true,
        onSelectOption: vi.fn(),
        onSubmitMultiChoice,
      })
    );

    const optBtn = document.createElement("button");
    document.body.appendChild(optBtn);
    optBtn.focus();

    // Plain Enter on focused button does not hijack button click
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onSubmitMultiChoice).not.toHaveBeenCalled();

    // Ctrl+Enter submits multi-choice from anywhere
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
    expect(onSubmitMultiChoice).toHaveBeenCalledTimes(1);
  });
});
