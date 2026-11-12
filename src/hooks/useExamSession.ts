import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAttempt, saveAnswer } from "@/api/attempts";
import { useExamUiStore } from "@/stores/examUiStore";

export function useExamSession(attemptId: string) {
  const { currentQuestionIndex, setQuestionIndex } = useExamUiStore();

  const {
    data: attempt,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["attemptSession", attemptId],
    queryFn: () => getAttempt(attemptId),
    enabled: !!attemptId,
    staleTime: 0, // Always get freshest remaining seconds on reload
  });

  // Local storage backup key
  const localCacheKey = `fuo_attempt_${attemptId}_answers`;

  // Restore local cached answers if offline/refresh
  const getCachedAnswers = useCallback((): Record<string, string> => {
    try {
      const cached = localStorage.getItem(localCacheKey);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }, [localCacheKey]);

  // Save answer to local cache and server
  const recordAnswer = useCallback(
    async (questionId: string, choice: string) => {
      // 1. Update local cache
      try {
        const current = getCachedAnswers();
        current[questionId] = choice;
        localStorage.setItem(localCacheKey, JSON.stringify(current));
      } catch (e) {
        console.warn("Failed to cache answer locally", e);
      }

      // 2. Persist to backend server
      return saveAnswer(attemptId, questionId, choice);
    },
    [attemptId, localCacheKey, getCachedAnswers]
  );

  // Clear cache on submit
  const clearSessionCache = useCallback(() => {
    localStorage.removeItem(localCacheKey);
  }, [localCacheKey]);

  useEffect(() => {
    // When attempt loads, ensure index is within range
    if (attempt?.questions && currentQuestionIndex >= attempt.questions.length) {
      setQuestionIndex(0);
    }
  }, [attempt, currentQuestionIndex, setQuestionIndex]);

  return {
    attempt,
    isLoading,
    error,
    refetch,
    recordAnswer,
    getCachedAnswers,
    clearSessionCache,
  };
}
