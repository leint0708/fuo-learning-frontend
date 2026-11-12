# Bug Fix: Question image loading failure, pagination lock, and tight page box UI

- **Slug**: question-view-error
- **Fixed**: 2026-11-12T09:10:00+07:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Fixed question diagram 404 image errors by rewriting `/static/exams` in Vite proxy and stripping `/static/exams` when resolving against backend asset servers; resolved sidebar pagination lock by removing `activePage` from the reactive dependency array in `ExamWorkspaceView`; and added generous horizontal padding and `min-w-[76px]` to the `[x/n page]` indicator pill.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `vite.config.ts` | modified | Added `/static/exams` proxy rule rewriting `^/static/exams` to `""` so requests map directly to Worker Assets root |
| `src/utils/imageUrl.ts` | modified | Strips `/static/exams` when `baseUrl` is set so asset requests target `/${subjectCode}/...` directly |
| `src/features/exam/ExamWorkspaceView.tsx` | modified | Removed `activePage` from `useEffect` dependencies so clicking next/prev page is not reverted on render |
| `src/features/exam/QuestionListSidebar.tsx` | modified | Added `min-w-[76px] px-space-3 whitespace-nowrap text-[12px]` to page indicator pill |
| `tests/unit/imageUrl.test.ts` | modified | Added unit test verifying `/static/exams` stripping when `baseUrl` is set |
| `tests/components/QuestionListSidebar.test.tsx` | modified | Added assertions verifying `min-w-[76px]` and `px-space-3` on page indicator pill |

## Diff Highlights

```typescript
// vite.config.ts
proxy: {
  "/api": {
    target: "http://localhost:8787",
    changeOrigin: true
  },
  "/static/exams": {
    target: "http://localhost:8787",
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/static\/exams/, "")
  },
  "/static": {
    target: "http://localhost:8787",
    changeOrigin: true
  }
}
```

```tsx
// src/features/exam/ExamWorkspaceView.tsx
// Sync active page only when current question index changes
useEffect(() => {
  const expectedPage = Math.floor(currentQuestionIndex / 25) + 1;
  setActivePage(expectedPage);
}, [currentQuestionIndex, setActivePage]);
```

```tsx
// src/features/exam/QuestionListSidebar.tsx
<div className="h-10 min-w-[76px] px-space-3 bg-color-7 border-2 border-color-1 rounded-full flex items-center justify-center font-bold text-[12px] text-color-1 shadow-xs whitespace-nowrap">
  <span>
    {currentPage}/{totalPages} page
  </span>
</div>
```

## Tests Added or Updated

- `tests/unit/imageUrl.test.ts::prefixes API_BASE_URL to relative paths and maps /static/exams to root for Worker Assets` — Validates that relative static paths beginning with `/static/exams/` are correctly resolved without duplicating paths.
- `tests/components/QuestionListSidebar.test.tsx::renders 'x/n' and 3-box navigation when total questions > 25` — Validates that the page indicator element contains classes `min-w-[76px]` and `px-space-3`.

## Local Verification

- **HTTP Live Probe Verification**:
  - `GET http://127.0.0.1:5173/static/exams/MAD101/MAD101%20-%20FA25%20-%20FEB5/Q20.webp` → **HTTP 200 OK** (Length: 31,370 bytes, Content-Type: `image/webp`).
  - `GET http://127.0.0.1:5173/static/exams/MAD101/MAD101%20-%20FA25%20-%20FEB5/Q1.webp` → **HTTP 200 OK**.
- **Automated Test Suite**:
  - `npm run test` → 7 test files passed, 28 tests passed (0 failures).
- **Production Build**:
  - `npm run build` → Compiled with zero TypeScript diagnostics in 3.39s (`dist/` emitted).

## Deviations from Assessment

None. All changes matched the preferred remediation plan.

## Follow-ups

- None required.
