import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiAnswerModal } from "@/features/exam/AiAnswerModal";

describe("AiAnswerModal Component Tests", () => {
  it("renders AI choice, model name, and explanation when open", () => {
    const handleClose = vi.fn();

    render(
      <AiAnswerModal
        isOpen={true}
        onClose={handleClose}
        questionNumber={5}
        questionCode="Q5"
        aiChoice="C"
        aiModel="gemini-3-flash-preview"
        aiExplanation="Step 1: Formula verification. Step 2: Proof concludes with C."
        optionByOptionAnalysis={{ A: "Option A is false", C: "Option C is correct" }}
      />
    );

    expect(screen.getByText(/Giải thích chi tiết từ AI/)).toBeInTheDocument();
    expect(screen.getByText(/Lựa chọn C/)).toBeInTheDocument();
    expect(screen.getByText("gemini-3-flash-preview")).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Formula verification/)).toBeInTheDocument();
    expect(screen.getByText(/Option A is false/)).toBeInTheDocument();
    // Verify redundant crowded pill is removed
    expect(screen.queryByText(/Khả dụng toàn bộ thời gian làm bài/)).not.toBeInTheDocument();
  });

  it("renders multi-choice AI recommendation cleanly", () => {
    render(
      <AiAnswerModal
        isOpen={true}
        onClose={vi.fn()}
        questionNumber={20}
        questionCode="Q20"
        aiChoice="ACD"
        aiModel="gemini-3-flash-preview"
        aiExplanation="Explanation for multiple choices."
      />
    );

    expect(screen.getByText(/Lựa chọn ACD/)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();

    render(
      <AiAnswerModal
        isOpen={true}
        onClose={handleClose}
        questionNumber={1}
        questionCode="Q1"
        aiChoice="A"
      />
    );

    const closeBtn = screen.getByRole("button", { name: /đóng cửa sổ/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    render(
      <AiAnswerModal
        isOpen={false}
        onClose={vi.fn()}
        questionNumber={1}
        questionCode="Q1"
      />
    );

    expect(screen.queryByText(/Giải thích chi tiết từ AI/)).not.toBeInTheDocument();
  });
});
