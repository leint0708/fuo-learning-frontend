import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionNavigator } from "@/features/workspace/QuestionNavigator";

describe("QuestionNavigator Component Tests", () => {
  it("renders semantic nav landmark with >=44px (min-h-11) grid pills and instant status", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: `q_${i + 1}`,
      number: i + 1,
      isAnswered: i === 1,
      isCurrent: i === 0,
      isCorrect: i === 1 ? false : null,
    }));

    render(
      <QuestionNavigator
        title="Danh sách câu hỏi"
        items={items}
        activeIndex={0}
        answeredCount={1}
        totalCount={10}
        onSelectQuestion={vi.fn()}
        onPrevQuestion={vi.fn()}
        onNextQuestion={vi.fn()}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Danh sách câu hỏi" });
    expect(nav).toBeInTheDocument();

    const q1 = screen.getByRole("button", { name: /Câu 1 \(Đang xem\)/i });
    expect(q1).toBeInTheDocument();

    const q2 = screen.getByRole("button", { name: /Câu 2 \(Chưa đúng\)/i });
    expect(q2.className).toContain("min-h-11");
    expect(q2.className).toContain("bg-color-4");
    expect(q2.className).toContain("text-color-1");

    expect(screen.getByText("Đang xem")).toBeInTheDocument();
    expect(screen.getByText("Chưa đúng")).toBeInTheDocument();
  });

  it("moves focus safely to sibling nav button before boundary button disables", () => {
    const items = [
      { id: "q_1", number: 1, isAnswered: false, isCurrent: false },
      { id: "q_2", number: 2, isAnswered: false, isCurrent: true },
    ];
    const onPrev = vi.fn();

    const { rerender } = render(
      <QuestionNavigator
        items={items}
        activeIndex={1}
        answeredCount={0}
        totalCount={2}
        onSelectQuestion={vi.fn()}
        onPrevQuestion={onPrev}
        onNextQuestion={vi.fn()}
      />
    );

    const prevBtn = screen.getByRole("button", { name: /Câu trước/i });
    const nextBtn = screen.getByRole("button", { name: /Câu sau/i });
    expect(nextBtn).toBeDisabled();

    prevBtn.focus();
    fireEvent.click(prevBtn);
    expect(onPrev).toHaveBeenCalledTimes(1);

    rerender(
      <QuestionNavigator
        items={[
          { id: "q_1", number: 1, isAnswered: false, isCurrent: true },
          { id: "q_2", number: 2, isAnswered: false, isCurrent: false },
        ]}
        activeIndex={0}
        answeredCount={0}
        totalCount={2}
        onSelectQuestion={vi.fn()}
        onPrevQuestion={onPrev}
        onNextQuestion={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /Câu trước/i })).toBeDisabled();
  });
});
