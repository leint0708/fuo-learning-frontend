import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubjectCatalogView } from "@/features/subjects/SubjectCatalogView";
import * as subjectsApi from "@/api/subjects";

vi.mock("@/api/subjects", () => ({
  getSubjects: vi.fn(),
}));

const mockSubjects = [
  {
    id: "1",
    code: "MAD101",
    title: "Toán rời rạc",
    description: "Logic, tập hợp và đồ thị",
    iconUrl: null,
    totalExams: 4,
  },
  {
    id: "2",
    code: "OSG202",
    title: "Hệ điều hành",
    description: "Quản lý tiến trình và bộ nhớ",
    iconUrl: null,
    totalExams: 0,
  },
];

function renderCatalog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SubjectCatalogView />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SubjectCatalogView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders subjects, local progress quick-resume, and supports accent-insensitive search", async () => {
    localStorage.setItem("fuo_cram_mastered_MAD101", JSON.stringify(["q1", "q2"]));
    vi.mocked(subjectsApi.getSubjects).mockResolvedValue(mockSubjects);

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText("Toán rời rạc")).toBeInTheDocument();
    });

    expect(screen.getByText("Tiếp tục ôn tập")).toBeInTheDocument();
    expect(screen.getByText("Chưa có đề thi")).toBeInTheDocument();
    expect(screen.getByText("2 môn học")).toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", {
      name: /tìm theo mã hoặc tên môn học/i,
    });

    // Accent-insensitive + whitespace-trimmed search
    fireEvent.change(searchInput, { target: { value: "  he dieu hanh  " } });
    expect(screen.getByText("Hệ điều hành")).toBeInTheDocument();
    expect(screen.queryByText("Toán rời rạc")).not.toBeInTheDocument();
    expect(screen.getByText("1/2 môn học phù hợp")).toBeInTheDocument();

    // Clear with Escape
    fireEvent.keyDown(searchInput, { key: "Escape" });
    expect(searchInput).toHaveValue("");
    expect(screen.getByText("Toán rời rạc")).toBeInTheDocument();

    // Empty search result shows reset button
    fireEvent.change(searchInput, { target: { value: "NONEXISTENT" } });
    expect(
      screen.getByText(/Không tìm thấy môn học nào khớp với "NONEXISTENT"/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /đặt lại bộ lọc/i }));
    expect(screen.getByText("Toán rời rạc")).toBeInTheDocument();
  });

  it("distinguishes server-empty catalog from search-empty state", async () => {
    vi.mocked(subjectsApi.getSubjects).mockResolvedValue([]);

    renderCatalog();

    await waitFor(() => {
      expect(
        screen.getByText("Chưa có môn học nào trong hệ thống.")
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /tải lại danh sách/i })).toBeInTheDocument();
  });
});
