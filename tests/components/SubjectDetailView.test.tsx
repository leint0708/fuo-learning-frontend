import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubjectDetailView } from "@/features/subjects/SubjectDetailView";
import * as subjectsApi from "@/api/subjects";
import * as attemptsApi from "@/api/attempts";

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

describe("SubjectDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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
});
