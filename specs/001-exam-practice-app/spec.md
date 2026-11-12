# Feature Specification: Exam Practice Platform

**Feature Branch**: `001-exam-practice-app`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Build an exam practice app with the backend i have builded in ../fuo-learning-backend. The app ui should be clean, user-friendly and follow the rule in DESIGN.md. In addition, the features the app should contain: authentication, options for practicing with new exams which is generated from questions bank with optional settings which like time, total questions in subjects exam page and view answers instantly after choosing answers or after finishing the exam. A question page should follow the sketch which i made in /assets/question_ui.png. In questions list box of the sketch, there is a navigation box & questions completed, i want the questions completed to account for all the space in the format like: \"Số câu đã làm\" if the questions list need one page to show all. However, in case the questions list need a more than one page to display, i want the questions completed box should be displayed with the format: \"x/n\" & the navigation should display with three box: x/n page, left, right. The view ai answers should be displayed all the time regardless of config for view answers instantly or not, the AI answers should contain the AI choice, AI model and AI explanations."

## Clarifications

### Session 2026-11-12
- Q: In "Instant Answer Feedback" mode, should a user be allowed to change their selected answer after the correct/incorrect feedback is revealed, or should their choice be locked on the first selection? → A: Option A (Allow changing answers freely): Users can click other options to experiment and learn; the final active selection at exam submission determines the question score.
- Q: When the answer benchmark is set to "Community Consensus", how should the system evaluate questions that do not currently have any community votes or answers recorded in the database? → A: Option A (Automatic AI fallback with indicator): Automatically fallback to the AI answer as the evaluation key for that specific question and display an informative badge ("Sử dụng đáp án AI (Chưa có dữ liệu cộng đồng)").
- Q: What exact question count threshold should determine whether the Question List sidebar is displayed as a single page or divided into multiple pages? → A: Fixed at 25 questions per page: Exams with ≤25 questions use the single-page layout (full-width "Số câu đã làm: x/total"); exams with >25 questions paginate in batches of 25 questions per page displaying the compact "x/n" box and 3-box page navigation controls.
- Q: When the user clicks "View AI Answers", what presentation format should the AI explanation view use to display the AI choice, model, and reasoning? → A: Option B (Clean & spacious modal dialog): Opens as a focused, centered modal dialog with backdrop, dismissible via Escape key or close button, with a clean and uncluttered visual hierarchy. The AI recommended answer (choice, model, step-by-step reasoning, and option analysis) MUST be loaded and displayed immediately for any question without waiting for or requiring the user to choose an answer first.
- Q: How should the application handle an in-progress exam session if the student accidentally refreshes the browser, closes the tab, or navigates away? → A: Option A (Automatic seamless resume): Upon page reload or returning to the test, the system automatically re-attaches to the active attempt session, synchronizes the server-calculated remaining countdown time, and pre-populates all previously recorded answer selections.
- Q: For "i want the question list to show answer choice from A -> H", where should the A -> H choices be displayed? → A: Option A (Questions Choice panel): In the Questions Choice panel, provide answer choice buttons from A to H (A, B, C, D, E, F, G, H), and completely remove the detailed text list below the buttons.
- Q: Where should the question_type badge be placed in the question image area? → A: Option A (Top-right of Question Image canvas): At the top-right corner of the Question Image canvas (opposite the top-left question number badge), displayed as a clean badge (e.g. "Single Choice" / "Multiple Choice").
- Q: For multiple-choice questions in Instant Feedback mode, how should checking be triggered? → A: Option A (Toggling with dedicated checking): Allow toggling multiple buttons (e.g., selecting A, C, D together). In Instant Feedback mode, provide a "Kiểm tra" / confirm action so users can pick all desired choices before checking, without premature incorrect penalties on individual button taps.
- Q: How should the canvas zoom and pan behave during question navigation? → A: Option A (Preserve last user options): The image zoom scale and pan coordinates remain fixed with the user's last selected settings across questions, rather than resetting to default on each question transition.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learner Authentication & Account Management (Priority: P1)

