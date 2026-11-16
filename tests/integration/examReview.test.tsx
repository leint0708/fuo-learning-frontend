import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { ResultScoreCard } from "@/features/review/ResultScoreCard";
import { QuestionReviewItem } from "@/features/review/QuestionReviewItem";
import { ExamWorkspaceView } from "@/features/exam/ExamWorkspaceView";
import { useExamUiStore } from "@/stores/examUiStore";

describe("Exam Review Integration Tests", () => {
  it("renders pass status when score is >= 70%", () => {
    render(
      <ResultScoreCard
        examTitle="Discrete Mathematics FA25"
        totalQuestions={50}
        correctCount={40}
        percentageScore={80.0}
        totalScore={8.0}
        isPassed={true}
        durationSeconds={2400}
      />
    );

    expect(screen.getByText(/KẾT QUẢ: ĐẠT TIÊU CHUẨN/)).toBeInTheDocument();
    expect(screen.getByText("8.0/10")).toBeInTheDocument();
    expect(screen.getByText("80.0%")).toBeInTheDocument();
    expect(screen.getByText("40/50")).toBeInTheDocument();
  });

  it("renders fail status when score is < 70%", () => {
    render(
      <ResultScoreCard
        examTitle="Computer Networking FA25"
        totalQuestions={20}
        correctCount={10}
        percentageScore={50.0}
        totalScore={5.0}
        isPassed={false}
        durationSeconds={1200}
      />
    );

    expect(screen.getByText(/KẾT QUẢ: CHƯA ĐẠT/)).toBeInTheDocument();
    expect(screen.getByText("50.0%")).toBeInTheDocument();
  });

  it("renders question review item with user choice vs correct answer and AI explanation", () => {
    const mockItem = {
      questionId: "q_1",
      questionNumber: 1,
      questionIdCode: "Q1",
      questionType: "single_choice" as const,
      questionText: "Which layer handles routing in OSI?",
      imageUrl: null,
      options: { A: "Physical", B: "Network", C: "Transport" },
      selectedOptions: "B",
      correctAnswer: "B",
      isCorrect: true,
      aiExplanation: "Network layer handles IP addressing and packet routing.",
      aiModel: "gemini-3-flash-preview",
      optionByOptionAnalysis: { A: "Physical is layer 1", B: "Network is layer 3" },
      communityStats: {
        totalComments: 10,
        validVoteCount: 8,
        topAnswerVotes: 7,
        agreementRatio: 0.88,
        communityAnswer: "B",
      },
    };

    render(<QuestionReviewItem item={mockItem} index={0} />);

    expect(screen.getByText(/Câu 1 \(Q1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Trả lời đúng/)).toBeInTheDocument();
    expect(screen.getByText(/Cộng đồng: B/)).toBeInTheDocument();
    expect(screen.getByText(/Network layer handles IP addressing/)).toBeInTheDocument();

    // Test expanding option-by-option analysis
    const expandBtn = screen.getByText(/Chi tiết từng phương án/);
    fireEvent.click(expandBtn);

    expect(screen.getByText(/Physical is layer 1/)).toBeInTheDocument();
  });

  it("renders question review item with diagram image using resolved URL", () => {
    const mockItemWithImage = {
      questionId: "q_2",
      questionNumber: 2,
      questionIdCode: "Q2",
      questionType: "single_choice" as const,
      questionText: "Identify the truth table represented in the diagram.",
      imageUrl: "/static/exams/MAD101/MAD101 - FA25/Q2.webp",
      options: { A: "AND gate", B: "OR gate" },
      selectedOptions: "A",
      correctAnswer: "A",
      isCorrect: true,
      aiExplanation: "Standard AND gate truth table.",
      aiModel: "gemini-3-flash-preview",
      optionByOptionAnalysis: null,
      communityStats: null,
    };

    render(<QuestionReviewItem item={mockItemWithImage} index={1} />);

    const img = screen.getByRole("img", { name: /câu hỏi 2/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/static/exams/MAD101/MAD101%20-%20FA25/Q2.webp");

    // Check zoom controls exist (localized to Vietnamese)
    const zoomInBtn = screen.getByRole("button", { name: /Phóng to/i });
    const zoomOutBtn = screen.getByRole("button", { name: /Thu nhỏ/i });
    const originalBtn = screen.getByRole("button", { name: /Kích thước gốc/i });

    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();
    expect(originalBtn).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    // Unzoomed diagram viewport allows vertical touch scrolling (touch-pan-y)
    const viewport = img.closest(".relative");
    expect(viewport).not.toBeNull();
    expect(viewport!.className).toContain("touch-pan-y");
    expect(viewport!.className).not.toContain("touch-none");

    // Clicking Phóng to increases zoom to 125% and activates touch-none pan
    fireEvent.click(zoomInBtn);
    expect(screen.getByText("125%")).toBeInTheDocument();
    expect(viewport!.className).toContain("touch-none");

    // Clicking Kích thước gốc resets zoom to 100%
    fireEvent.click(originalBtn);
    expect(screen.getByText("100%")).toBeInTheDocument();

    // Ctrl + scroll wheel up zooms in to 125%
    fireEvent.wheel(viewport!, { ctrlKey: true, deltaY: -100 });
    expect(screen.getByText("125%")).toBeInTheDocument();

    // Ctrl + scroll wheel down zooms out to 100%
    fireEvent.wheel(viewport!, { ctrlKey: true, deltaY: 100 });
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});

describe("ExamWorkspaceView Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useExamUiStore.getState().resetSessionState();
    useExamUiStore.getState().setFeedbackMode("instant");
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderExamWorkspace = (attemptId = "att_mock_100") =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/attempts/${attemptId}`]}>
          <Routes>
            <Route path="/" element={<div>Catalog Home Route Reached</div>} />
            <Route path="/attempts/:attemptId" element={<ExamWorkspaceView />} />
            <Route
              path="/attempts/:attemptId/review"
              element={<div>Exam Review Route Reached</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("supports text-only mode, full option labels, keyboard shortcuts, clear selection, live save telemetry & retry, and no benchmark toggle", async () => {
    let saveAttempts = 0;

    server.use(
      http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
        return HttpResponse.json({
          attempt_id: params.attemptId,
          exam_id: "exam_txt",
          exam_title: "Unified Operating Cockpit Exam",
          status: "in_progress",
          started_at: new Date().toISOString(),
          expires_at: null,
          time_remaining_seconds: null,
          questions: [
            {
              question_id: "q_txt_1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "What is the negation of p AND q?",
              image_url: null,
              options: {
                A: "NOT p AND NOT q",
                B: "NOT p OR NOT q",
                C: "p OR q",
                D: "p IMPLIES q",
              },
              selected_options: null,
            },
            {
              question_id: "q_txt_2",
              question_number: 2,
              question_id_code: "Q2",
              question_type: "single_choice",
              question_text: "Second question stem for keyboard navigation",
              image_url: null,
              options: {
                A: "First alt",
                B: "Second alt",
                C: "Third alt",
                D: "Fourth alt",
              },
              selected_options: null,
            },
          ],
        });
      }),
      http.put("*/api/v1/attempts/:attemptId/answers", async ({ request }) => {
        saveAttempts += 1;
        const body = (await request.json()) as {
          question_id: string;
          selected_options: string;
        };
        if (saveAttempts === 1) {
          return HttpResponse.json({ detail: "Temporary save failure" }, { status: 500 });
        }
        return HttpResponse.json({
          question_id: body.question_id,
          selected_options: body.selected_options,
          saved_at: new Date().toISOString(),
        });
      })
    );

    renderExamWorkspace("att_untimed_1");

    await waitFor(() => {
      expect(screen.getByText("Unified Operating Cockpit Exam")).toBeInTheDocument();
      expect(screen.getByText("What is the negation of p AND q?")).toBeInTheDocument();
    });

    // Dead benchmarkMode toggle is removed; untimed elapsed stopwatch renders
    expect(screen.queryByText(/Answers:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Theo cộng đồng/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("exam-timer-box")).toHaveTextContent(/Không giới hạn/i);

    // Full option text renders in single_choice
    expect(screen.getByText("NOT p OR NOT q")).toBeInTheDocument();

    // Pressing key '2' selects option B -> save fails first -> error retry button appears
    fireEvent.keyDown(window, { key: "2" });

    expect(
      await screen.findByRole("button", { name: /Lỗi lưu — Thử lại/i })
    ).toBeInTheDocument();

    // Retrying save recovers to "Đã lưu"
    fireEvent.click(screen.getByRole("button", { name: /Lỗi lưu — Thử lại/i }));
    expect(await screen.findByText(/Đã lưu/i)).toBeInTheDocument();

    // Clear selection via "Bỏ chọn" works
    const clearBtn = screen.getByRole("button", { name: /Bỏ chọn/i });
    fireEvent.click(clearBtn);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Bỏ chọn/i })).not.toBeInTheDocument();
    });

    // ArrowRight navigates to question 2; '?' opens ShortcutHelpModal
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(
      await screen.findByText("Second question stem for keyboard navigation")
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "?" });
    expect(await screen.findByText(/Phím tắt bàn phím/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Đã hiểu/i }));
  });

  it("keeps Xem giải thích AI accessible in post_exam mode with lazy error/retry and non-blocking submit error recovery", async () => {
    useExamUiStore.getState().setFeedbackMode("post_exam");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    let aiCalls = 0;
    let submitCalls = 0;

    server.use(
      http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
        return HttpResponse.json({
          attempt_id: params.attemptId,
          exam_id: "exam_post",
          exam_title: "Post Exam Standard Mode",
          status: "in_progress",
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 1800 * 1000).toISOString(),
          time_remaining_seconds: 1800,
          questions: [
            {
              question_id: "q_post_1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Post-exam AI check question",
              image_url: null,
              options: {
                A: "Choice Alpha",
                B: "Choice Beta",
                C: "Choice Gamma",
                D: "Choice Delta",
              },
              selected_options: null,
            },
          ],
        });
      }),
      http.post("*/api/v1/questions/:questionId/check", () => {
        aiCalls += 1;
        if (aiCalls === 1) {
          return HttpResponse.json({ detail: "AI upstream offline" }, { status: 503 });
        }
        return HttpResponse.json({
          is_correct: false,
          correct_answer: "B",
          ai_explanation: "Verified explanation selecting Beta.",
          option_by_option_analysis: { B: "Beta satisfies the invariant." },
        });
      }),
      http.post("*/api/v1/attempts/:attemptId/submit", ({ params }) => {
        submitCalls += 1;
        if (submitCalls === 1) {
          return HttpResponse.json({ detail: "Submit timed out" }, { status: 500 });
        }
        return HttpResponse.json({
          attempt_id: params.attemptId,
          status: "completed",
          total_questions: 1,
          correct_answers_count: 1,
          total_score: 10,
          percentage_score: 100,
          is_passed: true,
          submitted_at: new Date().toISOString(),
          duration_seconds: 60,
        });
      })
    );

    renderExamWorkspace("att_post_exam_1");

    await waitFor(() => {
      expect(screen.getByText("Post-exam AI check question")).toBeInTheDocument();
    });

    // Open "AI Explanation" in post_exam mode before selecting any answer
    fireEvent.click(screen.getByRole("button", { name: /AI Explanation/i }));

    // First call errors -> no fake "C", shows explicit retry button
    expect(
      await screen.findByText(/Không thể tải phân tích AI lúc này/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Lựa chọn C/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Thử lại/i }));
    expect(await screen.findByText(/Lựa chọn B/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Verified explanation selecting Beta/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /đóng cửa sổ/i }));

    // Submit flow: first failure renders inline alert in modal without window.alert()
    fireEvent.click(screen.getByRole("button", { name: /^Nộp bài$/i }));
    const confirmDialog = await screen.findByRole("dialog");
    expect(
      within(confirmDialog).getByText(/Xác nhận nộp bài thi/i)
    ).toBeInTheDocument();

    fireEvent.click(
      within(confirmDialog).getByRole("button", { name: /^Nộp bài thi$/i })
    );
    expect(
      await within(confirmDialog).findByText(/Submit timed out/i)
    ).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();

    // Retry submit navigates to review route
    fireEvent.click(
      within(confirmDialog).getByRole("button", { name: /Thử nộp lại/i })
    );
    expect(await screen.findByText("Exam Review Route Reached")).toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it("requires confirmation before exiting exam and prevents duplicate AI buttons in instant mode", async () => {
    server.use(
      http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
        return HttpResponse.json({
          attempt_id: params.attemptId,
          exam_id: "exam_exit",
          exam_title: "Exit Confirmation Exam",
          status: "in_progress",
          started_at: new Date().toISOString(),
          expires_at: null,
          time_remaining_seconds: 1800,
          questions: [
            {
              question_id: "q_exit_1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Which is primary?",
              image_url: null,
              options: { A: "Red", B: "Green", C: "Blue" },
              selected_options: null,
            },
          ],
        });
      }),
      http.post("*/api/v1/questions/:questionId/check", () => {
        return HttpResponse.json({
          is_correct: true,
          correct_answer: "C",
          ai_explanation: "C is primary.",
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
          duration_seconds: 60,
        });
      })
    );

    renderExamWorkspace("att_exit_confirm_1");

    await waitFor(() => {
      expect(screen.getByText("Which is primary?")).toBeInTheDocument();
    });

    // Clicking "Thoát phòng thi" opens confirmation modal instead of navigating away immediately
    fireEvent.click(screen.getByRole("button", { name: /Thoát phòng thi/i }));
    const exitDialog = await screen.findByRole("dialog", {
      name: /Xác nhận thoát phòng thi/i,
    });
    expect(
      within(exitDialog).getByText(/Bạn có chắc muốn thoát & kết thúc bài thi lúc này/i)
    ).toBeInTheDocument();

    // Continue keeps user in exam
    fireEvent.click(
      within(exitDialog).getByRole("button", { name: /Tiếp tục làm bài/i })
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Which is primary?")).toBeInTheDocument();

    // In instant mode after answer evaluation, exactly ONE "AI Explanation" button appears
    fireEvent.click(screen.getByRole("button", { name: /Đáp án C:/i }));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /AI Explanation/i })
    ).toHaveLength(1);

    // Simulating Browser Back (popstate) triggers the exact same exit confirmation modal
    fireEvent(window, new PopStateEvent("popstate"));
    const exitDialog2 = await screen.findByRole("dialog", {
      name: /Xác nhận thoát phòng thi/i,
    });
    expect(
      within(exitDialog2).getByRole("button", { name: /Tiếp tục làm bài/i })
    ).toBeInTheDocument();
    fireEvent.click(
      within(exitDialog2).getByRole("button", { name: /Thoát & kết thúc bài thi/i })
    );
    expect(await screen.findByText("Exam Review Route Reached")).toBeInTheDocument();
  });

  it("queues multiple failed saves across questions and flushes all pending answers on retry/submit", async () => {
    const flushedPairs: Array<{ questionId: string; selected: string }> = [];
    let allowSaveSuccess = false;

    server.use(
      http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
        return HttpResponse.json({
          attempt_id: params.attemptId,
          exam_id: "exam_queue",
          exam_title: "Offline Queue Exam",
          status: "in_progress",
          started_at: new Date().toISOString(),
          expires_at: null,
          time_remaining_seconds: null,
          questions: [
            {
              question_id: "q_1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Queue question one?",
              image_url: null,
              options: { A: "Alpha", B: "Beta" },
              selected_options: null,
            },
            {
              question_id: "q_2",
              question_number: 2,
              question_id_code: "Q2",
              question_type: "single_choice",
              question_text: "Network layer protocol?",
              image_url: null,
              options: { A: "TCP", B: "IP" },
              selected_options: null,
            },
          ],
        });
      }),
      http.put("*/api/v1/attempts/:attemptId/answers", async ({ request }) => {
        const body = (await request.json()) as {
          question_id: string;
          selected_options: string;
        };
        if (!allowSaveSuccess) {
          return HttpResponse.json({ detail: "Offline" }, { status: 503 });
        }
        flushedPairs.push({
          questionId: body.question_id,
          selected: body.selected_options,
        });
        return HttpResponse.json({
          question_id: body.question_id,
          selected_options: body.selected_options,
          saved_at: new Date().toISOString(),
        });
      })
    );

    renderExamWorkspace("att_multi_fail_1");

    await waitFor(() => {
      expect(screen.getByText("Queue question one?")).toBeInTheDocument();
    });

    // Fail save on Q1
    fireEvent.click(screen.getByRole("button", { name: /Đáp án A:/i }));
    expect(await screen.findByText(/Lỗi lưu — Thử lại/i)).toBeInTheDocument();

    // Jump to Q2 and fail save on Q2 as well
    fireEvent.click(screen.getByRole("button", { name: /Câu 2/i }));
    await waitFor(() => {
      expect(screen.getByText("Network layer protocol?")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Đáp án B:/i }));
    const retrySaveBtn = await screen.findByRole("button", {
      name: /Lỗi lưu — Thử lại/i,
    });

    // Re-enable network and click Retry Save -> flushes BOTH Q1 and Q2
    allowSaveSuccess = true;
    fireEvent.click(retrySaveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Đã lưu/i)).toBeInTheDocument();
    });

    expect(flushedPairs).toEqual(
      expect.arrayContaining([
        { questionId: "q_1", selected: "A" },
        { questionId: "q_2", selected: "B" },
      ])
    );
  });

  it("supports switching answer source to Cộng đồng mid-exam via Settings popover and opens AI Explanation before picking an option", async () => {
    const aiProbeRequests: Array<{ selected?: string; benchmark?: string }> = [];
    server.use(
      http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
        return HttpResponse.json({
          attempt_id: params.attemptId,
          exam_id: "MAD101_SP26_FE",
          exam_title: "Toggle & AI Probe Exam",
          status: "in_progress",
          started_at: new Date().toISOString(),
          expires_at: null,
          time_remaining_seconds: 1800,
          questions: [
            {
              question_id: "q_probe_1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Pick a valid statement.",
              image_url: null,
              options: { A: "False one", B: "False two", C: "True statement" },
              selected_options: null,
            },
          ],
        });
      }),
      http.post("*/api/v1/questions/:questionId/check", async ({ request }) => {
        const body = (await request.json()) as {
          selected_options?: string;
          benchmark_mode?: string;
        };
        aiProbeRequests.push({
          selected: body.selected_options,
          benchmark: body.benchmark_mode,
        });
        return HttpResponse.json({
          is_correct: body.selected_options === "C",
          correct_answer: "C",
          benchmark_source: body.benchmark_mode === "community" ? "ai" : "ai",
          community_stats: null,
          ai_explanation: "C is the unique valid statement.",
        });
      })
    );

    renderExamWorkspace("att_toggle_probe_1");

    await waitFor(() => {
      expect(screen.getByText("Pick a valid statement.")).toBeInTheDocument();
    });

    // Click "AI Explanation" BEFORE selecting any option -> sends safe probe "A" and opens modal
    fireEvent.click(screen.getByRole("button", { name: /AI Explanation/i }));
    const aiDialog = await screen.findByRole("dialog", {
      name: /Giải thích chi tiết từ AI/i,
    });
    expect(
      within(aiDialog).getByText("C is the unique valid statement.")
    ).toBeInTheDocument();
    expect(aiProbeRequests).toEqual([{ selected: "A", benchmark: undefined }]);
    expect(within(aiDialog).queryByText("Bạn chọn")).not.toBeInTheDocument();

    fireEvent.click(within(aiDialog).getByRole("button", { name: /Đóng cửa sổ/i }));

    // Ensure no option was accidentally selected
    expect(screen.getByRole("button", { name: /Đáp án A:/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    // Open Settings ⚙ popover and toggle answer source to Cộng đồng
    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    const communityBtn = await screen.findByRole("button", { name: /^Cộng đồng$/i });
    fireEvent.click(communityBtn);
    expect(communityBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(window, { key: "Escape" });

    // Picking C sends benchmark_mode: "community", triggers instant grading & updates fuo_active_exams
    fireEvent.click(screen.getByRole("button", { name: /Đáp án C:/i }));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Chưa có dữ liệu cộng đồng — đang dùng đáp án AI/i)
    ).toBeInTheDocument();
    expect(aiProbeRequests[1]).toEqual({ selected: "C", benchmark: "community" });

    const stored = JSON.parse(localStorage.getItem("fuo_active_exams") || "[]") as Array<{
      attemptId: string;
      subjectCode?: string;
      answeredCount: number;
      feedbackMode: string;
    }>;
    const probeRecord = stored.find((e) => e.attemptId === "att_toggle_probe_1");
    expect(probeRecord).toBeDefined();
    expect(probeRecord?.subjectCode).toBe("MAD101");
    expect(probeRecord?.answeredCount).toBe(1);
    expect(probeRecord?.feedbackMode).toBe("instant");
  });

  it("restores persisted post_exam feedbackMode on reload and resets currentQuestionIndex on mount", async () => {
    useExamUiStore.getState().setQuestionIndex(5);
    useExamUiStore.getState().setFeedbackMode("instant");
    localStorage.setItem(
      "fuo_active_exams",
      JSON.stringify([
        {
          attemptId: "att_reload_post",
          examId: "MAD101_SP26_FE",
          examTitle: "Reload Post Exam",
          subjectCode: "MAD101",
          totalQuestions: 2,
          answeredCount: 0,
          startedAt: new Date().toISOString(),
          expiresAt: null,
          feedbackMode: "post_exam",
          updatedAt: new Date().toISOString(),
        },
      ])
    );

    server.use(
      http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
        return HttpResponse.json({
          attempt_id: params.attemptId,
          exam_id: "MAD101_SP26_FE",
          exam_title: "Reload Post Exam",
          status: "in_progress",
          started_at: new Date().toISOString(),
          expires_at: null,
          time_remaining_seconds: 1800,
          questions: [
            {
              question_id: "q_r1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Question One After Reload",
              image_url: null,
              options: { A: "First", B: "Second" },
              selected_options: null,
            },
            {
              question_id: "q_r2",
              question_number: 2,
              question_id_code: "Q2",
              question_type: "single_choice",
              question_text: "Question Two",
              image_url: null,
              options: { A: "First", B: "Second" },
              selected_options: null,
            },
          ],
        });
      })
    );

    renderExamWorkspace("att_reload_post");

    await waitFor(() => {
      expect(screen.getByText("Question One After Reload")).toBeInTheDocument();
    });

    // currentQuestionIndex reset to 0 and post_exam stayed locked (no instant grading call)
    expect(useExamUiStore.getState().currentQuestionIndex).toBe(0);
    expect(useExamUiStore.getState().feedbackMode).toBe("post_exam");
    fireEvent.click(screen.getByRole("button", { name: /Đáp án A:/i }));
    expect(screen.queryByText(/Chính xác|Chưa chính xác/i)).not.toBeInTheDocument();
  });

  it("auto-switches to AI on Q1 without community answer, restores persisted Cộng đồng on Q2, and keeps explicit overrides across attempts", async () => {
    const checkCalls: Array<{ questionId: string; benchmark?: string }> = [];
    server.use(
      http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
        return HttpResponse.json({
          attempt_id: params.attemptId,
          exam_id: "NWC204_FA26_FE",
          exam_title: "Multi-Question Answer Source Exam",
          status: "in_progress",
          started_at: new Date().toISOString(),
          expires_at: null,
          time_remaining_seconds: 1800,
          questions: [
            {
              question_id: "ex_q1",
              question_number: 1,
              question_id_code: "Q1",
              question_type: "single_choice",
              question_text: "Exam Q1 Without Community Votes",
              image_url: null,
              options: { A: "First", B: "Second" },
              selected_options: null,
            },
            {
              question_id: "ex_q2",
              question_number: 2,
              question_id_code: "Q2",
              question_type: "single_choice",
              question_text: "Exam Q2 With Community Consensus",
              image_url: null,
              options: { A: "First 2", B: "Second 2" },
              selected_options: null,
            },
            {
              question_id: "ex_q3",
              question_number: 3,
              question_id_code: "Q3",
              question_type: "single_choice",
              question_text: "Exam Q3 Final",
              image_url: null,
              options: { A: "First 3", B: "Second 3" },
              selected_options: null,
            },
          ],
        });
      }),
      http.put("*/api/v1/attempts/:attemptId/answers", async ({ request }) => {
        const body = (await request.json()) as {
          question_id: string;
          selected_options: string;
        };
        return HttpResponse.json({
          question_id: body.question_id,
          selected_options: body.selected_options,
          saved_at: new Date().toISOString(),
        });
      }),
      http.post("*/api/v1/questions/:questionId/check", async ({ params, request }) => {
        const questionId = String(params.questionId);
        const body = (await request.json()) as {
          selected_options?: string;
          benchmark_mode?: string;
        };
        checkCalls.push({ questionId, benchmark: body.benchmark_mode });

        if (questionId === "ex_q1") {
          return HttpResponse.json({
            question_id: questionId,
            selected_options: body.selected_options ?? "A",
            correct_answer: "A",
            is_correct: body.selected_options === "A",
            benchmark_source: "ai",
            community_stats: null,
            ai_explanation: "AI fallback for Exam Q1.",
          });
        }

        return HttpResponse.json({
          question_id: questionId,
          selected_options: body.selected_options ?? "B",
          correct_answer: "B",
          is_correct: body.selected_options === "B",
          benchmark_source: "community",
          community_stats: {
            total_comments: 8,
            valid_vote_count: 7,
            top_answer_votes: 6,
            agreement_ratio: 0.85,
            community_answer: "B",
          },
          ai_explanation: "Community consensus B.",
        });
      })
    );

    renderExamWorkspace("att_multi_source_1");
    await waitFor(() => {
      expect(screen.getByText("Exam Q1 Without Community Votes")).toBeInTheDocument();
    });

    // User fixes preference to Cộng đồng
    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^Cộng đồng$/i }));
    expect(localStorage.getItem("fuo_answer_source_preference")).toBe("community");
    fireEvent.keyDown(window, { key: "Escape" });

    // Selecting option on Q1 returns no community answer -> Q1 flips to Đáp án AI
    fireEvent.click(screen.getByRole("button", { name: /Đáp án A:/i }));
    expect(await screen.findByText(/Chưa có dữ liệu cộng đồng — đang dùng đáp án AI/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    expect(screen.getByRole("button", { name: /^Đáp án AI$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(localStorage.getItem("fuo_answer_source_preference")).toBe("community");
    fireEvent.keyDown(window, { key: "Escape" });

    // Move to Q2 -> active source automatically restores to Cộng đồng
    fireEvent.click(screen.getByRole("button", { name: /^Câu tiếp$/i }));
    await waitFor(() => {
      expect(screen.getByText("Exam Q2 With Community Consensus")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    expect(screen.getByRole("button", { name: /^Cộng đồng$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    fireEvent.keyDown(window, { key: "Escape" });

    // Check Q2 -> receives community answer and stays on Cộng đồng
    fireEvent.click(screen.getByRole("button", { name: /Đáp án B:/i }));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();
    expect(screen.queryByText(/Chưa có dữ liệu cộng đồng/i)).not.toBeInTheDocument();

    // User changes mind to Đáp án AI -> stays fixed at "ai" for Q3
    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Đáp án AI$/i }));
    expect(localStorage.getItem("fuo_answer_source_preference")).toBe("ai");
    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /^Câu tiếp$/i }));
    await waitFor(() => {
      expect(screen.getByText("Exam Q3 Final")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Đáp án B:/i }));
    await waitFor(() => {
      expect(checkCalls).toHaveLength(3);
    });

    expect(checkCalls).toEqual([
      { questionId: "ex_q1", benchmark: "community" },
      { questionId: "ex_q2", benchmark: "community" },
      { questionId: "ex_q3", benchmark: undefined },
    ]);
  });
});
