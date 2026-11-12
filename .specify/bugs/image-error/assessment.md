# Bug Assessment: Question diagram image fails to load in exam workspace

- **Slug**: image-error
- **Created**: 2026-11-12T08:44:00+07:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

"The question cannot be loaded."

## Symptom

When opening an exam attempt or question review, the question diagram/formula image fails to render, triggering the image `onError` handler and displaying the fallback card ("Nội dung câu hỏi chưa có hình ảnh sơ đồ"). Because the exam questions rely heavily on scanned diagrams and mathematical expressions, the question text alone is insufficient, preventing the user from reading and answering the question.

## Reproduction

1. Launch an exam session for a subject with visual questions (e.g., discrete mathematics `MAD101`).
2. Navigate to an exam question where `image_url` is provided as a relative static path (e.g. `/static/exams/MAD101/MAD101%20-%20FA25%20-%20FEB5/Q1.webp`).
3. In production or an environment where frontend and backend are hosted on separate origins (or `VITE_API_BASE_URL` points to remote API/Worker), observe that the browser requests the image from the frontend origin (e.g. `https://fuo-learning.pages.dev/static/...`) instead of the backend origin, returning HTTP 404 Not Found.
4. Observe that `QuestionCanvas.tsx` catches the image load error, flips `imageError` to `true`, and replaces the canvas diagram with an alert box stating "Nội dung câu hỏi chưa có hình ảnh sơ đồ" or a minimal placeholder, making the question unreadable.

## Suspected Code Paths

- `src/features/exam/QuestionCanvas.tsx:68-76` — Receives `imageUrl` and passes it directly to `<img src={imageUrl} />`. On network or 404 error, `onError` sets `imageError(true)`, replacing the diagram with a fallback text card without retry capability.
- `src/features/review/QuestionReviewItem.tsx:67-75` — Directly passes `item.imageUrl` into `<img src={item.imageUrl} />` without base URL resolution, causing broken images in the exam review view.
- `src/api/attempts.ts:58, 100, 202` — Deserializes `q.image_url` directly as `imageUrl` without normalizing relative `/static/...` URLs with `API_BASE_URL`.
- `src/api/subjects.ts:22, 42, 116` — Maps `icon_url` and `image_url` directly without URL resolution.
- `src/api/client.ts:13` — Defines `API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""`, but does not provide an image URL normalization helper.
- `vite.config.ts:20-23` — Defines a `/static` proxy to `http://localhost:8787` for Vite dev server, masking cross-origin issues during local development but failing in preview, production Cloudflare Pages, or custom backend host setups.
- `fuo-learning-backend/src/index.ts` & `wrangler.jsonc` — The backend stores exams in `./exams` but seeds paths as `/static/exams/...` and has no explicit Hono route handler or middleware for `/static/*`.

## Root Cause Hypothesis

High confidence: The frontend assumes `imageUrl` can be passed verbatim to HTML `<img>` elements without resolving relative paths against the backend origin (`API_BASE_URL`). When deployed across separate origins (e.g. Cloudflare Pages for the frontend and Cloudflare Workers for the backend), browser requests for `/static/exams/...` target the frontend origin where static exam image assets do not exist, resulting in HTTP 404 errors. When the `<img>` element fails to load, `QuestionCanvas.tsx` activates an error state that replaces the question graphic with an empty or generic fallback notice. Additionally, exam folder paths contain unencoded spaces and special characters (e.g. `MAD101 - FA25 - FEB5`) that require uniform URI encoding.

## Proposed Remediation

**Preferred**:
1. Implement a centralized utility `resolveImageUrl(url: string | null | undefined): string | null` in `src/utils/imageUrl.ts`:
   - Returns `null` if the input is null, undefined, or empty.
   - Returns absolute URLs (`http://`, `https://`, `data:`, `blob:`) unmodified.
   - For relative paths (starting with `/`), prefixes `API_BASE_URL` (handling any trailing slash discrepancies) so assets point directly to the active backend origin.
   - Safely encodes URI components if path segments contain unencoded whitespace or special characters.
2. Utilize `resolveImageUrl` in `src/api/attempts.ts` and `src/api/subjects.ts` during DTO mapping so all downstream components (`QuestionCanvas`, `QuestionReviewItem`, `SubjectCard`) receive clean, fully resolved asset URLs.
3. Enhance `QuestionCanvas.tsx` to provide a retry action ("Thử tải lại hình ảnh") and display clearer diagnostic information when an image fails to load.
4. Add comprehensive unit and integration tests covering URL resolution and component image error fallback states.

**Alternatives**:
- Alternative 1: Host all exam images on a dedicated CDN or Cloudflare R2 bucket with full public URLs stored in the database. Trade-off: Requires cloud infrastructure migration and updates to backend database seed data.
- Alternative 2: Embed question images as Base64 data URLs within API responses. Trade-off: Bloats JSON payload size by 33%+ and eliminates browser HTTP caching benefits for image assets.

**Files likely to change**:
- `src/utils/imageUrl.ts` (new)
- `src/api/attempts.ts`
- `src/api/subjects.ts`
- `src/features/exam/QuestionCanvas.tsx`
- `src/features/review/QuestionReviewItem.tsx`
- `tests/unit/imageUrl.test.ts` (new)
- `tests/components/QuestionCanvas.test.tsx`

**Tests to add or update**:
- `tests/unit/imageUrl.test.ts`: Test `resolveImageUrl` with null/undefined, relative paths with/without `API_BASE_URL`, absolute URLs, and URLs containing spaces or special characters.
- `tests/components/QuestionCanvas.test.tsx`: Test that `QuestionCanvas` renders the image with resolved URL, gracefully handles image error events, and allows retry.
- `tests/components/QuestionReviewItem.test.tsx`: Test that diagram images in review items render with resolved image URLs.

## Risks & Considerations

- Trailing slash formatting between `API_BASE_URL` and relative image paths (e.g., avoid double slashes like `https://api.example.com//static/...`).
- URL encoding idempotency: Avoid double-encoding already encoded path segments (e.g., `%20` becoming `%2520`).
- Local development proxy vs. production Pages domain: When `API_BASE_URL` is empty in local dev, paths starting with `/static` should still work seamlessly with the Vite dev proxy.

## Open Questions

- Should the backend also implement a static asset fallback middleware in `fuo-learning-backend/src/index.ts` to directly serve `./exams` via `c.env.ASSETS` for `/static/exams/*`?
