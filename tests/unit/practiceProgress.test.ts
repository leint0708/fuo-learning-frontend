import { describe, it, expect, beforeEach } from "vitest";
import { getSubjectLocalProgress, normalizeSearchText } from "@/utils/practiceProgress";

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
});
