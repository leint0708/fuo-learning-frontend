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

  it("keeps the desktop inspector rail permanently visible without a collapse toggle and renders a single-line mastery badge", () => {
    const { container } = render(
      <StudyCockpitShell
        hasVisualMedia={true}
        header={<div>Header</div>}
        stageContent={<div>Paper Question Card</div>}
        navigatorContent={
          <CockpitInspectorRail
            mode="cram"
            options={{ A: "Opt A", B: "Opt B" }}
            sortedOptionKeys={["A", "B"]}
            selectedOptions="A"
            feedbackMode="instant"
            onSelectOption={vi.fn()}
            statsSummaryLabel="0 đã thuộc"
            navigatorItems={[{ id: "q1", number: 1, isAnswered: true, isCurrent: true }]}
          />
        }
        mobileStatusLabel="1/1"
        onOpenAiAnalysis={vi.fn()}
      />
    );

    expect(screen.getByText("Thông tin câu hỏi:")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thu gọn bảng thông tin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mở rộng bảng thông tin/i })).not.toBeInTheDocument();

    const masteryPill = screen.getByText("0 đã thuộc");
    expect(masteryPill.className).toContain("whitespace-nowrap");

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot.className).toContain("lg:h-dvh");
    expect(shellRoot.className).toContain("lg:overflow-hidden");
  });

  it("switches practice modes via header dropdown, toggles answer source inside ⚙ Settings popover, and renders mode-specific progress bars", () => {
    const onSelectMode = vi.fn();
    const onAnswerSourceChange = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <Routes>
          <Route
            path="*"
            element={
              <CockpitHeader
                title="Luyện thi cấp tốc"
                exitLabel="Thoát"
                onExit={vi.fn()}
                progressLabel="24/50 câu"
                progressCurrent={24}
                progressTotal={50}
                progressVariant="cram"
                modeSwitcher={{
                  currentMode: "cram",
                  label: "Cram",
                  options: [
                    { value: "cram", label: "Luyện thi (Cram)" },
                    { value: "learn", label: "Ghi nhớ (Learn)" },
                  ],
                  onSelectMode,
                }}
                answerSourceToggle={{
                  ariaLabel: "Nguồn đáp án",
                  value: "ai",
                  options: [
                    { value: "ai", label: "Đáp án AI" },
                    { value: "community", label: "Cộng đồng" },
                  ],
                  onChange: onAnswerSourceChange,
                }}
                onOpenShortcuts={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const cramBar = screen.getByRole("progressbar", { name: "24/50 câu" });
    expect(cramBar).toHaveAttribute("data-progress-variant", "cram");
    expect(cramBar.querySelectorAll("[data-segment-index]")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: /Cram/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Ghi nhớ \(Learn\)/i }));
    expect(onSelectMode).toHaveBeenCalledWith("learn");

    fireEvent.click(screen.getByRole("button", { name: /Cài đặt phiên làm bài/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cộng đồng/i }));
    expect(onAnswerSourceChange).toHaveBeenCalledWith("community");

    rerender(
      <MemoryRouter>
        <Routes>
          <Route
            path="*"
            element={
              <CockpitHeader
                title="Học ghi nhớ"
                exitLabel="Thoát"
                onExit={vi.fn()}
                progressLabel="18/50 câu"
                progressCurrent={18}
                progressTotal={50}
                progressVariant="learn"
                learnActiveCount={7}
                modeSubLegend={<span>Đã thuộc (18) • Đang học (7)</span>}
                modeSwitcher={{
                  currentMode: "learn",
                  label: "Learn",
                }}
                onOpenShortcuts={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const learnBar = screen.getByRole("progressbar", { name: "18/50 câu" });
    expect(learnBar).toHaveAttribute("data-progress-variant", "learn");
    expect(learnBar.querySelector('[data-learn-segment="mastered"]')).toBeInTheDocument();
    expect(learnBar.querySelector('[data-learn-segment="active"]')).toBeInTheDocument();
    expect(screen.getByText(/Đã thuộc \(18\)/i)).toBeInTheDocument();
  });
});
