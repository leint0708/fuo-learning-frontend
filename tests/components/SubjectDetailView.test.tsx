import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubjectDetailView } from "@/features/subjects/SubjectDetailView";
import * as subjectsApi from "@/api/subjects";
import * as attemptsApi from "@/api/attempts";
import * as practiceApi from "@/api/practice";
import { useAuthStore } from "@/stores/authStore";

vi.mock("@/api/subjects", () => ({
  getSubject: vi.fn(),
  getSubjectExams: vi.fn(),
}));

vi.mock("@/api/attempts", async () => {
  const actual = await vi.importActual<typeof attemptsApi>("@/api/attempts");
  return {
    ...actual,
    startExamAttempt: vi.fn(),
  };
});

vi.mock("@/api/practice", async () => {
  const actual = await vi.importActual<typeof practiceApi>("@/api/practice");
  return {
    ...actual,
    syncSubjectProgressWithServer: vi.fn(),
  };
});

describe("SubjectDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  function renderSubjectDetail(code = "MAD101") {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/subjects/${code}`]}>
          <Routes>
            <Route path="/subjects/:code" element={<SubjectDetailView />} />
            <Route path="/attempts/:attemptId" element={<div>Attempt Screen</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  it("renders a single Vào thi button per exam card (no Tùy chỉnh) and opens Tùy chỉnh đề luyện thi pre-filled", async () => {
    vi.mocked(subjectsApi.getSubject).mockResolvedValue({
      id: "1",
      code: "MAD101",
      title: "Toán rời rạc",
      description: "Logic và đồ thị",
      iconUrl: null,
      totalExams: 1,
    });
    vi.mocked(subjectsApi.getSubjectExams).mockResolvedValue([
      {
        id: "exam_mad_fe",
        subjectCode: "MAD101",
        code: "FE_SP26",
        title: "Đề thi thử FE Spring 2026",
        totalQuestions: 35,
        durationMinutes: 45,
        passingScorePercentage: 50,
      },
    ]);

    renderSubjectDetail("MAD101");

    await waitFor(() => {
      expect(screen.getByText("Đề thi thử FE Spring 2026")).toBeInTheDocument();
    });

    // Old direct CTA and per-card "Tùy chỉnh" button are removed (top-level "Tùy chỉnh đề thi" remains)
    expect(screen.queryByRole("button", { name: /Bắt đầu thi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Tùy chỉnh$/i })).not.toBeInTheDocument();

    // Clicking "Vào thi" opens "Tùy chỉnh đề luyện thi" modal without immediately starting attempt
    fireEvent.click(screen.getByRole("button", { name: /Vào thi/i }));
    expect(attemptsApi.startExamAttempt).not.toHaveBeenCalled();

    const modal = await screen.findByRole("dialog", { name: /Tùy chỉnh đề luyện thi/i });
    expect(within(modal).getByText("35 câu hỏi")).toBeInTheDocument();
    expect(within(modal).getByRole("button", { name: "45 phút" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const durationInput = within(modal).getByRole("spinbutton", {
      name: /Tùy chỉnh số phút/i,
    });
    expect(durationInput).toHaveValue(45);
  });

  it("launches custom exam with >50 questions via custom-subject endpoint instead of fixed first exam", async () => {
    vi.mocked(subjectsApi.getSubject).mockResolvedValue({
      id: "1",
      code: "MAD101",
      title: "Toán rời rạc",
      description: "Logic và đồ thị",
      iconUrl: null,
      totalExams: 4,
    });
    vi.mocked(subjectsApi.getSubjectExams).mockResolvedValue([
      {
        id: "exam_1",
        subjectCode: "MAD101",
        code: "FE1",
        title: "Exam 1",
        totalQuestions: 50,
        durationMinutes: 60,
        passingScorePercentage: 50,
      },
      {
        id: "exam_2",
        subjectCode: "MAD101",
        code: "FE2",
        title: "Exam 2",
        totalQuestions: 50,
        durationMinutes: 60,
        passingScorePercentage: 50,
      },
      {
        id: "exam_3",
        subjectCode: "MAD101",
        code: "FE3",
        title: "Exam 3",
        totalQuestions: 50,
        durationMinutes: 60,
        passingScorePercentage: 50,
      },
      {
        id: "exam_4",
        subjectCode: "MAD101",
        code: "FE4",
        title: "Exam 4",
        totalQuestions: 50,
        durationMinutes: 60,
        passingScorePercentage: 50,
      },
    ]);
    vi.mocked(attemptsApi.startExamAttempt).mockResolvedValue({
      attemptId: "att_custom_120",
      examId: "exam_1",
      examTitle: "Đề tùy chỉnh - MAD101 (120 câu)",
      status: "in_progress",
      startedAt: new Date().toISOString(),
      expiresAt: null,
      timeRemainingSeconds: 1800,
      questions: [],
    });

    renderSubjectDetail("MAD101");

    await waitFor(() => {
      expect(screen.getByText("200")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Tùy chỉnh đề thi tự do từ ngân hàng câu hỏi/i })
    );

    const modal = await screen.findByRole("dialog", { name: /Tùy chỉnh đề luyện thi/i });
    const slider = within(modal).getByRole("slider", { name: /Số lượng câu hỏi/i });
    expect(slider).toHaveAttribute("max", "200");

    fireEvent.change(slider, { target: { value: "120" } });
    fireEvent.click(within(modal).getByRole("button", { name: /Bắt đầu làm bài/i }));

    await waitFor(() => {
      expect(attemptsApi.startExamAttempt).toHaveBeenCalledWith(
        "custom-MAD101",
        expect.objectContaining({
          questionCount: 120,
        })
      );
    });
  });

  it("displays synced Cram and Learn progress from server when authenticated", async () => {
    useAuthStore.setState({
      accessToken: "tok",
      user: {
        id: "u1",
        email: "sv@fpt.edu.vn",
        fullName: "Student",
        createdAt: "2026-11-16T00:00:00Z",
      },
      isAuthenticated: true,
      isLoading: false,
    });
    vi.mocked(subjectsApi.getSubject).mockResolvedValue({
      id: "1",
      code: "MAD101",
      title: "Toán rời rạc",
      description: "Logic và đồ thị",
      iconUrl: null,
      totalExams: 4,
    });
    vi.mocked(subjectsApi.getSubjectExams).mockResolvedValue([
      {
        id: "exam_1",
        subjectCode: "MAD101",
        code: "FE1",
        title: "Exam 1",
        totalQuestions: 200,
        durationMinutes: 60,
        passingScorePercentage: 50,
      },
    ]);
    vi.mocked(practiceApi.syncSubjectProgressWithServer).mockResolvedValue({
      subjectCode: "MAD101",
      cramMasteredIds: Array.from({ length: 200 }, (_, i) => `q_${i + 1}`),
      learnMasteredIds: Array.from({ length: 75 }, (_, i) => `q_${i + 1}`),
      cardStats: {},
    });

    renderSubjectDetail("MAD101");

    await waitFor(() => {
      expect(screen.getByText("200/200 câu đã thuộc")).toBeInTheDocument();
      expect(screen.getByText("75/200 câu thành thạo")).toBeInTheDocument();
    });
  });
});
