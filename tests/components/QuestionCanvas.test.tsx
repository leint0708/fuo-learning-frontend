import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionCanvas } from "@/features/exam/QuestionCanvas";

describe("QuestionCanvas Component Tests", () => {
  it("renders zoom controls and question tag with initial 125% zoom autofocus", () => {
    render(
      <QuestionCanvas
        questionNumber={1}
        questionCode="Q1"
        imageUrl="/static/exams/MAD101/Q1.webp"
        questionTextFallback="Sample question text"
      />
    );

    expect(screen.getByText(/Câu 1 \(125%\)/)).toBeInTheDocument();
    expect(screen.getByText("Single Choice")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /original/i })).toBeInTheDocument();
  });

  it("renders Multiple Choice badge when questionType is multiple_choice", () => {
    render(
      <QuestionCanvas
        questionNumber={5}
        questionCode="Q5"
        questionType="multiple_choice"
        imageUrl="/static/exams/MAD101/Q5.webp"
        questionTextFallback="Multiple choice sample"
      />
    );

    expect(screen.getByText("Multiple Choice")).toBeInTheDocument();
  });

  it("preserves zoom level when question props change", () => {
    const { rerender } = render(
      <QuestionCanvas
        questionNumber={1}
        questionCode="Q1"
        imageUrl="/static/exams/MAD101/Q1.webp"
        questionTextFallback="Question 1 text"
      />
    );

    // Initial zoom is 125%
    expect(screen.getByText(/125%/)).toBeInTheDocument();

    // Zoom in to 150%
    const zoomInBtn = screen.getByRole("button", { name: /zoom in/i });
    fireEvent.click(zoomInBtn);
    expect(screen.getByText(/150%/)).toBeInTheDocument();

    // Rerender with next question
    rerender(
      <QuestionCanvas
        questionNumber={2}
        questionCode="Q2"
        imageUrl="/static/exams/MAD101/Q2.webp"
        questionTextFallback="Question 2 text"
      />
    );

    // Zoom level remains preserved at 150%
    expect(screen.getByText(/150%/)).toBeInTheDocument();
    expect(screen.getByText(/Câu 2/)).toBeInTheDocument();
  });

  it("handles zoom in and zoom out clicks", () => {
    render(
      <QuestionCanvas
        questionNumber={2}
        questionCode="Q2"
        imageUrl="/static/exams/MAD101/Q2.webp"
        questionTextFallback="Sample question 2"
      />
    );

    // Initial 125%
    expect(screen.getByText(/125%/)).toBeInTheDocument();

    const zoomInBtn = screen.getByRole("button", { name: /zoom in/i });
    fireEvent.click(zoomInBtn);

    // Zoom level increases to 150%
    expect(screen.getByText(/150%/)).toBeInTheDocument();

    const zoomOutBtn = screen.getByRole("button", { name: /zoom out/i });
    fireEvent.click(zoomOutBtn);

    // Zoom level returns to 125%
    expect(screen.getByText(/125%/)).toBeInTheDocument();
  });

  it("renders fallback text when imageUrl is null", () => {
    render(
      <QuestionCanvas
        questionNumber={3}
        questionCode="Q3"
        imageUrl={null}
        questionTextFallback="Fallback mathematical formula"
      />
    );

    expect(screen.getByText(/Fallback mathematical formula/)).toBeInTheDocument();
  });

  it("handles image load error and provides a retry mechanism", () => {
    render(
      <QuestionCanvas
        questionNumber={4}
        questionCode="Q4"
        imageUrl="/static/exams/MAD101/Q4.webp"
        questionTextFallback="Question 4 fallback text"
      />
    );

    const img = screen.getByRole("img", { name: /đề thi câu 4/i });
    expect(img).toBeInTheDocument();

    // Trigger image error
    fireEvent.error(img);

    // Fallback card with retry button is displayed
    expect(screen.getByText(/Question 4 fallback text/)).toBeInTheDocument();
    expect(screen.getByText(/Không thể tải sơ đồ\/hình ảnh từ máy chủ/)).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /thử tải lại hình ảnh/i });
    expect(retryBtn).toBeInTheDocument();

    // Clicking retry resets error and attempts reload
    fireEvent.click(retryBtn);
    expect(screen.getByRole("img", { name: /đề thi câu 4/i })).toBeInTheDocument();
  });
});
