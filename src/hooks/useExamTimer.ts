import { useState, useEffect, useRef, useCallback } from "react";

export interface UseExamTimerOptions {
  initialSeconds: number | null;
  onExpire?: () => void;
  isPaused?: boolean;
  isUntimed?: boolean;
}

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

  // Sync if initialSeconds or untimed mode changes
  useEffect(() => {
    if (isUntimed) {
      setRemainingSeconds(null);
    } else {
      setRemainingSeconds(initialSeconds);
    }
  }, [initialSeconds, isUntimed]);

  // Timer interval effect
  useEffect(() => {
    if (isPaused) return;

    if (isUntimed) {
      // Stopwatch mode: increment elapsed seconds
      const stopwatch = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(stopwatch);
    }

    if (remainingSeconds === null || remainingSeconds <= 0) return;

    // Countdown mode
    const countdown = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdown);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isPaused, isUntimed, remainingSeconds]);

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

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (num: number) => num.toString().padStart(2, "0");

      if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      }
      return `${pad(minutes)}:${pad(seconds)}`;
    },
    [isUntimed]
  );

  return {
    remainingSeconds,
    elapsedSeconds,
    formattedTime: formatTime(remainingSeconds),
    isWarning,
    isExpired,
    isUntimed,
    setRemainingSeconds,
  };
}
