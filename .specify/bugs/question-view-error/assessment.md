# Bug Assessment: Question image loading failure, pagination lock, and tight page box UI

- **Slug**: question-view-error
- **Created**: 2026-11-12T09:06:00+07:00
- **Source**: pasted text and screenshots
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

"The image still cannot be loaded. In addtion, the question list cannot goto next page & the ui of x/n page box is tight"
User provided two screenshots:
1. `uploaded_media_0_1794449051668.png`: Demonstrates exam `MAD101 - FA25 - FEB5` Question 20 with fallback card "Không thể tải sơ đồ/hình ảnh từ máy chủ", active question 20 highlighted in sidebar grid 1–25, and pagination controls at the bottom.
2. `uploaded_media_1_1794449051668.png`: Highlights the bottom navigation bar showing tight text clipping inside the `[1/2 page]` pill where the text collides with the pill's curved border.

## Symptom

1. **Image Load Failure**: When viewing question diagrams (e.g. Question 20 in `MAD101 - FA25 - FEB5`), the image returns HTTP 404, triggering `onError` in `QuestionCanvas.tsx` and displaying the error fallback card.
2. **Pagination Lock**: Clicking the `>` (next page) button in the Question List sidebar fails to switch the view to Page 2 (questions 26–50); the UI remains stuck on Page 1.
3. **Tight Pill UI**: The `[x/n page]` indicator pill in the sidebar bottom bar has insufficient horizontal padding for its text content, causing "1/2 page" to collide with the curved borders.

## Reproduction

1. Open `http://localhost:5173` and launch exam `MAD101 - FA25 - FEB5` (50 questions).
2. **Issue 1 (Image 404)**: Observe Question 20. The browser issues `GET /static/exams/MAD101/MAD101%20-%20FA25%20-%20FEB5/Q20.webp`. The local backend returns HTTP 404 because Cloudflare Workers Assets serves `./exams` at the root path (`/MAD101/...`), not under `/static/exams/`.
3. **Issue 2 (Pagination Lock)**: With Question 20 active, click the `>` (next page) button in the Question List sidebar. Observe that the grid remains on Page 1 (questions 1–25) and does not display questions 26–50.
4. **Issue 3 (Tight UI)**: Inspect the `[1/2 page]` indicator pill in the sidebar bottom bar. Observe that `1/2 page` is tightly pressed against the curved border.

## Suspected Code Paths

- `src/utils/imageUrl.ts:38-42` — Resolves relative paths preserving `/static/exams/...`. However, Cloudflare Workers Assets mounts `./exams` directly at the root, meaning assets exist at `/${subjectCode}/${examDir}/${file}` (HTTP 200), whereas `/static/exams/...` returns HTTP 404.
- `vite.config.ts:20-24` — Proxies `/static` to `http://localhost:8787` without rewriting `/static/exams` to `/`.
- `src/features/exam/ExamWorkspaceView.tsx:112-117` — Defines a `useEffect` that synchronizes `activePage` with `currentQuestionIndex` and includes `activePage` in its dependency array:
  ```tsx
  useEffect(() => {
    const expectedPage = Math.floor(currentQuestionIndex / 25) + 1;
    if (activePage !== expectedPage) {
      setActivePage(expectedPage);
    }
  }, [currentQuestionIndex, setActivePage, activePage]);
  ```
  When the user clicks `nextPage`, `activePage` changes from `1` to `2`. Because `currentQuestionIndex` is still 19 (Question 20 on page 1) and `activePage` is a dependency, the effect executes on re-render, detects `2 !== 1`, and immediately resets `activePage` back to `1`.
- `src/features/exam/QuestionListSidebar.tsx:116-120` — The page indicator pill uses `h-10 px-space-2.5 rounded-full text-[13px]`. The 10px padding is too narrow for a 40px tall pill, causing the text to touch the curved edges.

## Root Cause Hypothesis

