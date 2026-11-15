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

  it("renders loading state without hardcoded fallback answers", () => {
    render(
      <AiAnswerModal
        isOpen={true}
        onClose={vi.fn()}
        questionNumber={3}
        questionCode="Q3"
        isLoading={true}
        aiChoice={null}
        aiExplanation={null}
      />
    );

    expect(
      screen.getByText(/Đang tải phân tích chi tiết từ AI/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Lựa chọn C/i)).not.toBeInTheDocument();
  });

  it("renders explicit error state with retry action and zero hardcoded fallback", () => {
    const handleRetry = vi.fn();

    render(
      <AiAnswerModal
        isOpen={true}
        onClose={vi.fn()}
        questionNumber={4}
        questionCode="Q4"
        isLoading={false}
        errorMessage="Dịch vụ AI tạm thời gián đoạn"
        onRetry={handleRetry}
        aiChoice={null}
        aiExplanation={null}
      />
    );

    expect(
      screen.getByText(/Không thể tải phân tích AI lúc này/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Dịch vụ AI tạm thời gián đoạn/i)).toBeInTheDocument();
    expect(screen.queryByText(/Lựa chọn C/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Thử lại/i }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("hides duplicated OCR question text when image thumbnail is rendered and marks user choice vs AI choice", () => {
    render(
      <AiAnswerModal
        isOpen={true}
        onClose={vi.fn()}
        questionNumber={2}
        questionCode="Q2"
        questionText="What is the capital of Vietnam?"
        imageUrl="/static/exams/GEO/Q2.webp"
        options={{ B: "Hanoi", A: "Hue", C: "Da Nang" }}
        selectedOption="A"
        aiChoice="B"
        aiExplanation="Hanoi is the capital."
      />
    );

    expect(screen.queryByText("What is the capital of Vietnam?")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Minh họa câu 2/i })).toHaveAttribute(
      "src",
      "/static/exams/GEO/Q2.webp"
    );
    expect(screen.getByText(/A\. Hue/i)).toBeInTheDocument();
    expect(screen.getByText(/B\. Hanoi/i)).toBeInTheDocument();
    expect(screen.getByText("Bạn chọn")).toBeInTheDocument();
    expect(screen.getByText("AI gợi ý")).toBeInTheDocument();
  });

  it("renders question stem text in modal when imageUrl is absent", () => {
    render(
      <AiAnswerModal
        isOpen={true}
        onClose={vi.fn()}
        questionNumber={3}
        questionCode="Q3"
        questionText="What is the capital of Vietnam?"
        imageUrl={null}
        options={{ A: "Hue", B: "Hanoi" }}
        selectedOption="A"
        aiChoice="B"
        aiExplanation="Hanoi is the capital."
      />
    );

    expect(screen.getByText("What is the capital of Vietnam?")).toBeInTheDocument();
  });
});