As a learner preparing for course examinations, I want to create an account, securely sign in, and retain my active session so that my practice progress, customized exam attempts, and academic statistics are saved to my profile.

**Why this priority**: Authentication is the foundational gateway required to associate exam attempts, track score histories, and personalize exam settings for individual students.

**Independent Test**: Can be independently verified by registering a new user account, logging out, logging back in, and confirming that the learner's profile information is accurately retrieved and maintained across page reloads.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the platform landing page, **When** they provide valid registration credentials (full name, email, password), **Then** their account is created and they are automatically signed in to the main dashboard.
2. **Given** a registered user, **When** they enter their email and password on the login screen, **Then** they receive immediate access to their dashboard and personalized subject catalogs.
3. **Given** an authenticated user who closes and reopens the browser window, **When** they return to the application, **Then** their active session remains valid without requiring them to re-enter credentials.
4. **Given** an authenticated user, **When** they click "Log Out", **Then** their session terminates and they are redirected to the sign-in screen, preventing unauthorized access.

---

### User Story 2 - Subject Discovery & Custom Exam Configuration (Priority: P1)

As a student focusing on specific academic courses, I want to browse available subjects, review standard exams, or configure a custom practice exam dynamically sampled from the question bank with custom time and question limits so that I can practice under test conditions tailored to my study schedule.

**Why this priority**: Delivers core practice value by letting students select relevant course domains and tailor difficulty, length, and timing to their immediate preparation goals.

**Independent Test**: Can be tested by selecting a subject (e.g., Discrete Mathematics), selecting "Generate Custom Practice Exam", specifying 20 questions and a 30-minute timer with "Instant Feedback" mode, and verifying that an exam session matching these exact parameters is launched.

**Acceptance Scenarios**:

1. **Given** an authenticated student on the subjects catalog, **When** they choose a subject, **Then** the platform displays subject details along with standard pre-built exams and a "Custom Practice Exam" generator.
2. **Given** a student initiating a custom practice exam, **When** they configure the session options (total question count, time limit in minutes, and instant vs. post-exam answer reveal mode), **Then** the system validates the parameters and generates a customized practice session.
3. **Given** an exam configuration dialog, **When** the student selects "Instant Feedback" mode, **Then** the session provides feedback immediately upon option selection during the test.
4. **Given** an exam configuration dialog, **When** the student selects "Post-Exam Review" mode, **Then** correct answers remain hidden during the test and are revealed only upon final submission.

---

### User Story 3 - Interactive Question Workspace & Visual Canvas (Priority: P1)

As a test taker answering questions during an active exam session, I want a workspace that matches the question page sketch, featuring a progress bar, a live timer, a high-resolution question diagram canvas with persistent zoom tools, a question type badge on the canvas header, and a clean answer choice panel supporting options A through H and multiple-choice selections so that I can comfortably inspect visual problems and record answers accurately.

**Why this priority**: The central exam interface is the primary touchpoint of the entire learning experience; it must be visually ergonomic, responsive, and faithful to the visual specification.

**Independent Test**: Can be independently verified by entering an active exam, confirming the two-column layout from the sketch, zooming the question image and switching questions to verify zoom and position persist, toggling multiple choices for a multiple-choice question, and verifying choice buttons A through H operate cleanly without redundant text lists.

**Acceptance Scenarios**:

