import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

  it("loads questions and executes Cram Mode answer verification flow", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/subjects/MAD101/practice/cram"]}>
          <Routes>
            <Route
              path="/subjects/:code/practice/:mode"
              element={<PracticeWorkspaceView />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Verify loading and question header
    await waitFor(() => {
      expect(screen.getByText("Luyện thi cấp tốc")).toBeInTheDocument();
    });

    // Find and answer the first question (MSW returns Opt A, Opt B, Opt C, Opt D, where C is correct)
    const [optC] = await screen.findAllByText(/Opt C/i);
    expect(optC).toBeDefined();

    // Select Opt C
    fireEvent.click(optC!);

    // Verify evaluation result feedback is displayed
    const feedback = await screen.findByText(/Chính xác! Giỏi lắm!/i);
    expect(feedback).toBeInTheDocument();

    // Advance to next card via continue button
    const continueBtn = screen.getByRole("button", { name: /Tiếp tục/i });
    fireEvent.click(continueBtn);

    // Verify next question is presented
    await waitFor(() => {
      expect(screen.getByText(/Topical drill question/i)).toBeInTheDocument();
    });
  });

  it("loads questions and executes Learn Mode with round queue", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/subjects/MAD101/practice/learn"]}>
          <Routes>
            <Route
              path="/subjects/:code/practice/:mode"
              element={<PracticeWorkspaceView />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Học ghi nhớ")).toBeInTheDocument();
      expect(screen.getByText(/Vòng 1/i)).toBeInTheDocument();
    });

    const [optC] = await screen.findAllByText(/Opt C/i);
    expect(optC).toBeDefined();
  });
});
