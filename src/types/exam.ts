export type QuestionType = "single_choice" | "multiple_choice";
export type FeedbackMode = "instant" | "post_exam";
export type BenchmarkMode = "ai" | "community";

export type AnswerViewMode = "instant" | "review_after_finish";
export type AnswerSourceMode = "ai_answer" | "community_consensus";

export interface ExamConfigOptions {
  subjectId: string;
  subjectCode: string;
  totalQuestions: number;
  isTimed: boolean;
  durationMinutes: number;
  feedbackMode: AnswerViewMode;
  benchmarkSource: AnswerSourceMode;
}

export interface Question {
  questionId: string;
  questionNumber: number;
  questionIdCode: string;
  questionType: QuestionType;
  questionText: string;
  imageUrl: string | null;
  options: Record<string, string>;
  selectedOptions?: string | null;
}

export interface AiExplanationDetail {
  aiChoice: string;
  aiModel: string;
  aiExplanation: string;
  optionByOptionAnalysis?: Record<string, string> | null;
  comparisonNote?: string | null;
}

export interface CommunityStats {
  totalComments: number;
  validVoteCount: number;
  topAnswerVotes: number;
  agreementRatio: number;
  communityAnswer: string | null;
}

export type AttemptStatus = "in_progress" | "completed" | "expired";

export interface AttemptSession {
  attemptId: string;
  examId: string;
  examTitle: string;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
  timeRemainingSeconds: number;
  questions: Question[];
}

export interface CustomPracticeConfig {
  subjectCode: string;
  durationMinutes: number | null;
  totalQuestions: number;
  feedbackMode: FeedbackMode;
  benchmarkMode: BenchmarkMode;
}
