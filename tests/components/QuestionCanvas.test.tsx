import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionCanvas } from "@/features/exam/QuestionCanvas";

describe("QuestionCanvas Component Tests", () => {
  it("renders zoom controls and question tag with initial 100% zoom autofocus", () => {
    render(
      <QuestionCanvas
        questionNumber={1}
        questionCode="Q1"
        imageUrl="/static/exams/MAD101/Q1.webp"
        questionTextFallback="Sample question text"
      />
    );

    expect(screen.getByText(/Câu 1 \(100%\)/)).toBeInTheDocument();
    expect(screen.getByText("Một đáp án")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /phóng to/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thu nhỏ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kích thước gốc/i })).toBeInTheDocument();
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

    expect(screen.getByText("Nhiều đáp án")).toBeInTheDocument();
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

    expect(screen.getByText(/100%/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /phóng to/i }));
    expect(screen.getByText(/125%/)).toBeInTheDocument();

    rerender(
      <QuestionCanvas
        questionNumber={2}
        questionCode="Q2"
        imageUrl="/static/exams/MAD101/Q2.webp"
        questionTextFallback="Question 2 text"
      />
    );

    expect(screen.getByText(/125%/)).toBeInTheDocument();
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

    expect(screen.getByText(/100%/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /phóng to/i }));
    expect(screen.getByText(/125%/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /thu nhỏ/i }));
    expect(screen.getByText(/100%/)).toBeInTheDocument();
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

    const img = screen.getByRole("img", { name: /hình minh họa câu 4/i });
    expect(img).toBeInTheDocument();

    fireEvent.error(img);

    expect(screen.getByText(/Question 4 fallback text/)).toBeInTheDocument();
    expect(screen.getByText(/Không tải được hình ảnh \(Q4\)/)).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /thử tải lại hình ảnh/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(screen.getByRole("img", { name: /hình minh họa câu 4/i })).toBeInTheDocument();
  });

  it("supports zoom in and zoom out via Ctrl + scroll wheel", () => {
    render(
      <QuestionCanvas
        questionNumber={1}
        questionCode="Q1"
        imageUrl="/static/exams/MAD101/Q1.webp"
        questionTextFallback="Question 1 text"
      />
    );

    expect(screen.getByText(/100%/)).toBeInTheDocument();

    const viewport = screen.getByTestId("question-stage-viewport");

    fireEvent.wheel(viewport, { ctrlKey: true, deltaY: -100 });
    expect(screen.getByText(/125%/)).toBeInTheDocument();

    fireEvent.wheel(viewport, { ctrlKey: true, deltaY: 100 });
    expect(screen.getByText(/100%/)).toBeInTheDocument();

    fireEvent.wheel(viewport, { ctrlKey: false, deltaY: -100 });
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("supports touch/pointer drag panning and recovers cleanly from interrupted gestures", () => {
    render(
      <QuestionCanvas
        questionNumber={1}
        questionCode="Q1"
        imageUrl="/static/exams/MAD101/Q1.webp"
        questionTextFallback="Question 1 text"
      />
    );

    const viewport = screen.getByTestId("question-stage-viewport");
    expect(viewport.className).toContain("touch-pan-y");

    // Zoom in so pan switches to touch-none
    fireEvent.click(screen.getByRole("button", { name: /phóng to/i }));
    expect(viewport.className).toContain("touch-none");

    const img = screen.getByRole("img", { name: /hình minh họa câu 1/i });
    const transformWrapper = img.parentElement as HTMLElement;

    const dispatchPointer = (
      type: string,
      props: { pointerId: number; clientX?: number; clientY?: number }
    ) => {
      const evt = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: props.clientX ?? 0,
        clientY: props.clientY ?? 0,
      });
      Object.defineProperty(evt, "pointerId", { value: props.pointerId });
      fireEvent(viewport, evt);
    };

    dispatchPointer("pointerdown", { pointerId: 1, clientX: 100, clientY: 100 });
    dispatchPointer("pointermove", { pointerId: 1, clientX: 150, clientY: 125 });

    // Second finger landing without active multi-touch is tracked for pinch but ignored for single pan delta
    dispatchPointer("pointerdown", { pointerId: 2, clientX: 300, clientY: 300 });
    dispatchPointer("pointermove", { pointerId: 2, clientX: 400, clientY: 400 });

    expect(transformWrapper.style.transform).toContain("translate3d(40px, 20px, 0)");

    dispatchPointer("pointercancel", { pointerId: 1 });
    dispatchPointer("pointermove", { pointerId: 1, clientX: 200, clientY: 200 });
    expect(transformWrapper.style.transform).toContain("translate3d(40px, 20px, 0)");
  });
});