1. **Given** an active exam session, **When** a question is displayed, **Then** the screen renders a left column containing a top progress bar, a countdown timer, a central question image canvas, and an image manipulation toolbar (Zoom In, Zoom Out, Reset to Original Size). The canvas displays the question number and zoom scale tag on the top-left, and the `question_type` badge (e.g. "Single Choice" or "Multiple Choice") at the top-right.
2. **Given** a student who adjusts the zoom size or pans the position of the question image on the canvas, **When** they navigate between different questions, **Then** the zoom scale and pan position remain fixed with the user's last selected settings rather than resetting to default fit on every question.
3. **Given** the Questions Choice panel in the sidebar, **When** viewed by the student, **Then** it renders choice buttons for options A through H (A, B, C, D, E, F, G, H) without displaying any redundant detailed text list below the buttons.
4. **Given** a single-choice question (`single_choice`), **When** the student clicks an option button (e.g. A, B, C, D, E, F, G, or H), **Then** that single option is selected, replacing any previously selected option.
5. **Given** a multiple-choice question (`multiple_choice`), **When** the student clicks multiple option buttons (e.g. A, C, and D), **Then** all selected options toggle and remain actively highlighted simultaneously (e.g. "ACD").
6. **Given** a multiple-choice question in "Instant Answer Feedback" mode, **When** the student selects choices, **Then** they can toggle all desired options and trigger "Kiểm tra" without being prematurely penalized as incorrect upon their first button click.
7. **Given** an active exam with a running timer, **When** time elapses, **Then** the countdown decrements every second; if time reaches zero, the exam automatically finalizes and proceeds to the score summary.

---

### User Story 4 - Persistent AI Answer & Clean In-Depth Explanation Modal (Priority: P2)

As a learner seeking immediate pedagogical insight, I want to view AI-generated answers, model provenance, and step-by-step reasoning at any time in a clean, spacious dialog without having to first select an answer for the question, regardless of whether instant feedback mode is turned on or off.

**Why this priority**: Provides instant educational value by explaining complex problem steps, enabling students to learn from their mistakes in real-time rather than guessing blindly.

**Independent Test**: Can be tested by navigating to any unanswered question in any exam mode, clicking "View AI Answers", and verifying that the clean modal dialog immediately displays the AI's selected option, the specific AI model name, and the comprehensive step-by-step reasoning without requiring the user to select an answer first.

**Acceptance Scenarios**:

1. **Given** any question view in an active or completed exam, **When** the student clicks the "View AI Answers" action button, **Then** a spacious, clean centered modal dialog with backdrop opens without disrupting the active question state or timer.
2. **Given** any question where the student has NOT yet selected an answer option, **When** they open the AI modal, **Then** the actual AI recommendation, model name, and step-by-step reasoning are displayed immediately without waiting for user answer interaction.
3. **Given** the opened AI answers modal, **When** inspected by the student, **Then** it presents clean, well-spaced visual sections without cramped borders or cluttered badges:
   - A distinct hero recommendation banner clearly showing the recommended choice and AI model.
   - A comfortably padded step-by-step explanation card with readable line height.
   - An option-by-option rationale breakdown card (when available).
4. **Given** a question where individual option-by-option analysis is available, **When** viewed in the AI panel, **Then** the learner can inspect why each option is correct or incorrect.
5. **Given** an exam in "Post-Exam Review" mode where official submission scoring is pending, **When** the student clicks "View AI Answers", **Then** the AI pedagogical explanation remains accessible without prematurely concluding or grading the exam attempt.

---

### User Story 5 - Adaptive Question List Pagination & Completion Tracking (Priority: P2)

As a test taker navigating through questions in the exam sidebar, I want the questions list box to intelligently adapt its completion summary and pagination controls depending on whether all questions fit on one page or span multiple pages, so that I always know my progress without UI clutter.

**Why this priority**: Directly enforces the explicit user requirement regarding the layout of the question navigation box, ensuring seamless navigation whether the test has 10 questions or 100 questions.

**Independent Test**: Can be tested by creating an exam that fits on a single page (e.g. 10 or 20 questions) and verifying the single full-width "Số câu đã làm" box, then creating a test with more than 25 questions (e.g. 30 or 50 questions) and verifying the "x/n" completion box and 3-box pagination navigation.

**Acceptance Scenarios**:

