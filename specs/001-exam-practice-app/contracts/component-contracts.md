# UI Component Contracts: Exam Practice Platform

**Feature**: `001-exam-practice-app` | **Date**: 2026-11-12

This document defines the interface, prop contracts, and interaction behaviors for the components specified in `/assets/question_ui.png` and `DESIGN.md`.

---

## 1. Question Canvas Workspace (`QuestionCanvas.tsx`)

Main viewer for question diagram imagery with zoom and pan controls.

### Props Contract
```typescript
export interface QuestionCanvasProps {
  questionNumber: number;
  questionCode: string; // e.g. "Q1"
  questionType: "single_choice" | "multiple_choice";
  imageUrl: string | null;
  questionTextFallback: string;
}
```

### Visual & Behavioral Requirements
- Render high-resolution diagram using CSS transforms: `transform: scale(zoomLevel) translate3d(panX, panY, 0)`.
- Header overlay inside canvas area:
  - Top-left badge: `Câu {questionNumber} ({Math.round(zoomLevel * 100)}%)`.
  - Top-right badge: `Single Choice` or `Multiple Choice` (pill styled with `radius-full`).
- Bottom toolbar contains three distinct pill buttons (`radius-full: 9999px`):
  1. `Zoom in`
  2. `Zoom out`
  3. `Original`
- Zoom and pan position MUST persist across question changes (preserving the user's last chosen zoom level and coordinates).
- When image is loading, display skeleton state with `color-6` background.
- When image fails to load, render empty state card with retry button and extracted question text.

---

## 2. Question List Sidebar (`QuestionListSidebar.tsx`)

Sidebar question grid displaying question statuses, adaptive completion box, and 3-box pagination.

### Props Contract
```typescript
export interface QuestionListSidebarProps {
  totalQuestions: number;
  questions: Array<{
    id: string;
    number: number;
    isAnswered: boolean;
    isCurrent: boolean;
    isCorrect?: boolean | null; // in instant feedback mode
  }>;
  activeQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  // Pagination
  currentPage: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  // Answered count
  answeredCount: number;
  pageSize?: number; // default 25
}
```

### Layout Logic Contract (User Specification)
- **Case 1: Single-Page (`totalQuestions <= 25`)**:
  - The completion container expands to `width: 100%` across the bottom bar.
  - Text format: `"Số câu đã làm: {answeredCount}/{totalQuestions}"`.
  - Pagination navigation box is **omitted** (not rendered).
- **Case 2: Multi-Page (`totalQuestions > 25`)**:
  - Split into two visual zones on the bottom bar:
    1. Left completion box formatted as: `"{answeredCount}/{totalQuestions}"`.
    2. Right 3-box navigation control:
       - Box 1: Page indicator `"{currentPage}/{totalPages} page"`.
       - Box 2: Previous page button (`<`) with disabled state when `currentPage === 1`.
       - Box 3: Next page button (`>`) with disabled state when `currentPage === totalPages`.
  - The question list grid paginates in fixed batches of 25 questions per page.

---

## 3. Question Choice Panel (`QuestionChoicePanel.tsx`)

Renders option buttons from A to H (`A, B, C, D, E, F, G, H`) and reflects selected states.

### Props Contract
```typescript
export interface QuestionChoicePanelProps {
  options?: Record<string, string>; // optional dictionary; buttons render A through H
  selectedOptions: string | null; // e.g. "C" or "ACD"
  questionType: "single_choice" | "multiple_choice";
  onSelectOption: (optionKey: string) => void;
  onCheckAnswer?: () => void; // for multiple-choice instant feedback checking
  feedbackMode: "instant" | "post_exam";
  instantResult?: {
    isCorrect: boolean;
    correctAnswer: string;
  } | null;
  disabled?: boolean;
}
```

### State & Token Contract
- Pill buttons using `radius-full: 9999px` and `font-bold` for choices A, B, C, D, E, F, G, H.
- No redundant detailed textual options list rendered below the buttons.
- For multiple-choice questions in Instant Feedback mode, displays a "Kiểm tra" (Check Answer) button when choices are selected so checking is performed on the combined selection without premature failure.
- Default: `bg-color-7 text-color-1 border-color-1 shadow-sm hover:bg-color-6`.
- Selected (Post-Exam Mode): `bg-color-2 text-color-7 border-color-2 shadow-sm`.
- Selected Correct (Instant Mode): `bg-color-3 text-color-7 border-color-3 shadow-sm`.
- Selected Incorrect (Instant Mode): `bg-color-4 text-color-7 border-color-4 shadow-sm`.
- Correct Answer Indicator (Instant Mode when wrong selected): Highlighted border in `color-3`.

---

## 4. Persistent AI Answers Modal (`AiAnswerModal.tsx`)

Modal dialog triggered by clicking "View AI Answers". Accessible at all times without requiring prior answer selection.

### Props Contract
```typescript
export interface AiAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionNumber: number;
  aiChoice: string; // e.g. "C" or "ACD"
  aiModel: string; // e.g. "gemini-3-flash-preview"
  aiExplanation: string;
  optionByOptionAnalysis?: Record<string, string> | null;
}
```

### Visual & Behavioral Requirements
- Center-aligned modal dialog with dimmed backdrop (`bg-black/60`).
- Dismissible via `Escape` key, click outside backdrop, or top-right `Close` button.
- Eager data loading: always presents the actual AI answer, model, and reasoning for the current question immediately upon opening.
- Clean typography and spacious sections adhering to `DESIGN.md`:
  1. Header: `"Giải thích chi tiết từ AI - Câu {questionNumber}"`
  2. Hero Recommendation Banner: Spacious card with generous padding (`p-space-6`), clearly displaying AI model badge and AI recommended choice without cramped pill overlaps.
  3. Step-by-Step Explanation: Comfortably padded card (`p-space-6`) with relaxed line-height and structured reasoning steps.
  4. Option Analysis Breakdown: Clean list cards explaining why each option is correct or incorrect.
  5. Dismiss button: Centered or right-aligned pill button (`radius-full: 9999px`).

---

## 5. Exam Header Bar (`ExamHeaderBar.tsx`)

Header containing progress bar, timer, and benchmark indicator.

### Props Contract
```typescript
export interface ExamHeaderBarProps {
  answeredCount: number;
  totalQuestions: number;
  remainingSeconds: number;
  benchmarkMode: "ai" | "community";
  onToggleBenchmark: () => void;
  onSubmitExam: () => void;
}
```

### Requirements
- **Progress Bar**: Shows visual percentage completion: `(answeredCount / totalQuestions) * 100%`.
- **Timer**: Monospace formatted countdown `HH:MM:SS`. When `remainingSeconds < 300` (5 min), transitions text color to `color-4` with subtle pulse animation.
- **Benchmark Toggle**: Displays label `"Answers should follow commu or AI opt"`, allowing switching between AI benchmark and Community benchmark.
