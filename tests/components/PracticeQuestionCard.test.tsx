import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PracticeQuestionCard } from "@/features/practice/PracticeQuestionCard";
import type { Question } from "@/types/exam";

const mockQuestion: Question = {
  questionId: "q_test_1",
  questionNumber: 1,
  questionIdCode: "Q1",
  questionType: "single_choice",
  questionText: "What is the capital of Vietnam?",
  imageUrl: "/static/test.png",
  options: {
    A: "Hanoi",
    B: "Ho Chi Minh City",
    C: "Da Nang",
    D: "Hue",
  },
};

const mockMultiQuestion: Question = {
  questionId: "q_multi_1",
  questionNumber: 2,
  questionIdCode: "Q2",
  questionType: "multiple_choice",
  questionText: "Select prime numbers:",
  imageUrl: null,
  options: {
    A: "2",
    B: "3",
    C: "4",
    D: "5",
  },
};

describe("PracticeQuestionCard", () => {
  it("renders question text, options, and question code badge", () => {
    render(
      <PracticeQuestionCard
        question={mockQuestion}
        selectedOptions=""
        isEvaluating={false}
        evaluatedResult={null}
        onSelectOption={vi.fn()}
        onSubmitAnswer={vi.fn()}
        onNextCard={vi.fn()}
      />
    );

    expect(screen.getByText("What is the capital of Vietnam?")).toBeInTheDocument();
    expect(screen.getByText("Hanoi")).toBeInTheDocument();
    expect(screen.getByText("Ho Chi Minh City")).toBeInTheDocument();
    expect(screen.getByText("Câu 1")).toBeInTheDocument();
  });

  it("calls onSelectOption when an option is clicked on single-choice question", () => {
    const handleSelect = vi.fn();
    render(
      <PracticeQuestionCard
        question={mockQuestion}
        selectedOptions=""
        isEvaluating={false}
        evaluatedResult={null}
        onSelectOption={handleSelect}
        onSubmitAnswer={vi.fn()}
        onNextCard={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Hanoi"));
    expect(handleSelect).toHaveBeenCalledWith("A");
  });

  it("displays submit button for multi-choice questions and calls onSubmitAnswer", () => {
    const handleSubmit = vi.fn();
    render(
      <PracticeQuestionCard
        question={mockMultiQuestion}
        selectedOptions="AB"
        isEvaluating={false}
        evaluatedResult={null}
        onSelectOption={vi.fn()}
        onSubmitAnswer={handleSubmit}
        onNextCard={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Kiểm tra đáp án/i });
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders evaluated result feedback and calls onNextCard when continue is clicked", () => {
    const handleNext = vi.fn();
    render(
      <PracticeQuestionCard
        question={mockQuestion}
        selectedOptions="A"
        isEvaluating={false}
        evaluatedResult={{
          isCorrect: true,
          correctAnswer: "A",
          explanation: "Hà Nội là thủ đô của Việt Nam.",
        }}
        onSelectOption={vi.fn()}
        onSubmitAnswer={vi.fn()}
        onNextCard={handleNext}
      />
    );

    expect(screen.getByText(/Chính xác!/i)).toBeInTheDocument();
    expect(screen.getByText("Hà Nội là thủ đô của Việt Nam.")).toBeInTheDocument();

    const continueBtn = screen.getByRole("button", { name: /Tiếp tục/i });
    fireEvent.click(continueBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });
});
