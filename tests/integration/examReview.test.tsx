import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultScoreCard } from "@/features/review/ResultScoreCard";
import { QuestionReviewItem } from "@/features/review/QuestionReviewItem";

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
  });
});
