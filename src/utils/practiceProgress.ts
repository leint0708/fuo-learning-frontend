export interface SubjectLocalProgress {
  cramCount: number;
  learnCount: number;
  hasProgress: boolean;
}

/**
 * Reads cached Cram and Learn mastery counts for a subject from localStorage.
 */
export function getSubjectLocalProgress(subjectCode: string): SubjectLocalProgress {
  let cramCount = 0;
  let learnCount = 0;

  try {
    const storedCram = localStorage.getItem(`fuo_cram_mastered_${subjectCode}`);
    if (storedCram) {
      const parsed = JSON.parse(storedCram);
      if (Array.isArray(parsed)) cramCount = parsed.length;
    }

    const storedLearn = localStorage.getItem(`fuo_learn_mastered_${subjectCode}`);
    if (storedLearn) {
      const parsed = JSON.parse(storedLearn);
      if (Array.isArray(parsed)) learnCount = parsed.length;
    }
  } catch {
    // Ignore malformed localStorage entries
  }

  return {
    cramCount,
    learnCount,
    hasProgress: cramCount > 0 || learnCount > 0,
  };
}

/**
 * Normalizes text for Vietnamese accent-insensitive and whitespace-trimmed search matching.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();
}
