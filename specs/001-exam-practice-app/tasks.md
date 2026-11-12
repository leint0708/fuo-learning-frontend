# Tasks: Exam Practice Platform

**Input**: Design documents from [`specs/001-exam-practice-app/`](file:///D:/FUO/fuo-learning-frontend/specs/001-exam-practice-app/)
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
**Constitution Reference**: [`.specify/memory/constitution.md`](file:///D:/FUO/fuo-learning-frontend/.specify/memory/constitution.md)

---

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Associated user story (US1 through US6)
- File paths are explicitly designated for each task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, build tools, design tokens, and test harness.

- [X] T001 Initialize Vite 6 + React 19 + TypeScript project with `package.json`, `tsconfig.json`, and `vite.config.ts` configured with API proxy to `http://localhost:8787`
- [X] T002 [P] Configure Tailwind CSS with DESIGN.md design tokens in `tailwind.config.ts` and `src/styles/tokens.css` (defining `color-1` to `color-7`, `space-1` to `space-10`, `radius-full: 9999px`, and `shadow-sm`)
- [X] T003 [P] Configure Cloudflare Pages SPA rewrite rule in `public/_redirects` and HTML entry with Space Grotesk font in `index.html`
- [X] T004 [P] Configure test infrastructure with Vitest, React Testing Library, and MSW setup in `vitest.config.ts` and `tests/setup.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure, types, API client, and reusable design primitives that MUST be completed before user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Define TypeScript domain interfaces (`UserProfile`, `Subject`, `ExamSummary`, `Question`, `AttemptSession`, `AttemptResult`, `ReviewQuestionItem`) in `src/types/auth.ts`, `src/types/catalog.ts`, `src/types/exam.ts`, and `src/types/review.ts`
- [X] T006 [P] Implement base HTTP API client with auth token interceptor and standardized error handling in `src/api/client.ts`
- [X] T007 [P] Setup MSW API mock handlers for OpenAPI endpoints in `tests/mocks/handlers.ts` and `tests/mocks/server.ts`
- [X] T008 [P] Create reusable UI button primitive with 8 interactive states and `radius-full: 9999px` in `src/components/ui/Button.tsx` and card container with `shadow-sm` in `src/components/ui/Card.tsx`
- [X] T009 [P] Create reusable UI primitives in `src/components/ui/Modal.tsx`, `src/components/ui/ProgressBar.tsx`, and `src/components/ui/Badge.tsx`
- [X] T010 Implement application layout components with responsive navigation bar and user profile dropdown in `src/components/layout/Navbar.tsx` and footer in `src/components/layout/Footer.tsx`
- [X] T011 Configure React Router v7 application shell with protected route wrapper and TanStack Query provider in `src/App.tsx` and `src/main.tsx`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Learner Authentication & Account Management (Priority: P1) 🎯 MVP

**Goal**: Enable user registration, login, token persistence in `localStorage`, session profile restoration, and logout.

**Independent Test**: Register an account, reload the browser to verify session persistence, logout, and verify redirection to the sign-in screen.

### Tests for User Story 1 ⚠️
- [X] T012 [P] [US1] Create contract test for authentication endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`) in `tests/contract/auth.test.ts`

### Implementation for User Story 1
- [X] T013 [P] [US1] Implement authentication API client functions (`login`, `register`, `getMe`) in `src/api/auth.ts`
- [X] T014 [US1] Implement Zustand authentication store with JWT `localStorage` token management in `src/stores/authStore.ts` and `src/hooks/useAuth.ts`
- [X] T015 [P] [US1] Implement login form component with validation and error alerts in `src/features/auth/LoginForm.tsx`
- [X] T016 [P] [US1] Implement registration form component with validation (verbatim rule: "password minimum 8 characters") in `src/features/auth/RegisterForm.tsx`
- [X] T017 [US1] Implement user profile view with aggregate learning statistics (pass rate, exams completed, study duration) in `src/features/auth/ProfileView.tsx`

**Checkpoint**: User Story 1 functional and independently testable as an MVP increment.

---

## Phase 4: User Story 2 - Subject Discovery & Custom Exam Configuration (Priority: P1)

**Goal**: Browse subjects, view standard pre-built exams, and configure custom practice exams with custom time, questions count, and feedback mode.

**Independent Test**: Select a course subject (e.g., MAD101), open custom exam configuration, specify 20 questions and 30 minutes with Instant Feedback mode, and launch the session.

### Tests for User Story 2 ⚠️
- [X] T018 [P] [US2] Create contract test for subject and exam catalog endpoints (`/api/v1/subjects`, `/api/v1/subjects/:code/exams`) in `tests/contract/subjects.test.ts`

### Implementation for User Story 2
- [X] T019 [P] [US2] Implement subjects and exams API client functions in `src/api/subjects.ts`
- [X] T020 [P] [US2] Implement subject card component in `src/features/subjects/SubjectCard.tsx` and subject catalog grid in `src/features/subjects/SubjectCatalogView.tsx`
- [X] T021 [US2] Implement subject details page listing available exams with duration, question count, and passing threshold (default 70.0%) in `src/features/subjects/SubjectDetailView.tsx`
- [X] T022 [US2] Implement custom exam configuration modal (`CustomExamModal.tsx`) with controls for duration (5-180 min or untimed), question count, feedback mode ("Instant Answer Feedback" vs "Post-Exam Review"), and benchmark source ("Community Consensus" vs "AI Key") in `src/features/subjects/CustomExamModal.tsx`

**Checkpoint**: User Stories 1 and 2 functional and testable together.

---

## Phase 5: User Story 3 - Interactive Question Workspace & Visual Canvas (Priority: P1)

**Goal**: Central examination workspace faithful to `/assets/question_ui.png` with progress bar, countdown timer, question image canvas with zoom tools, and choice buttons.

**Independent Test**: Load a question with diagram, click Zoom In/Out/Original, click choice buttons, and verify selection highlights and state updates.

### Tests for User Story 3 ⚠️
- [X] T023 [P] [US3] Create component test for question canvas zoom and pan interactions in `tests/components/QuestionCanvas.test.tsx`

### Implementation for User Story 3
- [X] T024 [P] [US3] Implement GPU-accelerated canvas pan and zoom hook (`useZoomPan`) with bounds `[0.5x, 3.0x]` in `src/hooks/useZoomPan.ts`
- [X] T025 [P] [US3] Implement countdown timer hook with warning state when time < 5 minutes and auto-submission at `00:00:00` in `src/hooks/useExamTimer.ts`
- [X] T026 [P] [US3] Implement Question Canvas component with central image display, loading skeleton, and bottom toolbar buttons (`Zoom in`, `Zoom out`, `Original`) in `src/features/exam/QuestionCanvas.tsx`
- [X] T027 [P] [US3] Implement Question Choice panel supporting option buttons (A through G) with 8 states, instant correctness green (`color-3`) / red (`color-4`) highlighting, and free re-selection support in `src/features/exam/QuestionChoicePanel.tsx`
- [X] T028 [US3] Implement exam attempt and answer persistence API client functions in `src/api/attempts.ts`
- [X] T029 [US3] Implement main Exam Workspace view integrating header progress bar, timer, canvas, and choices panel in `src/features/exam/ExamWorkspaceView.tsx`
- [X] T046 [P] [US3] Update `QuestionCanvas` to display `questionType` badge ("Single Choice" or "Multiple Choice") at the top right of canvas header and render zoom percentage at top left in `src/features/exam/QuestionCanvas.tsx`
- [X] T047 [P] [US3] Update canvas zoom and pan handling so `zoomLevel` and pan position persist across question transitions in `src/features/exam/QuestionCanvas.tsx`
- [X] T048 [P] [US3] Update `QuestionChoicePanel` to render choice buttons A through H (`A, B, C, D, E, F, G, H`), delete the redundant detail text list, and support multi-selection styling in `src/features/exam/QuestionChoicePanel.tsx`
- [X] T049 [US3] Update `ExamWorkspaceView` to handle multiple-choice answer selection (toggling options e.g. "ACD"), add a "Kiểm tra" button for multiple-choice instant feedback checking, and persist multi-letter answers in `src/features/exam/ExamWorkspaceView.tsx`
- [X] T050 [P] [US3] Add component tests for `QuestionChoicePanel` verifying buttons A-H, deletion of text list, and multi-selection in `tests/components/QuestionChoicePanel.test.tsx`
- [X] T051 [P] [US3] Update `QuestionCanvas` tests for `questionType` badge and zoom persistence in `tests/components/QuestionCanvas.test.tsx`

**Checkpoint**: Core question examination workflow functional and independently testable with persistent zoom, A-H buttons, question type badge, and multiple-choice toggling.

---

## Phase 6: User Story 4 - Persistent AI Answer & Clean In-Depth Explanation Modal (Priority: P2)

**Goal**: Dedicated "View AI Answers" button accessible on every question at all times, opening a centered, spacious modal with real AI choice, model name, and step-by-step reasoning eagerly loaded without waiting for user answer selection.

**Independent Test**: Click "View AI Answers" on any unanswered question, verify real AI choice, model, and explanation render immediately in a clean spacious layout, and close via Escape or close button.

### Tests for User Story 4 ⚠️
- [X] T030 [P] [US4] Create component test for AI answer modal dialog in `tests/components/AiAnswerModal.test.tsx`
- [X] T054 [P] [US4] Update component tests in `tests/components/AiAnswerModal.test.tsx` to verify clean card structure and immediate explanation display for unanswered questions

### Implementation for User Story 4
- [X] T031 [US4] Implement centered modal dialog component displaying AI choice, AI model badge, step-by-step explanation, and option-by-option analysis in `src/features/exam/AiAnswerModal.tsx`
- [X] T032 [US4] Integrate "View AI Answers" action button into exam workspace and connect modal visibility to UI store in `src/features/exam/ExamWorkspaceView.tsx`
- [X] T052 [P] [US4] Redesign `AiAnswerModal` for a clean, spacious card architecture with `p-space-6` padding, distinct cards for reasoning and option analysis, and eliminate visual pill crowding in `src/features/exam/AiAnswerModal.tsx`
- [X] T053 [US4] Update `ExamWorkspaceView` to eagerly fetch and display real AI answers, model, and reasoning for active questions without requiring prior user answer selection in `src/features/exam/ExamWorkspaceView.tsx`

**Checkpoint**: AI explanation modal accessible, clean, and testable across all exam scenarios with eager data display.

---

## Phase 7: User Story 5 - Adaptive Question List Pagination & Completion Tracking (Priority: P2)

**Goal**: Sidebar question list grid with adaptive layout: full-width "Số câu đã làm: x/total" for ≤25 questions (single page); compact "x/n" with 3-box navigation control for >25 questions (fixed 25 questions per page).

**Independent Test**: Test with 20 questions (verifying single-page full-width label and no pagination buttons), then test with 50 questions (verifying 25/page pagination, "x/50", and 3-box navigation).

### Tests for User Story 5 ⚠️
- [X] T033 [P] [US5] Update component test for single-page (≤25) vs multi-page (>25, 25/page) sidebar layout rules in `tests/components/QuestionListSidebar.test.tsx`

### Implementation for User Story 5
- [X] T034 [US5] Implement adaptive Question List sidebar with 25-question threshold (default `pageSize = 25`), status indicator pills, and 3-box pagination controls (`[Page x/n]`, `[<]`, `[>]`) in `src/features/exam/QuestionListSidebar.tsx`
- [X] T035 [US5] Connect Question List sidebar 25-question pagination and selection to exam UI store in `src/stores/examUiStore.ts` and `src/features/exam/ExamWorkspaceView.tsx`

**Checkpoint**: Question List sidebar fulfills exact layout rules for single-page and multi-page tests with 25 questions per page.

---

## Phase 8: User Story 6 - Answer Benchmark Consensus & Submission Scoring (Priority: P3)

**Goal**: Benchmark toggle ("commu or AI opt") with automatic AI fallback for missing community data, submission confirmation, scoring evaluation (70% pass threshold), and question review.

**Independent Test**: Submit exam, verify score calculation, and review question items showing user choice vs correct answer vs AI solution.

### Tests for User Story 6 ⚠️
- [X] T036 [P] [US6] Create integration test for exam submission and review flow in `tests/integration/examReview.test.tsx`

### Implementation for User Story 6
- [X] T037 [US6] Implement submit confirmation modal summarizing answered vs unanswered questions with auto-submit on timer expiry in `src/features/exam/SubmitConfirmModal.tsx`
- [X] T038 [US6] Implement post-exam score card component displaying total score, percentage, duration, and pass/fail badge (70.0% threshold) in `src/features/review/ResultScoreCard.tsx`
- [X] T039 [US6] Implement question review item component comparing user selection vs correct answer vs AI solution vs community consensus in `src/features/review/QuestionReviewItem.tsx`
- [X] T040 [US6] Implement comprehensive Review View page in `src/features/review/ReviewView.tsx`

**Checkpoint**: End-to-end examination lifecycle from start to grading and review is complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Reliability, error recovery, DESIGN.md token audits, and production verification.

- [X] T041 [P] Implement automatic active attempt re-connection and timer/choice restoration on browser refresh in `src/hooks/useExamSession.ts`
- [X] T042 [P] Verify strict adherence to `DESIGN.md` tokens across all screens using ESLint and CSS audit (zero arbitrary colors or spacing values)
- [X] T043 [P] Implement responsive layout adaptations for mobile breakpoints in `src/features/exam/ExamWorkspaceView.tsx`
- [X] T044 Execute end-to-end quickstart validation scenarios defined in `specs/001-exam-practice-app/quickstart.md`
- [X] T055 Run full test suite (`npm run test`) and type check (`npm run build`) ensuring zero errors and zero warnings

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Completed.
- **Foundational (Phase 2)**: Completed.
- **User Stories (Phase 3 through 8)**:
  - User Stories 1, 2, 5, 6: Completed.
  - User Story 3 enhancements (T046-T051): Workspace UI refinements (buttons A-H, no text list, persistent zoom, question type badge, multi-select toggling + checking).
  - User Story 4 enhancements (T052-T054): Clean spacious modal architecture & eager AI explanation loading.
- **Polish (Phase 9)**: Tasks T044 and T055 will validate all enhancements.

### Parallel Opportunities
- T046 (`src/features/exam/QuestionCanvas.tsx`), T048 (`src/features/exam/QuestionChoicePanel.tsx`), and T052 (`src/features/exam/AiAnswerModal.tsx`) can be developed in parallel as they touch distinct component files.
- Tests T050, T051, T054 can be authored in parallel.
- Once T046-T048 and T052 are ready, T049 and T053 integrate them into `src/features/exam/ExamWorkspaceView.tsx`.

---

## Implementation Strategy: MVP First

1. **Step 1**: Complete Phase 1 (Setup) and Phase 2 (Foundational) — [Done].
2. **Step 2**: Implement Phase 3 (User Story 1: Authentication) — [Done].
3. **Step 3**: Implement Phase 4 (User Story 2: Subject & Exam Discovery) — [Done].
4. **Step 4**: Implement Phase 5 enhancements (User Story 3: Questions Choice A-H, persistent zoom, question_type badge, multi-select) — [Tasks T046-T051].
5. **Step 5**: Implement Phase 6 enhancements (User Story 4: Clean AI Answers modal & eager real AI data) — [Tasks T052-T054].
6. **Step 6**: Execute Phase 9 (End-to-end verification & build) — [Tasks T044, T055].
