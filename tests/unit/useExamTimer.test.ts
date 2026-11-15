import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExamTimer } from "@/hooks/useExamTimer";

describe("useExamTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Timed mode", () => {
    it("counts down remaining seconds and formats time", () => {
      const { result } = renderHook(() =>
        useExamTimer({
          initialSeconds: 3600,
        })
      );

      expect(result.current.remainingSeconds).toBe(3600);
      expect(result.current.formattedTime).toBe("01:00:00");
      expect(result.current.isWarning).toBe(false);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isUntimed).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.remainingSeconds).toBe(3599);
      expect(result.current.formattedTime).toBe("59:59");
    });

    it("triggers onExpire when countdown reaches 0", () => {
      const onExpire = vi.fn();
      const { result } = renderHook(() =>
        useExamTimer({
          initialSeconds: 2,
          onExpire,
        })
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.remainingSeconds).toBe(0);
      expect(result.current.isExpired).toBe(true);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it("sets isWarning when remaining seconds <= 300", () => {
      const { result } = renderHook(() =>
        useExamTimer({
          initialSeconds: 300,
        })
      );

      expect(result.current.isWarning).toBe(true);
    });
  });

  describe("Untimed mode", () => {
    it("activates untimed mode when isUntimed is true", () => {
      const onExpire = vi.fn();
      const { result } = renderHook(() =>
        useExamTimer({
          initialSeconds: 3600,
          isUntimed: true,
          onExpire,
        })
      );

      expect(result.current.isUntimed).toBe(true);
      expect(result.current.remainingSeconds).toBeNull();
      expect(result.current.formattedTime).toBe("Không giới hạn");
      expect(result.current.isWarning).toBe(false);
      expect(result.current.isExpired).toBe(false);

      // Advance time by 10 seconds - should NOT countdown
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.remainingSeconds).toBeNull();
      expect(result.current.elapsedSeconds).toBe(10);
      expect(result.current.isWarning).toBe(false);
      expect(result.current.isExpired).toBe(false);
      expect(onExpire).not.toHaveBeenCalled();
    });

    it("activates untimed mode when initialSeconds is null", () => {
      const onExpire = vi.fn();
      const { result } = renderHook(() =>
        useExamTimer({
          initialSeconds: null,
          onExpire,
        })
      );

      expect(result.current.isUntimed).toBe(true);
      expect(result.current.remainingSeconds).toBeNull();
      expect(result.current.isWarning).toBe(false);
      expect(result.current.isExpired).toBe(false);
      expect(onExpire).not.toHaveBeenCalled();
    });
  });
});
