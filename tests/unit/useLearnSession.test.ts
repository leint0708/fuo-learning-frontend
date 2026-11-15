import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLearnSession } from "@/hooks/useLearnSession";
import type { Question } from "@/types/exam";

const createMockQuestions = (count: number): Question[] => {
  return Array.from({ length: count }, (_, i) => ({
    questionId: `learn_q_${i + 1}`,
    questionNumber: i + 1,
    questionIdCode: `Q${i + 1}`,
    questionType: "single_choice",
    questionText: `Learn Question ${i + 1}`,
    imageUrl: null,
    options: { A: "A", B: "B", C: "C", D: "D" },
  }));
};

describe("useLearnSession hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes active pool with strict ceiling of 7 cards from waiting pool", () => {
    const questions = createMockQuestions(15);
    const { result } = renderHook(() =>
      useLearnSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    expect(result.current.activePool.length).toBe(7);
    expect(result.current.waitingPool.length).toBe(8);
    expect(result.current.graduatedPool.length).toBe(0);
    expect(result.current.roundQueue.length).toBe(7);
    expect(result.current.currentRoundNumber).toBe(1);
    expect(result.current.isRoundCompleted).toBe(false);
  });

  it("graduates pristine cards directly to Learned on 1 correct answer", () => {
    const questions = createMockQuestions(7);
    const { result } = renderHook(() =>
      useLearnSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    const firstCard = result.current.currentCard!;
    expect(firstCard).toBeDefined();

    act(() => {
      result.current.recordAnswer(firstCard.questionId, "A", "A", true);
    });

    const stat = result.current.stats[firstCard.questionId]!;
    expect(stat.wrongAttempts).toBe(0);
    expect(stat.consecutiveCorrect).toBe(1);
    expect(stat.status).toBe("learned");
  });

  it("requires 2 consecutive correct answers to graduate a previously missed card", () => {
    const questions = createMockQuestions(7);
    const { result } = renderHook(() =>
      useLearnSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    const firstCard = result.current.currentCard!;

    // Attempt 1: Wrong answer
    act(() => {
      result.current.recordAnswer(firstCard.questionId, "B", "A", false);
    });

    expect(result.current.stats[firstCard.questionId]!.wrongAttempts).toBe(1);
    expect(result.current.stats[firstCard.questionId]!.consecutiveCorrect).toBe(0);
    expect(result.current.stats[firstCard.questionId]!.status).toBe("learning");

    // Attempt 2: Correct answer (1st correct) -> should still be 'learning'
    act(() => {
      result.current.recordAnswer(firstCard.questionId, "A", "A", true);
    });

    expect(result.current.stats[firstCard.questionId]!.consecutiveCorrect).toBe(1);
    expect(result.current.stats[firstCard.questionId]!.status).toBe("learning");

    // Attempt 3: Correct answer (2nd consecutive correct) -> now graduates to 'learned'
    act(() => {
      result.current.recordAnswer(firstCard.questionId, "A", "A", true);
    });

    expect(result.current.stats[firstCard.questionId]!.consecutiveCorrect).toBe(2);
    expect(result.current.stats[firstCard.questionId]!.status).toBe("learned");
  });

  it("wipes out consecutive correct streak to 0 upon incorrect answer", () => {
    const questions = createMockQuestions(7);
    const { result } = renderHook(() =>
      useLearnSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    const card = result.current.currentCard!;

    // Initial mistake
    act(() => {
      result.current.recordAnswer(card.questionId, "B", "A", false);
    });
    // Followed by 1 correct
    act(() => {
      result.current.recordAnswer(card.questionId, "A", "A", true);
    });
    expect(result.current.stats[card.questionId]!.consecutiveCorrect).toBe(1);

    // Followed by a mistake -> streak must wipe out to 0
    act(() => {
      result.current.recordAnswer(card.questionId, "C", "A", false);
    });
    expect(result.current.stats[card.questionId]!.consecutiveCorrect).toBe(0);
    expect(result.current.stats[card.questionId]!.wrongAttempts).toBe(2);
  });

  it("calculates round diagnostic and refills pool to 7 on next round", () => {
    const questions = createMockQuestions(10);
    const { result } = renderHook(() =>
      useLearnSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    // Answer all 7 cards in round 1 (5 correct pristine, 2 wrong)
    const initialQueue = [...result.current.roundQueue];
    for (let i = 0; i < initialQueue.length; i++) {
      const q = initialQueue[i]!;
      const isCorrect = i < 5;
      act(() => {
        result.current.recordAnswer(q.questionId, isCorrect ? "A" : "B", "A", isCorrect);
      });
    }

    expect(result.current.isRoundCompleted).toBe(true);
    const diag = result.current.currentRoundDiagnostic!;
    expect(diag).toBeDefined();
    expect(diag.totalCardsReviewed).toBe(7);
    expect(diag.incorrectCount).toBe(2);
    expect(diag.correctCount).toBe(5);
    expect(Math.round(diag.errorRate)).toBe(29); // 2/7 = ~28.57%

    // Advance to next round
    act(() => {
      result.current.nextRound();
    });

    expect(result.current.currentRoundNumber).toBe(2);
    expect(result.current.isRoundCompleted).toBe(false);
    // 5 cards graduated, leaving 2 in learning pool. 3 available in waiting pool, so refilled to 5
    expect(result.current.activePool.length).toBe(5);
  });
});
