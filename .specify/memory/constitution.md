<!--
SYNC IMPACT REPORT
==================
Version Change: 0.0.0 (Unratified Template) -> 1.0.0 (Ratified Constitution)
Modified Principles:
  - [PRINCIPLE_1_NAME] -> Principle I: Code Quality & Type Discipline
  - [PRINCIPLE_2_NAME] -> Principle II: Multi-Tier Testing & Verification
  - [PRINCIPLE_3_NAME] -> Principle III: Maintainability & Component Modularity
  - [PRINCIPLE_4_NAME] -> Principle IV: Token-Driven UI/UX & DESIGN.md Compliance
  - [PRINCIPLE_5_NAME] -> Principle V: Accessibility, Responsiveness & State Completeness
Added Sections:
  - DESIGN.md System Specifications & Constraints (replacing [SECTION_2_NAME])
  - Quality Gates & Verification Workflow (replacing [SECTION_3_NAME])
  - Concrete Governance Rules & Versioning Policy (replacing [GOVERNANCE_RULES])
Removed Sections:
  - None (scaffold placeholders replaced with concrete requirements)
Follow-up TODOs:
  - None. All placeholders resolved.
-->

# FUO Learning Frontend Constitution

## Core Principles

### Principle I: Code Quality & Type Discipline
Code quality is a non-negotiable standard enforced across all application modules and interfaces:
- **Strict Typing**: TypeScript MUST be configured and maintained in strict mode. The use of `any`,
  suppression comments (`@ts-ignore`), or untyped data contracts is strictly prohibited unless
  explicitly documented and approved with a concrete rationale.
- **Static Integrity**: All code MUST pass zero-warning linter, formatter, and type-checker gates
  prior to merge. Code formatting rules (indentation, imports, quotes) MUST be automated.
- **Predictability & Purity**: Functions, hooks, and services MUST have clear, deterministic behavior.
  Side effects MUST be strictly encapsulated within dedicated lifecycle hooks or service layers.
- **Clean Hygiene**: Dead code, commented-out code, and unreferenced dependencies MUST be purged
  immediately. Meaningful variable and function names MUST reflect domain intent.

*Rationale*: High code quality prevents runtime faults, minimizes cognitive overhead for reviewers,
and guarantees that future automated and human refactoring remains safe and predictable.

### Principle II: Multi-Tier Testing & Verification
Testing is an integral component of the development lifecycle, not an afterthought:
- **Test-Driven Discipline**: Where applicable, unit specifications and test scenarios MUST be
  defined prior to implementation, following the Red-Green-Refactor cycle.
- **Layered Verification**:
  - *Unit Tests*: Business logic, utility calculations, and data parsing MUST achieve high test
    coverage with isolated, deterministic assertions.
  - *Component Tests*: Reusable UI components MUST be tested for rendering fidelity, user
    interactions (click, keyboard input), and state transitions across permutations.
  - *Integration & Contract Tests*: Shared schemas, API client integrations, and critical user
    journeys MUST be validated against realistic contracts and mock servers.
- **Regression Protection**: Every discovered bug MUST be accompanied by a reproducing test case
  that asserts the bug and proves its remediation before the fix is considered complete.
- **Deterministic Mocking**: Network requests, timers, and storage drivers MUST be cleanly mocked
  to prevent test flakiness and external dependencies in continuous integration pipelines.

*Rationale*: Automated multi-tier testing preserves system confidence, prevents silent regressions,
and enables continuous delivery without manual regression verification bottlenecks.

### Principle III: Maintainability & Component Modularity
The codebase MUST be architected for sustainable longevity, modular evolution, and clear boundaries:
- **Single Responsibility Principle (SRP)**: Each component, module, and hook MUST have exactly one
  well-defined concern. Monolithic components (>250 lines) MUST be decomposed into smaller, composed
  primitives and subcomponents.
- **Separation of Concerns**: Presentation logic MUST be separated from data orchestration. Views
  render UI and emit events; business logic and server communication MUST reside in custom hooks,
  stores, or service adapters.
- **Reusability over Duplication**: Shared layout patterns, forms, and interaction controls MUST be
  extracted into reusable design system components with strongly typed prop interfaces.
- **Cohesive Directory Structure**: Feature directories MUST encapsulate their related components,
  hooks, test files, and types, making modular deletion or relocation effortless.

*Rationale*: Modular architectures with low coupling and high cohesion drastically lower maintenance
cost, speed up developer onboarding, and prevent cross-cutting dependency tangles.

### Principle IV: Token-Driven UI/UX & DESIGN.md Compliance
All user interface development MUST strictly adhere to the project design tokens and rules defined in `DESIGN.md`:
- **Strict Token Usage**: Visual decisions MUST reference design tokens by canonical token name.
  Hardcoded hex values, raw pixel values, or arbitrary styles are strictly forbidden.
- **Color Palette Pinning**: Only colors from the designated palette are permissible:
  `color-1` (`#000000` - Text Primary), `color-2` (`#394DA2` - Background Dark),
  `color-3` (`#1D7F5B` - Accent), `color-4` (`#D65442` - Accent), `color-5` (`#F5BE3F` - Accent),
  `color-6` (`#F3F3F3` - Text Light), and `color-7` (`#FFFFFF` - Text Light). No unapproved tints.
- **8px Spacing Grid**: All margins, paddings, and layout gaps MUST use the defined spacing scale:
  `space-1` (8px), `space-2` (16px), `space-3` (20px), `space-4` (24px), `space-5` (32px),
  `space-6` (56px), `space-7` (80px), `space-8` (259px), `space-9` (399px), `space-10` (719px).