1. **Given** an exam whose question count fits within a single questions list page (≤25 questions), **When** rendered in the sidebar, **Then** the completed questions box expands across the entire width of the navigation container and displays the full Vietnamese completion label format: "Số câu đã làm: [X]/[Total]" without showing extraneous pagination buttons.
2. **Given** an exam whose question count exceeds the single-page display capacity (>25 questions), **When** rendered in the sidebar, **Then** the completed questions box displays in the compact format "x/n" (e.g., "14/50") on the left side of the bottom bar.
3. **Given** a multi-page question list, **When** the student views the bottom navigation area, **Then** a three-box navigation group is visible containing:
   - An indicator box displaying the current page index (e.g., "Page 1/3").
   - A left navigation button (`<`) to switch to the previous page.
   - A right navigation button (`>`) to switch to the next page.
4. **Given** a multi-page question list, **When** the student clicks the right navigation button, **Then** the grid transitions to the subsequent batch of questions while keeping the student's currently active question clearly highlighted.
5. **Given** any question number button in the grid, **When** the student clicks that number, **Then** the main canvas immediately loads and presents that specific question.

---

### User Story 6 - Answer Benchmark Consensus & Submission Scoring (Priority: P3)

As a student reviewing questions or finishing an exam, I want to reference either community consensus or AI key answers according to the benchmark toggle, and receive an automated grade upon submission so that I can evaluate my overall mastery.

**Why this priority**: Enables students to understand their overall performance, review discrepancies between community answers and AI solutions, and record a permanent attempt score.

**Independent Test**: Can be tested by completing all questions in an exam, clicking "Submit Exam", and verifying that a final score card is displayed with percentage, passing status, duration, and question-by-question review.

**Acceptance Scenarios**:

1. **Given** the question page header, **When** the student observes the top-right benchmark indicator ("Answers should follow commu or AI opt"), **Then** they can identify whether correct-answer comparison is evaluated against Community answers or the AI answer benchmark. If Community consensus is selected but a question lacks community votes, the system automatically falls back to the AI benchmark with an informative badge.
2. **Given** an active exam, **When** the student clicks "Submit Exam" and confirms the submission prompt, **Then** the test is scored automatically and the student is redirected to the Results & Review screen.
3. **Given** a submitted exam review screen, **When** the student inspects individual questions, **Then** each question displays the student's selected answer, the correct answer, the community vote agreement ratio, and the AI explanation.

---

### Edge Cases

- **Accidental Tab Closure, Navigation, or Page Reload**: The exam state is synchronized with the backend. Reloading the page or returning to the exam URL immediately restores the active attempt, the accurate server-calculated remaining time, and all previously selected answers without penalty or loss of progress.
- **Timer Expiration During Active Answering**: When the countdown reaches `00:00:00`, the application MUST immediately disable further option selection, prompt the user that time has expired, and automatically submit all recorded answers for grading.
- **Network Interruption During Choice Selection**: If a network failure occurs when recording an answer choice, the application MUST cache the selection locally, display a subtle warning indicator, and automatically synchronize the choice once connection is restored without losing user data.
- **Corrupted or Missing Question Image**: If a question diagram fails to load, the canvas MUST render a clean empty state with a "Retry Loading Image" button and display the text-extracted version of the problem so the user is not blocked.
- **Small Screen / Mobile Breakpoint Adaptation**: On compact screens (smaller than 768px), the dual-column layout (Question Canvas on left, Question List on right) MUST adapt into a stacked or tabbed layout (Canvas view with a sticky collapsible sidebar or bottom drawer for choices and question grid) while strictly adhering to `DESIGN.md` spacing and touch target standards.
- **Exam with Fewer Available Questions than Requested**: If a student requests a custom exam of 50 questions for a subject that currently only contains 35 questions in its question bank, the configuration dialog MUST inform the user and automatically cap the maximum selectable questions to 35.
- **Rapid Navigation / Option Toggling**: Rapid clicking between questions or changing choices MUST NOT cause race conditions or inconsistent answer state in the question navigation list.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & User Profiles
- **FR-001**: The system MUST allow new users to register using an email address, password, and full name.
- **FR-002**: The system MUST authenticate returning users and issue a persistent session that survives browser refreshes.
- **FR-003**: The system MUST allow users to log out securely, clearing local session credentials.
- **FR-004**: The system MUST display the logged-in user's profile and overall academic statistics (exams taken, pass rate, average score, practice time).

