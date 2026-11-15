import { describe, it, expect } from "vitest";
import { normalizeAnswer, compareAnswers } from "@/utils/answerComparison";

describe("answerComparison utility", () => {
  describe("normalizeAnswer", () => {
    it("handles null and undefined gracefully", () => {
      expect(normalizeAnswer(null)).toBe("");
      expect(normalizeAnswer(undefined)).toBe("");
      expect(normalizeAnswer("")).toBe("");
    });

    it("uppercases and sorts characters alphabetically", () => {
      expect(normalizeAnswer("bca")).toBe("ABC");
      expect(normalizeAnswer("DbaC")).toBe("ABCD");
    });

    it("trims surrounding and internal whitespace", () => {
      expect(normalizeAnswer("  a c b  ")).toBe("ABC");
    });
  });

  describe("compareAnswers", () => {
    it("returns true for identical single-choice answers", () => {
      expect(compareAnswers("A", "A")).toBe(true);
      expect(compareAnswers("b", "B")).toBe(true);
      expect(compareAnswers("c", "C")).toBe(true);
    });

    it("returns false for non-matching single-choice answers", () => {
      expect(compareAnswers("A", "B")).toBe(false);
      expect(compareAnswers("C", "D")).toBe(false);
    });

    it("evaluates multi-choice answer permutations as equal", () => {
      expect(compareAnswers("CAD", "ACD")).toBe(true);
      expect(compareAnswers("DCA", "ACD")).toBe(true);
      expect(compareAnswers("bd", "DB")).toBe(true);
      expect(compareAnswers("BACD", "DCBA")).toBe(true);
    });

    it("evaluates missing or extra options as false", () => {
      expect(compareAnswers("AC", "ACD")).toBe(false);
      expect(compareAnswers("ACDE", "ACD")).toBe(false);
      expect(compareAnswers("AB", "CD")).toBe(false);
    });

    it("handles empty or null parameters without throwing", () => {
      expect(compareAnswers(null, "A")).toBe(false);
      expect(compareAnswers("A", null)).toBe(false);
      expect(compareAnswers(null, null)).toBe(false);
      expect(compareAnswers("", "")).toBe(false);
    });
  });
});
