import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionListSidebar } from "@/features/exam/QuestionListSidebar";

describe("QuestionListSidebar Adaptive Layout Tests", () => {
  it("renders full-width 'Số câu đã làm' box when total questions <= 25 (single page)", () => {
    const mockQuestions = Array.from({ length: 20 }, (_, i) => ({
      id: `q_${i + 1}`,
      number: i + 1,
      isAnswered: i < 5,
      isCurrent: i === 0,
    }));

    render(
      <QuestionListSidebar
        totalQuestions={20}
        questions={mockQuestions}
        activeQuestionIndex={0}
        onSelectQuestion={vi.fn()}
        currentPage={1}
        onPrevPage={vi.fn()}
        onNextPage={vi.fn()}
        answeredCount={5}
        // pageSize defaults to 25
      />
    );

    // Matches "Số câu đã làm: 5/20"
    expect(screen.getByText(/Số câu đã làm: 5\/20/)).toBeInTheDocument();

    // Navigation buttons must NOT be present
    expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /trang trước/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /trang sau/i })).not.toBeInTheDocument();
  });

  it("renders 'x/n' and 3-box navigation when total questions > 25 (multi-page, 25 questions per page)", () => {
    const mockQuestions = Array.from({ length: 50 }, (_, i) => ({
      id: `q_${i + 1}`,
      number: i + 1,
      isAnswered: i < 15,
      isCurrent: i === 0,
    }));

    const handleNextPage = vi.fn();
    const handlePrevPage = vi.fn();

    render(
      <QuestionListSidebar
        totalQuestions={50}
        questions={mockQuestions}
        activeQuestionIndex={0}
        onSelectQuestion={vi.fn()}
        currentPage={1}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        answeredCount={15}
        // pageSize defaults to 25
      />
    );

    // Box 1: "x/n" compact completion box
    expect(screen.getByText("15/50")).toBeInTheDocument();

    // 3-box navigation: "1/2 page", prev button, next button (50 questions = 2 pages)
    const pageIndicatorText = screen.getByText("1/2 page");
    expect(pageIndicatorText).toBeInTheDocument();
    expect(pageIndicatorText.parentElement).toHaveClass("min-w-[76px]");
    expect(pageIndicatorText.parentElement).toHaveClass("px-space-3");

    const nextBtn = screen.getByRole("button", { name: /trang sau/i });
    expect(nextBtn).toBeInTheDocument();
    expect(nextBtn).toBeEnabled();

    const prevBtn = screen.getByRole("button", { name: /trang trước/i });
    expect(prevBtn).toBeInTheDocument();
    expect(prevBtn).toBeDisabled(); // on page 1

    fireEvent.click(nextBtn);
    expect(handleNextPage).toHaveBeenCalledTimes(1);
  });

  it("slices questions into batches of 25 per page", () => {
    const mockQuestions = Array.from({ length: 60 }, (_, i) => ({
      id: `q_${i + 1}`,
      number: i + 1,
      isAnswered: false,
      isCurrent: i === 25,
    }));

    // Render Page 2 of a 60-question exam (questions 26-50)
    render(
      <QuestionListSidebar
        totalQuestions={60}
        questions={mockQuestions}
        activeQuestionIndex={25}
        onSelectQuestion={vi.fn()}
        currentPage={2}
        onPrevPage={vi.fn()}
        onNextPage={vi.fn()}
        answeredCount={0}
      />
    );

    // Page indicator displays 2/3 page
    expect(screen.getByText("2/3 page")).toBeInTheDocument();

    // Question 26 should be visible
    expect(screen.getByText("26")).toBeInTheDocument();
    // Question 50 should be visible
    expect(screen.getByText("50")).toBeInTheDocument();
    // Question 1 (page 1) and Question 55 (page 3) should NOT be rendered
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("55")).not.toBeInTheDocument();
  });
});
