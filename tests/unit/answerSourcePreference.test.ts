import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ANSWER_SOURCE_STORAGE_KEY,
  loadAnswerSourcePreference,
  saveAnswerSourcePreference,
} from "@/utils/answerSourcePreference";

describe("answerSourcePreference storage utility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("defaults to 'ai' when no preference is stored", () => {
    expect(loadAnswerSourcePreference()).toBe("ai");
  });

  it("persists and loads 'community' and 'ai' preferences accurately", () => {
    saveAnswerSourcePreference("community");
    expect(localStorage.getItem(ANSWER_SOURCE_STORAGE_KEY)).toBe("community");
    expect(loadAnswerSourcePreference()).toBe("community");

    saveAnswerSourcePreference("ai");
    expect(localStorage.getItem(ANSWER_SOURCE_STORAGE_KEY)).toBe("ai");
    expect(loadAnswerSourcePreference()).toBe("ai");
  });

  it("falls back safely to 'ai' for corrupted or unknown stored values", () => {
    localStorage.setItem(ANSWER_SOURCE_STORAGE_KEY, "unknown_source");
    expect(loadAnswerSourcePreference()).toBe("ai");
  });

  it("handles localStorage access errors without throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });

    expect(() => saveAnswerSourcePreference("community")).not.toThrow();
    expect(loadAnswerSourcePreference()).toBe("ai");
  });
});
