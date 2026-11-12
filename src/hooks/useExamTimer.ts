import { useState, useEffect, useRef, useCallback } from "react";

export interface UseExamTimerOptions {
  initialSeconds: number;
  onExpire?: () => void;
  isPaused?: boolean;
}

export function useExamTimer({
  initialSeconds,
  onExpire,
  isPaused = false,
}: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Sync if initialSeconds changes drastically (e.g. from server fetch)
  useEffect(() => {
    setRemainingSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, remainingSeconds]);

  const isWarning = remainingSeconds > 0 && remainingSeconds <= 300; // <5 minutes
  const isExpired = remainingSeconds <= 0;

  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, []);

  return {
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    isWarning,
    isExpired,
    setRemainingSeconds,
  };
}
