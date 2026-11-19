import { apiClient } from "./client";
import { resolveImageUrl } from "@/utils/imageUrl";
import {
  applyServerSubjectProgress,
  computeUnsyncedLocalDelta,
  readLocalCardStats,
  readLocalCramActiveBatch,
  readLocalCramMasteredIds,
  readLocalLearnMasteredIds,
} from "@/utils/practiceProgress";
import type { BenchmarkMode, CommunityStats, Question } from "@/types/exam";
import type {
  CardMasteryRecord,
  CramActiveBatch,
  InstantAnswerResult,
  PracticeMode,
  PracticeProgressSummaryItem,
  SubjectPracticeProgress,
} from "@/types/practice";

/**
 * Fetches practice questions for a given subject.
 * Requests the full subject question bank unless an explicit positive count is provided.
 */
export async function getPracticeQuestions(
  subjectCode: string,
  count?: number
): Promise<Question[]> {
  const query =
    typeof count === "number" && Number.isFinite(count) && count > 0
      ? `subject_code=${encodeURIComponent(subjectCode)}&count=${Math.floor(count)}`
      : `subject_code=${encodeURIComponent(subjectCode)}&all=true&count=10000`;

  const data = await apiClient<
    Array<{
      question_id: string;
      subject_code: string;
      question_type: string;
      question_text: string;
      image_url: string | null;
      options: Record<string, string>;
    }>
  >(`/api/v1/questions/drills?${query}`);

  return data.map((q, idx) => ({
    questionId: q.question_id,
    questionNumber: idx + 1,
    questionIdCode: `Q${idx + 1}`,
    questionType: (q.question_type as Question["questionType"]) || "single_choice",
    questionText: q.question_text,
    imageUrl: resolveImageUrl(q.image_url),
    options: q.options,
  }));
}

/**
 * Checks an instant practice answer submission for correctness and explanations.
 */
export async function checkPracticeAnswer(
  questionId: string,
  selectedOptions: string,
  benchmarkMode: BenchmarkMode = "ai"
): Promise<InstantAnswerResult> {
  const payload: { selected_options: string; benchmark_mode?: BenchmarkMode } = {
    selected_options: selectedOptions,
  };
  if (benchmarkMode !== "ai") {
    payload.benchmark_mode = benchmarkMode;
  }

  const data = await apiClient<{
    question_id: string;
    selected_options: string;
    correct_answer: string;
    is_correct: boolean;
    ai_explanation: string;
    option_by_option_analysis?: Record<string, string>;
    benchmark_source?: BenchmarkMode;
    community_stats?: {
      total_comments: number;
      valid_vote_count: number;
      top_answer_votes: number;
      agreement_ratio: number;
      community_answer: string | null;
    } | null;
  }>(`/api/v1/questions/${encodeURIComponent(questionId)}/check`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const mappedCommunityStats: CommunityStats | null = data.community_stats
    ? {
        totalComments: data.community_stats.total_comments,
        validVoteCount: data.community_stats.valid_vote_count,
        topAnswerVotes: data.community_stats.top_answer_votes,
        agreementRatio: data.community_stats.agreement_ratio,
        communityAnswer: data.community_stats.community_answer,
      }
    : null;

  return {
    questionId: data.question_id,
    selectedOptions: data.selected_options,
    correctAnswer: data.correct_answer,
    isCorrect: data.is_correct,
    aiExplanation: data.ai_explanation,
    optionByOptionAnalysis: data.option_by_option_analysis,
    benchmarkSource: data.benchmark_source,
    communityStats: mappedCommunityStats,
  };
}

interface RawCardStat {
  question_id: string;
  consecutive_correct: number;
  wrong_attempts: number;
  total_attempts: number;
  status: "learning" | "learned";
  last_answered_at?: string;
}

interface RawCramActiveBatch {
  scope: "deck" | "mistakes";
  scoped_question_ids?: string[];
  batch_question_ids: string[];
  active_queue_ids: string[];
  queue_pointer: number;
  mastered_in_batch_ids: string[];
  missed_ids?: string[];
  updated_at: string;
}

interface RawSubjectPracticeProgress {
  subject_code: string;
  cram_mastered_ids: string[];
  learn_mastered_ids: string[];
  card_stats: Record<string, RawCardStat>;
  cram_active_batch?: RawCramActiveBatch | null;
}

function mapRawCramActiveBatch(raw: RawCramActiveBatch | null | undefined): CramActiveBatch | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  return {
    scope: raw.scope === "mistakes" ? "mistakes" : "deck",
    scopedQuestionIds: Array.isArray(raw.scoped_question_ids) ? raw.scoped_question_ids : undefined,
    batchQuestionIds: Array.isArray(raw.batch_question_ids) ? raw.batch_question_ids : [],
    activeQueueIds: Array.isArray(raw.active_queue_ids) ? raw.active_queue_ids : [],
    queuePointer: typeof raw.queue_pointer === "number" ? raw.queue_pointer : 0,
    masteredInBatchIds: Array.isArray(raw.mastered_in_batch_ids) ? raw.mastered_in_batch_ids : [],
    missedIds: Array.isArray(raw.missed_ids) ? raw.missed_ids : [],
    updatedAt: raw.updated_at || new Date(0).toISOString(),
  };
}

