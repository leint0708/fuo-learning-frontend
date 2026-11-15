import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CramBatchModal } from "@/features/practice/CramBatchModal";

describe("CramBatchModal", () => {
  it("renders batch completion stats, milestone progress, and locks body scroll when open", () => {
    render(
      <CramBatchModal
        isOpen={true}
        batchNumber={1}
        totalBatches={3}
        batchSize={10}
        cumulativeMastered={10}
        totalDeckSize={25}
        onContinueNextBatch={vi.fn()}
        onFinishSession={vi.fn()}
      />
    );

    expect(screen.getByText(/Hoàn thành Đợt 1\/3/i)).toBeInTheDocument();
    expect(screen.getByText(/10 câu hỏi trong đợt vừa rồi/i)).toBeInTheDocument();
    expect(screen.getByText("10/25 câu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tiếp tục Đợt tiếp theo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dừng bài luyện tập/i })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("calls onContinueNextBatch when clicking continue button, pressing Escape, or clicking backdrop", () => {
    const handleContinue = vi.fn();
    render(
      <CramBatchModal
        isOpen={true}
        batchNumber={1}
        totalBatches={2}
        batchSize={10}
        cumulativeMastered={10}
        totalDeckSize={20}
        onContinueNextBatch={handleContinue}
        onFinishSession={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục Đợt tiếp theo/i }));
    expect(handleContinue).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleContinue).toHaveBeenCalledTimes(2);

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.parentElement!);
    expect(handleContinue).toHaveBeenCalledTimes(3);
  });

  it("calls onFinishSession only when clicking explicit stop button", () => {
    const handleFinish = vi.fn();
    render(
      <CramBatchModal
        isOpen={true}
        batchNumber={2}
        totalBatches={2}
        batchSize={10}
        cumulativeMastered={20}
        totalDeckSize={20}
        onContinueNextBatch={vi.fn()}
        onFinishSession={handleFinish}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(handleFinish).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Dừng bài luyện tập/i }));
    expect(handleFinish).toHaveBeenCalledTimes(1);
  });

  it("advances with Enter when primary button is focused, without hijacking focused stop button", () => {
    const handleContinue = vi.fn();
    const handleFinish = vi.fn();
    render(
      <CramBatchModal
        isOpen={true}
        batchNumber={1}
        totalBatches={3}
        batchSize={10}
        cumulativeMastered={10}
        totalDeckSize={25}
        onContinueNextBatch={handleContinue}
        onFinishSession={handleFinish}
      />
    );

    fireEvent.keyDown(window, { key: "Enter" });
    expect(handleContinue).toHaveBeenCalledTimes(1);

    const stopBtn = screen.getByRole("button", { name: /Dừng bài luyện tập/i });
    stopBtn.focus();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });
});
