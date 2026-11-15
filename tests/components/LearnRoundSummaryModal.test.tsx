import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LearnRoundSummaryModal } from "@/features/practice/LearnRoundSummaryModal";
import type { RoundDiagnostic } from "@/types/practice";

const mockDiagnostic: RoundDiagnostic = {
  roundNumber: 1,
  totalCardsReviewed: 5,
  incorrectCount: 1,
  correctCount: 4,
  errorRate: 20, // 20% -> 0 < E < 30 bracket
  items: [
    {
      question: {
        questionId: "q_1",
        questionNumber: 1,
        questionIdCode: "Q1",
        questionType: "single_choice",
        questionText: "What is 2 + 2?",
        imageUrl: null,
        options: { A: "3", B: "4", C: "5", D: "6" },
      },
      selectedOptions: "B",
      correctAnswer: "B",
      isCorrect: true,
      consecutiveCorrect: 1,
      wrongAttempts: 0,
      status: "learned",
    },
    {
      question: {
        questionId: "q_2",
        questionNumber: 2,
        questionIdCode: "Q2",
        questionType: "single_choice",
        questionText: "What is the capital of France?",
        imageUrl: null,
        options: { A: "Berlin", B: "Rome", C: "Paris", D: "Madrid" },
      },
      selectedOptions: "A",
      correctAnswer: "C",
      isCorrect: false,
      consecutiveCorrect: 0,
      wrongAttempts: 1,
      status: "learning",
      explanation: "Paris là thủ đô của nước Pháp.",
    },
  ],
};

describe("LearnRoundSummaryModal", () => {
  it("renders round diagnostic headline and tiered feedback for 20% error rate", () => {
    render(
      <LearnRoundSummaryModal
        isOpen={true}
        roundDiagnostic={mockDiagnostic}
        activePoolCount={4}
        waitingCount={5}
        graduatedCount={1}
        totalDeckSize={10}
        onContinueNextRound={vi.fn()}
        onFinishSession={vi.fn()}
      />
    );

    expect(screen.getByText(/Tổng kết Vòng 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Rất tốt! Tiếp tục nào! 🔥/i)).toBeInTheDocument();
    expect(screen.getByText("Tỷ lệ sai: 20%")).toBeInTheDocument();
  });

  it("renders question audit gallery items with correct/incorrect status", () => {
    render(
      <LearnRoundSummaryModal
        isOpen={true}
        roundDiagnostic={mockDiagnostic}
        activePoolCount={4}
        waitingCount={5}
        graduatedCount={1}
        totalDeckSize={10}
        onContinueNextRound={vi.fn()}
        onFinishSession={vi.fn()}
      />
    );

    expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    expect(screen.getByText("What is the capital of France?")).toBeInTheDocument();
    expect(screen.getByText("Đã tốt nghiệp")).toBeInTheDocument();
    expect(screen.getByText("Cần lặp lại")).toBeInTheDocument();
  });

  it("calls onContinueNextRound when clicking continue button or pressing Enter", () => {
    const handleContinue = vi.fn();
    render(
      <LearnRoundSummaryModal
        isOpen={true}
        roundDiagnostic={mockDiagnostic}
        activePoolCount={4}
        waitingCount={5}
        graduatedCount={1}
        totalDeckSize={10}
        onContinueNextRound={handleContinue}
        onFinishSession={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục học vòng tiếp theo/i }));
    expect(handleContinue).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Enter" });
    expect(handleContinue).toHaveBeenCalledTimes(2);
  });
});
