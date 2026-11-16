import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { ReviewView } from "@/features/review/ReviewView";
import { QuestionReviewItem } from "@/features/review/QuestionReviewItem";
import type { ReviewQuestionItem as ReviewItemType } from "@/types/review";

describe("ReviewView & QuestionReviewItem Hardening, Layout & Polish", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderReviewRoute = (initialEntry = "/attempts/att_review_1/review") =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/attempts/:attemptId/review" element={<ReviewView />} />
            <Route path="/review-no-id" element={<ReviewView />} />
            <Route path="/subjects/:code" element={<div>Subject Detail Route Reached</div>} />
            <Route
              path="/subjects/:code/practice/cram"
              element={<div>Cram Practice Route Reached</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("renders text-only question stems, full sorted option text, and highlights multi-choice keys in breakdown", () => {
    const multiChoiceItem: ReviewItemType = {
      questionId: "q_mc_1",
      questionNumber: 14,
      questionIdCode: "Q14",
      questionType: "multiple_choice",
      questionText: "Which two layers sit closest to physical transmission or framing?",
      imageUrl: null,
      options: {
        B: "Data Link layer",
        A: "Physical layer",
        C: "Session layer",
      },
      selectedOptions: "AB",
      correctAnswer: "AB",
      isCorrect: true,
      aiExplanation: "Layer 1 is Physical and Layer 2 is Data Link.",
      aiModel: "gemini-3-flash-preview",
      optionByOptionAnalysis: {
        A: "Handles raw bits over the wire.",
        B: "Handles MAC framing.",
        C: "Manages user sessions.",
      },
      communityStats: null,
    };

    render(<QuestionReviewItem item={multiChoiceItem} index={0} />);

    // Uses genuine questionNumber (14) instead of filtered array index
    expect(screen.getByRole("heading", { name: /Câu 14 \(Q14\)/ })).toBeInTheDocument();
    // Text stem & sorted option text are visible for recognition
    expect(
      screen.getByText("Which two layers sit closest to physical transmission or framing?")
    ).toBeInTheDocument();
    expect(screen.getByText("Physical layer")).toBeInTheDocument();
    expect(screen.getByText("Data Link layer")).toBeInTheDocument();
    expect(screen.getByText("Session layer")).toBeInTheDocument();
    // Calm neutral AI provenance copy (no noisy warning or raw model slug)
    expect(screen.getByText("Nguồn: Đáp án AI (chưa có bình chọn)")).toBeInTheDocument();
    expect(screen.queryByText(/gemini-3-flash-preview/i)).not.toBeInTheDocument();

    // Multi-choice breakdown highlights BOTH A and B as correct
    fireEvent.click(screen.getByRole("button", { name: /Chi tiết từng phương án/i }));
    const aText = screen.getByText("Handles raw bits over the wire.");
    const bText = screen.getByText("Handles MAC framing.");
    const cText = screen.getByText("Manages user sessions.");

    expect(aText.closest("div")?.className).toContain("border-color-3");
    expect(bText.closest("div")?.className).toContain("border-color-3");
    expect(cText.closest("div")?.className).not.toContain("border-color-3");
  });

  it("recovers gracefully when diagram image fails to load and supports retry", () => {
    const diagramItem: ReviewItemType = {
      questionId: "q_img_fail",
      questionNumber: 5,
      questionIdCode: "Q5",
      questionType: "single_choice",
      questionText: "Fallback stem explaining the missing circuit diagram.",
      imageUrl: "/static/broken-diagram.webp",
      options: { A: "10 Ohms", B: "20 Ohms" },
      selectedOptions: "A",
      correctAnswer: "B",
      isCorrect: false,
      aiExplanation: "Total resistance in series is 20 Ohms.",
      aiModel: "gemini-3-flash-preview",
      optionByOptionAnalysis: null,
      communityStats: null,
    };

    render(<QuestionReviewItem item={diagramItem} index={0} />);

    const img = screen.getByRole("img", { name: "Câu hỏi 5" });
    fireEvent.error(img);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Không thể tải hình ảnh sơ đồ của câu 5");
    expect(
      screen.getByText("Fallback stem explaining the missing circuit diagram.")
    ).toBeInTheDocument();

    const retryBtn = within(alert).getByRole("button", { name: /Thử tải lại ảnh/i });
    fireEvent.click(retryBtn);

    const retriedImg = screen.getByRole("img", { name: "Câu hỏi 5" });
    expect(retriedImg.getAttribute("src")).toContain("retry=1");
  });

  it("shows invalid route alert when attemptId is missing and supports API error retry", async () => {
    const invalidRender = renderReviewRoute("/review-no-id");
    expect(screen.getByRole("alert")).toHaveTextContent("Liên kết kết quả không hợp lệ");
    invalidRender.unmount();

    let calls = 0;
    server.use(
      http.get("*/api/v1/attempts/att_err_1/review", () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ detail: "Temporary gateway error" }, { status: 500 });
        }
        return HttpResponse.json({
          attempt_id: "att_err_1",
          exam_title: "SWE201 - Midterm Review",
          percentage_score: 100,
          is_passed: true,
          submitted_at: new Date().toISOString(),
          duration_seconds: 185,
          questions: [
            {
              question_id: "q_ok_1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "What is Agile?",
              image_url: null,
              options: { A: "Iterative framework", B: "Hardware bus" },
              selected_options: "A",
              correct_answer: "A",
              is_correct: true,
              ai_explanation: "Agile emphasizes iterative delivery.",
              ai_model: "gemini-3-flash-preview",
              option_by_option_analysis: null,
              community_stats: null,
            },
          ],
        });
      })
    );

    renderReviewRoute("/attempts/att_err_1/review");

    const errorAlert = await screen.findByRole("alert");
    expect(errorAlert).toHaveTextContent("Temporary gateway error");

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "SWE201 - Midterm Review" })
      ).toBeInTheDocument();
    });

    // Filtering "Sai (0)" on a 100% attempt shows a celebratory empty state with reset action
    fireEvent.click(screen.getByRole("button", { name: /Sai \(0\)/ }));
    expect(
      screen.getByText("Tuyệt vời! Bạn không sai câu nào trong bài thi này.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả câu hỏi" }));
    expect(screen.getByText("What is Agile?")).toBeInTheDocument();
  });

  it("preserves question numbering on filter, supports keyboard shortcuts, AiAnswerModal parity, and Cram CTA", async () => {
    server.use(
      http.get("*/api/v1/attempts/att_mixed_1/review", () => {
        return HttpResponse.json({
          attempt_id: "att_mixed_1",
          exam_title: "SWE201 - Final Mock Exam",
          percentage_score: 50,
          is_passed: false,
          submitted_at: new Date().toISOString(),
          duration_seconds: 300,
          questions: [
            {
              question_id: "q_1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "First question stem",
              image_url: null,
              options: { A: "Alpha", B: "Beta" },
              selected_options: "A",
              correct_answer: "A",
              is_correct: true,
              ai_explanation: "Alpha is right.",
              ai_model: "gemini-3-flash-preview",
              option_by_option_analysis: { A: "Correct", B: "Incorrect" },
              community_stats: null,
            },
            {
              question_id: "q_2",
              question_number: 2,
              question_id_code: "Q2",
              question_type: "single_choice",
              question_text: "Second question stem (missed)",
              image_url: null,
              options: { A: "Wrong opt", B: "Right opt" },
              selected_options: "A",
              correct_answer: "B",
              is_correct: false,
              ai_explanation: "Right opt satisfies requirement.",
              ai_model: "gemini-3-flash-preview",
              option_by_option_analysis: { A: "Violates constraint", B: "Matches constraint" },
              community_stats: null,
            },
          ],
        });
      })
    );

    renderReviewRoute("/attempts/att_mixed_1/review");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "SWE201 - Final Mock Exam" })
      ).toBeInTheDocument();
    });

    // Keyboard shortcut '3' filters to incorrect only while preserving "Câu 2 (Q2)"
    fireEvent.keyDown(window, { key: "3" });
    expect(screen.queryByText("First question stem")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Câu 2 (Q2)" })).toBeInTheDocument();

    // Keyboard shortcut 'e' expands breakdown, '1' restores all questions
    fireEvent.keyDown(window, { key: "e" });
    expect(screen.getByText("Matches constraint")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "1" });
    expect(screen.getByText("First question stem")).toBeInTheDocument();

    // Open full AiAnswerModal parity view
    const openModalBtns = screen.getAllByRole("button", { name: "Xem khung AI" });
    fireEvent.click(openModalBtns[0]!);
    expect(
      screen.getByText(/Giải thích chi tiết từ AI - Câu 1 \(Q1\)/)
    ).toBeInTheDocument();

    // Close modal and navigate directly into Cram Mode
    fireEvent.keyDown(window, { key: "Escape" });
    const cramBtns = screen.getAllByRole("button", { name: /Ôn cấp tốc/i });
    fireEvent.click(cramBtns[0]!);
    expect(await screen.findByText("Cram Practice Route Reached")).toBeInTheDocument();
  });
});
