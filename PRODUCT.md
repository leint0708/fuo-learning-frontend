# Product <!-- impeccable:product-schema 1 -->

## Platform
web

## Users
- **Primary Users**: FPT University students preparing for semester course final examinations, progressive quizzes, and practical drills (specifically computing and software engineering curricula, such as PRM392, SWE201, MAS291, and related courses).
- **Situation & Mindset**: High-stakes revision periods with large question banks (often 100+ questions per subject), frequently studying in focused late-night sprints on laptops or on-the-go on mobile devices.
- **Job to Be Done**: Eliminate anxiety and cognitive overload by drilling authentic multi-choice exam questions, mastering difficult concepts with scientifically structured spaced repetition, and passing courses with high confidence and scores.

## Product Purpose
- Provide a focused, all-in-one exam simulation and cognitive practice platform designed to transform dense question banks into effective, measurable study workouts.
- **Success Criteria**: A student can launch a tailored study or exam session in seconds, experience zero interface friction or distraction, get immediate clarity on errors via AI-driven rationale, retain difficult questions through adaptive repetition, and track verifiable progress toward 100% subject mastery.

## Positioning
- Unlike generic flashcard tools (Anki, Quizlet) that only handle basic flashcard pairs, or static leaked PDF/doc files with unverified answers, FUO is tailor-made for authentic university exam preparation.
- FUO uniquely pairs realistic exam simulations (configurable timers, untimed modes, multi-choice A–H options, pan-and-zoom diagram inspection) with cognitive memorization algorithms (Cram Mode with near-distance jitter and Quizlet-style Learn Mode with Miller's $7 \pm 2$ working memory pool) and on-demand Gemini AI explanations.

## Operating Context
- **Environment**: Desktop and mobile web browsers, deployed continuously to Cloudflare Pages at [https://fuo-learning-frontend.pages.dev](https://fuo-learning-frontend.pages.dev).
- **Core Workflows**:
  - *Exam Simulation*: Selecting custom question counts, configuring timed countdown or untimed stopwatch modes, applying topic filters, and choosing between instant feedback and post-exam review.
  - *Cram Mode (Luyện thi cấp tốc)*: Rapid-fire 10-card chunks with Fisher-Yates shuffling, single-hit graduation, and near-distance jitter re-insertion (2–4 cards ahead) upon errors for fast pre-exam consolidation.
  - *Learn Mode (Học ghi nhớ)*: Adaptive Leitner spaced retention strictly capped at a 7-card active working memory buffer, asymmetric graduation (1 correct if pristine vs. 2 consecutive correct if previously missed), and comprehensive round error summaries.
  - *Review & Diagnostics*: Score breakdowns, item-by-item review against verified answer keys, and instant AI tutor explanations.
- **Input & Ergonomics**: Full dual-input support—mouse/touch pan-and-zoom for visual diagrams paired with instant single-key keyboard shortcuts (`1`–`8`, `A`–`H`, `Space`, `Enter`, `Escape`) for lightning-fast drilling without mouse fatigue.

## Capabilities and Constraints
- **Confirmed Capabilities**:
  - Secure JWT authentication with session persistence in `localStorage`.
  - Subject catalog discovery and dynamic question bank querying.
  - Full-featured custom exam generator with configurable time limits, question counts, and review modes.
  - Interactive visual question canvas with pan-and-zoom persistence across questions.
  - Single-choice and multi-choice evaluation with permutation-invariant comparison (e.g., `ABC` == `CBA`).
  - Integrated Gemini AI explanation modal (`gemini-3-flash-preview`) providing step-by-step logic.
  - Dual practice modes: Fixed-Chunk Cram Mode and 7-Card Sliding Buffer Learn Mode with live mastery badges.
  - Resilient session resume with synchronized timer and attempt state restoration.
- **Technical Constraints**:
  - Single-page application built on React 19, TypeScript 5.7+, Vite 6, and Tailwind CSS 3.4.
  - State management via Zustand 5 stores and TanStack Query v5 cache.
  - Client-side persistence in `localStorage` for offline-safe practice progress.
  - 100% automated test coverage gate with Vitest and Mock Service Worker (MSW).

## Brand Commitments
- **Design Language**: Strict adherence to the established Neo-Brutalist design system defined in [DESIGN.md](file:///D:/FUO/fuo-learning-frontend/DESIGN.md).
- **Visual Identity**: Prominent 2px–3px black borders (`#000000`), bold retro offset drop shadows (`4px 4px 0px #000000`), pill shapes (`radius-full: 9999px`), crisp typography (`Space Grotesk` / sans-serif), and a vibrant high-contrast color palette (`#394DA2` Blue, `#1D7F5B` Teal, `#F5BE3F` Amber, `#D65442` Coral).
- **Tone & Voice**: Direct, encouraging, and implementation-focused. Clean and motivating without corporate filler, patronizing fluff, or generic AI styling.

## Evidence on Hand
- **Functional Specification**: [cram_and_learn_feature_spec.md](file:///D:/FUO/fuo-learning-frontend/cram_and_learn_feature_spec.md) detailing algorithmic mechanics for Cram and Learn modes.
- **Design System Blueprint**: [DESIGN.md](file:///D:/FUO/fuo-learning-frontend/DESIGN.md) documenting tokenized colors, typography, spacing, elevation, and component rules.
- **Implementation Specifications & Plans**: [specs/004-subject-practice-modes/](file:///D:/FUO/fuo-learning-frontend/specs/004-subject-practice-modes/) containing architecture plan, contract definitions, data models, and 32/32 completed tasks.
- **Live Production App**: [https://fuo-learning-frontend.pages.dev](https://fuo-learning-frontend.pages.dev).
- **Automated Verification**: Complete passing Vitest test suite (117 tests across 21 test files) and zero-warning TypeScript production build.

## Product Principles
- **Frictionless Cognitive Flow**: The interface must get out of the student's way. Every core review action is accessible via single-stroke keyboard shortcuts, eliminating pointer travel and decision fatigue.
- **Cognitive Science Over Mindless Repetition**: Pacing is rooted in cognitive psychology (Miller's $7 \pm 2$ working memory law, near-distance jitter, and asymmetric streak graduation) rather than endless, overwhelming question queues.
- **Total Answer Transparency**: Never present a score without actionable insight. Always provide verified answer keys, user selection diffs, and on-demand AI reasoning to turn mistakes into durable learning.
- **Uncompromised State Resilience**: Practice sessions, question progress, and timer states persist reliably against accidental tab closes, page refreshes, and network interruptions.

## Accessibility & Inclusion
- **High Contrast Baseline**: Strict contrast ratios adhering to WCAG AA (>4.5:1 text-to-background contrast) using high-contrast tokenized palettes and solid borders.
- **Mouse-Free Operability**: 100% of exam and practice functionality is operable via keyboard alone.
- **Touch Ergonomics**: Minimum 44px touch targets on mobile viewports for all interactive controls and option buttons.
- **Motion Consideration**: Honors `prefers-reduced-motion` across animated state transitions.
