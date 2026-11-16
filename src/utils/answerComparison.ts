import type { BenchmarkMode, CommunityStats } from "@/types/exam";

/**
 * Returns true when valid community consensus votes exist for a question.
 */
export function hasValidCommunityAnswer(
  communityStats?: CommunityStats | null
): boolean {
  return Boolean(
    communityStats?.communityAnswer && communityStats.validVoteCount > 0
  );
}

/**
 * Determines whether a question evaluated under "community" mode fell back to AI
 * because valid community answers were unavailable for that question.
 */
export function didFallbackToAi(
  requestedMode: BenchmarkMode,
  communityStats?: CommunityStats | null,
  benchmarkSource?: BenchmarkMode
): boolean {
  if (requestedMode !== "community") return false;
  return !hasValidCommunityAnswer(communityStats) || benchmarkSource === "ai";
}

/**
 * Returns a non-blocking notice when the user selected community answers
 * but no valid community votes exist yet and AI fallback was used.
 */
export function getCommunityFallbackNotice(
  benchmarkMode: BenchmarkMode,
  communityStats?: CommunityStats | null,
  benchmarkSource?: BenchmarkMode
): string | null {
  return didFallbackToAi(benchmarkMode, communityStats, benchmarkSource)
    ? "Chưa có dữ liệu cộng đồng — đang dùng đáp án AI"
    : null;
}

/**
 * Normalizes an answer string by trimming, uppercasing, and sorting characters alphabetically.
 * E.g., "bca " -> "ABC"
 */
export function normalizeAnswer(answer?: string | null): string {
  if (!answer) return "";
  return answer
    .trim()
    .toUpperCase()
    .split("")
    .filter((char) => char.trim().length > 0)
    .sort()
    .join("");
}

/**
 * Compares user selection with correct answer key in a permutation-invariant manner.
 * Guarantees that selecting 'A', 'C', 'D' in any order (e.g. 'CAD' or 'DAC')
 * evaluates as equal to 'ACD'.
 */
export function compareAnswers(
  userSelection?: string | null,
  correctAnswer?: string | null
): boolean {
  const normalizedUser = normalizeAnswer(userSelection);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (!normalizedUser || !normalizedCorrect) {
    return false;
  }

  return normalizedUser === normalizedCorrect;
}
