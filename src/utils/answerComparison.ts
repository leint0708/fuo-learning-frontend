import type { BenchmarkMode, CommunityStats } from "@/types/exam";

/**
 * Returns a non-blocking notice when the user selected community answers
 * but no valid community votes exist yet and AI fallback was used.
 */
export function getCommunityFallbackNotice(
  benchmarkMode: BenchmarkMode,
  communityStats?: CommunityStats | null
): string | null {
  if (benchmarkMode !== "community") return null;
  const hasVotes = Boolean(
    communityStats?.communityAnswer && communityStats.validVoteCount > 0
  );
  return hasVotes ? null : "Chưa có dữ liệu cộng đồng — đang dùng đáp án AI";
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