- **Typography & Scale**: Typography MUST utilize font stack `__Space_Grotesk_8c5df3, ui-sans-serif`
  with levels `text-xs` (16px), `text-sm` (18px), `text-base` (20px), `text-lg` (24px),
  `text-xl` (30px), `text-2xl` (60px), and `text-3xl` (72px). Weight scale: 400, 600, 700.
- **Shape & Elevation**: Border radius is strictly pinned to `radius-full: 9999px`. Elevation MUST
  use `shadow-sm` (`rgb(0, 0, 0) 4px 4px 0px 0px`). Motion MUST adhere to `duration-fast`
  (`0.15s cubic-bezier(0.4, 0, 0.2, 1)`).
- **Copy & Casing**: Content MUST be written in sentence case. ALL CAPS is strictly reserved for
  acronyms. Body text in full-uppercase is forbidden.

*Rationale*: Strict token adherence preserves brand coherence, eliminates visual inconsistency, and
prevents layout regressions across parallel development streams.

### Principle V: Accessibility, Responsiveness & State Completeness
Interfaces MUST be robust, universally accessible, and resilient across all environments:
- **Eight-State Completeness**: Every interactive element and component MUST explicitly define and
  handle all interactive states: default, hover, focus-visible, active, disabled, loading,
  error, and empty.
- **Accessible by Default (WCAG AA)**: Compliance is baseline. Color contrast MUST meet WCAG AA
  (minimum 3:1 for focus rings and graphic elements, 4.5:1 for standard text). Focus rings MUST be
  visible for keyboard navigation.
- **Keyboard Navigation**: All interactive flows MUST be operable via keyboard (Tab, Enter, Space,
  Escape, Arrow keys). Interactive elements MUST NOT be nested (e.g. no buttons within anchor tags).
  ARIA roles, labels, and live regions MUST be supplied where semantic HTML is insufficient.
- **Responsive Adaptability**: Components and pages MUST be tested and verified at both smallest
  supported mobile breakpoints and largest desktop viewports without overflow or clipping.

*Rationale*: Incomplete interaction states create brittle user experiences; accessibility and
responsive design guarantee universal usability across diverse hardware and user capabilities.

## DESIGN.md System Specifications & Constraints

All component implementations and modifications MUST satisfy the structural requirements set forth in `DESIGN.md`:
- **Authoring Sequence**: Component documentation and scaffold workflows MUST proceed in sequence:
  1. State Intent -> 2. Map Tokens -> 3. Define Anatomy -> 4. Specify States ->
  5. Describe Interactions -> 6. Accessibility Criteria -> 7. List Anti-Patterns -> 8. QA Checklist.
- **Required Component Guideline Structure**:
  Guidelines MUST contain in order: Overview, Tokens & Foundations, Anatomy & Variants, States &
  Interactions, Accessibility, Content Guidelines, and Anti-Patterns.
- **Strict Anti-Patterns**:
  - Never introduce colors outside the extracted palette.
  - Never use arbitrary spacing or margin values outside the 8px-based scale.
  - Never mix border-radius values; pin strictly to `radius-full: 9999px`.
  - Never ship components without defining hover, focus-visible, active, and disabled states.
  - Never nest interactive elements.
  - Never use full-uppercase text for body or paragraph content.

## Quality Gates & Verification Workflow

Code and component releases MUST pass the following mechanical Definition of Done (DoD) verification gates:
- **Gate 1: Static Analysis & Type Verification**:
  Zero TypeScript compiler errors (`tsc --noEmit`), zero linter errors/warnings, and zero formatting
  deviations.
- **Gate 2: Automated Test Execution**:
  All unit, component, and integration tests MUST pass in CI. Bugfix PRs MUST supply proof of
  regression tests.
- **Gate 3: Token Audit**:
  Automated token linter or peer review verification that no hardcoded CSS colors, arbitrary pixel
  spacings, or foreign font declarations exist.
- **Gate 4: Interaction & State Audit**:
  All 8 states (default, hover, focus-visible, active, disabled, loading, error, empty) verified
  visually or via component tests.
- **Gate 5: Keyboard & Accessibility Verification**:
  Focus order is logical; focus indicators are visible with 3:1 contrast; keyboard operability
  (Tab, Enter, Escape, Arrow keys) functions with no mouse pointer.
- **Gate 6: Responsive Viewport Check**:
  Component tested and visually verified at the smallest mobile breakpoint and largest desktop breakpoint.

## Governance

This constitution serves as the foundational architectural and design contract for FUO Learning Frontend:
- **Supremacy**: The rules, principles, and quality gates in this constitution supersede all ad-hoc
  coding practices, unreviewed patterns, or personal preferences.
- **Amendment Procedure**: Amendments to this constitution require a formal Spec Kit amendment
  command (`/speckit-constitution`), documented rationale, peer consensus, and an actionable
  migration plan for existing code affected by the change.
- **Semantic Versioning**:
  - *MAJOR*: Incompatible governance changes, removal or major redefinition of core principles.
  - *MINOR*: Addition of new principles, new quality gates, or material expansion of guidelines.
  - *PATCH*: Wording improvements, clarifications, typo fixes, or non-semantic adjustments.
- **Review & Compliance**: All pull requests, code reviews, and autonomous agent workflows MUST
  explicitly certify compliance with the Core Principles and the Quality Gates before merging.
- **Runtime Guidance**: Developers and autonomous agents MUST consult `DESIGN.md` for design system
  tokens and this constitution (`.specify/memory/constitution.md`) for development principles.

**Version**: 1.0.0 | **Ratified**: 2026-11-12 | **Last Amended**: 2026-11-12
