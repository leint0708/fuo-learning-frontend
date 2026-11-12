# Quickstart & Verification Guide: Exam Practice Platform

**Feature**: `001-exam-practice-app` | **Date**: 2026-11-12

This guide outlines prerequisites, environment configuration, local development commands, and runnable end-to-end verification workflows.

---

## 1. Prerequisites

- **Node.js**: `v20.x` or `v22.x` LTS
- **Package Manager**: `npm` (v10+)
- **Backend Service**: `fuo-learning-backend` running on `http://localhost:8787` (via Cloudflare Wrangler dev)
- **Deployment Tool**: Wrangler CLI (`npm install -g wrangler` or via `npx wrangler`)

---

## 2. Setup & Environment Configuration

### Step 2.1: Initialize Frontend App
In `D:\FUO\fuo-learning-frontend`:
```powershell
# Install project dependencies
npm install
```

### Step 2.2: Environment Variables
Create `.env.local` in project root:
```env
VITE_API_BASE_URL=http://localhost:8787
```

For production deployment on Cloudflare Pages:
```env
VITE_API_BASE_URL=https://fuo-learning-backend.workers.dev
```

---

## 3. Development & Testing Commands

| Command | Action | Expected Output |
|---|---|---|
| `npm run dev` | Starts Vite local dev server | Server accessible at `http://localhost:5173` |
| `npm run build` | Compiles production assets | Emits optimized bundle into `dist/` |
| `npm run preview` | Previews production build locally | Serves `dist/` on local port |
| `npm run test` | Executes Vitest test suite | 100% unit and component test suites passing |
| `npm run lint` | Runs ESLint and TypeScript check | Zero errors, zero warnings |

---

## 4. End-to-End Verification Scenarios

### Scenario A: Learner Authentication Flow
1. Open `http://localhost:5173/register`.
2. Input: Name `"Nguyen Van A"`, Email `"test@fpt.edu.vn"`, Password `"Password123"`.
3. Click "Sign Up".
4. **Verification**: User is redirected to `/` (Dashboard), JWT token is stored in `localStorage`, and header displays learner's name.

### Scenario B: Custom Exam Configuration & Instant Feedback
1. From Dashboard, select subject `"MAD101"` -> navigates to `/subjects/MAD101`.
2. Click `"Luyện đề tùy chọn"` (Custom Practice Exam).
3. Set:
   - Total Questions: `20`
   - Time Limit: `30 minutes`
   - Feedback Mode: `Instant Answer Feedback`
4. Click `"Bắt đầu làm bài"`.
5. **Verification**:
   - Exam loads with 20 questions.
   - Left canvas shows Question 1 diagram with zoom controls.
   - Right sidebar shows question grid 1 to 20.
   - Bottom bar shows full-width `"Số câu đã làm: 0/20"` (single-page mode, because total ≤ 25).
   - Click option `C`: Answer immediately highlights green (if correct) or red (if incorrect), and allows re-selection.

### Scenario C: Multi-Page Sidebar Pagination & AI Answers Modal
1. Launch an exam containing `60` questions (or topical drill of 60 questions).
2. **Verification**:
   - Question list splits into 3 pages (25 on Page 1, 25 on Page 2, 10 on Page 3).
   - Bottom bar displays compact completion box `"x/60"` on the left.
   - 3-box navigation control appears: `[Page 1/3]`, `[< disabled]`, `[> enabled]`.
   - Clicking `[>]` switches the grid to questions 26-50.
3. Click `"View AI Answers"` button at bottom right:
   - **Verification**: Centered modal dialog opens with backdrop.
   - Displays real AI Choice (e.g. `C`), AI Model (`gemini-3-flash-preview`), and full step-by-step reasoning immediately, even when no user option was clicked yet.
   - Clean, spacious visual layout with generous padding (`p-space-6`) and zero overlapping pills.
   - Pressing `Escape` closes the modal without affecting the active question or timer.

### Scenario D: Exam Submission & Score Review
1. Answer questions and click `"Submit Exam"`.
2. Confirm submission in dialog.
3. **Verification**:
   - Redirects to `/attempts/:id/review`.
   - Score card displays total score (e.g. `8.4 / 10.0`), percentage (`84%`), and passing badge (`Passed`).
   - Detailed review list displays user answer vs. correct answer vs. AI solution.

### Scenario E: Choices A Through H & Redundant Detail Removal
1. Navigate to any exam question.
2. In the "Questions Choice" card in the sidebar:
   - **Verification**: Choice buttons A through H (`A, B, C, D, E, F, G, H`) are cleanly rendered in an accessible grid.
   - The redundant textual list below the buttons is eliminated.

### Scenario F: Zoom & Pan Persistence Across Questions
1. On Question 1, click "Zoom in" twice (scale to 150%) and drag the diagram slightly.
2. Click "Question 2" in the sidebar grid.
3. **Verification**: The image in Question 2 maintains the 150% zoom scale and pan position rather than resetting back to default fit.

### Scenario G: Question Type Badge & Multiple-Choice Toggling
1. View a question in the canvas.
2. **Verification**:
   - The top-left tag displays `Câu {N} ({Zoom}%)`.
   - The top-right badge displays the question type (`Single Choice` or `Multiple Choice`).
3. On a multiple-choice question:
   - Clicking option A highlights A.
   - Clicking option C highlights C as well (both A and C remain selected: "AC").
   - In Instant Feedback mode, click "Kiểm tra" to validate the combined selection against the answer key without premature failure penalties.

---

## 5. Cloudflare Pages Deployment Verification

```powershell
# Build the production bundle
npm run build

# Deploy directly to Cloudflare Pages
npx wrangler pages deploy dist --project-name=fuo-learning-frontend
```

**Verification**:
- Access the generated `*.pages.dev` URL.
- Refreshing `/subjects/MAD101` or `/attempts/123` does not return a 404 error (verified via `_redirects` SPA rewrite).
