# Phase 0 Research: Exam Practice Platform

**Feature**: `001-exam-practice-app` | **Date**: 2026-11-12

## 1. Core Framework & Build Tool

### Decision
Adopt **Vite 6 + React 19 + TypeScript (Strict Mode)**.

### Rationale
- **Popularity & Ecosystem**: React is the industry-standard frontend library with the widest availability of community components, testing utilities, and developer tooling.
- **Fast Build & Developer Experience**: Vite offers instant Hot Module Replacement (HMR) and optimized Rollup-based production builds (`dist/`).
- **Cloudflare Pages Compatibility**: Emits standard static Single Page Application (SPA) assets (`index.html`, hashed JS/CSS, images) without requiring Node.js server runtimes, matching Cloudflare Pages' global CDN edge deployment.
- **Constitution Alignment**: Strict TypeScript enforces zero `any`, strict null checks, and interface contracts, satisfying Principle I.

### Alternatives Considered
- **Next.js (App Router)**: While powerful, deploying Next.js to Cloudflare requires `@cloudflare/next-on-pages` or OpenNext adapters, which frequently run into Node.js edge runtime compatibility barriers and cold start overhead.
- **Astro**: Optimized for static content/blogs rather than complex, highly interactive single-page exam engines with persistent client-side state and live timers.
- **SvelteKit / Vue**: Capable, but React has the largest ecosystem and best alignment with the project's design system guidelines and component patterns.

---

## 2. Cloudflare Deployment Architecture

### Decision
Deploy on **Cloudflare Pages** with `_redirects` SPA fallback and Wrangler CLI automation.

### Rationale
- **Global Edge Performance**: Static assets are served from 300+ Cloudflare edge data centers with HTTP/3, TLS 1.3, and automatic Brotli compression.
- **SPA Routing**: Single-page application route fallback is handled by adding a simple `public/_redirects` file:
  ```text
  /*    /index.html   200
  ```
- **Wrangler Integration**: Direct preview and production deployments via `wrangler pages deploy dist --project-name=fuo-learning-frontend`.
- **CORS & API Proxy**: Cloudflare Pages can seamlessly communicate with the existing Cloudflare Workers backend at `https://fuo-learning-backend.workers.dev` (or local `http://localhost:8787` in dev mode via Vite proxy).

### Alternatives Considered
- **Cloudflare Workers with Static Assets**: Adds unnecessary worker script routing overhead for what is fundamentally a rich client-side SPA.
- **Traditional Cloud Storage (AWS S3 + CloudFront)**: Extra infrastructure management and cost compared to Cloudflare's free/included high-bandwidth Pages tier.

---

## 3. Styling & DESIGN.md Token Enforcement

