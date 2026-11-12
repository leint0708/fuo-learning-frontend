import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionChoicePanel } from "@/features/exam/QuestionChoicePanel";

describe("QuestionChoicePanel Component Tests", () => {
  it("renders buttons from A through H and does not render detailed text list", () => {
    const handleSelect = vi.fn();
    render(
      <QuestionChoicePanel
        options={{ A: "Programmed I/O", B: "Memory-mapped I/O", C: "Interrupt", D: "DMA" }}
        selectedOptions={null}
        feedbackMode="post_exam"
        onSelectOption={handleSelect}
      />
    );

    // Verify all 8 buttons A through H exist
    ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((letter) => {
      expect(screen.getByRole("button", { name: new RegExp(`^${letter}$`) })).toBeInTheDocument();
    });

    // Verify detailed option texts are NOT rendered (deleted as requested)
    expect(screen.queryByText("Programmed I/O")).not.toBeInTheDocument();
    expect(screen.queryByText("Memory-mapped I/O")).not.toBeInTheDocument();
  });

  it("calls onSelectOption when clicking an option button", () => {
    const handleSelect = vi.fn();
    render(
      <QuestionChoicePanel
        selectedOptions="C"
        feedbackMode="post_exam"
        onSelectOption={handleSelect}
      />
    );

    const btnB = screen.getByRole("button", { name: /^B$/ });
    fireEvent.click(btnB);
    expect(handleSelect).toHaveBeenCalledWith("B");
  });

  it("handles multi-selection active styles for multiple choices", () => {
    const handleSelect = vi.fn();
    render(
      <QuestionChoicePanel
        selectedOptions="ACD"
        questionType="multiple_choice"
        feedbackMode="post_exam"
        onSelectOption={handleSelect}
      />
    );

    const btnA = screen.getByRole("button", { name: /^A$/ });
    const btnB = screen.getByRole("button", { name: /^B$/ });
    const btnC = screen.getByRole("button", { name: /^C$/ });
    const btnD = screen.getByRole("button", { name: /^D$/ });

    // A, C, D should have selected class
    expect(btnA.className).toContain("bg-color-2");
    expect(btnC.className).toContain("bg-color-2");
    expect(btnD.className).toContain("bg-color-2");
    // B should NOT have selected class
    expect(btnB.className).not.toContain("bg-color-2");
  });

  it("renders 'Kiểm tra' button for multiple choice questions in instant mode", () => {
    const handleCheck = vi.fn();
    render(
      <QuestionChoicePanel
        selectedOptions="AC"
        questionType="multiple_choice"
        feedbackMode="instant"
        onSelectOption={vi.fn()}
        onCheckAnswer={handleCheck}
      />
    );

    const checkBtn = screen.getByRole("button", { name: /kiểm tra/i });
    expect(checkBtn).toBeInTheDocument();
    fireEvent.click(checkBtn);
    expect(handleCheck).toHaveBeenCalledTimes(1);
  });

  it("shows correctness feedback correctly in instant mode", () => {
    render(
      <QuestionChoicePanel
        selectedOptions="ACD"
        questionType="multiple_choice"
        feedbackMode="instant"
        instantResult={{
          isCorrect: true,
          correctAnswer: "ACD",
        }}
        onSelectOption={vi.fn()}
      />
    );

    expect(screen.getByText("✓ Chính xác")).toBeInTheDocument();
    const btnA = screen.getByRole("button", { name: /A/ });
    expect(btnA.className).toContain("bg-color-3");
  });
});
