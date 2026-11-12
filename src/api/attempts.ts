import { apiClient } from "./client";
import { resolveImageUrl } from "@/utils/imageUrl";
import type {
  AttemptSession,
  Question,
  AttemptResult,
  AttemptReview,
  FeedbackMode,
  BenchmarkMode,
} from "@/types/index";

export interface StartAttemptOptions {
  questionCount?: number;
  durationMinutes?: number | null;
  feedbackMode?: FeedbackMode;
  benchmarkMode?: BenchmarkMode;
}

export async function startExamAttempt(
  examId: string,
  _options?: StartAttemptOptions
): Promise<AttemptSession> {
  const data = await apiClient<{
    attempt_id: string;
    exam_id: string;
    exam_title: string;
    status: string;
    started_at: string;
    expires_at: string;
    time_remaining_seconds: number;
    questions: Array<{
      question_id: string;
      question_number: number;
      question_id_code: string;
      question_type: string;
      question_text: string;
      image_url: string | null;
      options: Record<string, string>;
      selected_options: string | null;
    }>;
  }>(`/api/v1/exams/${encodeURIComponent(examId)}/attempts`, {
    method: "POST",
  });

  return {
    attemptId: data.attempt_id,
    examId: data.exam_id,
    examTitle: data.exam_title,
    status: (data.status as AttemptSession["status"]) || "in_progress",
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    timeRemainingSeconds: data.time_remaining_seconds,
    questions: data.questions.map((q) => ({
      questionId: q.question_id,
      questionNumber: q.question_number,
      questionIdCode: q.question_id_code,
      questionType: (q.question_type as Question["questionType"]) || "single_choice",
      questionText: q.question_text,
      imageUrl: resolveImageUrl(q.image_url),
      options: q.options,
      selectedOptions: q.selected_options,
    })),
  };
}

export async function getAttempt(attemptId: string): Promise<AttemptSession> {
  const data = await apiClient<{
    attempt_id: string;
    exam_id: string;
    exam_title: string;
    status: string;
    started_at: string;
    expires_at: string;
    time_remaining_seconds: number;
    questions: Array<{
      question_id: string;
      question_number: number;
      question_id_code: string;
      question_type: string;
      question_text: string;
      image_url: string | null;
      options: Record<string, string>;
      selected_options: string | null;
    }>;
  }>(`/api/v1/attempts/${encodeURIComponent(attemptId)}`);

  return {
    attemptId: data.attempt_id,
    examId: data.exam_id,
    examTitle: data.exam_title,
    status: (data.status as AttemptSession["status"]) || "in_progress",
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    timeRemainingSeconds: data.time_remaining_seconds,
    questions: data.questions.map((q) => ({
      questionId: q.question_id,
      questionNumber: q.question_number,
      questionIdCode: q.question_id_code,
      questionType: (q.question_type as Question["questionType"]) || "single_choice",
      questionText: q.question_text,
      imageUrl: resolveImageUrl(q.image_url),
      options: q.options,
      selectedOptions: q.selected_options,
    })),
  };
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOptions: string
): Promise<{ questionId: string; selectedOptions: string; savedAt: string }> {
  const res = await apiClient<{
    question_id: string;
    selected_options: string;
    saved_at: string;
  }>(`/api/v1/attempts/${encodeURIComponent(attemptId)}/answers`, {
    method: "PUT",
    body: JSON.stringify({
      question_id: questionId,
      selected_options: selectedOptions,
    }),
  });

  return {
    questionId: res.question_id,
    selectedOptions: res.selected_options,
    savedAt: res.saved_at,
  };
}

export async function submitAttempt(attemptId: string): Promise<AttemptResult> {
  const data = await apiClient<{
    attempt_id: string;
    status: string;
    total_questions: number;
    correct_answers_count: number;
    total_score: number;
    percentage_score: number;
    is_passed: boolean;
    submitted_at: string;
    duration_seconds: number;
  }>(`/api/v1/attempts/${encodeURIComponent(attemptId)}/submit`, {
    method: "POST",
  });

  return {
    attemptId: data.attempt_id,
    status: "completed",
    totalQuestions: data.total_questions,
    correctAnswersCount: data.correct_answers_count,
    totalScore: data.total_score,
    percentageScore: data.percentage_score,
    isPassed: data.is_passed,
    submittedAt: data.submitted_at,
    durationSeconds: data.duration_seconds,
  };
}

export async function getAttemptReview(attemptId: string): Promise<AttemptReview> {
  const data = await apiClient<{
    attempt_id: string;
    exam_title: string;
    percentage_score: number;
    is_passed: boolean;
    submitted_at: string;
    questions: Array<{
      question_id: string;
      question_number: number;
      question_id_code: string;
      question_type: string;
      question_text: string;
      image_url: string | null;
      options: Record<string, string>;
      selected_options: string | null;
      correct_answer: string;
      is_correct: boolean;
      ai_explanation: string | null;
      ai_model?: string | null;
      option_by_option_analysis: Record<string, string> | null;
      community_stats: {
        total_comments: number;
        valid_vote_count: number;
        top_answer_votes: number;
        agreement_ratio: number;
        community_answer: string | null;
      } | null;
    }>;
  }>(`/api/v1/attempts/${encodeURIComponent(attemptId)}/review`);

  return {
    attemptId: data.attempt_id,
    examTitle: data.exam_title,
    percentageScore: data.percentage_score,
    isPassed: data.is_passed,
    submittedAt: data.submitted_at,
    questions: data.questions.map((q) => ({
      questionId: q.question_id,
      questionNumber: q.question_number,
      questionIdCode: q.question_id_code,
      questionType: (q.question_type as Question["questionType"]) || "single_choice",
      questionText: q.question_text,
      imageUrl: resolveImageUrl(q.image_url),
      options: q.options,
      selectedOptions: q.selected_options,
      correctAnswer: q.correct_answer,
      isCorrect: q.is_correct,
      aiExplanation: q.ai_explanation,
      aiModel: q.ai_model,
      optionByOptionAnalysis: q.option_by_option_analysis,
      communityStats: q.community_stats
        ? {
            totalComments: q.community_stats.total_comments,
            validVoteCount: q.community_stats.valid_vote_count,
            topAnswerVotes: q.community_stats.top_answer_votes,
            agreementRatio: q.community_stats.agreement_ratio,
            communityAnswer: q.community_stats.community_answer,
          }
        : null,
    })),
  };
}

export async function checkInstantAnswer(
  questionId: string,
  selectedOptions: string
): Promise<{
  questionId: string;
  selectedOptions: string;
  correctAnswer: string;
  isCorrect: boolean;
  aiExplanation: string;
  optionByOptionAnalysis?: Record<string, string>;
}> {
  const data = await apiClient<{
    question_id: string;
    selected_options: string;
    correct_answer: string;
    is_correct: boolean;
    ai_explanation: string;
    option_by_option_analysis?: Record<string, string>;
  }>(`/api/v1/questions/${encodeURIComponent(questionId)}/check`, {
    method: "POST",
    body: JSON.stringify({ selected_options: selectedOptions }),
  });

  return {
    questionId: data.question_id,
    selectedOptions: data.selected_options,
    correctAnswer: data.correct_answer,
    isCorrect: data.is_correct,
    aiExplanation: data.ai_explanation,
    optionByOptionAnalysis: data.option_by_option_analysis,
  };
}
