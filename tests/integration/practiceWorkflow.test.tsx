import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { PracticeWorkspaceView } from "@/features/practice/PracticeWorkspaceView";

describe("Practice Workflow Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderPractice = (path: string) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/subjects/:code/practice/:mode"
              element={<PracticeWorkspaceView />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("loads questions, zooms diagrams, renders optionByOptionAnalysis, and defers Cram commit until Continue", async () => {
    server.use(
      http.get("*/api/v1/questions/drills", () => {
        return HttpResponse.json([
          {
            question_id: "drill_only_1",
            subject_code: "MAD101",
            question_type: "single_choice",
            question_text: "Single batch card stem",
            image_url: "/static/exams/MAD101/Q1.webp",
            options: { A: "Opt A 1", B: "Opt B 1", C: "Opt C 1", D: "Opt D 1" },
          },
        ]);
      })
    );

    renderPractice("/subjects/MAD101/practice/cram");

    await waitFor(() => {
      expect(screen.getByText("Luyện thi cấp tốc")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /Hình minh họa câu 1/i })).toBeInTheDocument();
      expect(screen.queryByText("Single batch card stem")).not.toBeInTheDocument();
    });

    // Diagram zoom in Practice works
    fireEvent.click(screen.getByRole("button", { name: /Phóng to/i }));
    expect(screen.getByText(/125%/)).toBeInTheDocument();

    // Select wrong option A -> card MUST stay pinned with compact verdict ONLY (no inline prose) & no premature CramBatchModal!
    const optA = await screen.findByText(/Opt A 1/i);
    fireEvent.click(optA);

    expect(
      await screen.findByText(/Chưa chính xác — Đáp án đúng: C/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Phân tích từng đáp án/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Đúng theo công thức")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Opening on-demand "Xem giải thích AI" button reveals optionByOptionAnalysis & rationale inside AiAnswerModal
    fireEvent.click(screen.getByRole("button", { name: /Xem giải thích AI/i }));
    const aiDialog = await screen.findByRole("dialog", {
      name: /Giải thích chi tiết từ AI/i,
    });
    expect(
      within(aiDialog).getByText(/Phân tích từng phương án lựa chọn/i)
    ).toBeInTheDocument();
    expect(within(aiDialog).getByText("Đúng theo công thức")).toBeInTheDocument();
    fireEvent.click(within(aiDialog).getByRole("button", { name: /Đóng cửa sổ/i }));

    // Immediate Space right after evaluation (within 300ms guard) does not accidentally double-advance
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByRole("button", { name: /^Tiếp tục$/i })).toBeInTheDocument();

    // Explicit Continue commits answer -> requeues missed card so we try again -> pick C -> pin correct feedback -> Continue -> completes session -> in-state reset clears fuo_card_stats_MAD101
    fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));

    await waitFor(() => {
      expect(screen.getByText("Nhắc lại sau lỗi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Opt C 1/i));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));

    expect(
      await screen.findByText(/Tuyệt vời! Bạn đã hoàn thành toàn bộ bài luyện!/i)
    ).toBeInTheDocument();

    localStorage.setItem("fuo_card_stats_MAD101", JSON.stringify({ test: 1 }));
    fireEvent.click(screen.getByRole("button", { name: /Luyện lại từ đầu/i }));

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /Hình minh họa câu 1/i })).toBeInTheDocument();
      expect(localStorage.getItem("fuo_card_stats_MAD101")).toBeNull();
      expect(localStorage.getItem("fuo_cram_mastered_MAD101")).toBeNull();
    });
  });

  it("shows explicit API retry on network failure without offline fallback grading", async () => {
    let attempts = 0;
    server.use(
      http.post("*/api/v1/questions/:questionId/check", () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json({ detail: "Network error" }, { status: 503 });
        }
        return HttpResponse.json({
          question_id: "drill_1",
          selected_options: "A",
          correct_answer: "C",
          is_correct: false,
          ai_explanation: "Recovered explanation",
        });
      })
    );

    renderPractice("/subjects/MAD101/practice/learn");

    await waitFor(() => {
      expect(screen.getByText("Học ghi nhớ")).toBeInTheDocument();
      expect(screen.getAllByText(/Vòng 1/i).length).toBeGreaterThan(0);
    });

    const optBtn = await screen.findByRole("button", { name: /Đáp án A:/i });
    expect(optBtn).toBeEnabled();
    fireEvent.click(optBtn);

    expect(
      await screen.findByText(/Không thể kiểm tra đáp án lúc này/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Kiểm tra offline thành công/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Kiểm tra lại/i }));
    expect(
      await screen.findByText(/Chưa chính xác — Đáp án đúng: C/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Recovered explanation")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Xem giải thích AI/i }));
    const aiDialog = await screen.findByRole("dialog", {
      name: /Giải thích chi tiết từ AI/i,
    });
    expect(within(aiDialog).getByText("Recovered explanation")).toBeInTheDocument();
  });

  it("defers Learn round summary modal until user explicitly advances past the final card", async () => {
    server.use(
      http.get("*/api/v1/questions/drills", () => {
        return HttpResponse.json([
          {
            question_id: "learn_last_1",
            subject_code: "MAD101",
            question_type: "single_choice",
            question_text: "Final learn card stem",
            image_url: null,
            options: { A: "Alpha", B: "Beta", C: "Gamma", D: "Delta" },
          },
        ]);
      })
    );

    renderPractice("/subjects/MAD101/practice/learn");

    await waitFor(() => {
      expect(screen.getByText("Final learn card stem")).toBeInTheDocument();
    });

    // Miss on last card in round
    fireEvent.click(screen.getByText("Alpha"));
    expect(
      await screen.findByText(/Chưa chính xác — Đáp án đúng: C/i)
    ).toBeInTheDocument();
    // Modal must NOT hijack feedback
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Advance opens LearnRoundSummaryModal
    fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));
    expect(await screen.findByText(/Tổng kết Vòng 1/i)).toBeInTheDocument();
  });

  it("allows opening AI explanation before selecting any answer using non-empty probe without marking card answered", async () => {
    const checkRequests: string[] = [];
    server.use(
      http.get("*/api/v1/questions/drills", () => {
        return HttpResponse.json([
          {
            question_id: "probe_q_1",
            subject_code: "MAD101",
            question_type: "single_choice",
            question_text: "Text question before selection",
            image_url: null,
            options: { A: "First Opt", B: "Second Opt", C: "Third Opt", D: "Fourth Opt" },
          },
        ]);
      }),
      http.post("*/api/v1/questions/:questionId/check", async ({ request }) => {
        const body = (await request.json()) as { selected_options?: string };
        checkRequests.push(body.selected_options ?? "");
        return HttpResponse.json({
          question_id: "probe_q_1",
          selected_options: body.selected_options ?? "A",
          correct_answer: "C",
          is_correct: false,
          ai_explanation: "AI explanation works before picking an option.",
        });
      })
    );

    renderPractice("/subjects/MAD101/practice/cram");
    await waitFor(() => {
      expect(screen.getByText("Text question before selection")).toBeInTheDocument();
    });

    // Open AI explanation without picking any option
    fireEvent.click(screen.getByRole("button", { name: /Xem giải thích AI/i }));
    const aiDialog = await screen.findByRole("dialog", {
      name: /Giải thích chi tiết từ AI/i,
    });
    expect(
      within(aiDialog).getByText("AI explanation works before picking an option.")
    ).toBeInTheDocument();
    expect(checkRequests).toEqual(["A"]);
    expect(within(aiDialog).queryByText("Bạn chọn")).not.toBeInTheDocument();

    // Closing modal keeps options unlocked and unselected
    fireEvent.click(within(aiDialog).getByRole("button", { name: /Đóng cửa sổ/i }));
    expect(screen.getByRole("button", { name: /Đáp án A:/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.queryByText(/Chưa chính xác/i)).not.toBeInTheDocument();
  });

  it("supports switching between Chấm tức thì and Chờ tổng kết mid-session in Practice", async () => {
    const submittedChoices: string[] = [];
    server.use(
      http.get("*/api/v1/questions/drills", () => {
        return HttpResponse.json([
          {
            question_id: "deferred_1",
            subject_code: "MAD101",
            question_type: "single_choice",
            question_text: "Deferred Card One",
            image_url: null,
            options: { A: "Choice A1", B: "Choice B1", C: "Choice C1" },
          },
          {
            question_id: "deferred_2",
            subject_code: "MAD101",
            question_type: "single_choice",
            question_text: "Deferred Card Two",
            image_url: null,
            options: { A: "Choice A2", B: "Choice B2", C: "Choice C2" },
          },
        ]);
      }),
      http.post("*/api/v1/questions/:questionId/check", async ({ request }) => {
        const body = (await request.json()) as { selected_options?: string };
        submittedChoices.push(body.selected_options ?? "");
        return HttpResponse.json({
          question_id: "deferred_1",
          selected_options: body.selected_options ?? "C",
          correct_answer: "C",
          is_correct: body.selected_options === "C",
          ai_explanation: "Deferred mode rationale.",
        });
      })
    );

    renderPractice("/subjects/MAD101/practice/cram");
    await waitFor(() => {
      expect(screen.getByText(/Deferred Card (One|Two)/i)).toBeInTheDocument();
    });
    const firstCardTitle = screen.getByText(/Deferred Card (One|Two)/i).textContent;
    const expectedNextTitle =
      firstCardTitle === "Deferred Card One" ? "Deferred Card Two" : "Deferred Card One";

    // Switch header toggle to "Chờ tổng kết"
    const deferredBtn = screen.getByRole("button", { name: /Chờ tổng kết/i });
    fireEvent.click(deferredBtn);
    expect(deferredBtn).toHaveAttribute("aria-pressed", "true");

    // Pick A -> change mind to C -> no instant grading badge yet
    fireEvent.click(screen.getByRole("button", { name: /Đáp án A:/i }));
    expect(submittedChoices).toHaveLength(0);
    expect(screen.queryByText(/Chưa chính xác/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Đáp án C:/i }));
    expect(submittedChoices).toHaveLength(0);

    // Clicking "Tiếp tục" submits C and advances directly to the second card
    fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));
    await waitFor(() => {
      expect(screen.getByText(expectedNextTitle)).toBeInTheDocument();
    });
    expect(submittedChoices).toEqual(["C"]);
  });
});
