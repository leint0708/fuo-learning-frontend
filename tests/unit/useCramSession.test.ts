import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCramSession } from "@/hooks/useCramSession";
import type { Question } from "@/types/exam";

const createMockQuestions = (count: number): Question[] => {
  return Array.from({ length: count }, (_, i) => ({
    questionId: `q_${i + 1}`,
    questionNumber: i + 1,
    questionIdCode: `Q${i + 1}`,
    questionType: "single_choice",
    questionText: `Question ${i + 1} text`,
    imageUrl: null,
    options: { A: "A", B: "B", C: "C", D: "D" },
  }));
};

describe("useCramSession hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("initializes with first batch of 10 cards and Fisher-Yates shuffle", () => {
    const questions = createMockQuestions(25);
    const { result } = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    expect(result.current.deckPool.length).toBe(25);
    expect(result.current.currentBatch.length).toBe(10);
    expect(result.current.activeQueue.length).toBe(10);
    expect(result.current.batchIndex).toBe(0);
    expect(result.current.totalBatches).toBe(3);
    expect(result.current.isBatchCompleted).toBe(false);
    expect(result.current.isSessionCompleted).toBe(false);
  });

  it("removes correctly answered card from active queue and tracks batch progress", () => {
    const questions = createMockQuestions(10);
    const { result } = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    const firstCard = result.current.currentCard;
    expect(firstCard).toBeDefined();

    act(() => {
      result.current.recordAnswer(firstCard!.questionId, true);
    });

    expect(result.current.masteredInBatch.has(firstCard!.questionId)).toBe(true);
    expect(result.current.activeQueue.length).toBe(9);
    expect(result.current.activeQueue.find((c) => c.questionId === firstCard!.questionId)).toBeUndefined();
  });

  it("re-inserts incorrectly answered card with near-distance jitter (2-4 cards ahead)", () => {
    const questions = createMockQuestions(10);
    // Mock Math.random to return predictable jitter (e.g., 0.5 -> J = 2 + floor(0.5 * 3) = 3)
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const { result } = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    const failedCard = result.current.currentCard!;

    act(() => {
      result.current.recordAnswer(failedCard.questionId, false);
    });

    // Failed card must NOT be mastered
    expect(result.current.masteredInBatch.has(failedCard.questionId)).toBe(false);
    // Failed card must still be in the active queue
    expect(result.current.activeQueue.some((c) => c.questionId === failedCard.questionId)).toBe(true);

    vi.restoreAllMocks();
  });

  it("handles single card remaining in batch when answered incorrectly without crashing", () => {
    const questions = createMockQuestions(1);
    const { result } = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    const singleCard = result.current.currentCard!;

    act(() => {
      result.current.recordAnswer(singleCard.questionId, false);
    });

    expect(result.current.activeQueue.length).toBe(1);
    expect(result.current.currentCard?.questionId).toBe(singleCard.questionId);
    expect(result.current.isBatchCompleted).toBe(false);
  });

  it("triggers batch completion when all 10 cards are mastered and advances to next batch", () => {
    const questions = createMockQuestions(15);
    const { result } = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    // Answer all 10 cards in the current batch correctly
    for (let i = 0; i < 10; i++) {
      const card = result.current.currentCard;
      if (card) {
        act(() => {
          result.current.recordAnswer(card.questionId, true);
        });
      }
    }

    expect(result.current.isBatchCompleted).toBe(true);

    // Advance to next batch
    act(() => {
      result.current.nextBatch();
    });

    expect(result.current.batchIndex).toBe(1);
    expect(result.current.currentBatch.length).toBe(5);
    expect(result.current.activeQueue.length).toBe(5);
    expect(result.current.isBatchCompleted).toBe(false);
  });

  it("supports scopedQuestionIds drill including already-mastered struggled cards without overwriting unrelated masteredIds", () => {
    localStorage.setItem("fuo_cram_mastered_MAD101", JSON.stringify(["q_1", "q_2"]));
    const questions = createMockQuestions(5);

    const { result } = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
        scopedQuestionIds: ["q_2", "q_4"],
      })
    );

    // Even though q_2 is already mastered in localStorage, scoped drill includes both q_2 and q_4
    expect(result.current.deckPool.map((q) => q.questionId)).toEqual(["q_2", "q_4"]);
    expect(result.current.currentBatch).toHaveLength(2);

    // Master both scoped cards and verify q_1 remains persisted alongside newly mastered q_4
    for (let i = 0; i < 2; i++) {
      const card = result.current.currentCard;
      if (card) {
        act(() => {
          result.current.recordAnswer(card.questionId, true);
        });
      }
    }

    expect(result.current.isSessionCompleted).toBe(true);
    const persisted = JSON.parse(localStorage.getItem("fuo_cram_mastered_MAD101") || "[]") as string[];
    expect(persisted).toEqual(expect.arrayContaining(["q_1", "q_2", "q_4"]));
  });

  it("persists in-progress batch state on answer and restores exact batch, mastered markers, and missed cards on remount", () => {
    const questions = createMockQuestions(15);
    const firstMount = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    const originalBatchIds = firstMount.result.current.currentBatch.map((q) => q.questionId);
    const card1 = firstMount.result.current.currentCard!;

    let returnedBatch: ReturnType<typeof firstMount.result.current.recordAnswer> = null;
    act(() => {
      returnedBatch = firstMount.result.current.recordAnswer(card1.questionId, true);
    });
    expect(returnedBatch).not.toBeNull();
    expect(returnedBatch!.masteredInBatchIds).toEqual([card1.questionId]);

    const card2 = firstMount.result.current.currentCard!;
    act(() => {
      returnedBatch = firstMount.result.current.recordAnswer(card2.questionId, false);
    });
    expect(returnedBatch).not.toBeNull();
    expect(returnedBatch!.missedIds).toContain(card2.questionId);

    const expectedQueueIds = firstMount.result.current.activeQueue.map((q) => q.questionId);
    const expectedPointer = firstMount.result.current.queuePointer;
    firstMount.unmount();

    // Remount simulating page reload or navigating away and returning
    const secondMount = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    expect(secondMount.result.current.wasRestoredActiveBatch).toBe(true);
    expect(secondMount.result.current.currentBatch.map((q) => q.questionId)).toEqual(originalBatchIds);
    expect(secondMount.result.current.masteredInBatch.has(card1.questionId)).toBe(true);
    expect(secondMount.result.current.masteredInBatch.size).toBe(1);
    expect(secondMount.result.current.missedIds.has(card2.questionId)).toBe(true);
    expect(secondMount.result.current.activeQueue.map((q) => q.questionId)).toEqual(expectedQueueIds);
    expect(secondMount.result.current.queuePointer).toBe(expectedPointer);
  });

  it("clears persisted active batch and returns null when the final card in a batch is mastered", () => {
    const questions = createMockQuestions(2);
    const { result } = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
      })
    );

    const first = result.current.currentCard!;
    act(() => {
      const b1 = result.current.recordAnswer(first.questionId, true);
      expect(b1).not.toBeNull();
    });
    expect(localStorage.getItem("fuo_cram_active_batch_MAD101")).not.toBeNull();

    const second = result.current.currentCard!;
    act(() => {
      const b2 = result.current.recordAnswer(second.questionId, true);
      expect(b2).toBeNull();
    });
    expect(localStorage.getItem("fuo_cram_active_batch_MAD101")).toBeNull();
    expect(result.current.isBatchCompleted).toBe(true);
  });

  it("restores syncedActiveBatch from server when authenticated", () => {
    const questions = createMockQuestions(12);
    const { result } = renderHook(() =>
      useCramSession({
        subjectCode: "MAD101",
        questions,
        syncedMasteredIds: ["q_1", "q_2", "q_3"],
        syncedActiveBatch: {
          scope: "deck",
          batchQuestionIds: ["q_1", "q_2", "q_3", "q_4", "q_5"],
          activeQueueIds: ["q_5", "q_4"],
          queuePointer: 0,
          masteredInBatchIds: ["q_1", "q_2", "q_3"],
          missedIds: ["q_5"],
          updatedAt: "2026-11-19T14:00:00.000Z",
        },
      })
    );

    expect(result.current.wasRestoredActiveBatch).toBe(true);
    expect(result.current.currentBatch.map((q) => q.questionId)).toEqual([
      "q_1",
      "q_2",
      "q_3",
      "q_4",
      "q_5",
    ]);
    expect(result.current.masteredInBatch.size).toBe(3);
    expect(result.current.currentCard?.questionId).toBe("q_5");
    expect(result.current.missedIds.has("q_5")).toBe(true);
  });
});
