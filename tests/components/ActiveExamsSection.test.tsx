import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ActiveExamsSection } from "@/features/subjects/ActiveExamsSection";
import {
  getActiveExams,
  inferSubjectCode,
  removeActiveExam,
  upsertActiveExam,
} from "@/utils/activeExams";

describe("activeExams storage & ActiveExamsSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("infers subject code from examId or examTitle", () => {
    expect(inferSubjectCode("custom-MAD101", "Đề tùy chỉnh")).toBe("MAD101");
    expect(inferSubjectCode("MAD101_SP26_FE", "Spring 2026")).toBe("MAD101");
    expect(inferSubjectCode("exam_123", "CSD201 Final Exam")).toBe("CSD201");
  });

  it("prunes expired exams automatically and supports upserting/removing", () => {
    upsertActiveExam({
      attemptId: "att_expired",
      examId: "MAD101_OLD",
      examTitle: "Expired Exam",
      subjectCode: "MAD101",
      totalQuestions: 50,
      answeredCount: 5,
      startedAt: new Date(Date.now() - 7200_000).toISOString(),
      expiresAt: new Date(Date.now() - 10_000).toISOString(),
      feedbackMode: "post_exam",
      updatedAt: new Date().toISOString(),
    });

    upsertActiveExam({
      attemptId: "att_live",
      examId: "MAD101_LIVE",
      examTitle: "MAD101 - SP26 - FE",
      subjectCode: "MAD101",
      totalQuestions: 50,
      answeredCount: 12,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1800_000).toISOString(),
      feedbackMode: "instant",
      updatedAt: new Date().toISOString(),
    });

    const active = getActiveExams();
    expect(active).toHaveLength(1);
    expect(active[0]?.attemptId).toBe("att_live");

    removeActiveExam("att_live");
    expect(getActiveExams()).toHaveLength(0);
  });

  it("renders active exams filtered by subjectCode and allows dismissing entries", () => {
    upsertActiveExam({
      attemptId: "att_mad",
      examId: "MAD101_SP26_FE",
      examTitle: "MAD101 - SP26 - FE",
      subjectCode: "MAD101",
      totalQuestions: 50,
      answeredCount: 10,
      startedAt: new Date().toISOString(),
      expiresAt: null,
      feedbackMode: "post_exam",
      updatedAt: new Date().toISOString(),
    });

    upsertActiveExam({
      attemptId: "att_csd",
      examId: "CSD201_SP26_FE",
      examTitle: "CSD201 - SP26 - FE",
      subjectCode: "CSD201",
      totalQuestions: 30,
      answeredCount: 4,
      startedAt: new Date().toISOString(),
      expiresAt: null,
      feedbackMode: "instant",
      updatedAt: new Date().toISOString(),
    });

    render(
      <MemoryRouter>
        <ActiveExamsSection subjectCode="MAD101" />
      </MemoryRouter>
    );

    expect(screen.getByText(/Bài thi đang làm dở/i)).toBeInTheDocument();
    expect(screen.getByText("MAD101 - SP26 - FE")).toBeInTheDocument();
    expect(screen.getByText(/10\/50 câu/i)).toBeInTheDocument();
    expect(screen.queryByText("CSD201 - SP26 - FE")).not.toBeInTheDocument();

    const resumeLink = screen.getByRole("link", { name: /Tiếp tục làm bài/i });
    expect(resumeLink).toHaveAttribute("href", "/attempts/att_mad");

    fireEvent.click(
      screen.getByRole("button", { name: /Ẩn bài thi MAD101/i })
    );
    expect(screen.queryByText("MAD101 - SP26 - FE")).not.toBeInTheDocument();
    expect(getActiveExams("MAD101")).toHaveLength(0);
    expect(getActiveExams("CSD201")).toHaveLength(1);
  });
});
