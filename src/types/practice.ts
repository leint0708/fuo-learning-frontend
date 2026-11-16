import type { BenchmarkMode, CommunityStats, Question } from "./exam";

export type PracticeMode = "cram" | "learn";

export type CardMasteryStatus = "not_learned" | "learning" | "learned";

export interface CardMasteryRecord {
  questionId: string;
  consecutiveCorrect: number; // Streak of consecutive correct answers
  wrongAttempts: number;      // Total mistakes made on this card
  totalAttempts: number;      // Total presentations of this card
  status: CardMasteryStatus;  // Current Leitner tier in Learn mode
  lastAnsweredAt?: string;
}

export interface PracticeProgressSummary {
  subjectCode: string;
  totalQuestions: number;
  cramMasteredIds: string[];
  learnGraduatedIds: string[];
  stats: Record<string, CardMasteryRecord>;
}

export interface CramSessionState {
  subjectCode: string;
  mode: "cram";
  deckPool: Question[];            // Full eligible question set for this session
  masteredIds: Set<string>;        // Cumulative card IDs mastered across batches
  currentBatch: Question[];        // Active batch slice (up to 10 cards)
  activeQueue: Question[];         // Dynamic working queue within the batch
  queuePointer: number;            // Index of the card currently displayed (0 <= pointer < activeQueue.length)
  masteredInBatch: Set<string>;    // Card IDs mastered in the current 10-card batch
  batchIndex: number;              // Current batch index (0-indexed: Batch 1, Batch 2, etc.)
  totalBatches: number;            // Math.ceil(deckPool.length / 10)
  isBatchCompleted: boolean;       // True when masteredInBatch.size === currentBatch.length
  isSessionCompleted: boolean;     // True when all batches are cleared
}

export interface RoundReviewItem {
  question: Question;
  selectedOptions: string;
  correctAnswer: string;
  isCorrect: boolean;
  consecutiveCorrect: number;
  wrongAttempts: number;
  status: CardMasteryStatus;
  explanation?: string;
}

export interface RoundDiagnostic {
  roundNumber: number;
  totalCardsReviewed: number;
  incorrectCount: number;
  correctCount: number;
  errorRate: number;              // (incorrectCount / totalCardsReviewed) * 100
  items: RoundReviewItem[];
}

export interface LearnSessionState {
  subjectCode: string;
  mode: "learn";
  waitingPool: Question[];         // "Not Yet Learned" cards waiting in reserve
  activePool: Question[];          // "Learning" active working memory buffer (strict max 7 cards)
  graduatedPool: Question[];       // "Learned" cards certified as mastered
  roundQueue: Question[];          // Shuffled sequence of activePool cards for the current round
  roundPointer: number;            // Current question index in the active round (0 <= pointer < roundQueue.length)
  currentRoundNumber: number;      // 1-indexed round counter
  roundReviewItems: RoundReviewItem[]; // Audit history of cards answered during the active round
  currentRoundDiagnostic: RoundDiagnostic | null; // Null during active round, populated at round end
  isRoundCompleted: boolean;       // True when roundPointer >= roundQueue.length
  isSessionCompleted: boolean;     // True when activePool.length === 0 && waitingPool.length === 0
  stats: Record<string, CardMasteryRecord>; // Telemetry per questionId
}

export interface InstantAnswerResult {
  questionId: string;
  selectedOptions: string;
  correctAnswer: string;
  isCorrect: boolean;
  aiExplanation: string;
  optionByOptionAnalysis?: Record<string, string>;
  benchmarkSource?: BenchmarkMode;
  communityStats?: CommunityStats | null;
}
