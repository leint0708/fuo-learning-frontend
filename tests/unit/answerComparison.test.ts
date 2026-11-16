import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  compareAnswers,
  hasValidCommunityAnswer,
  didFallbackToAi,
  getCommunityFallbackNotice,
} from "@/utils/answerComparison";

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

  describe("community fallback helpers", () => {
    it("detects valid community answers only when communityAnswer is non-empty and votes > 0", () => {
      expect(hasValidCommunityAnswer(null)).toBe(false);
      expect(hasValidCommunityAnswer(undefined)).toBe(false);
      expect(
        hasValidCommunityAnswer({
          totalComments: 2,
          validVoteCount: 0,
          topAnswerVotes: 0,
          agreementRatio: 0,
          communityAnswer: null,
        })
      ).toBe(false);
      expect(
        hasValidCommunityAnswer({
          totalComments: 4,
          validVoteCount: 4,
          topAnswerVotes: 3,
          agreementRatio: 0.75,
          communityAnswer: "B",
        })
      ).toBe(true);
    });

    it("detects AI fallback when community was requested without valid consensus or backend returned ai", () => {
      expect(didFallbackToAi("ai", null, "ai")).toBe(false);
      expect(didFallbackToAi("community", null, "ai")).toBe(true);
      expect(
        didFallbackToAi(
          "community",
          {
            totalComments: 0,
            validVoteCount: 0,
            topAnswerVotes: 0,
            agreementRatio: 0,
            communityAnswer: null,
          },
          "community"
        )
      ).toBe(true);
      expect(
        didFallbackToAi(
          "community",
          {
            totalComments: 3,
            validVoteCount: 3,
            topAnswerVotes: 3,
            agreementRatio: 1,
            communityAnswer: "C",
          },
          "ai"
        )
      ).toBe(true);
      expect(
        didFallbackToAi(
          "community",
          {
            totalComments: 3,
            validVoteCount: 3,
            topAnswerVotes: 3,
            agreementRatio: 1,
            communityAnswer: "C",
          },
          "community"
        )
      ).toBe(false);
    });

    it("returns localized fallback notice strictly when AI fallback occurred", () => {
      expect(getCommunityFallbackNotice("ai", null)).toBeNull();
      expect(getCommunityFallbackNotice("community", null, "ai")).toBe(
        "Chưa có dữ liệu cộng đồng — đang dùng đáp án AI"
      );
      expect(
        getCommunityFallbackNotice(
          "community",
          {
            totalComments: 5,
            validVoteCount: 5,
            topAnswerVotes: 4,
            agreementRatio: 0.8,
            communityAnswer: "A",
          },
          "community"
        )
      ).toBeNull();
    });
  });
});
