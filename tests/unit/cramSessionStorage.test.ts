import { describe, it, expect, beforeEach } from "vitest";
import {
  saveCramSessionSnapshot,
  loadCramSessionSnapshot,
  clearCramSessionSnapshot,
  saveCramMistakeDrill,
  loadCramMistakeDrill,
  clearCramMistakeDrill,
  getCramSessionStorageKey,
  getCramMistakeDrillKey,
} from "@/utils/cramSessionStorage";
import { clearExamSessionStorage } from "@/utils/activeExams";
import type { CramSessionSnapshot } from "@/types/practice";

describe("cramSessionStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const sampleSnapshot: CramSessionSnapshot = {
    subjectCode: "SWE201",
    scope: "deck",
    endReason: "batch_stop",
    completedAt: "2026-11-16T10:00:00.000Z",
    totalDeckSize: 20,
    cumulativeMasteredCount: 10,
    entries: [
      {
        question: {
          questionId: "q_1",
          questionNumber: 1,
          questionIdCode: "Q1",
          questionType: "single_choice",
          questionText: "What is SRS?",
          imageUrl: null,
          options: { A: "Software Requirements Specification", B: "System Runtime" },
        },
        sessionOrder: 1,
        attemptCount: 2,
        mistakeCount: 1,
        hadMistakes: true,
        isMasteredInSession: true,
        firstSelectedOptions: "B",
        lastSelectedOptions: "A",
        correctAnswer: "A",
        aiExplanation: "SRS defines software requirements.",
        optionByOptionAnalysis: { A: "Correct", B: "Wrong" },
        communityStats: null,
        lastAnsweredAt: "2026-11-16T09:59:00.000Z",
      },
    ],
  };

  it("saves, loads case-insensitively, and clears session snapshots", () => {
    saveCramSessionSnapshot(sampleSnapshot);

    const loaded = loadCramSessionSnapshot("swe201");
    expect(loaded).not.toBeNull();
    expect(loaded?.entries).toHaveLength(1);
    expect(loaded?.entries[0]?.hadMistakes).toBe(true);

    clearCramSessionSnapshot("SWE201");
    expect(loadCramSessionSnapshot("SWE201")).toBeNull();
  });

  it("returns null gracefully for missing or corrupted JSON in sessionStorage", () => {
    sessionStorage.setItem(getCramSessionStorageKey("PRN211"), "{bad_json");
    expect(loadCramSessionSnapshot("PRN211")).toBeNull();

    sessionStorage.setItem(getCramMistakeDrillKey("PRN211"), "not_json");
    expect(loadCramMistakeDrill("PRN211")).toEqual([]);
  });

  it("deduplicates and persists scoped mistake drill question IDs", () => {
    saveCramMistakeDrill("mas291", ["q_2", "q_5", "q_2", ""]);
    expect(loadCramMistakeDrill("MAS291")).toEqual(["q_2", "q_5"]);

    clearCramMistakeDrill("MAS291");
    expect(loadCramMistakeDrill("MAS291")).toEqual([]);
  });

  it("wipes all Cram session snapshots and drill payloads inside clearExamSessionStorage()", () => {
    saveCramSessionSnapshot(sampleSnapshot);
    saveCramMistakeDrill("SWE201", ["q_1"]);
    sessionStorage.setItem("unrelated_key", "keep_me");

    clearExamSessionStorage();

    expect(loadCramSessionSnapshot("SWE201")).toBeNull();
    expect(loadCramMistakeDrill("SWE201")).toEqual([]);
    expect(sessionStorage.getItem("unrelated_key")).toBe("keep_me");
  });
});
