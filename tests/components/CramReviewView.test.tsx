import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CramReviewView } from "@/features/practice/CramReviewView";
import {
  saveCramSessionSnapshot,
  loadCramMistakeDrill,
} from "@/utils/cramSessionStorage";
import type { CramSessionSnapshot } from "@/types/practice";

describe("CramReviewView Component & Cockpit Behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderCramReview = (initialPath = "/subjects/SWE201/practice/cram/review") =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/subjects/:code/practice/cram/review" element={<CramReviewView />} />
          <Route
            path="/subjects/:code/practice/cram"
            element={<div>Cram Target Route</div>}
          />
          <Route path="/subjects/:code" element={<div>Subject Detail Route</div>} />
        </Routes>
      </MemoryRouter>
    );

  const sampleMixedSnapshot: CramSessionSnapshot = {
    subjectCode: "SWE201",
    scope: "deck",
    endReason: "completed",
    completedAt: "2026-11-16T10:30:00.000Z",
    totalDeckSize: 20,
    cumulativeMasteredCount: 10,
    entries: [
      {
        question: {
          questionId: "q_1",
          questionNumber: 1,
          questionIdCode: "Q1",
          questionType: "single_choice",
          questionText: "Which model iterates in short sprints?",
          imageUrl: null,
          options: { A: "Waterfall", B: "Scrum", C: "Big Bang" },
        },
        sessionOrder: 1,
        attemptCount: 1,
        mistakeCount: 0,
        hadMistakes: false,
        isMasteredInSession: true,
        firstSelectedOptions: "B",
        lastSelectedOptions: "B",
        correctAnswer: "B",
        aiExplanation: "Scrum uses iterative time-boxed sprints.",
        optionByOptionAnalysis: { A: "Sequential", B: "Iterative", C: "Ad-hoc" },
        communityStats: null,
        lastAnsweredAt: "2026-11-16T10:25:00.000Z",
      },
      {
        question: {
          questionId: "q_5",
          questionNumber: 5,
          questionIdCode: "Q5",
          questionType: "single_choice",
          questionText: "What does SRS stand for?",
          imageUrl: null,
          options: {
            A: "Software Requirements Specification",
            B: "Simple Runtime Service",
          },
        },
        sessionOrder: 2,
        attemptCount: 3,
        mistakeCount: 2,
        hadMistakes: true,
        isMasteredInSession: true,
        firstSelectedOptions: "B",
        lastSelectedOptions: "A",
        correctAnswer: "A",
        aiExplanation: "SRS documents functional and non-functional requirements.",
        optionByOptionAnalysis: { A: "Correct expansion", B: "Distractor" },
        communityStats: null,
        lastAnsweredAt: "2026-11-16T10:29:00.000Z",
      },
    ],
  };

  it("renders empty/expired session fallback UI when no Cram snapshot exists", () => {
    renderCramReview("/subjects/SWE201/practice/cram/review");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Chưa có phiên ôn tập cấp tốc nào được ghi nhận",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bắt đầu luyện cấp tốc/i })).toBeInTheDocument();
  });

  it("displays KPI summary, mistake badges, first-choice comparison, filters, keyboard shortcuts, and AI modal", () => {
    saveCramSessionSnapshot(sampleMixedSnapshot);
    renderCramReview("/subjects/SWE201/practice/cram/review");

    // Summary KPIs
    expect(
      screen.getByRole("heading", { level: 1, name: /Tổng kết phiên luyện cấp tốc — SWE201/ })
    ).toBeInTheDocument();
    expect(screen.getByText("2 câu")).toBeInTheDocument();
    expect(screen.getByText("1/2 (50%)")).toBeInTheDocument();
    expect(screen.getByText("1 câu")).toBeInTheDocument();
    expect(screen.getByText("10/20")).toBeInTheDocument();

    // Struggled badge + first-attempt trace (zero duplicate badges or incomplete-session wording)
    expect(screen.getByText("Từng sai (2 lần)")).toBeInTheDocument();
    expect(screen.queryByText("Sai 2 lần")).not.toBeInTheDocument();
    expect(screen.getAllByText("Đã thuộc trong phiên")).toHaveLength(2);
    expect(screen.queryByText(/Chưa hoàn thành/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chưa thuộc/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("Lựa chọn đầu tiên chưa đúng: B → Sửa đúng: A")
    ).toBeInTheDocument();

    // Filter via keyboard shortcut '3' (Từng sai)
    fireEvent.keyDown(window, { key: "3" });
    expect(screen.queryByText("Which model iterates in short sprints?")).not.toBeInTheDocument();
    expect(screen.getByText("What does SRS stand for?")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Câu 5 (Q5)" })).toBeInTheDocument();

    // Shortcut 'e' expands breakdown and '1' restores all
    fireEvent.keyDown(window, { key: "e" });
    expect(screen.getByText("Correct expansion")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "1" });
    expect(screen.getByText("Which model iterates in short sprints?")).toBeInTheDocument();

    // Map click from filtered-out state resets filter cleanly
    fireEvent.keyDown(window, { key: "2" });
    expect(screen.queryByText("What does SRS stand for?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Câu 5: Từng sai" }));
    expect(screen.getByText("What does SRS stand for?")).toBeInTheDocument();

    // Shortcut 'a' opens shared AiAnswerModal
    fireEvent.keyDown(window, { key: "a" });
    expect(screen.getByText(/Giải thích chi tiết từ AI - Câu 5 \(Q5\)/)).toBeInTheDocument();
  });

  it("renders celebratory empty filter state on zero mistakes and triggers scoped mistake drill", () => {
    const cleanSnapshot: CramSessionSnapshot = {
      ...sampleMixedSnapshot,
      entries: [sampleMixedSnapshot.entries[0]!],
    };
    saveCramSessionSnapshot(cleanSnapshot);
    const firstRender = renderCramReview("/subjects/SWE201/practice/cram/review");

    fireEvent.click(screen.getByRole("button", { name: /Từng sai \(0\)/ }));
    expect(screen.getByText("Không có câu từng sai trong phiên này!")).toBeInTheDocument();
    firstRender.unmount();

    // Now test mistake drill launch with mixed snapshot
    saveCramSessionSnapshot(sampleMixedSnapshot);
    renderCramReview("/subjects/SWE201/practice/cram/review");

    fireEvent.click(screen.getAllByRole("button", { name: /Luyện lại 1 câu từng sai/i })[0]!);
    expect(loadCramMistakeDrill("SWE201")).toEqual(["q_5"]);
    expect(screen.getByText("Cram Target Route")).toBeInTheDocument();
  });

  it("gates full-deck reset behind a confirmation modal and cycles N across shuffled lower-numbered mistakes", () => {
    localStorage.setItem("fuo_cram_mastered_SWE201", JSON.stringify(["q_15", "q_3"]));
    const shuffledSnapshot: CramSessionSnapshot = {
      ...sampleMixedSnapshot,
      totalDeckSize: 2,
      cumulativeMasteredCount: 2,
      entries: [
        {
          ...sampleMixedSnapshot.entries[1]!,
          question: {
            ...sampleMixedSnapshot.entries[1]!.question,
            questionId: "q_15",
            questionNumber: 15,
            questionIdCode: "Q15",
          },
          sessionOrder: 1,
        },
        {
          ...sampleMixedSnapshot.entries[1]!,
          question: {
            ...sampleMixedSnapshot.entries[1]!.question,
            questionId: "q_3",
            questionNumber: 3,
            questionIdCode: "Q3",
          },
          sessionOrder: 2,
        },
      ],
    };
    saveCramSessionSnapshot(shuffledSnapshot);
    renderCramReview("/subjects/SWE201/practice/cram/review");

    // Verify N advances from Q15 -> lower-numbered Q3 in shuffled session order
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByRole("button", { name: "Câu 15: Từng sai" }).className).toContain(
      "ring-2"
    );
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByRole("button", { name: "Câu 3: Từng sai" }).className).toContain("ring-2");

    // Clicking Luyện lại từ đầu opens confirmation modal instead of wiping mastery immediately
    fireEvent.click(screen.getAllByRole("button", { name: /Luyện lại từ đầu/i })[0]!);
    const confirmDialog = screen.getByRole("dialog", {
      name: /Xác nhận đặt lại tiến độ cấp tốc/i,
    });
    fireEvent.click(within(confirmDialog).getByRole("button", { name: /^Hủy$/i }));
    expect(JSON.parse(localStorage.getItem("fuo_cram_mastered_SWE201") || "[]")).toEqual([
      "q_15",
      "q_3",
    ]);

    // Confirming reset wipes mastery and navigates cleanly
    fireEvent.click(screen.getAllByRole("button", { name: /Luyện lại từ đầu/i })[0]!);
    const secondDialog = screen.getByRole("dialog", {
      name: /Xác nhận đặt lại tiến độ cấp tốc/i,
    });
    fireEvent.click(
      within(secondDialog).getByRole("button", { name: /Xóa tiến độ & luyện lại/i })
    );
    expect(localStorage.getItem("fuo_cram_mastered_SWE201")).toBeNull();
    expect(screen.getByText("Cram Target Route")).toBeInTheDocument();
  });

  it("informs user of preserved localStorage mastery when browser-restart clears sessionStorage snapshot", () => {
    localStorage.setItem("fuo_cram_mastered_MAD101", JSON.stringify(["q1", "q2", "q3"]));
    renderCramReview("/subjects/MAD101/practice/cram/review");

    expect(screen.getByText(/Bạn đã thuộc 3 câu môn MAD101 từ các lần trước/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tiếp tục luyện cấp tốc/i })).toBeInTheDocument();
  });
});
