import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { PracticeWorkspaceView } from "@/features/practice/PracticeWorkspaceView";
import { CramReviewView } from "@/features/practice/CramReviewView";
import { loadCramSessionSnapshot } from "@/utils/cramSessionStorage";

describe("Practice Workflow Integration", () => {
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

  const renderPractice = (path: string) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/subjects/:code"
              element={<div>Subject Detail Route Reached</div>}
            />
            <Route
              path="/subjects/:code/practice/cram/review"
              element={<CramReviewView />}
            />
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

    // Select wrong option A via synced keypad -> card MUST stay pinned with compact verdict ONLY (no inline prose) & no premature CramBatchModal!
    const optA = await screen.findByRole("button", { name: /Đáp án A: Opt A 1/i });
    fireEvent.click(optA);

    expect(
      await screen.findByText(/Chưa chính xác — Đáp án đúng: C/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Phân tích từng đáp án/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Đúng theo công thức")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Opening on-demand "AI Explanation" button reveals optionByOptionAnalysis & rationale inside AiAnswerModal
    fireEvent.click(screen.getByRole("button", { name: /AI Explanation/i }));
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
      expect(screen.getAllByText("Nhắc lại sau lỗi").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /Đáp án C: Opt C 1/i }));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));

    // Completing Cram deck automatically transitions to CramReviewView
    expect(
      await screen.findByText("HOÀN THÀNH PHIÊN CẤP TỐC")
    ).toBeInTheDocument();
    expect(screen.getByText("Từng sai (1 lần)")).toBeInTheDocument();
    expect(loadCramSessionSnapshot("MAD101")?.endReason).toBe("completed");

    localStorage.setItem("fuo_card_stats_MAD101", JSON.stringify({ test: 1 }));
    fireEvent.click(screen.getAllByRole("button", { name: /Luyện lại từ đầu/i })[0]!);

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

    fireEvent.click(screen.getByRole("button", { name: /AI Explanation/i }));
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
    fireEvent.click(screen.getByRole("button", { name: /AI Explanation/i }));
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

  it("supports switching answer source to Cộng đồng mid-session and renders Learn dot legend", async () => {
    const benchmarkModes: Array<string | undefined> = [];
    server.use(
      http.get("*/api/v1/questions/drills", () => {
        return HttpResponse.json([
          {
            question_id: "src_1",
            subject_code: "MAD101",
            question_type: "single_choice",
            question_text: "Source Toggle Card One",
            image_url: null,
            options: { A: "Choice A1", B: "Choice B1", C: "Choice C1" },
          },
          {
            question_id: "src_2",
            subject_code: "MAD101",
            question_type: "single_choice",
            question_text: "Source Toggle Card Two",
            image_url: null,
            options: { A: "Choice A2", B: "Choice B2", C: "Choice C2" },
          },
        ]);
      }),
      http.post("*/api/v1/questions/:questionId/check", async ({ request }) => {
        const body = (await request.json()) as {
          selected_options?: string;
          benchmark_mode?: string;
        };
        benchmarkModes.push(body.benchmark_mode);
        return HttpResponse.json({
          question_id: "src_1",
          selected_options: body.selected_options ?? "C",
          correct_answer: "C",
          is_correct: body.selected_options === "C",
          benchmark_source: "ai",
          community_stats: null,
          ai_explanation: "AI fallback rationale.",
        });
      })
    );

    renderPractice("/subjects/MAD101/practice/learn");
    await waitFor(() => {
      expect(screen.getByText(/Source Toggle Card (One|Two)/i)).toBeInTheDocument();
    });

    // Learn dot legend renders live counts in header
    expect(screen.getByText(/Đã thuộc \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Đang học \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Chưa học \(0\)/i)).toBeInTheDocument();

    // Open Settings ⚙ popover and switch answer source to "Cộng đồng"
    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    const communityBtn = await screen.findByRole("button", { name: /^Cộng đồng$/i });
    fireEvent.click(communityBtn);
    expect(communityBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(window, { key: "Escape" });

    // Pick C -> sends benchmark_mode: "community" and shows non-blocking fallback notice when community votes are absent
    fireEvent.click(screen.getByRole("button", { name: /Đáp án C:/i }));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Chưa có dữ liệu cộng đồng — đang dùng đáp án AI/i)
    ).toBeInTheDocument();
    expect(benchmarkModes).toEqual(["community"]);
    expect(localStorage.getItem("fuo_answer_source_preference")).toBe("community");

    // Settings reflects temporary AI fallback on current question while keeping preference saved
    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    expect(screen.getByRole("button", { name: /^Đáp án AI$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText(/Sang câu sau sẽ tự động quay lại Cộng đồng/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });

    // Active header Reset asks confirmation before wiping mastery progress
    fireEvent.click(screen.getByRole("button", { name: /Luyện lại từ đầu/i }));
    const resetDialog = await screen.findByRole("dialog", {
      name: /Xác nhận đặt lại tiến độ/i,
    });
    fireEvent.click(within(resetDialog).getByRole("button", { name: /^Hủy$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("persists Cộng đồng across mode switch/remount, restores Cộng đồng after Q1 AI fallback on next question, and honors explicit change to AI", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    try {
      const benchmarkRequests: Array<{ questionId: string; benchmark?: string }> = [];
    server.use(
      http.get("*/api/v1/questions/drills", () => {
        return HttpResponse.json([
          {
            question_id: "persist_q1",
            subject_code: "PRF192",
            question_type: "single_choice",
            question_text: "Persist Question 1 (No Community)",
            image_url: null,
            options: { A: "Opt A1", B: "Opt B1", C: "Opt C1" },
          },
          {
            question_id: "persist_q2",
            subject_code: "PRF192",
            question_type: "single_choice",
            question_text: "Persist Question 2 (Has Community)",
            image_url: null,
            options: { A: "Opt A2", B: "Opt B2", C: "Opt C2" },
          },
          {
            question_id: "persist_q3",
            subject_code: "PRF192",
            question_type: "single_choice",
            question_text: "Persist Question 3",
            image_url: null,
            options: { A: "Opt A3", B: "Opt B3", C: "Opt C3" },
          },
        ]);
      }),
      http.post("*/api/v1/questions/:questionId/check", async ({ params, request }) => {
        const questionId = String(params.questionId);
        const body = (await request.json()) as {
          selected_options?: string;
          benchmark_mode?: string;
        };
        benchmarkRequests.push({ questionId, benchmark: body.benchmark_mode });

        if (questionId === "persist_q1") {
          return HttpResponse.json({
            question_id: questionId,
            selected_options: body.selected_options ?? "A",
            correct_answer: "A",
            is_correct: body.selected_options === "A",
            benchmark_source: "ai",
            community_stats: null,
            ai_explanation: "AI fallback for Q1.",
          });
        }

        if (questionId === "persist_q2") {
          return HttpResponse.json({
            question_id: questionId,
            selected_options: body.selected_options ?? "B",
            correct_answer: "B",
            is_correct: body.selected_options === "B",
            benchmark_source: "community",
            community_stats: {
              total_comments: 6,
              valid_vote_count: 5,
              top_answer_votes: 4,
              agreement_ratio: 0.8,
              community_answer: "B",
            },
            ai_explanation: "Community consensus is B.",
          });
        }

        return HttpResponse.json({
          question_id: questionId,
          selected_options: body.selected_options ?? "C",
          correct_answer: "C",
          is_correct: body.selected_options === "C",
          benchmark_source: "ai",
          community_stats: null,
          ai_explanation: "Q3 AI answer.",
        });
      })
    );

    const firstRender = renderPractice("/subjects/PRF192/practice/learn");
    await waitFor(() => {
      expect(screen.getByText(/Persist Question [123]/i)).toBeInTheDocument();
    });

    // Fix preference to Cộng đồng once in Learn
    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^Cộng đồng$/i }));
    expect(localStorage.getItem("fuo_answer_source_preference")).toBe("community");
    fireEvent.keyDown(window, { key: "Escape" });

    // Unmount and switch to Cram mode (simulating mode switch / reload) -> Cộng đồng stays fixed
    firstRender.unmount();
    renderPractice("/subjects/PRF192/practice/cram");
    await waitFor(() => {
      expect(screen.getByText("Persist Question 1 (No Community)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    expect(screen.getByRole("button", { name: /^Cộng đồng$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    fireEvent.keyDown(window, { key: "Escape" });

    // Q1 lacks community data -> auto-switches current question active source to Đáp án AI
    fireEvent.click(screen.getByRole("button", { name: /Đáp án A:/i }));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    expect(screen.getByRole("button", { name: /^Đáp án AI$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(localStorage.getItem("fuo_answer_source_preference")).toBe("community");
    fireEvent.keyDown(window, { key: "Escape" });

    // Advance to Q2 -> active source automatically restores to Cộng đồng
    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));
    await waitFor(() => {
      expect(screen.getByText("Persist Question 2 (Has Community)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    expect(screen.getByRole("button", { name: /^Cộng đồng$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.queryByText(/Sang câu sau sẽ tự động quay lại Cộng đồng/i)
    ).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });

    // Check Q2 -> uses benchmark_mode: "community" and stays Cộng đồng because Q2 has valid votes
    fireEvent.click(screen.getByRole("button", { name: /Đáp án B:/i }));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Chưa có dữ liệu cộng đồng — đang dùng đáp án AI/i)
    ).not.toBeInTheDocument();

    // Advance to Q3, then explicitly change mind to Đáp án AI -> persists "ai"
    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục/i }));
    await waitFor(() => {
      expect(screen.getByText("Persist Question 3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Đáp án AI$/i }));
    expect(localStorage.getItem("fuo_answer_source_preference")).toBe("ai");
    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /Đáp án C:/i }));
    expect(await screen.findByText(/Chính xác! Giỏi lắm!/i)).toBeInTheDocument();

      expect(benchmarkRequests).toEqual([
        { questionId: "persist_q1", benchmark: "community" },
        { questionId: "persist_q2", benchmark: "community" },
        { questionId: "persist_q3", benchmark: undefined },
      ]);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("exits straight to subject detail when quitting via Thoát, opens review after each finished Cram batch/session, and supports scoped ?scope=mistakes re-drill", async () => {
    const cramDeck = Array.from({ length: 11 }, (_, idx) => ({
      question_id: `c_${idx + 1}`,
      subject_code: "SWE201",
      question_type: "single_choice",
      question_text: `Card ${idx + 1} Concept`,
      image_url: null,
      options: { A: `Wrong A${idx + 1}`, C: `Right C${idx + 1}` },
    }));

    server.use(
      http.get("*/api/v1/questions/drills", () => HttpResponse.json(cramDeck)),
      http.post("*/api/v1/questions/:questionId/check", async ({ params, request }) => {
        const body = (await request.json()) as { selected_options: string };
        return HttpResponse.json({
          question_id: String(params.questionId),
          selected_options: body.selected_options,
          correct_answer: "C",
          is_correct: body.selected_options === "C",
          ai_explanation: "C is the verified answer.",
          option_by_option_analysis: { A: "Incorrect choice", C: "Correct choice" },
        });
      })
    );

    // 1) Exiting via Thoát mid-batch after answering cards returns directly to subject detail with no review snapshot
    const earlyExitRender = renderPractice("/subjects/SWE201/practice/cram");
    await screen.findByText("Luyện thi cấp tốc");
    fireEvent.click(screen.getByRole("button", { name: /Đáp án C:/i }));
    await screen.findByText(/Chính xác! Giỏi lắm!/i);
    fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Thoát/i }));
    expect(await screen.findByText("Subject Detail Route Reached")).toBeInTheDocument();
    expect(loadCramSessionSnapshot("SWE201")).toBeNull();
    earlyExitRender.unmount();
    localStorage.clear();

    // 2) Finishing Batch 1 (10 cards) opens CramReviewView directly for the 10 learned questions
    renderPractice("/subjects/SWE201/practice/cram");
    await screen.findByText("Luyện thi cấp tốc");
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByRole("button", { name: /Đáp án C:/i }));
      await screen.findByText(/Chính xác! Giỏi lắm!/i);
      fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));
    }

    expect(await screen.findByText("HOÀN THÀNH ĐỢT ÔN TẬP")).toBeInTheDocument();
    expect(screen.getByText("10 câu")).toBeInTheDocument();
    expect(loadCramSessionSnapshot("SWE201")?.entries).toHaveLength(10);

    // 3) Continue next unmastered batch -> loads Card 11 -> miss once then master -> finishes full session -> opens review & mistake drill
    fireEvent.click(screen.getAllByRole("button", { name: /Tiếp tục đợt chưa học/i })[0]!);
    await screen.findByText("Card 11 Concept");

    fireEvent.click(screen.getByRole("button", { name: /Đáp án A:/i }));
    await screen.findByText(/Chưa chính xác/i);
    fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));

    fireEvent.click(screen.getByRole("button", { name: /Đáp án C:/i }));
    await screen.findByText(/Chính xác! Giỏi lắm!/i);
    fireEvent.click(screen.getByRole("button", { name: /^Tiếp tục$/i }));

    expect(await screen.findByText("HOÀN THÀNH PHIÊN CẤP TỐC")).toBeInTheDocument();
    const saved = loadCramSessionSnapshot("SWE201");
    expect(saved?.endReason).toBe("completed");
    expect(saved?.entries).toHaveLength(1);
    expect(screen.queryByText(/Chưa hoàn thành/i)).not.toBeInTheDocument();

    // 4) Launch scoped mistake re-drill -> loads strictly the missed card
    fireEvent.click(screen.getAllByRole("button", { name: /Luyện lại 1 câu từng sai/i })[0]!);
    expect(await screen.findByText("Luyện lại câu từng sai")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Ôn câu từng sai: 0/1 câu" })
    ).toBeInTheDocument();
  });

  it("requests the full subject bank without 50/60 caps and loads all >60 questions in both Cram and Learn modes", async () => {
    const requestedUrls: string[] = [];
    const fullDeck = Array.from({ length: 65 }, (_, idx) => ({
      question_id: `full_${idx + 1}`,
      subject_code: "NWC204",
      question_type: "single_choice",
      question_text: `Full Bank Question ${idx + 1}`,
      image_url: null,
      options: { A: "A", B: "B", C: "C", D: "D" },
    }));

    server.use(
      http.get("*/api/v1/questions/drills", ({ request }) => {
        requestedUrls.push(request.url);
        return HttpResponse.json(fullDeck);
      })
    );

    const cramRender = renderPractice("/subjects/NWC204/practice/cram");
    await waitFor(() => {
      expect(screen.getByText(/Đợt 1\/7/i)).toBeInTheDocument();
    });
    expect(requestedUrls[0]).toContain("subject_code=NWC204");
    expect(requestedUrls[0]).toContain("all=true");
    expect(requestedUrls[0]).toContain("count=10000");

    cramRender.unmount();

    renderPractice("/subjects/NWC204/practice/learn");
    await waitFor(() => {
      expect(screen.getByText(/Đang học \(7\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Chưa học \(58\)/i)).toBeInTheDocument();
    });
  });
});
