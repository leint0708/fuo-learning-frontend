import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionListSidebar } from "@/features/exam/QuestionListSidebar";

describe("QuestionListSidebar Unified Scrollable & Stepping Tests", () => {
  it("renders all question numbers in a single list regardless of question count", () => {
    const mockQuestions = Array.from({ length: 50 }, (_, i) => ({
      id: `q_${i + 1}`,
      number: i + 1,
      isAnswered: i < 15,
      isCurrent: i === 0,
    }));

    render(
      <QuestionListSidebar
        totalQuestions={50}
        questions={mockQuestions}
        activeQuestionIndex={0}
        onSelectQuestion={vi.fn()}
        answeredCount={15}
      />
    );

    // Header and completion count
    expect(screen.getByText("Danh sách câu hỏi")).toBeInTheDocument();
    expect(screen.getByText("Tổng: 50 câu")).toBeInTheDocument();
    expect(screen.getByText(/Số câu đã làm: 15\/50/)).toBeInTheDocument();

    // All questions 1 to 50 must be rendered in DOM without page split
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("26")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();

    // Multi-page controls must NOT exist
    expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /trang trước/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /trang sau/i })).not.toBeInTheDocument();
  });

  it("handles direct question stepping navigation (Previous / Next)", () => {
    const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
      id: `q_${i + 1}`,
      number: i + 1,
      isAnswered: false,
      isCurrent: i === 2,
    }));

    const handlePrevQuestion = vi.fn();
    const handleNextQuestion = vi.fn();

    render(
      <QuestionListSidebar
        totalQuestions={10}
        questions={mockQuestions}
        activeQuestionIndex={2} // Question 3
        onSelectQuestion={vi.fn()}
        onPrevQuestion={handlePrevQuestion}
        onNextQuestion={handleNextQuestion}
        answeredCount={0}
      />
    );

    const prevBtn = screen.getByRole("button", { name: /câu trước/i });
    const nextBtn = screen.getByRole("button", { name: /câu sau/i });

    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);
    expect(handleNextQuestion).toHaveBeenCalledTimes(1);

    fireEvent.click(prevBtn);
    expect(handlePrevQuestion).toHaveBeenCalledTimes(1);
  });

  it("disables Previous button on question 1 and Next button on last question", () => {
    const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
      id: `q_${i + 1}`,
      number: i + 1,
      isAnswered: false,
      isCurrent: i === 0,
    }));

    const { rerender } = render(
      <QuestionListSidebar
        totalQuestions={10}
        questions={mockQuestions}
        activeQuestionIndex={0} // Question 1
        onSelectQuestion={vi.fn()}
        answeredCount={0}
      />
    );

    // On Q1: Previous disabled, Next enabled
    expect(screen.getByRole("button", { name: /câu trước/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /câu sau/i })).toBeEnabled();

    // Re-render on last question (index 9)
    rerender(
      <QuestionListSidebar
        totalQuestions={10}
        questions={mockQuestions}
        activeQuestionIndex={9} // Question 10
        onSelectQuestion={vi.fn()}
        answeredCount={0}
      />
    );

    // On Q10: Previous enabled, Next disabled
    expect(screen.getByRole("button", { name: /câu trước/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /câu sau/i })).toBeDisabled();
  });
});
