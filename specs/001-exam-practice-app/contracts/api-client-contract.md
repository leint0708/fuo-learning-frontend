# API Client Contract: Exam Practice Platform

**Feature**: `001-exam-practice-app` | **Date**: 2026-11-12

This document specifies the exact REST API client endpoints consumed by the frontend application, mapped directly from [`fuo-learning-backend`](file:///D:/FUO/fuo-learning-backend).

## Base Configuration

- **Development Base URL**: `http://localhost:8787` (proxied via Vite dev server `/api`)
- **Production Base URL**: `https://fuo-learning-backend.workers.dev` (configured via `VITE_API_BASE_URL`)
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>` (on protected endpoints)

---

## Endpoints Specification

### 1. Authentication

| Method | Endpoint | Description | Request Body | Response (200/201) |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new learner | `{ email, password, full_name }` | `{ access_token, token_type, user }` |
| `POST` | `/api/v1/auth/login` | Authenticate learner | `{ email, password }` | `{ access_token, token_type, user }` |
| `GET` | `/api/v1/auth/me` | Fetch authenticated profile | *None* | `{ id, email, full_name, created_at }` |

---

### 2. Subjects & Exams Catalog

| Method | Endpoint | Description | Query / Path Params | Response (200) |
|---|---|---|---|---|
| `GET` | `/api/v1/subjects` | List subjects | `?skip=0&limit=50` | `Array<SubjectSummary>` |
| `GET` | `/api/v1/subjects/:code` | Get subject details | `code` (e.g. `MAD101`) | `SubjectDetail` |
| `GET` | `/api/v1/subjects/:code/exams`| List exams for subject | `code` (e.g. `MAD101`) | `Array<ExamSummary>` |
| `GET` | `/api/v1/exams/:exam_id` | Get exam instructions | `exam_id` | `ExamDetail` |

---

### 3. Exam Attempts & Answers

| Method | Endpoint | Description | Request / Params | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/exams/:exam_id/attempts` | Start exam attempt | `exam_id` | `201: AttemptSessionResponse` |
| `GET` | `/api/v1/attempts/:attempt_id` | Reconnect ongoing session | `attempt_id` | `200: AttemptSessionResponse` |
| `PUT` | `/api/v1/attempts/:attempt_id/answers`| Record selected answer | `{ question_id, selected_options }` | `200: AnswerSavedResponse` |
| `POST` | `/api/v1/attempts/:attempt_id/submit` | Grade and finalize attempt | *None* | `200: AttemptResultResponse` |
| `GET` | `/api/v1/attempts/:attempt_id/review` | Question review & explanations | *None* | `200: AttemptReviewResponse` |

---

### 4. Topical Drills & Instant Verification

| Method | Endpoint | Description | Request / Params | Response (200) |
|---|---|---|---|---|
| `GET` | `/api/v1/questions/drills` | Pull practice questions | `?subject_code=MAD101&count=10` | `Array<PracticeQuestion>` |
| `POST` | `/api/v1/questions/:question_id/check` | Instant answer check | `{ selected_options }` | `DrillCheckResponse` (`is_correct`, `ai_explanation`, `option_by_option_analysis`) |

---

### 5. Learner Statistics & Attempt History

| Method | Endpoint | Description | Query Params | Response (200) |
|---|---|---|---|---|
| `GET` | `/api/v1/users/me/stats` | Overall performance metrics | *None* | `UserStatisticsResponse` |
| `GET` | `/api/v1/users/me/attempts` | Past attempt history | `?subject_code=&skip=0&limit=20` | `Array<AttemptHistoryItem>` |

---

## Static Assets Hosting

- **Question Diagrams**:
  - Asset path template: `/static/exams/:subjectCode/:examDirName/:imageFile`
  - Example: `http://localhost:8787/static/exams/MAD101/MAD101%20-%20FA25%20-%20FEB5/Q1.webp`
  - Fallback: In case of 404/network error, display placeholder canvas with retry action.
