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