### Decision
Adopt **Tailwind CSS v4** combined with semantic CSS variables mapped strictly to the tokens in [`DESIGN.md`](file:///D:/FUO/fuo-learning-frontend/DESIGN.md).

### Rationale
- **Token Pinning**: CSS variables are declared in `:root` and extended in `tailwind.config.ts`:
  - Colors: `color-1` (`#000000`), `color-2` (`#394DA2`), `color-3` (`#1D7F5B`), `color-4` (`#D65442`), `color-5` (`#F5BE3F`), `color-6` (`#F3F3F3`), `color-7` (`#FFFFFF`).
  - Spacing Scale: `space-1` (8px), `space-2` (16px), `space-3` (20px), `space-4` (24px), `space-5` (32px), `space-6` (56px), `space-7` (80px), `space-8` (259px), `space-9` (399px), `space-10` (719px).
  - Radius: `radius-full` (`9999px`) for pill buttons and chips.
  - Typography: `__Space_Grotesk_8c5df3, ui-sans-serif` font family across levels `text-xs` (16px) to `text-3xl` (72px).
  - Elevation: `shadow-sm: rgb(0, 0, 0) 4px 4px 0px 0px`.
- **Zero Arbitrary Styles**: Prohibits arbitrary Tailwind classes (e.g., `text-[#123456]` or `p-[13px]`) through ESLint rules, enforcing Constitution Principle IV.
- **Interactive State Completeness**: Tailwind makes it trivial to explicitly define the 8 mandatory states (`default:`, `hover:`, `focus-visible:`, `active:`, `disabled:`, etc.).

### Alternatives Considered
- **CSS Modules / Pure CSS**: Lacks built-in token constraints and requires verbose custom boilerplate for hover/focus/active state matrices.
- **Styled Components / Emotion**: Runtime CSS-in-JS adds unnecessary runtime bundle size and performance overhead.

---

## 4. State Management & Server Synchronization

### Decision
Adopt **TanStack Query (React Query v5)** for asynchronous server state + **Zustand** for local interactive exam session state.

### Rationale
- **Server State (TanStack Query)**:
  - Manages subject catalogs, exams, ongoing attempt queries, question banks, and answer persistence mutations.
  - Automatic caching, query invalidation (e.g. invalidating stats after submit), and optimistic updates.
  - Automatic background retries and reconnect detection.
- **Client Session State (Zustand)**:
  - Lightweight store (<1kB) managing:
    - Active question index (`currentQuestionIndex`).
    - Local answer buffer (optimistic selections before server sync).
    - Canvas zoom/pan scale (`zoomLevel`, `panOffset`).
    - Modal visibility (`isAiModalOpen`, `isSubmitModalOpen`).
    - Active benchmark preference (`benchmarkMode`: `'ai'` | `'community'`).
  - Avoids re-rendering the entire view tree on high-frequency events (such as timer ticks or image pan gestures).

### Alternatives Considered
- **Redux Toolkit**: Over-engineered and boilerplate-heavy for an exam practice application.
- **React Context Alone**: Causes cascading re-renders across the question canvas whenever the countdown timer or answer state updates.

---

## 5. Client Routing & Navigation

### Decision
Adopt **React Router v7 / v6** with declarative route layout and auth loaders.

### Rationale
- Standard, battle-tested route tree:
  - `/` -> Subject Explorer & Dashboard (protected)
  - `/login` & `/register` -> Authentication Screens (public / redirect if logged in)
  - `/subjects/:code` -> Subject Details, Exams List, and Custom Exam Generator (protected)
  - `/exams/:examId/start` -> Exam Configuration & Pre-test Briefing (protected)
  - `/attempts/:attemptId` -> Active Exam Workspace (Sketch layout) (protected)
  - `/attempts/:attemptId/review` -> Post-Exam Scoring & Question Review (protected)
  - `/profile` -> User Profile & Aggregate Practice Statistics (protected)
- Supports route guards (`<ProtectedRoute>`), scroll restoration, and nested layout wrappers (Navbar, Main Content, Modals).

---

## 6. Question Canvas Zoom & Pan Handling

### Decision
Adopt a dedicated, lightweight **`useZoomPan` custom hook** leveraging standard CSS transforms (`scale()`, `translate3d()`) with boundary constraints.

### Rationale
- Zero heavy dependencies (under 50 lines of pure React/TypeScript logic).
- Handles user controls directly:
  - Zoom In: Increments scale by `+0.25x` (max `3.0x`).
  - Zoom Out: Decrements scale by `-0.25x` (min `0.5x`).
  - Reset to Original: Instantly resets scale to `1.0x` and position to `(0, 0)`.
- Smooth GPU-accelerated CSS transitions without redrawing canvas buffers or losing image resolution.

### Alternatives Considered
- **Fabric.js**: Massive canvas manipulation engine intended for graphic editors, totally unnecessary for inspecting question images.
- **OpenSeadragon**: Designed for gigapixel medical/astronomical tile sets, adds too much weight for simple webp exam diagrams.

---

## 7. Testing & Quality Assurance

### Decision
Adopt **Vitest + React Testing Library + MSW (Mock Service Worker)**.

### Rationale
- **Vitest**: Runs natively on the Vite dev environment with identical TS/path aliases, executing tests 10x faster than Jest.
- **React Testing Library**: Ensures tests focus on accessible user interactions (clicking choices, modal opening, keyboard navigation), enforcing WCAG AA compliance.
- **MSW**: Intercepts HTTP requests at the network layer according to OpenAPI specs (`http://localhost:8787`), validating API integration without requiring live backend processes in continuous integration pipelines.
- Satisfies Constitution Principle II (Multi-tier testing, unit tests, component tests, contract tests).

---

## 8. Workspace Interaction & UI Refinements

### 8.1 Choice Buttons A through H & Detail List Removal
- **Decision**: Render choice buttons for options A through H (`['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']`) in a responsive grid in the Questions Choice panel, and completely remove the detailed textual options list below the buttons.
- **Rationale**: Question diagrams in FUO already contain the question statement and detailed answer choices visually inside the image. Duplicating the textual option list below creates clutter and wastes screen height. Expanding the buttons to A through H covers questions with up to 8 choices cleanly.
- **Alternatives Considered**: Dynamically rendering only options present in the database `options` object; discarded because some OCR-scanned questions contain options A through H in the image while the backend options dictionary is incomplete.

### 8.2 Canvas Zoom & Pan Persistence Across Questions
- **Decision**: Persist `zoomLevel` and `panOffset` in the active workspace session (via state or store) across question transitions rather than resetting to `1.0x` and `(0, 0)` on each question switch.
- **Rationale**: Resetting zoom forces learners to repeatedly click "Zoom In" and adjust positions for every single question when inspecting fine math subscripts and diagrams. Preserving the user's last chosen zoom level creates a smooth, frictionless reading flow.
- **Alternatives Considered**: Storing zoom per question; discarded as learners typically establish a preferred viewing scale for their monitor/device and want it applied across all questions.

### 8.3 Question Type Badge in Question Image Canvas
- **Decision**: Display a dedicated badge at the top-right corner of the Question Image canvas (opposite the question number and zoom scale tag at the top-left), displaying `"Single Choice"` (or `"Một đáp án"`) vs. `"Multiple Choice"` (or `"Nhiều đáp án"`).
- **Rationale**: Gives learners immediate clarity on whether the problem allows one or multiple selections before they begin answering.
- **Alternatives Considered**: Inlining the type inside the question number tag; discarded to prevent wide, cramped pills and maintain balanced visual weight across the canvas header.

### 8.4 Multiple-Choice Question Toggling & Instant Feedback Checking
- **Decision**:
  - Single-choice: Clicking an option selects it (replacing prior selection).
  - Multiple-choice: Clicking options toggles them into/out of the selection set (e.g., clicking A then C then D yields `"ACD"`).
  - Instant Feedback: For multiple-choice questions, provide a dedicated "Kiểm tra" (Check Answer) button in instant feedback mode so students can toggle all desired options before checking, preventing premature incorrect penalties on their first click.
- **Rationale**: Prevents premature penalty where clicking option "A" on an "ACD" question would immediately show "Sai (Đáp án: ACD)" before the user could click C and D.
- **Alternatives Considered**: Immediate evaluation on every toggle click; discarded because partial correct selections would be marked incorrect while still answering.

### 8.5 Eager AI Explanation Pre-fetching & Clean Modal Hierarchy
- **Decision**: Pre-fetch or query AI explanations eagerly via `checkInstantAnswer(questionId, "")` upon mounting a question or opening the AI modal so the actual AI choice, model, and reasoning are always available immediately. Restructure [`AiAnswerModal.tsx`](file:///D:/FUO/fuo-learning-frontend/src/features/exam/AiAnswerModal.tsx) with generous padding (`p-space-6`), distinct cards, and clear typography without cramped pill overlapping.
- **Rationale**: Students should be able to consult the AI's explanation and answer key at any time, even before submitting their own guess. Generous padding adheres strictly to [`DESIGN.md`](file:///D:/FUO/fuo-learning-frontend/DESIGN.md).