function serializeCramActiveBatch(
  batch: CramActiveBatch | null | undefined
): RawCramActiveBatch | null | undefined {
  if (batch === undefined) return undefined;
  if (batch === null) return null;
  return {
    scope: batch.scope,
    scoped_question_ids: batch.scopedQuestionIds,
    batch_question_ids: batch.batchQuestionIds,
    active_queue_ids: batch.activeQueueIds,
    queue_pointer: batch.queuePointer,
    mastered_in_batch_ids: batch.masteredInBatchIds,
    missed_ids: batch.missedIds,
    updated_at: batch.updatedAt,
  };
}

function mapSubjectProgressResponse(raw: RawSubjectPracticeProgress): SubjectPracticeProgress {
  const cardStats: Record<string, CardMasteryRecord> = {};
  for (const [qId, stat] of Object.entries(raw.card_stats ?? {})) {
    cardStats[qId] = {
      questionId: stat.question_id || qId,
      consecutiveCorrect: stat.consecutive_correct ?? 0,
      wrongAttempts: stat.wrong_attempts ?? 0,
      totalAttempts: stat.total_attempts ?? 0,
      status: stat.status === "learned" ? "learned" : "learning",
      lastAnsweredAt: stat.last_answered_at,
    };
  }
  return {
    subjectCode: raw.subject_code,
    cramMasteredIds: Array.isArray(raw.cram_mastered_ids) ? raw.cram_mastered_ids : [],
    learnMasteredIds: Array.isArray(raw.learn_mastered_ids) ? raw.learn_mastered_ids : [],
    cardStats,
    cramActiveBatch: mapRawCramActiveBatch(raw.cram_active_batch),
  };
}

export async function getPracticeProgressSummary(): Promise<PracticeProgressSummaryItem[]> {
  const data = await apiClient<
    Array<{
      subject_code: string;
      cram_count: number;
      learn_count: number;
    }>
  >("/api/v1/users/me/practice-progress");

  return data.map((item) => ({
    subjectCode: item.subject_code,
    cramCount: item.cram_count ?? 0,
    learnCount: item.learn_count ?? 0,
  }));
}

export async function getSubjectPracticeProgress(
  subjectCode: string
): Promise<SubjectPracticeProgress> {
  const raw = await apiClient<RawSubjectPracticeProgress>(
    `/api/v1/subjects/${encodeURIComponent(subjectCode)}/practice/progress`
  );
  return mapSubjectProgressResponse(raw);
}

export interface SyncPracticeProgressPayload {
  cramMasteredIds?: string[];
  learnMasteredIds?: string[];
  cardStats?: Record<string, CardMasteryRecord>;
  cramActiveBatch?: CramActiveBatch | null;
}

export async function syncSubjectPracticeProgress(
  subjectCode: string,
  payload: SyncPracticeProgressPayload
): Promise<SubjectPracticeProgress> {
  const serializedStats: Record<string, RawCardStat> = {};
  if (payload.cardStats) {
    for (const [qId, stat] of Object.entries(payload.cardStats)) {
      serializedStats[qId] = {
        question_id: stat.questionId || qId,
        consecutive_correct: stat.consecutiveCorrect,
        wrong_attempts: stat.wrongAttempts,
        total_attempts: stat.totalAttempts,
        status: stat.status === "learned" ? "learned" : "learning",
        last_answered_at: stat.lastAnsweredAt,
      };
    }
  }

  const raw = await apiClient<RawSubjectPracticeProgress>(
    `/api/v1/subjects/${encodeURIComponent(subjectCode)}/practice/progress`,
    {
      method: "PUT",
      body: JSON.stringify({
        cram_mastered_ids: payload.cramMasteredIds,
        learn_mastered_ids: payload.learnMasteredIds,
        card_stats: Object.keys(serializedStats).length > 0 ? serializedStats : undefined,
        cram_active_batch: serializeCramActiveBatch(payload.cramActiveBatch),
      }),
    }
  );
  return mapSubjectProgressResponse(raw);
}

export async function resetSubjectPracticeProgress(
  subjectCode: string,
  mode?: PracticeMode
): Promise<void> {
  await apiClient<{ message: string }>(
    `/api/v1/subjects/${encodeURIComponent(subjectCode)}/practice/reset`,
    {
      method: "POST",
      body: mode ? JSON.stringify({ mode }) : undefined,
    }
  );
}

/**
 * Reconciles unsynced localStorage Cram/Learn progress with the backend (union merge)
 * and persists the canonical merged progress back to localStorage.
 */
export async function syncSubjectProgressWithServer(
  subjectCode: string
): Promise<SubjectPracticeProgress> {
  const delta = computeUnsyncedLocalDelta(subjectCode);
  const serverProgress = delta.hasChanges
    ? await syncSubjectPracticeProgress(subjectCode, {
        cramMasteredIds: delta.cramMasteredIds,
        learnMasteredIds: delta.learnMasteredIds,
        cardStats: delta.cardStats,
        cramActiveBatch: delta.cramActiveBatch,
      })
    : await getSubjectPracticeProgress(subjectCode);

  applyServerSubjectProgress(subjectCode, serverProgress);
  return {
    ...serverProgress,
    cramActiveBatch: readLocalCramActiveBatch(subjectCode),
  };
}

export function getLocalSubjectPracticeFallback(subjectCode: string): SubjectPracticeProgress {
  return {
    subjectCode,
    cramMasteredIds: readLocalCramMasteredIds(subjectCode),
    learnMasteredIds: readLocalLearnMasteredIds(subjectCode),
    cardStats: readLocalCardStats(subjectCode),
    cramActiveBatch: readLocalCramActiveBatch(subjectCode),
  };
}
