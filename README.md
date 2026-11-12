# FUO Exam Practice Platform (Frontend)

[![Deployment Status](https://img.shields.io/badge/Deployment-Cloudflare%20Pages-f38020?style=for-the-badge&logo=cloudflare)](https://fuo-learning-frontend.pages.dev)
[![React](https://img.shields.io/badge/React-19.0.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20%26%20MSW-green?style=for-the-badge&logo=vitest)](https://vitest.dev/)

A modern, high-performance web application designed for students preparing for course examinations and standardized tests. The application features a distinctive **Neo-Brutalist** visual style, an interactive visual question workspace with pan & zoom persistence, dynamic custom exam generation, multiple-choice instant feedback, and immediate on-demand AI explanations powered by Gemini.

🌐 **Live Production App**: [https://fuo-learning-frontend.pages.dev](https://fuo-learning-frontend.pages.dev)

---

## 🌟 Key Features

### 1. 🎓 Subject Catalog & Custom Exam Generation
- **Catalog Discovery**: Browse subjects, view course details, and practice standard benchmark exams.
- **Custom Exam Generator**: Configure customized practice sessions on demand:
  - Total question count (e.g., 10, 20, 50 questions).
  - Time limit configuration with countdown timers.
  - Optional chapter/topic filters sampled dynamically from the question bank.
  - Instant Answer Feedback vs. Post-Exam Review mode.

### 2. 🔍 Interactive Visual Question Workspace
- **Image-Based Canvas**: View high-resolution question diagrams and formulas clearly.
- **Pan & Zoom Persistence**: Smooth interactive drag-to-pan and mouse wheel/button zoom controls. Zoom scale and pan coordinates remain saved across question transitions rather than resetting.
- **Question Badges**: Top-left question numbering with current zoom percentage indicator, paired with a top-right question type badge (`Single Choice` or `Multiple Choice`).

### 3. 🔘 Answer Choices Panel (A through H)
- **Compact A–H Grid**: Clean circular option buttons supporting questions with up to 8 choices (A to H).
- **Multiple Choice Support**: Seamless toggle selection for multi-answer questions (e.g., selecting A, C, and D together) with dedicated check/confirm flow in instant feedback mode.
- **Immediate Feedback**: Instant visual cueing showing correct and chosen answers without locking you out from exploring alternative choices.

### 4. 🤖 Instant AI Explanations Modal
- **Immediate Insights**: View AI-recommended answers, model identifiers (e.g. `gemini-3-flash-preview`), and structured step-by-step logic immediately without waiting for user answer submission.
- **Clean Modal Layout**: Clean, spacious dialog with backdrop, dismissible via `Escape` key or backdrop click.
- **Balanced Typography**: Tokenized font sizing ensuring readability across both desktop and mobile screens.

### 5. 📑 Responsive Question Navigation Sidebar
- **Smart Adaptive Pagination**:
  - Small exams (≤25 questions): Displays a full-width completed count badge (`Số câu đã làm: x/n`).
  - Large exams (>25 questions): Paginates into clean batches of 25 with a compact `x/n` progress badge and three-button page controls (Page Number, Previous, Next).
- **Status Indicators**: Instant visual distinction between answered, active, and unanswered questions.

### 6. ⏱️ Real-Time Timer & Seamless Session Resume
- **Live Countdown**: Persistent timer synchronized with server attempts.
- **Automatic Resume**: If the user reloads or navigates away, the active session re-attaches automatically, restoring answer selections and remaining time.
- **Auto-Submission**: Automatically submits and scores the attempt when time expires.

### 7. 📊 Comprehensive Post-Exam Review
- **Score Breakdown**: Summary score cards showing percentage, correct/incorrect count, and completion duration.
- **Answer Key Comparison**: Question-by-question review displaying learner selections, official answer keys, and AI rationale.

### 8. 🔐 Authentication & Profile Management
- Secure JWT authentication with session persistence in `localStorage`.
- User registration, login, and authenticated route protection.

---

## 🎨 Design System: Neo-Brutalism

This application follows a strict design specification detailed in [`DESIGN.md`](./DESIGN.md):

- **High Contrast Borders**: Prominent 2px–3px black (`#000000`) borders on cards, buttons, and modals.
- **Offset Box Shadows**: Retro solid offset drop shadows (`4px 4px 0px #000000`) providing depth without blur.
- **Vibrant Accent Palette**: High-energy primary accents (e.g., `#3852ad` Indigo, `#ffb703` Amber, `#fb8500` Coral, `#2a9d8f` Teal).
- **Accessible Typography**: Monospace numbers and crisp sans-serif headings with strict tokenized scale (`text-xs` through `text-2xl`).

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) | Component architecture & modern state hooks |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) | Strict typing, contracts, and interfaces |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Lightning-fast HMR and optimized production bundles |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Design token utility system & neo-brutalist styling |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) | Minimalist reactive stores (`authStore`, `examUiStore`) |
| **Data Fetching** | [TanStack Query v5](https://tanstack.com/query) | Cache synchronization, retry policies & loading states |
| **Routing** | [React Router v7](https://reactrouter.com/) | Declarative client routing with SPA redirect support |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent vector iconography |
| **Testing** | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) | Contract, component, and integration unit testing |
| **API Mocking** | [MSW v2](https://mswjs.io/) | Mock Service Worker for hermetic testing |
| **Hosting** | [Cloudflare Pages](https://pages.cloudflare.com/) | Edge static hosting with high availability |

---

## 📁 Project Directory Structure

```text
fuo-learning-frontend/
├── public/                     # Static assets
├── specs/                      # Spec-Kit specifications and task plans
│   └── 001-exam-practice-app/
│       ├── spec.md             # Functional requirements & user scenarios
│       ├── plan.md             # Technical architecture plan
│       └── tasks.md            # Actionable implementation task checklist
├── src/
│   ├── api/                    # API client, interceptors & endpoint contracts
│   │   ├── client.ts           # Centralized fetch client with JWT injection
│   │   ├── auth.ts             # Authentication endpoints
│   │   ├── subjects.ts         # Subjects & question bank endpoints
│   │   └── attempts.ts         # Exam attempts, session sync & submission
│   ├── components/             # Reusable UI primitives
│   │   ├── layout/             # Navbar, Footer, ProtectedRoute
│   │   └── ui/                 # Button, Card, Modal, Badge, ProgressBar
│   ├── features/               # Domain feature modules
│   │   ├── auth/               # LoginForm, RegisterForm, ProfileView
│   │   ├── subjects/           # SubjectCatalogView, Detail, CustomExamModal
│   │   ├── exam/               # Workspace, QuestionCanvas, ChoicePanel,
│   │   │                       # QuestionListSidebar, AiAnswerModal
│   │   └── review/             # ReviewView, ResultScoreCard, ReviewItem
│   ├── hooks/                  # Custom hooks (useAuth, useExamSession,
│   │                           # useExamTimer, useZoomPan)
│   ├── stores/                 # Zustand stores (authStore, examUiStore)
│   ├── styles/                 # Tailwind entry & CSS design tokens
│   ├── types/                  # TypeScript interface definitions
│   ├── utils/                  # Helper utilities (image URL resolvers, etc.)
│   ├── App.tsx                 # Route tree definitions
│   └── main.tsx                # Application bootstrap & QueryClient setup
├── tests/                      # 100% Passing Vitest Test Suite
│   ├── components/             # Component unit tests (Canvas, Choice, Modal)
│   ├── contract/               # API contract schema tests
│   ├── integration/            # Full exam and review integration tests
│   └── mocks/                  # MSW API handlers & mock server
├── DESIGN.md                   # Complete Neo-Brutalist design system guide
├── tailwind.config.ts          # Tailwind token configuration
├── vite.config.ts              # Vite bundler configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version `18.0.0` or higher)
- [npm](https://www.npmjs.com/) (version `9.0.0` or higher)

### 1. Installation

Clone this repository and install all dependencies:

```bash
git clone https://github.com/leint0708/fuo-learning-frontend.git
cd fuo-learning-frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# URL pointing to the fuo-learning-backend API
# In local development:
VITE_API_BASE_URL=http://localhost:8787

# Leave empty if deploying behind a reverse proxy or same domain:
# VITE_API_BASE_URL=
```

### 3. Run Development Server

Start the local Vite development server with Hot Module Replacement:

```bash
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing

The codebase includes comprehensive test suites across contracts, components, hooks, and integration workflows using **Vitest** and **Testing Library**.

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

Current test status: **36 / 36 tests passing** across 8 test suites.

---

## 📦 Building for Production

Compile TypeScript and build the optimized static assets into the `dist/` directory:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## ☁️ Deployment

### Cloudflare Pages

This application is optimized for deployment on **Cloudflare Pages**, which provides built-in native Single Page Application (SPA) routing for Vite/React applications.

#### Deploying with Wrangler CLI

1. Build the production bundle:
   ```powershell
   npm run build
   ```

2. Deploy directly using the Cloudflare account ID:
   ```powershell
   $env:CLOUDFLARE_ACCOUNT_ID="c6146cc59d61c594f9b23499e9aa8af5"
   npx wrangler pages deploy dist --project-name=fuo-learning-frontend
   ```

3. Access your live application at:
   - [https://fuo-learning-frontend.pages.dev](https://fuo-learning-frontend.pages.dev)

---

## 🤝 Contributing & Guidelines

- **Style Consistency**: Refer to [`DESIGN.md`](./DESIGN.md) for color tokens, border radius, and font constraints.
- **Specification**: Major features follow the [Spec-Kit](./specs/) workflow (`spec.md` -> `plan.md` -> `tasks.md`).
- **Code Quality**: All pull requests must pass `npm test` and `npm run build` without TypeScript warnings or linting errors.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