#### Subject Exploration & Exam Catalog
- **FR-005**: The system MUST list all available academic subjects with their code, title, description, and total exam counts.
- **FR-006**: The system MUST display all standard pre-built exams categorized under a chosen subject, showing duration, total questions, and passing thresholds.
- **FR-007**: The system MUST allow students to launch standard curated practice exams.

#### Custom Exam Generation & Configuration
- **FR-008**: The system MUST provide a "Custom Practice Exam" generator on each subject's exam page that pulls random practice questions from the subject question bank.
- **FR-009**: The custom exam generator MUST allow users to configure:
  - Custom duration / time limit (in minutes, or untimed practice mode).
  - Total question count (selectable up to the maximum questions available in that subject's bank).
  - Feedback mode: "Instant Answer Feedback" vs. "Post-Exam Review".
  - Benchmark source: "Community Consensus" vs. "AI Key" (with automatic fallback to AI answer and an indicator badge if a question lacks community consensus data).
- **FR-010**: The system MUST prevent students from starting a new attempt if an active incomplete attempt on that exam is already in progress, offering a button to resume the existing session.
- **FR-010a**: If a student refreshes their browser, closes the tab, or temporarily navigates away from an active exam, the application MUST automatically re-attach to the ongoing attempt upon return, restore the exact remaining countdown time from the server, and pre-populate all previously recorded answer selections without data loss.

#### Question Page Architecture & Canvas (Matching Sketch)
- **FR-011**: The question page MUST follow the structural blueprint depicted in `/assets/question_ui.png`:
  - **Left Section**:
    - Top Bar: Progress bar visually tracking completed questions, and a live countdown Timer.
    - Central Main Canvas: High-resolution question image display with a header overlay displaying the question number and zoom percentage on the top-left, and the `question_type` badge ("Single Choice" or "Multiple Choice") on the top-right.
    - Bottom Toolbar: Image controls with "Zoom In", "Zoom Out", and "Original Size" reset.
  - **Right Sidebar**:
    - Header Box: Benchmark indicator/toggle ("Answers should follow commu or AI opt").
    - Top Sub-Box: Question List grid with completion indicator and pagination controls.
    - Middle Sub-Box: Question Choice panel containing option buttons from A to H (`A, B, C, D, E, F, G, H`), without any redundant detailed text list.
    - Bottom Action: "View AI Answers" button and interactive drawer.
- **FR-012**: The question image viewer MUST support smooth zooming and panning so that small formula details, subscripts, and geometric diagrams remain completely legible. The user's active zoom size and pan coordinates MUST be preserved and remain fixed across question navigation rather than resetting on every question switch.
- **FR-013**: The timer MUST update every second, turn yellow/red when remaining time drops below 5 minutes, and trigger automatic exam submission upon reaching zero.

#### Sidebar Question Navigation & Completion Rules
- **FR-014**: The Question List grid MUST display a numbered button for each question, visually differentiating:
  - Current active question (focused/highlighted).
  - Answered question (completed state).
  - Unanswered question (default state).
- **FR-015**: When an exam contains 25 or fewer questions (single-page capacity):
  - The completion box MUST expand to fill the entire horizontal width of the navigation footer.
  - The completion box MUST display in the format: `"Số câu đã làm: [X]/[Total]"` (e.g., `"Số câu đã làm: 12/25"`).
  - The pagination navigation buttons MUST be hidden.
- **FR-016**: When an exam contains more than 25 questions (multi-page capacity):
  - The question list grid MUST paginate in batches of 25 questions per page.
  - The completed questions box MUST display in the compact format: `"x/n"` (e.g., `"14/50"`).
  - The navigation footer MUST display a three-box control group: `[Current Page x/n]` (page indicator), `[Left]` (previous page button), and `[Right]` (next page button).
- **FR-017**: Clicking any question number button in the grid MUST immediately switch the main canvas and choices to that question.

#### Answer Selection & Feedback Modes
- **FR-018**: The Question Choice panel MUST display option buttons from A to H (`A, B, C, D, E, F, G, H`). The detailed question choice text list below the buttons MUST be omitted/deleted.
- **FR-019**: Question answer selection MUST adapt to question type:
  - For single-choice questions (`question_type === "single_choice"`), clicking an option selects that single choice, replacing any prior selection.
  - For multiple-choice questions (`question_type === "multiple_choice"`), clicking an option toggles that option into or out of the selected combination (e.g., selecting A, C, D produces "ACD"), allowing multiple active options to be highlighted simultaneously.
  - Selections MUST instantly update the Question List completion state for that question.
- **FR-020**: In "Instant Answer Feedback" mode:
  - For single-choice questions, selecting an answer immediately reveals whether the choice is correct or incorrect.
  - For multiple-choice questions, students can toggle multiple choices freely without premature incorrect penalties, and trigger a "Kiểm tra" (Check Answer) action to evaluate the combined selection against the target key.
  - The correct option(s) MUST be highlighted in accent green (`color-3`), and incorrect selection(s) MUST be highlighted in accent red (`color-4`).
  - Users MUST be permitted to change their answer selections freely to explore alternative options; the final recorded choices upon submission determine the score.
- **FR-021**: In "Post-Exam Review" mode:
  - Selecting an answer MUST only highlight the user's recorded selection without revealing correctness.
  - Correctness, score, and answer comparisons MUST remain hidden until the exam is explicitly submitted.

#### Persistent AI Answers Panel
- **FR-022**: The "View AI Answers" control MUST be clickable and accessible at all times on every question, opening as a clean, spacious centered modal dialog with backdrop, dismissible via Escape or close button, regardless of whether the exam is configured for instant feedback or post-exam review.
- **FR-023**: When opened, the AI Answers modal MUST immediately load and display the true AI choice, AI model, step-by-step reasoning, and option analysis without waiting for or requiring the user to choose an answer for the question first.
- **FR-024**: The AI Answers modal UI MUST follow a clean, spacious card architecture adhering to `DESIGN.md`:
  - A clean hero recommendation banner with generous padding, clearly displaying the AI choice and model name without visual crowding or extraneous pills.
  - Distinct cards for step-by-step explanation and option-by-option analysis with comfortable line-height and whitespace.
  - A clean dismiss action button.

#### Submission, Scoring & Review
- **FR-025**: The exam interface MUST provide a clear "Submit Exam" action with a confirmation dialog summarizing answered vs. unanswered questions.
- **FR-026**: Upon submission, the system MUST display a comprehensive results summary with total score, percentage, passing status (based on passing threshold, default 70%), total time spent, and a button to review all questions.
- **FR-027**: The review view MUST allow the student to step through all questions with their selected answer, the correct answer, the AI answer, and community voting statistics.

#### Design System & DESIGN.md Compliance
- **FR-028**: The visual interface MUST strictly use the tokens defined in `DESIGN.md`:
  - Colors: Text Primary (`color-1`: `#000000`), Background Dark (`color-2`: `#394DA2`), Accent Green (`color-3`: `#1D7F5B`), Accent Red (`color-4`: `#D65442`), Accent Amber (`color-5`: `#F5BE3F`), Text Light (`color-6`: `#F3F3F3`, `color-7`: `#FFFFFF`).
  - Spacing: Exclusively use the 8px grid scale (`space-1` through `space-10`).
  - Border Radius: Interactive buttons, pills, and chips MUST use `radius-full: 9999px`.
  - Typography: Font stack `__Space_Grotesk_8c5df3, ui-sans-serif` using levels `text-xs` through `text-3xl`.
  - Elevation: Offset shadow `shadow-sm: rgb(0, 0, 0) 4px 4px 0px 0px`.
  - Motion: Smooth transition using `duration-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1)`.
- **FR-029**: All interactive elements (buttons, inputs, choice cards) MUST define and visually reflect 8 complete states: default, hover, focus-visible, active, disabled, loading, error, and empty.
- **FR-030**: All interface copy MUST be written in sentence case (ALL CAPS strictly restricted to acronyms).

---

### Key Entities *(include if feature involves data)*

- **Learner Profile**: Represents the registered student, holding user identity, email, display name, account creation date, and aggregated learning statistics.
- **Subject**: Represents an academic domain (e.g., MAD101, NWC204, OSG202, PRO192), with course title, description, icon graphic, and list of available practice exams.
- **Exam**: Represents a curated or dynamically generated test specification, containing subject reference, title, duration in minutes, total questions count, passing threshold percentage, and question sequence.
- **Question**: Represents an individual test item, including question number/code, question text extracted, image diagram asset reference, question type (`single_choice` or `multiple_choice`), option choices (A through H), selected options string (e.g. "A" or "ACD"), correct answer key, and community statistics.
- **AI Solution**: Associated with a question, containing the recommended answer choice, the identifying AI model name/version, detailed step-by-step textual explanation, and option-by-option rejection rationale.
- **Exam Attempt**: Represents a student's active or finished practice session, containing start timestamp, expiration timestamp, completion status (in_progress vs. completed), recorded answers per question, duration spent, total score, percentage score, and pass/fail determination.
- **Practice Configuration**: User-selected session settings specifying whether the test is curated or dynamically generated, time limit, question count limit, feedback reveal mode (instant vs. post-exam), and answer benchmark (community vs. AI).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can register or log in and navigate to an active exam within 30 seconds of landing on the application.
- **SC-002**: Generating and loading a customized practice exam from the question bank completes in under 2 seconds.
- **SC-003**: In active exam mode, switching between questions or selecting answer choices responds instantaneously with no perceptible latency (<100ms visual update).
- **SC-004**: Question images render crisply, and image manipulation (Zoom In, Zoom Out, Reset Original) operates smoothly with zero layout disruption.
- **SC-005**: 100% of questions display the "View AI Answers" control, and opening the AI drawer loads the AI choice, AI model name, and step-by-step reasoning in under 500ms without interrupting test progress.
- **SC-006**: The Question List sidebar dynamically applies the exact requested layout rules: 100% width `"Số câu đã làm: x/total"` for single-page tests, and compact `"x/n"` with 3-box pagination navigation for multi-page tests with zero layout glitches.
- **SC-007**: 100% of visual elements, colors, paddings, and font sizes strictly conform to `DESIGN.md` design tokens with zero hardcoded values.
- **SC-008**: 95% of first-time test takers complete an entire practice session and successfully access their score review without requiring assistance.

---

## Assumptions

- **Backend Availability**: The application communicates with the existing backend running at `../fuo-learning-backend` (locally at `http://localhost:8787` or deployed edge environment), utilizing standard REST endpoints for authentication, subjects, exams, attempts, question banks, and reviews.
- **Question Media Hosting**: Question diagrams (`Q1.webp`, `Q2.webp`, etc.) are served from the static assets directory of the backend or equivalent media server; the frontend handles image loading states and fallback placeholders gracefully.
- **Single-Page Sidebar Question Threshold**: A standard single-page sidebar question list fits up to 25 question number buttons before triggering multi-page pagination controls (e.g. 5 columns by 5 rows of compact numbered buttons). Exams with 25 or fewer questions stay on a single page, paginating in batches of 25 questions per page for larger question sets (>25 questions).
- **Multiple-Choice vs Single-Choice**: Single-choice questions permit choosing one option from A through H; multiple-choice questions permit selecting and toggling multiple options (combinations among A-H, e.g. "ACD") before checking or submitting.
- **Bilingual Interface**: The core interface and completion status format follow the user's specific Vietnamese string requirement (`"Số câu đã làm"`), while instructional labels and AI explanations retain the subject's academic language (Vietnamese/English as provided by the question bank).
