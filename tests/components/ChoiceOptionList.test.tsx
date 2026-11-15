import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChoiceOptionList } from "@/features/workspace/ChoiceOptionList";

describe("ChoiceOptionList Component Tests", () => {
  it("renders sorted keys dynamically with full option text and desktop keycap hints (never dead E-H slots on 4-option items)", () => {
    const handleSelect = vi.fn();
    render(
      <ChoiceOptionList
        options={{
          D: "DMA",
          A: "Programmed I/O",
          C: "Interrupt",
          B: "Memory-mapped I/O",
        }}
        selectedOptions=""
        feedbackMode="post_exam"
        onSelectOption={handleSelect}
      />
    );

    expect(screen.getByText("Programmed I/O")).toBeInTheDocument();
    expect(screen.getByText("Memory-mapped I/O")).toBeInTheDocument();
    expect(screen.getByText("Interrupt")).toBeInTheDocument();
    expect(screen.getByText("DMA")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Đáp án A: Programmed I\/O/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Đáp án E/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Đáp án B/i }));
    expect(handleSelect).toHaveBeenCalledWith("B");
  });

  it("supports clear selection button when allowsClear is true and shows multi-choice check button", () => {
    const handleClear = vi.fn();
    const handleCheck = vi.fn();

    render(
      <ChoiceOptionList
        options={{ A: "Alpha", B: "Beta", C: "Gamma" }}
        selectedOptions="AC"
        questionType="multiple_choice"
        feedbackMode="instant"
        allowsClear={true}
        onSelectOption={vi.fn()}
        onClearSelection={handleClear}
        onSubmitMultiChoice={handleCheck}
      />
    );

    const btnA = screen.getByRole("button", { name: /Đáp án A/i });
    expect(btnA).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /Bỏ chọn/i }));
    expect(handleClear).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Kiểm tra/i }));
    expect(handleCheck).toHaveBeenCalledTimes(1);
  });

  it("renders accessible instant correctness feedback with WCAG AA styling and aria-live status", () => {
    render(
      <ChoiceOptionList
        options={{ A: "Option A", B: "Option B" }}
        selectedOptions="B"
        feedbackMode="instant"
        evaluation={{
          status: "resolved",
          isCorrect: false,
          correctAnswer: "A",
          aiExplanation: null,
        }}
        onSelectOption={vi.fn()}
      />
    );

    const statusBadge = screen.getByRole("status");
    expect(statusBadge).toHaveAttribute("aria-live", "polite");
    expect(statusBadge).toHaveTextContent(/Chưa chính xác/i);
    // Uses dark ink on coral for WCAG AA >= 4.5:1 instead of white on coral
    const wrongBtn = screen.getByRole("button", { name: /Đáp án B/i });
    expect(wrongBtn.className).toContain("bg-color-4");
    expect(wrongBtn.className).toContain("text-color-1");
  });
});
