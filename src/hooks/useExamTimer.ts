import { useState, useEffect, useRef, useCallback } from "react";

export interface UseExamTimerOptions {
  initialSeconds: number | null;
  onExpire?: () => void;
  isPaused?: boolean;
  isUntimed?: boolean;
}

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Exam countdown & untimed stopwatch hook with stable interval scheduling.
 */
export function useExamTimer({
  initialSeconds,
  onExpire,
  isPaused = false,
  isUntimed: isUntimedProp = false,
}: UseExamTimerOptions) {
  const isUntimed = isUntimedProp || initialSeconds === null;
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    isUntimed ? null : initialSeconds
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasExpiredTriggeredRef = useRef(false);

  // Sync only when initialSeconds or untimed mode transitions
  useEffect(() => {
    hasExpiredTriggeredRef.current = false;
    if (isUntimed) {
      setRemainingSeconds(null);
    } else {
      setRemainingSeconds(initialSeconds);
    }
  }, [initialSeconds, isUntimed]);

  // Stable interval effect: excludes remainingSeconds to avoid 1Hz teardown/recreation churn
  useEffect(() => {
    if (isPaused) return;

    if (isUntimed) {
      const stopwatch = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(stopwatch);
    }

    if (initialSeconds === null || initialSeconds <= 0) return;

    const countdown = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdown);
          if (!hasExpiredTriggeredRef.current) {
            hasExpiredTriggeredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isPaused, isUntimed, initialSeconds]);

  const isWarning =
    !isUntimed &&
    remainingSeconds !== null &&
    remainingSeconds > 0 &&
    remainingSeconds <= 300; // <5 minutes

  const isExpired = !isUntimed && remainingSeconds !== null && remainingSeconds <= 0;

  const formatTime = useCallback(
    (totalSeconds: number | null): string => {
      if (isUntimed || totalSeconds === null) {
        return "Không giới hạn";
      }
      return formatDuration(totalSeconds);
    },
    [isUntimed]
  );

  return {
    remainingSeconds,
    elapsedSeconds,
    formattedTime: formatTime(remainingSeconds),
    formattedElapsed: formatDuration(elapsedSeconds),
    isWarning,
    isExpired,
    isUntimed,
  };
}
