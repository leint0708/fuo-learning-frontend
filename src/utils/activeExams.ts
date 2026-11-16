import type { FeedbackMode } from "@/types/exam";

const STORAGE_KEY = "fuo_active_exams";
const ENDED_ATTEMPTS_KEY = "fuo_ended_attempts";
const DRAFT_PREFIX = "fuo_exam_draft_";
const MAX_ACTIVE_EXAMS = 10;
const MAX_ENDED_ATTEMPTS = 50;

export interface ActiveExamRecord {
  attemptId: string;
  examId: string;
  examTitle: string;
  subjectCode?: string;
  totalQuestions: number;
  answeredCount: number;
  startedAt: string;
  expiresAt: string | null;
  feedbackMode: FeedbackMode;
  updatedAt: string;
}

export function inferSubjectCode(examTitle?: string, examId?: string): string | undefined {
  const candidates = [examTitle, examId].filter((v): v is string => Boolean(v));
  for (const text of candidates) {
    const match = text.match(/(?:^|[^A-Za-z0-9])([A-Za-z]{2,4}\d{3}[A-Za-z]?)(?=$|[^A-Za-z0-9])/);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }
  return undefined;
}

function isRecordActive(record: ActiveExamRecord, nowMs: number): boolean {
  if (!record.attemptId || !record.examTitle) return false;
  if (!record.expiresAt) return true;
  const expiryMs = Date.parse(record.expiresAt);
  if (Number.isNaN(expiryMs)) return true;
  return expiryMs > nowMs;
}

function readAllRecords(): ActiveExamRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const nowMs = Date.now();
    return parsed.filter(
      (item): item is ActiveExamRecord =>
        Boolean(item && typeof item === "object" && isRecordActive(item as ActiveExamRecord, nowMs))
    );
  } catch {
    return [];
  }
}

function writeAllRecords(records: ActiveExamRecord[]): void {
  try {
    if (records.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  } catch {
    // Ignore storage quota or restricted environments
  }
}

export function getActiveExams(subjectCode?: string): ActiveExamRecord[] {
  const records = readAllRecords().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (!subjectCode) return records;
  const normalizedTarget = subjectCode.toUpperCase();
  return records.filter(
    (item) => (item.subjectCode || inferSubjectCode(item.examTitle, item.examId)) === normalizedTarget
  );
}

export function upsertActiveExam(record: ActiveExamRecord): void {
  const subjectCode = record.subjectCode || inferSubjectCode(record.examTitle, record.examId);
  const existing = readAllRecords().filter((item) => item.attemptId !== record.attemptId);
  const nextRecord: ActiveExamRecord = {
    ...record,
    subjectCode,
  };
  const updated = [nextRecord, ...existing]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_ACTIVE_EXAMS);
  writeAllRecords(updated);
}

export function removeActiveExam(attemptId: string): void {
  if (!attemptId) return;
  const remaining = readAllRecords().filter((item) => item.attemptId !== attemptId);
  writeAllRecords(remaining);
}

type EndedAttemptMap = Record<string, "completed" | "expired">;

function readEndedAttemptsMap(): EndedAttemptMap {
  try {
    const raw = window.sessionStorage.getItem(ENDED_ATTEMPTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const legacyMap: EndedAttemptMap = {};
      parsed.forEach((id) => {
        if (typeof id === "string" && id.length > 0) {
          legacyMap[id] = "completed";
        }
      });
      return legacyMap;
    }
    if (parsed && typeof parsed === "object") {
      const safe: EndedAttemptMap = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (k && (v === "completed" || v === "expired")) {
          safe[k] = v;
        }
      }
      return safe;
    }
    return {};
  } catch {
    return {};
  }
}

export function markAttemptEnded(
  attemptId: string,
  reason: "completed" | "expired" = "completed"
): void {
  if (!attemptId) return;
  try {
    const current = readEndedAttemptsMap();
    delete current[attemptId];
    const entries = [[attemptId, reason], ...Object.entries(current)].slice(0, MAX_ENDED_ATTEMPTS);
    window.sessionStorage.setItem(ENDED_ATTEMPTS_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

export function getEndedAttemptReason(attemptId: string): "completed" | "expired" | null {
  if (!attemptId) return null;
  return readEndedAttemptsMap()[attemptId] ?? null;
}

export function isAttemptEnded(attemptId: string): boolean {
  return getEndedAttemptReason(attemptId) !== null;
}

export function clearExamSessionStorage(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(ENDED_ATTEMPTS_KEY);
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage access errors
  }
}
