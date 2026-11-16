import { apiClient } from "./client";
import { resolveImageUrl } from "@/utils/imageUrl";
import type { BenchmarkMode, CommunityStats, Question } from "@/types/exam";
import type { InstantAnswerResult } from "@/types/practice";

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
