import type { Question, CommunityStats } from "./exam";

export interface AttemptResult {
  attemptId: string;
  status: "completed";
  totalQuestions: number;
  correctAnswersCount: number;
  totalScore: number;
  percentageScore: number;
  isPassed: boolean;
  submittedAt: string;
  durationSeconds: number;
}

export interface ReviewQuestionItem extends Question {
  correctAnswer: string;
  isCorrect: boolean;
  aiExplanation: string | null;
  aiModel?: string | null;
  optionByOptionAnalysis: Record<string, string> | null;
  communityStats: CommunityStats | null;
}

export interface AttemptReview {
  attemptId: string;
  examTitle: string;
  percentageScore: number;
  isPassed: boolean;
  submittedAt: string;
  questions: ReviewQuestionItem[];
}

export interface UserStats {
  totalAttemptsCount: number;
  totalExamsPassed: number;
  overallPassRate: number;
  overallAverageScore: number;
  totalPracticeSeconds: number;
  subjectBreakdowns: Record<
    string,
    {
      attemptsCount: number;
      averageScore: number;
      passedCount: number;
    }
  >;
}
