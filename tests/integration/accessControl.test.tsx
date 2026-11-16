import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { GuestRoute } from "@/components/layout/GuestRoute";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginForm } from "@/features/auth/LoginForm";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { ExamWorkspaceView } from "@/features/exam/ExamWorkspaceView";
import { useAuthStore } from "@/stores/authStore";
import { useExamUiStore } from "@/stores/examUiStore";
import { queryClient as sharedQueryClient } from "@/lib/queryClient";
import { apiClient } from "@/api/client";

describe("Broken Access Control Remediation Integration Tests", () => {
  let testQueryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sharedQueryClient.clear();
    useExamUiStore.getState().resetSessionState();
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("redirects authenticated users away from /login and /register to /", () => {
    localStorage.setItem("fuo_auth_token", "valid_tok");
    useAuthStore.setState({
      accessToken: "valid_tok",
      user: {
        id: "u1",
        email: "sv@fpt.edu.vn",
        fullName: "Student",
        createdAt: "2026-11-16T00:00:00Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    const { unmount } = render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginForm />
                </GuestRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Authenticated Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("Authenticated Dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đăng nhập" })).not.toBeInTheDocument();
    unmount();

    render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterForm />
                </GuestRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Authenticated Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("Authenticated Dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Đăng ký tài khoản" })).not.toBeInTheDocument();
  });

  it("prevents re-entering a quit/submitted exam via browser Back or direct URL", async () => {
    let getAttemptCalls = 0;

    server.use(
      http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
        getAttemptCalls += 1;
        return HttpResponse.json({
          attempt_id: params.attemptId,
          exam_id: "MAD101_FE",
          exam_title: "Quit Guard Exam",
          status: "in_progress",
          started_at: new Date().toISOString(),
          expires_at: null,
          time_remaining_seconds: 1800,
          questions: [
            {
              question_id: "q_1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Secret active exam stem",
              image_url: null,
              options: { A: "Alpha", B: "Beta" },
              selected_options: null,
            },
          ],
        });
      }),
      http.post("*/api/v1/attempts/:attemptId/submit", ({ params }) => {
        return HttpResponse.json({
          attempt_id: params.attemptId,
          status: "completed",
          total_questions: 1,
          correct_answers_count: 1,
          total_score: 10,
          percentage_score: 100,
          is_passed: true,
          submitted_at: new Date().toISOString(),
          duration_seconds: 30,
        });
      })
    );

    const { unmount } = render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={["/attempts/att_ended_check_1"]}>
          <Routes>
            <Route path="/attempts/:attemptId" element={<ExamWorkspaceView />} />
            <Route
              path="/attempts/:attemptId/review"
              element={<div>Review Destination</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Secret active exam stem")).toBeInTheDocument();
    });
    expect(getAttemptCalls).toBe(1);

    // Quit and finish the exam via confirmation modal
    fireEvent.click(screen.getByRole("button", { name: /Thoát phòng thi/i }));
    const dialog = await screen.findByRole("dialog", { name: /Xác nhận thoát phòng thi/i });
    fireEvent.click(within(dialog).getByRole("button", { name: /Thoát & kết thúc bài thi/i }));
    expect(await screen.findByText("Review Destination")).toBeInTheDocument();
    unmount();

    // Navigating back or revisiting /attempts/att_ended_check_1 must NOT render exam questions
    render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={["/attempts/att_ended_check_1"]}>
          <Routes>
            <Route path="/attempts/:attemptId" element={<ExamWorkspaceView />} />
            <Route
              path="/attempts/:attemptId/review"
              element={<div>Review Destination</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Review Destination")).toBeInTheDocument();
    expect(screen.queryByText("Secret active exam stem")).not.toBeInTheDocument();
  });

  it("blocks direct access when backend reports completed or expired status", async () => {
    server.use(
      http.get("*/api/v1/attempts/att_server_completed", () =>
        HttpResponse.json({
          attempt_id: "att_server_completed",
          exam_id: "MAD101_FE",
          exam_title: "Completed Attempt",
          status: "completed",
          started_at: new Date().toISOString(),
          expires_at: null,
          time_remaining_seconds: 0,
          questions: [
            {
              question_id: "q_c",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Completed stem hidden",
              image_url: null,
              options: { A: "A", B: "B" },
              selected_options: "A",
            },
          ],
        })
      ),
      http.get("*/api/v1/attempts/att_server_expired", () =>
        HttpResponse.json({
          attempt_id: "att_server_expired",
          exam_id: "MAD101_FE",
          exam_title: "Expired Attempt",
          status: "expired",
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() - 60000).toISOString(),
          time_remaining_seconds: 0,
          questions: [
            {
              question_id: "q_e",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Expired stem hidden",
              image_url: null,
              options: { A: "A", B: "B" },
              selected_options: null,
            },
          ],
        })
      )
    );

    const { unmount } = render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={["/attempts/att_server_completed"]}>
          <Routes>
            <Route path="/attempts/:attemptId" element={<ExamWorkspaceView />} />
            <Route
              path="/attempts/:attemptId/review"
              element={<div>Completed Redirected To Review</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Completed Redirected To Review")).toBeInTheDocument();
    expect(screen.queryByText("Completed stem hidden")).not.toBeInTheDocument();
    unmount();

    render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={["/attempts/att_server_expired"]}>
          <Routes>
            <Route path="/attempts/:attemptId" element={<ExamWorkspaceView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Phiên thi đã kết thúc")).toBeInTheDocument();
    expect(screen.queryByText("Expired stem hidden")).not.toBeInTheDocument();
  });

  it("syncs Zustand logout & clears caches on 401 unauthorized API response and explicit logout", async () => {
    localStorage.setItem("fuo_auth_token", "expired_tok");
    localStorage.setItem("fuo_exam_draft_att_x", JSON.stringify({ q1: "A" }));
    localStorage.setItem("fuo_active_exams", JSON.stringify([{ attemptId: "att_x", examTitle: "X", examId: "E", totalQuestions: 1, answeredCount: 1, startedAt: "2026-11-16", expiresAt: null, feedbackMode: "instant", updatedAt: "2026-11-16" }]));
    sharedQueryClient.setQueryData(["sensitive"], { secret: true });
    useAuthStore.setState({
      accessToken: "expired_tok",
      user: {
        id: "u1",
        email: "sv@fpt.edu.vn",
        fullName: "Student",
        createdAt: "2026-11-16T00:00:00Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });

    server.use(
      http.get("*/api/v1/subjects", () =>
        HttpResponse.json({ detail: "Token expired" }, { status: 401 })
      )
    );

    await expect(apiClient("/api/v1/subjects")).rejects.toThrow(/Token expired/i);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem("fuo_auth_token")).toBeNull();
    expect(localStorage.getItem("fuo_exam_draft_att_x")).toBeNull();
    expect(localStorage.getItem("fuo_active_exams")).toBeNull();
    expect(sharedQueryClient.getQueryData(["sensitive"])).toBeUndefined();
  });
});
