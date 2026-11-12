# Implementation Plan: Exam Practice Platform

**Branch**: `001-exam-practice-app` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from [`specs/001-exam-practice-app/spec.md`](./spec.md)

## Summary

Build and deploy a modern, high-performance web-based exam practice application powered by the existing Cloudflare Workers backend (`fuo-learning-backend`). The application provides learner authentication, dynamic practice exam generation from the course question bank with custom time and question settings, instant versus post-exam feedback modes, and an interactive question workspace faithful to the `/assets/question_ui.png` sketch with persistent zoom controls, adaptive single/multi-page sidebar navigation (fixed 25 questions per page), choice buttons from A through H with multi-choice toggling, a dedicated question type badge on the canvas header, and a persistent, clean, and spacious AI answer & explanation modal with eager loading.

The application is built as a Single Page Application (SPA) using **React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query + Zustand**, strictly adhering to [`DESIGN.md`](file:///D:/FUO/fuo-learning-frontend/DESIGN.md) design tokens and deployed to **Cloudflare Pages**.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+ LTS

**Primary Dependencies**:
- Core: `react`, `react-dom`, `vite`
- Routing: `react-router` (v7 / v6)
- State & Data Fetching: `@tanstack/react-query`, `zustand`
- Styling: `tailwindcss` (customized strictly with `DESIGN.md` tokens)
- Icons & Utilities: `lucide-react`, `clsx`, `tailwind-merge`

**Storage**:
- Client: Browser `localStorage` for JWT authentication token and user preferences
- Server: SQLite / D1 database (managed by `fuo-learning-backend`)

**Testing**:
- Test Runner: `vitest`
- Component Testing: `@testing-library/react`, `@testing-library/user-event`
- API Mocking: `msw` (Mock Service Worker)

**Target Platform**: Modern desktop and mobile web browsers, deployed globally on **Cloudflare Pages** with `_redirects` SPA rewrite.

**Project Type**: Web Application (Single Page Application SPA)

**Performance Goals**:
- Initial page load < 1.5s on Cloudflare Edge CDN
- Question switching and choice selection latency < 50ms
- Smooth 60fps GPU-accelerated canvas zooming and panning

**Constraints**:
- Absolute adherence to `DESIGN.md` tokens (zero arbitrary colors or spacings)
- WCAG AA accessibility compliance (3:1 contrast focus rings, full keyboard navigation)
- Explicit implementation of all 8 interactive component states

**Scale/Scope**:
- 4 academic courses (MAD101, NWC204, OSG202, PRO192)
- 200+ question bank items with images and AI explanations
- 12+ UI views and reusable component primitives

---

## Constitution Check

*GATE: Evaluated against `.specify/memory/constitution.md`*

| Principle / Gate | Requirement | Evaluation | Status |
|---|---|---|:---:|
| **Principle I: Code Quality & Type Discipline** | Strict TypeScript, zero `any`, automated lint/formatting, pure logic | TypeScript strict mode enforced in `tsconfig.json`, zero `any` policy, ESLint + Prettier config | **PASS** |
| **Principle II: Multi-Tier Testing & Verification** | Unit, component, and contract testing with regression protection | Vitest for unit logic, React Testing Library for components, MSW for API contracts | **PASS** |
| **Principle III: Maintainability & Component Modularity** | Single Responsibility Principle, components <250 lines, views separated from hooks | Feature-based modular structure; dedicated custom hooks (`useZoomPan`, `useTimer`); separate presentation components | **PASS** |
| **Principle IV: Token-Driven UI/UX & DESIGN.md Compliance** | Strict token pinning (`color-1` to `color-7`, `space-1` to `space-10`, `radius-full: 9999px`) | Tailwind theme configured exclusively with `DESIGN.md` tokens; zero arbitrary CSS | **PASS** |
| **Principle V: Accessibility & State Completeness** | 8 interactive states, WCAG AA contrast, keyboard navigation | All interactive components define default, hover, focus-visible, active, disabled, loading, error, empty | **PASS** |
| **Gate 1: Static Analysis Gate** | Zero `tsc --noEmit` errors and zero linter warnings | Enforced via pre-commit and build scripts | **PASS** |
| **Gate 2: Automated Test Execution Gate** | 100% test pass rate in CI | Test suite automated in `npm run test` | **PASS** |
| **Gate 3: Token Audit Gate** | Zero hardcoded hex colors or arbitrary pixel margins | Tailwind lint rules prohibit raw values | **PASS** |
| **Gate 4: Interaction & State Audit** | Visual verification of all 8 states | Component test matrices verify states | **PASS** |
| **Gate 5: Keyboard & Accessibility Gate** | Tab/Enter/Arrow navigation works without pointer | Native keyboard handlers and accessible ARIA attributes | **PASS** |
| **Gate 6: Responsive Viewport Check** | Verified at mobile (375px) and desktop (1440px) | Tested across viewports with adaptive sidebar | **PASS** |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-exam-practice-app/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output: Tech stack & architectural decisions
├── data-model.md        # Phase 1 output: Domain models & state transitions
├── quickstart.md        # Phase 1 output: Setup & verification guide
├── contracts/           # Phase 1 output: API and component contracts
│   ├── api-client-contract.md
│   └── component-contracts.md
└── tasks.md             # Phase 2 output (/speckit-tasks output)
```

### Source Code Layout

```text
fuo-learning-frontend/
├── public/
│   ├── _redirects               # Cloudflare Pages SPA rewrite rule
│   └── favicon.ico
├── src/
│   ├── api/                     # Backend API client & fetch wrappers
│   │   ├── client.ts            # Typed HTTP client with auth interceptor
│   │   ├── auth.ts              # Login, register, me endpoints
│   │   ├── subjects.ts          # Subjects and exam listings
│   │   ├── attempts.ts          # Attempt creation, sync, submit, review
│   │   └── questions.ts         # Topical drills & instant checking
│   ├── components/              # Shared UI design system primitives (DESIGN.md)
│   │   ├── ui/
│   │   │   ├── Button.tsx       # Pill button (radius-full) with 8 states
│   │   │   ├── Card.tsx         # Card container with shadow-sm
│   │   │   ├── Modal.tsx        # Centered backdrop modal dialog
│   │   │   ├── ProgressBar.tsx  # Dynamic test progress bar
│   │   │   ├── Timer.tsx        # Monospace countdown clock
│   │   │   └── Badge.tsx        # Pill indicator badge
│   │   └── layout/
│   │       ├── Navbar.tsx       # Top navigation & user profile menu
│   │       └── Footer.tsx       # Standard page footer
│   ├── features/                # Feature modules
│   │   ├── auth/                # Login & Registration views & forms
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── subjects/            # Subject catalog & custom exam generator
│   │   │   ├── SubjectCard.tsx
│   │   │   ├── SubjectDetailView.tsx
│   │   │   └── CustomExamModal.tsx
│   │   ├── exam/                # Question workspace (sketch layout)
│   │   │   ├── ExamWorkspaceView.tsx
│   │   │   ├── QuestionCanvas.tsx
│   │   │   ├── QuestionListSidebar.tsx
│   │   │   ├── QuestionChoicePanel.tsx
│   │   │   ├── AiAnswerModal.tsx
│   │   │   └── SubmitConfirmModal.tsx
│   │   └── review/              # Post-exam scoring & detailed review
│   │       ├── ResultScoreCard.tsx
│   │       └── QuestionReviewItem.tsx
│   ├── hooks/                   # Custom reusable hooks
│   │   ├── useAuth.ts           # Authentication session hook
│   │   ├── useZoomPan.ts        # GPU-accelerated canvas pan/zoom
│   │   ├── useExamTimer.ts      # Countdown timer with warning & auto-submit
│   │   └── useExamSession.ts    # TanStack Query + Zustand integration
│   ├── stores/                  # Zustand global UI stores
│   │   ├── authStore.ts         # Token and profile state
│   │   └── examUiStore.ts       # Active question, zoom, modal states
│   ├── types/                   # Shared TypeScript interfaces (data-model)
│   │   ├── auth.ts
│   │   ├── catalog.ts
│   │   ├── exam.ts
│   │   └── review.ts
│   ├── styles/                  # Tailwind & DESIGN.md token mappings
│   │   └── tokens.css           # CSS variables (:root)
│   ├── App.tsx                  # Root component & Route configuration
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles & font imports
├── tests/                       # Automated test suites
│   ├── unit/                    # Unit tests for hooks and utility functions
│   ├── components/              # Component rendering & interaction tests
│   └── mocks/                   # MSW server and mock handlers
├── .env.example                 # Environment template
├── index.html                   # HTML entry point with Space Grotesk font
├── package.json                 # Project dependencies & scripts
├── tailwind.config.ts           # Tailwind configuration with DESIGN.md tokens
├── tsconfig.json                # TypeScript strict configuration
└── vite.config.ts               # Vite configuration with proxy settings
```

**Structure Decision**: A feature-driven single project web application structure (`features/`, `components/`, `api/`, `hooks/`, `stores/`) is chosen. This cleanly separates domain logic, isolates UI components to maintain Single Responsibility Principle (<250 lines per file), and enables simple static SPA output to Cloudflare Pages.

---

## Complexity Tracking

*No constitutional violations identified. Design conforms strictly to all core principles and quality gates.*
