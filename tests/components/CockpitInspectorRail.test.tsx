import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CockpitInspectorRail } from "@/features/workspace/CockpitInspectorRail";
import { CockpitHeader } from "@/features/workspace/CockpitHeader";
import { StudyCockpitShell } from "@/features/workspace/StudyCockpitShell";

describe("Rebuilt Cockpit Components (Inspector Rail, Header Popover, 3-Zone Shell)", () => {
  it("renders Cram/Learn Mastery stats card, multi-choice keypad with Xác nhận CTA, and expands pool accordion", () => {
    const onSelectOption = vi.fn();
    const onSubmitMultiChoice = vi.fn();

    render(
      <CockpitInspectorRail
        mode="cram"
        options={{ A: "Alpha", B: "Beta", C: "Gamma", D: "Delta" }}
        sortedOptionKeys={["A", "B", "C", "D"]}
        selectedOptions="BC"
        questionType="multiple_choice"
        feedbackMode="instant"
        hasInlineCardOptions={false}
        onSelectOption={onSelectOption}
        onSubmitMultiChoice={onSubmitMultiChoice}
        statsSummaryLabel="4 đã thuộc"
        subProgressText="Đợt 1/3 • Còn 6 thẻ"
        masteryBadge={{ label: "Nhắc lại sau lỗi", tone: "warning" }}
        navigatorItems={[
          { id: "c1", number: 1, isAnswered: true, isCurrent: false, isCorrect: true },
          { id: "c2", number: 2, isAnswered: false, isCurrent: true, isCorrect: null },
        ]}
      />
    );

    expect(screen.getByText("Tiến độ cấp tốc")).toBeInTheDocument();
    expect(screen.getByText("4 đã thuộc")).toBeInTheDocument();
    expect(screen.getByText("Đợt 1/3 • Còn 6 thẻ")).toBeInTheDocument();
    expect(screen.getByText("Nhắc lại sau lỗi")).toBeInTheDocument();
    expect(screen.getByText("2✓")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Xác nhận \(2\)/i });
    fireEvent.click(confirmBtn);
    expect(onSubmitMultiChoice).toHaveBeenCalledTimes(1);

    // Expand batch card overview accordion
    const accordionBtn = screen.getByRole("button", { name: /Thẻ trong đợt \(2\)/i });
    expect(accordionBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(accordionBtn);
    expect(accordionBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTitle("Câu 1")).toBeInTheDocument();
    expect(screen.getByTitle("Câu 2")).toBeInTheDocument();
  });

  it("supports collapsing and expanding the right inspector rail inside StudyCockpitShell", () => {
    render(
      <StudyCockpitShell
        header={<div>Header</div>}
        stageContent={<div>Paper Question Card</div>}
        navigatorContent={
          <CockpitInspectorRail
            mode="exam"
            options={{ A: "Opt A", B: "Opt B" }}
            sortedOptionKeys={["A", "B"]}
            selectedOptions="A"
            feedbackMode="post_exam"
            onSelectOption={vi.fn()}
            navigatorItems={[{ id: "q1", number: 1, isAnswered: true, isCurrent: true }]}
            answeredCount={1}
            totalQuestions={1}
            onSelectQuestion={vi.fn()}
          />
        }
        mobileStatusLabel="1/1"
        onOpenAiAnalysis={vi.fn()}
      />
    );

    expect(screen.getByText("Câu hỏi (1/1 đã trả lời):")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Thu gọn bảng thông tin/i }));
    expect(screen.queryByText("Câu hỏi (1/1 đã trả lời):")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mở rộng bảng thông tin/i }));
    expect(screen.getByText("Câu hỏi (1/1 đã trả lời):")).toBeInTheDocument();
  });

  it("switches practice modes via header dropdown and toggles feedback mode inside ⚙ Settings popover", () => {
    const onSelectMode = vi.fn();
    const onFeedbackChange = vi.fn();

    render(
      <MemoryRouter>
        <Routes>
          <Route
            path="*"
            element={
              <CockpitHeader
                title="Luyện thi cấp tốc"
                exitLabel="Thoát"
                onExit={vi.fn()}
                progressLabel="1/12 câu"
                progressCurrent={1}
                progressTotal={12}
                modeSwitcher={{
                  currentMode: "cram",
                  label: "Cram",
                  options: [
                    { value: "cram", label: "Luyện thi (Cram)" },
                    { value: "learn", label: "Ghi nhớ (Learn)" },
                  ],
                  onSelectMode,
                }}
                modeToggle={{
                  ariaLabel: "Chế độ chấm điểm",
                  value: "instant",
                  options: [
                    { value: "instant", label: "Chấm tức thì" },
                    { value: "deferred", label: "Chờ tổng kết" },
                  ],
                  onChange: onFeedbackChange,
                }}
                onOpenShortcuts={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Cram/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Ghi nhớ \(Learn\)/i }));
    expect(onSelectMode).toHaveBeenCalledWith("learn");

    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    fireEvent.click(screen.getByRole("button", { name: /Chờ tổng kết/i }));
    expect(onFeedbackChange).toHaveBeenCalledWith("deferred");
  });
});
