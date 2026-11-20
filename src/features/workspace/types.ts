import type { BenchmarkMode, CommunityStats, Question, QuestionType } from "@/types/exam";
import type { RoundReviewItem } from "@/types/practice";

/**
 * Canonical workspace session mode combining Study (Cram / Learn) and Exam flows.
 */
export type WorkspaceMode = "cram" | "learn" | "exam_instant" | "exam_post";

/**
 * Async answer evaluation & AI explanation lifecycle.
 */
export type WorkspaceEvaluationStatus = "idle" | "loading" | "resolved" | "error";

/**
 * Live persistence indicator for Exam `saveAnswer` synchronization.
 */
export type WorkspaceSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Navigation item status rendered inside QuestionNavigator.
 */
export interface WorkspaceNavigatorItem {
  id: string;
  number: number;
  label?: string;
  isAnswered: boolean;
  isCurrent: boolean;
  isCorrect?: boolean | null;
  isRequeued?: boolean;
  streakText?: string;
}

/**
 * Optional practice mastery / repetition indicator shown on active cards.
 */
export interface WorkspaceCardBadge {
  label: string;
  tone: "primary" | "accent" | "warning" | "neutral" | "danger";
}

/**
 * Normalized question representation consumed by shared cockpit components.
 */
export interface WorkspaceQuestionState {
  question: Question;
  hasVisualMedia: boolean;
  sortedOptionKeys: string[];
  masteryBadge?: WorkspaceCardBadge | null;
}

/**
 * Unified evaluation & AI breakdown payload across Practice & Exam.
 */
export interface WorkspaceEvaluationResult {
  status: WorkspaceEvaluationStatus;
  isCorrect: boolean | null;
  correctAnswer: string | null;
  aiExplanation: string | null;
  optionByOptionAnalysis?: Record<string, string> | null;
  aiModel?: string;
  errorMessage?: string | null;
  benchmarkSource?: BenchmarkMode | null;
  communityStats?: CommunityStats | null;
  communityFallbackNotice?: string | null;
  resolvedAt?: number;
}

/**
 * Exam countdown / untimed elapsed telemetry exposed to CockpitHeader.
 */
export interface WorkspaceTimerState {
  isUntimed: boolean;
  formattedTime: string;
  formattedElapsed: string;
  isWarning: boolean;
  isExpired: boolean;
}

/**
 * Mode-level descriptor configuring chrome, rules, and interaction boundaries.
 */
export interface WorkspaceSessionDescriptor {
  mode: WorkspaceMode;
  title: string;
  exitRoute: string;
  exitLabel: string;
  supportsFreeNavigation: boolean;
  requiresExplicitContinue: boolean;
  allowsClearSelection: boolean;
}

/**
 * Shared adapter contract connecting Practice or Exam state machines to StudyCockpitShell.
 */
export interface UseWorkspaceSessionResult {
  descriptor: WorkspaceSessionDescriptor;
  sessionStatus: "loading" | "error" | "empty" | "ready" | "completed" | "submitting";
  loadErrorMessage?: string | null;
  currentQuestionState: WorkspaceQuestionState | null;
  currentIndex: number;
  totalQuestions: number;
  progressCurrent: number;
  progressTotal: number;
  progressLabel: string;
  selectedOptions: string;
  questionType: QuestionType;
  evaluation: WorkspaceEvaluationResult | null;
  saveStatus: WorkspaceSaveStatus;
  timer: WorkspaceTimerState | null;
  navigatorItems: WorkspaceNavigatorItem[];
  answeredCount: number;
  selectOption: (key: string) => void;
  clearSelection: () => void;
  submitCheck: () => void;
  advanceNext: () => void;
  navigatePrev: () => void;
  jumpToQuestion: (index: number) => void;
  retrySave?: () => void;
  retryEvaluation?: () => void;
  openAiAnalysis?: () => void;
  resetSession?: () => void;
  reviewItems?: RoundReviewItem[];
}
