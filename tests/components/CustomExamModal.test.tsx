import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { CustomExamModal } from "@/features/subjects/CustomExamModal";
import { startExamAttempt } from "@/api/attempts";

// Mock API and store
vi.mock("@/api/attempts", () => ({
  startExamAttempt: vi.fn().mockResolvedValue({ attemptId: "attempt-test-123" }),
}));

describe("CustomExamModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 4 configuration sections when open", () => {
    render(
      <BrowserRouter>
        <CustomExamModal
          isOpen={true}
          onClose={vi.fn()}
          subjectCode="OSG202"
          maxAvailableQuestions={50}
        />
      </BrowserRouter>
    );

    // Header
    expect(screen.getByText("Tùy chỉnh đề luyện thi - OSG202")).toBeInTheDocument();

    // Section 1: Question Count
    expect(screen.getByText("Số lượng câu hỏi")).toBeInTheDocument();
    expect(screen.getByText("Tối đa: 50 câu")).toBeInTheDocument();

    // Section 2: Time Limit
    expect(screen.getByText("Thời gian làm bài")).toBeInTheDocument();
    expect(screen.getByText("Thi có hẹn giờ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "15 phút" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 phút" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "45 phút" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "60 phút" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Tùy chỉnh số phút" })).toBeInTheDocument();

    // Section 3: Answer View Mode
    expect(screen.getByText("Chế độ xem đáp án")).toBeInTheDocument();
    expect(screen.getByText("Xem đáp án ngay")).toBeInTheDocument();
    expect(screen.getByText("Xem sau khi nộp bài")).toBeInTheDocument();

    // Section 4: Answer Benchmark Source
    expect(screen.getByText("Nguồn đối chiếu đáp án chuẩn")).toBeInTheDocument();
    expect(screen.getByText("Đáp án AI chuẩn")).toBeInTheDocument();
    expect(screen.getByText("Biểu quyết cộng đồng")).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole("button", { name: "Hủy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bắt đầu làm bài/i })).toBeInTheDocument();
  });

  it("calls onClose when clicking Hủy button", () => {
    const handleClose = vi.fn();
    render(
      <BrowserRouter>
        <CustomExamModal
          isOpen={true}
          onClose={handleClose}
          subjectCode="OSG202"
        />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("allows selecting duration and feedback options", () => {
    render(
      <BrowserRouter>
        <CustomExamModal
          isOpen={true}
          onClose={vi.fn()}
          subjectCode="OSG202"
        />
      </BrowserRouter>
    );

    // Select 45 minutes
    fireEvent.click(screen.getByRole("button", { name: "45 phút" }));
    expect(screen.getByRole("button", { name: "45 phút" })).toBeInTheDocument();

    // Select 'Xem sau khi nộp bài'
    fireEvent.click(screen.getByText("Xem sau khi nộp bài"));
    expect(screen.getByText("Xem sau khi nộp bài")).toBeInTheDocument();
  });

  // User Story 1: Fixed Question Count for Standard Exam Selection
  it("hides question slider and shows fixed question summary when isCustomExam is false", async () => {
    render(
      <BrowserRouter>
        <CustomExamModal
          isOpen={true}
          onClose={vi.fn()}
          subjectCode="OSG202"
          isCustomExam={false}
          fixedQuestionCount={40}
        />
      </BrowserRouter>
    );

    // Slider should NOT be rendered
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();

    // Fixed question count badge and text
    expect(screen.getByText("40 câu")).toBeInTheDocument();
    expect(screen.getByText("Đề thi chuẩn học kỳ:")).toBeInTheDocument();
    expect(screen.getByText("40 câu hỏi")).toBeInTheDocument();

    // Launch exam should use fixed question count 40
    fireEvent.click(screen.getByRole("button", { name: /Bắt đầu làm bài/i }));
    expect(startExamAttempt).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ questionCount: 40 })
    );
  });

  // User Story 2: Dynamic Question Bank Ceiling for New Custom Exams
  it("renders question slider with dynamic maximum boundary when isCustomExam is true", () => {
    render(
      <BrowserRouter>
        <CustomExamModal
          isOpen={true}
          onClose={vi.fn()}
          subjectCode="OSG202"
          isCustomExam={true}
          maxAvailableQuestions={85}
        />
      </BrowserRouter>
    );

    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("max", "85");
    expect(screen.getByText("Tối đa: 85 câu")).toBeInTheDocument();
  });

  // User Story 3: Custom Exam Duration Input
  it("supports custom duration input and synchronizes with preset pills", () => {
    render(
      <BrowserRouter>
        <CustomExamModal
          isOpen={true}
          onClose={vi.fn()}
          subjectCode="OSG202"
        />
      </BrowserRouter>
    );

    const customInput = screen.getByRole("spinbutton", { name: "Tùy chỉnh số phút" });
    expect(customInput).toBeInTheDocument();

    // Type 25 minutes
    fireEvent.change(customInput, { target: { value: "25" } });
    expect(screen.getByText("25 phút")).toBeInTheDocument();

    // Click 45 phút preset
    fireEvent.click(screen.getByRole("button", { name: "45 phút" }));
    expect(screen.getAllByText("45 phút").length).toBeGreaterThanOrEqual(2);
    expect(customInput).toHaveValue(45);
  });

  it("launches exam with custom typed duration", async () => {
    render(
      <BrowserRouter>
        <CustomExamModal
          isOpen={true}
          onClose={vi.fn()}
          subjectCode="OSG202"
        />
      </BrowserRouter>
    );

    const customInput = screen.getByRole("spinbutton", { name: "Tùy chỉnh số phút" });
    fireEvent.change(customInput, { target: { value: "90" } });

    fireEvent.click(screen.getByRole("button", { name: /Bắt đầu làm bài/i }));
    expect(startExamAttempt).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ durationMinutes: 90 })
    );
  });
});
