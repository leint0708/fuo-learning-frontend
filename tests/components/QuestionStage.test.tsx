import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionStage } from "@/features/workspace/QuestionStage";
import type { Question } from "@/types/exam";

const diagramQuestion: Question = {
  questionId: "q_diag",
  questionNumber: 1,
  questionIdCode: "Q1",
  questionType: "single_choice",
  questionText: "Inspect the state machine diagram below.",
  imageUrl: "/static/exams/MAD101/Q1.webp",
  options: { A: "S0", B: "S1" },
};

const textQuestion: Question = {
  questionId: "q_text",
  questionNumber: 2,
  questionIdCode: "Q2",
  questionType: "multiple_choice",
  questionText: "Which protocols operate at Transport layer?",
  imageUrl: null,
  options: { A: "TCP", B: "UDP", C: "IP" },
};

describe("QuestionStage Component Tests", () => {
  it("applies touch-pan-y at 1.0x zoom and enables touch-none only when zoomLevel > 1", () => {
    render(<QuestionStage question={diagramQuestion} />);

    const viewport = screen.getByTestId("question-stage-viewport");
    expect(viewport.className).toContain("touch-pan-y");
    expect(viewport.className).not.toContain("touch-none");

    fireEvent.click(screen.getByRole("button", { name: /Phóng to/i }));
    expect(screen.getByText(/Câu 1 \(125%\)/)).toBeInTheDocument();
    expect(viewport.className).toContain("touch-none");
  });

  it("moves image error fallback outside pan capture surface so text stays selectable and retry works", () => {
    render(<QuestionStage question={diagramQuestion} />);

    const img = screen.getByRole("img", { name: /Hình minh họa câu 1/i });
    fireEvent.error(img);

    expect(screen.getByText(/Inspect the state machine diagram below\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thử tải lại hình ảnh/i })).toBeInTheDocument();
    expect(screen.queryByTestId("question-stage-viewport")).not.toBeInTheDocument();
  });

  it("renders clean selectable text-only stage without empty canvas box when imageUrl is null", () => {
    render(<QuestionStage question={textQuestion} />);

    expect(screen.getByText(/Nhiều đáp án/i)).toBeInTheDocument();
    expect(screen.getByText("Which protocols operate at Transport layer?")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Phóng to/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("question-stage-viewport")).not.toBeInTheDocument();
  });
});
