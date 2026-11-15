import { apiClient } from "./client";
import { resolveImageUrl } from "@/utils/imageUrl";
import type { Question } from "@/types/exam";
import type { InstantAnswerResult } from "@/types/practice";

/**
 * Fetches practice questions for a given subject.
 * Defaults to 50 questions or full available question bank.
 */
export async function getPracticeQuestions(
  subjectCode: string,
  count = 50
): Promise<Question[]> {
  const data = await apiClient<
    Array<{
      question_id: string;
      subject_code: string;
      question_type: string;
      question_text: string;
      image_url: string | null;
      options: Record<string, string>;
    }>
  >(`/api/v1/questions/drills?subject_code=${encodeURIComponent(subjectCode)}&count=${count}`);

  return data.map((q, idx) => ({
    questionId: q.question_id,
    questionNumber: idx + 1,
    questionIdCode: `Q${idx + 1}`,
    questionType: (q.question_type as Question["questionType"]) || "single_choice",
    questionText: q.question_text,
    imageUrl: resolveImageUrl(q.image_url),
    options: q.options,
  }));
}

/**
 * Checks an instant practice answer submission for correctness and explanations.
 */
export async function checkPracticeAnswer(
  questionId: string,
  selectedOptions: string
): Promise<InstantAnswerResult> {
  const data = await apiClient<{
    question_id: string;
    selected_options: string;
    correct_answer: string;
    is_correct: boolean;
    ai_explanation: string;
    option_by_option_analysis?: Record<string, string>;
  }>(`/api/v1/questions/${encodeURIComponent(questionId)}/check`, {
    method: "POST",
    body: JSON.stringify({ selected_options: selectedOptions }),
  });

  return {
    questionId: data.question_id,
    selectedOptions: data.selected_options,
    correctAnswer: data.correct_answer,
    isCorrect: data.is_correct,
    aiExplanation: data.ai_explanation,
    optionByOptionAnalysis: data.option_by_option_analysis,
  };
}
