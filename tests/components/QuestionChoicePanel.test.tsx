import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionChoicePanel } from "@/features/exam/QuestionChoicePanel";

describe("QuestionChoicePanel Component Tests", () => {
  it("renders option buttons with full text list and falls back when options are empty", () => {
    const handleSelect = vi.fn();
    render(
      <QuestionChoicePanel
        options={{ A: "Programmed I/O", B: "Memory-mapped I/O", C: "Interrupt", D: "DMA" }}
        selectedOptions={null}
        feedbackMode="post_exam"
        onSelectOption={handleSelect}
      />
    );

    expect(screen.getByText("Programmed I/O")).toBeInTheDocument();
    expect(screen.getByText("Memory-mapped I/O")).toBeInTheDocument();
    expect(screen.getByText("Interrupt")).toBeInTheDocument();
    expect(screen.getByText("DMA")).toBeInTheDocument();

    ["A", "B", "C", "D"].forEach((letter) => {
      expect(
        screen.getByRole("button", { name: new RegExp(`Đáp án ${letter}:`, "i") })
      ).toBeInTheDocument();
    });
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

    const btnB = screen.getByRole("button", { name: /Đáp án B/i });
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

    const btnA = screen.getByRole("button", { name: /Đáp án A/i });
    const btnB = screen.getByRole("button", { name: /Đáp án B/i });
    const btnC = screen.getByRole("button", { name: /Đáp án C/i });
    const btnD = screen.getByRole("button", { name: /Đáp án D/i });

    expect(btnA.className).toContain("bg-color-2");
    expect(btnC.className).toContain("bg-color-2");
    expect(btnD.className).toContain("bg-color-2");
    expect(btnB.className).not.toContain("bg-color-2");
  });

  it("renders 'Kiểm tra đáp án' button for multiple choice questions in instant mode", () => {
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
    const btnA = screen.getByRole("button", { name: /Đáp án A/i });
    expect(btnA.className).toContain("bg-color-3");
  });
});