High confidence:
1. **Asset Routing Mismatch**: The backend Cloudflare Workers Assets configuration (`wrangler.jsonc`) maps `./exams` directly to the root URL `/`, serving files at `http://localhost:8787/MAD101/...` (verified HTTP 200). However, database records and frontend URLs use `/static/exams/MAD101/...` (verified HTTP 404). Frontend URL resolution must normalize `/static/exams/` to the actual server asset route and configure Vite proxy rewrite accordingly.
2. **Reactive Feedback Loop in Pagination**: `ExamWorkspaceView.tsx` includes `activePage` in the dependency array of its page-synchronization effect. Clicking `nextPage` triggers a re-render where the effect immediately reverts `activePage` to the page containing `currentQuestionIndex`, locking pagination.
3. **Cramped CSS Box Sizing**: `QuestionListSidebar.tsx` sets `px-space-2.5` (`10px`) on a `rounded-full` pill with height `h-10` (`40px`), which does not leave adequate horizontal clearance for the 8-character string `1/2 page`.

## Proposed Remediation

**Preferred**:
1. **Asset URL Normalization**:
   - In `src/utils/imageUrl.ts`, normalize paths starting with `/static/exams/` by mapping them to `/${pathWithoutStaticExams}` when resolving against `API_BASE_URL` (or when `baseUrl` is set).
   - In `vite.config.ts`, add a proxy rule for `/static/exams` that rewrites `^/static/exams` to `""` so requests from local dev server proxy cleanly to `http://localhost:8787/${subjectCode}/...`.
2. **Decouple Page Browsing from Question Index**:
   - In `src/features/exam/ExamWorkspaceView.tsx`, remove `activePage` from the dependency array of the sync effect so that it only fires when `currentQuestionIndex` changes:
     ```tsx
     useEffect(() => {
       const pageForQuestion = Math.floor(currentQuestionIndex / 25) + 1;
       setActivePage(pageForQuestion);
     }, [currentQuestionIndex, setActivePage]);
     ```
   - This allows users to freely browse pages via the pagination controls without being snapped back to the active question's page.
3. **Adjust Sidebar Page Indicator Pill Styling**:
   - In `src/features/exam/QuestionListSidebar.tsx`, style the page indicator pill with `min-w-[76px] px-space-3.5 text-text-xs font-bold whitespace-nowrap` to ensure ample visual padding and prevent text clipping on all pagination states (`1/2 page`, `2/3 page`, etc.).
4. **Update Test Suites**:
   - Update `tests/unit/imageUrl.test.ts` to test `/static/exams` path rewriting.
   - Update `tests/components/QuestionListSidebar.test.tsx` to verify page pill sizing and styling.
   - Add integration test in `tests/integration/examPagination.test.tsx` verifying that clicking `nextPage` persists `activePage = 2` without resetting.

**Alternatives**:
- In the backend (`fuo-learning-backend/src/index.ts`), add a route `app.get("/static/exams/*", ...)` that rewrites and proxies to `c.env.ASSETS`. (Can be done as an additional server-side defense).

**Files likely to change**:
- `src/utils/imageUrl.ts`
- `vite.config.ts`
- `src/features/exam/ExamWorkspaceView.tsx`
- `src/features/exam/QuestionListSidebar.tsx`
- `tests/unit/imageUrl.test.ts`
- `tests/components/QuestionListSidebar.test.tsx`

**Tests to add or update**:
- `tests/unit/imageUrl.test.ts`: Verify `/static/exams/` stripping/mapping.
- `tests/components/QuestionListSidebar.test.tsx`: Verify page pill layout and classes.

## Risks & Considerations

- Ensure `resolveImageUrl` continues to support absolute external URLs (e.g. AWS S3/R2) without unwanted rewriting.
- Ensure Vite dev proxy handles both `/static` and `/static/exams` smoothly without interfering with other endpoints.

## Open Questions

- None. Both the root causes and reproduction mechanisms have been verified through direct HTTP probes against the running local worker and code analysis.
