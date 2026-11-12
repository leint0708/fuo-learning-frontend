# Bug Fix: Question diagram image fails to load in exam workspace

- **Slug**: image-error
- **Fixed**: 2026-11-12T08:49:00+07:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Resolved the issue where question diagram images failed to load (or triggered the error fallback card) by introducing a centralized `resolveImageUrl` utility that resolves relative asset paths against `API_BASE_URL` with URI encoding, applying it across API adapters and components, and adding image error retry capability to `QuestionCanvas`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `src/utils/imageUrl.ts` | added | Centralized utility to resolve relative/absolute URLs with `API_BASE_URL` and URI encoding |
| `src/api/attempts.ts` | modified | Applied `resolveImageUrl` when mapping question `image_url` to `imageUrl` in attempt and review endpoints |
| `src/api/subjects.ts` | modified | Applied `resolveImageUrl` when mapping `icon_url` and drill question `image_url` |
| `src/features/exam/QuestionCanvas.tsx` | modified | Resolves image URL, displays error retry button ("Thử tải lại hình ảnh"), and resets loading state on retry |
| `src/features/review/QuestionReviewItem.tsx` | modified | Resolves image URL before rendering question diagram in review view |
| `tests/unit/imageUrl.test.ts` | added | 7 unit tests verifying null safety, absolute URLs, relative paths with/without `API_BASE_URL`, and special character encoding |
| `tests/components/QuestionCanvas.test.tsx` | modified | Added test for image error fallback display and retry button click action |
| `tests/integration/examReview.test.tsx` | modified | Added test for diagram image rendering with resolved URL |

## Diff Highlights

```typescript
// src/utils/imageUrl.ts
export function resolveImageUrl(
  url: string | null | undefined,
  baseUrl: string = API_BASE_URL
): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|blob:)/.test(trimmed)) {
    try { return encodeURI(decodeURI(trimmed)); } catch { return encodeURI(trimmed); }
  }
  const cleanBase = (baseUrl || "").replace(/\/+$/, "");
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const combined = cleanBase ? `${cleanBase}${normalizedPath}` : normalizedPath;
  try { return encodeURI(decodeURI(combined)); } catch { return encodeURI(combined); }
}
```

```tsx
// src/features/exam/QuestionCanvas.tsx
{imageError && (
  <div className="mt-space-4 flex flex-col items-center gap-space-2">
    <p className="text-text-xs text-color-4 font-semibold">
      Không thể tải sơ đồ/hình ảnh từ máy chủ.
    </p>
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        setImageError(false);
        setIsImageLoading(true);
      }}
      className="flex items-center gap-1.5"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      <span>Thử tải lại hình ảnh</span>
    </Button>
  </div>
)}
```

## Tests Added or Updated

- `tests/unit/imageUrl.test.ts::resolveImageUrl Utility` — 7 tests verifying null/empty handling, preservation of absolute URLs and data/blob URIs, prefixing of `API_BASE_URL` without double slashes, handling of URLs with spaces, and fallback when `baseUrl` is empty.
- `tests/components/QuestionCanvas.test.tsx::handles image load error and provides a retry mechanism` — Simulates image `onError` event, asserts error message and retry button display, and verifies clicking retry restores the image element.
- `tests/integration/examReview.test.tsx::renders question review item with diagram image using resolved URL` — Asserts that diagram images in review mode render with encoded, normalized URLs.

## Local Verification

- Commands run:
  - `npm run test` → 7 test files passed, 27 tests passed (0 failures).
  - `npm run build` → `tsc -b && vite build` succeeded in 3.55s with zero TypeScript diagnostics and emitted bundle in `dist/`.
- Manual checks:
  - Verified path resolution with whitespace: `/static/exams/MAD101 - FA25 - FEB5/Q1.webp` -> `/static/exams/MAD101%20-%20FA25%20-%20FEB5/Q1.webp`.
  - Verified no regression on existing auth, sidebar, modal, and review flows.

## Deviations from Assessment

None. The implementation followed the preferred remediation from the assessment.

## Follow-ups

- For the Cloudflare Worker backend (`fuo-learning-backend`), ensure `c.env.ASSETS` serves `./exams` under `/static/exams/*` route when requests are made directly to the worker domain.
