import { describe, it, expect, beforeEach } from "vitest";
import {
  applyServerSubjectProgress,
  computeUnsyncedLocalDelta,
  getSubjectLocalProgress,
  normalizeSearchText,
  readLocalCramActiveBatch,
  writeLocalCramActiveBatch,
} from "@/utils/practiceProgress";

describe("practiceProgress utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("normalizeSearchText", () => {
    it("trims whitespace and lowercases", () => {
      expect(normalizeSearchText("  MAD101  ")).toBe("mad101");
    });

    it("strips Vietnamese diacritics and converts đ/Đ", () => {
      expect(normalizeSearchText("Toán Rời Rạc")).toBe("toan roi rac");
      expect(normalizeSearchText("Hệ điều hành & Đại số")).toBe("he dieu hanh & dai so");
    });
  });

  describe("getSubjectLocalProgress", () => {
    it("returns zeros when no progress exists", () => {
      expect(getSubjectLocalProgress("MAD101")).toEqual({
        cramCount: 0,
        learnCount: 0,
        hasProgress: false,
      });
    });

    it("parses valid cram and learn arrays", () => {
      localStorage.setItem("fuo_cram_mastered_MAD101", JSON.stringify(["q1", "q2", "q3"]));
      localStorage.setItem("fuo_learn_mastered_MAD101", JSON.stringify(["q1"]));

      expect(getSubjectLocalProgress("MAD101")).toEqual({
        cramCount: 3,
        learnCount: 1,
        hasProgress: true,
      });
    });

    it("handles malformed or non-array localStorage gracefully", () => {
      localStorage.setItem("fuo_cram_mastered_BAD", "{broken json");
      localStorage.setItem("fuo_learn_mastered_BAD", JSON.stringify({ count: 5 }));

      expect(getSubjectLocalProgress("BAD")).toEqual({
        cramCount: 0,
        learnCount: 0,
        hasProgress: false,
      });
    });
  });

  describe("computeUnsyncedLocalDelta & applyServerSubjectProgress", () => {
    it("treats pre-existing local progress as unsynced on first migration and respects remote reset once synced", () => {
      localStorage.setItem("fuo_cram_mastered_MAD101", JSON.stringify(["q1", "q2"]));

      // First migration: no fuo_cram_synced_MAD101 marker yet -> both q1, q2 are unsynced
      const initialDelta = computeUnsyncedLocalDelta("MAD101");
      expect(initialDelta.hasChanges).toBe(true);
      expect(initialDelta.cramMasteredIds).toEqual(["q1", "q2"]);

      // Server merges and returns union ["q1", "q2", "q3"]
      applyServerSubjectProgress("MAD101", {
        subjectCode: "MAD101",
        cramMasteredIds: ["q1", "q2", "q3"],
        learnMasteredIds: [],
        cardStats: {},
      });

      expect(getSubjectLocalProgress("MAD101").cramCount).toBe(3);
      expect(computeUnsyncedLocalDelta("MAD101").hasChanges).toBe(false);

      // Suppose user adds q4 locally offline -> only q4 is reported as unsynced
      localStorage.setItem(
        "fuo_cram_mastered_MAD101",
        JSON.stringify(["q1", "q2", "q3", "q4"])
      );
      const offlineDelta = computeUnsyncedLocalDelta("MAD101");
      expect(offlineDelta.hasChanges).toBe(true);
      expect(offlineDelta.cramMasteredIds).toEqual(["q4"]);

      // Suppose remote resets to empty while local only has previously-synced items
      applyServerSubjectProgress("MAD101", {
        subjectCode: "MAD101",
        cramMasteredIds: [],
        learnMasteredIds: [],
        cardStats: {},
      });
      expect(getSubjectLocalProgress("MAD101").cramCount).toBe(0);
      expect(computeUnsyncedLocalDelta("MAD101").hasChanges).toBe(false);
    });

    it("reconciles cramActiveBatch by updatedAt timestamp and clears local batch when completed on server", () => {
      const olderBatch = {
        scope: "deck" as const,
        batchQuestionIds: ["q1", "q2", "q3"],
        activeQueueIds: ["q2", "q3"],
        queuePointer: 0,
        masteredInBatchIds: ["q1"],
        missedIds: [],
        updatedAt: "2026-11-19T10:00:00.000Z",
      };
      const newerBatch = {
        ...olderBatch,
        activeQueueIds: ["q3"],
        masteredInBatchIds: ["q1", "q2"],
        updatedAt: "2026-11-19T12:00:00.000Z",
      };

      writeLocalCramActiveBatch("MAD101", olderBatch);

      // Newer server batch overwrites older local batch
      applyServerSubjectProgress("MAD101", {
        subjectCode: "MAD101",
        cramMasteredIds: ["q1", "q2"],
        learnMasteredIds: [],
        cardStats: {},
        cramActiveBatch: newerBatch,
      });
      expect(readLocalCramActiveBatch("MAD101")?.activeQueueIds).toEqual(["q3"]);

      // Older server batch does NOT overwrite newer local batch
      applyServerSubjectProgress("MAD101", {
        subjectCode: "MAD101",
        cramMasteredIds: ["q1", "q2"],
        learnMasteredIds: [],
        cardStats: {},
        cramActiveBatch: olderBatch,
      });
      expect(readLocalCramActiveBatch("MAD101")?.activeQueueIds).toEqual(["q3"]);

      // Server null + all remaining batch questions mastered -> clears local batch
      applyServerSubjectProgress("MAD101", {
        subjectCode: "MAD101",
        cramMasteredIds: ["q1", "q2", "q3"],
        learnMasteredIds: [],
        cardStats: {},
        cramActiveBatch: null,
      });
      expect(readLocalCramActiveBatch("MAD101")).toBeNull();
    });
  });
});
