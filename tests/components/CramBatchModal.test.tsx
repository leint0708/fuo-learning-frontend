import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CramBatchModal } from "@/features/practice/CramBatchModal";

describe("CramBatchModal", () => {
  it("renders batch completion stats and milestone progress when open", () => {
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

    expect(screen.getByText(/Hoàn thành Batch 1\/3/i)).toBeInTheDocument();
    expect(screen.getByText("10/25 câu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tiếp tục Batch tiếp theo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dừng bài luyện tập/i })).toBeInTheDocument();
  });

  it("calls onContinueNextBatch when clicking continue button", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /Tiếp tục Batch tiếp theo/i }));
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it("calls onFinishSession when clicking finish button", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /Dừng bài luyện tập/i }));
    expect(handleFinish).toHaveBeenCalledTimes(1);
  });

  it("advances when pressing Enter or Space key", () => {
    const handleContinue = vi.fn();
    render(
      <CramBatchModal
        isOpen={true}
        batchNumber={1}
        totalBatches={3}
        batchSize={10}
        cumulativeMastered={10}
        totalDeckSize={25}
        onContinueNextBatch={handleContinue}
        onFinishSession={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: "Enter" });
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });
});
