import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { SubjectPracticeActions } from "@/features/subjects/SubjectPracticeActions";

describe("SubjectPracticeActions", () => {
  it("renders both Cram Mode and Learn Mode buttons with badges", () => {
    render(
      <BrowserRouter>
        <SubjectPracticeActions
          subjectCode="MAD101"
          totalBankQuestions={50}
          cramMasteredCount={10}
          learnGraduatedCount={7}
        />
      </BrowserRouter>
    );

    expect(screen.getByText("Luyện thi cấp tốc")).toBeInTheDocument();
    expect(screen.getByText("Học ghi nhớ")).toBeInTheDocument();
    expect(screen.getByText("10/50 câu đã thuộc")).toBeInTheDocument();
    expect(screen.getByText("7/50 câu thành thạo")).toBeInTheDocument();
  });

  it("calls onLaunchCram and onLaunchLearn callbacks when clicked", () => {
    const handleCram = vi.fn();
    const handleLearn = vi.fn();

    render(
      <BrowserRouter>
        <SubjectPracticeActions
          subjectCode="MAD101"
          totalBankQuestions={50}
          onLaunchCram={handleCram}
          onLaunchLearn={handleLearn}
        />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Luyện thi cấp tốc/i }));
    expect(handleCram).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Học ghi nhớ/i }));
    expect(handleLearn).toHaveBeenCalledTimes(1);
  });

  it("disables buttons when totalBankQuestions is 0", () => {
    render(
      <BrowserRouter>
        <SubjectPracticeActions
          subjectCode="EMPTY101"
          totalBankQuestions={0}
        />
      </BrowserRouter>
    );

    const cramBtn = screen.getByRole("button", { name: /Luyện thi cấp tốc/i });
    const learnBtn = screen.getByRole("button", { name: /Học ghi nhớ/i });

    expect(cramBtn).toBeDisabled();
    expect(learnBtn).toBeDisabled();
    expect(screen.getAllByText("Chưa có câu hỏi luyện tập").length).toBe(2);
  });
});
