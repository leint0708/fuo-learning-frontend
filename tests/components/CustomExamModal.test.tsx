import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { CustomExamModal } from "@/features/subjects/CustomExamModal";

// Mock API and store
vi.mock("@/api/attempts", () => ({
  startExamAttempt: vi.fn().mockResolvedValue({ attemptId: "attempt-test-123" }),
}));

describe("CustomExamModal", () => {
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
});
