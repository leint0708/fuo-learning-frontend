import { apiClient } from "./client";
import { resolveImageUrl } from "@/utils/imageUrl";
import type { Subject, ExamSummary, ExamDetail } from "@/types/catalog";
import type { Question } from "@/types/exam";

export async function getSubjects(): Promise<Subject[]> {
  const data = await apiClient<
    Array<{
      id: string;
      code: string;
      title: string;
      description: string;
      icon_url?: string | null;
      total_exams: number;
    }>
  >("/api/v1/subjects");

  return data.map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    description: s.description,
    iconUrl: resolveImageUrl(s.icon_url),
    totalExams: s.total_exams,
  }));
}

export async function getSubject(code: string): Promise<Subject> {
  const s = await apiClient<{
    id: string;
    code: string;
    title: string;
    description: string;
    icon_url?: string | null;
    total_exams: number;
  }>(`/api/v1/subjects/${encodeURIComponent(code)}`);

  return {
    id: s.id,
    code: s.code,
    title: s.title,
    description: s.description,
    iconUrl: resolveImageUrl(s.icon_url),
    totalExams: s.total_exams,
  };
}

export async function getSubjectExams(code: string): Promise<ExamSummary[]> {
  const data = await apiClient<
    Array<{
      id: string;
      subject_code: string;
      code: string;
      title: string;
      duration_minutes: number;
      total_questions: number;
      passing_score_percentage: number;
    }>
  >(`/api/v1/subjects/${encodeURIComponent(code)}/exams`);

  return data.map((e) => ({
    id: e.id,
    subjectCode: e.subject_code,
    code: e.code,
    title: e.title,
    durationMinutes: e.duration_minutes,
    totalQuestions: e.total_questions,
    passingScorePercentage: e.passing_score_percentage,
  }));
}

export async function getExam(examId: string): Promise<ExamDetail> {
  const e = await apiClient<{
    id: string;
    subject_code: string;
    code: string;
    title: string;
    duration_minutes: number;
    total_questions: number;
    passing_score_percentage: number;
    description?: string;
  }>(`/api/v1/exams/${encodeURIComponent(examId)}`);

  return {
    id: e.id,
    subjectCode: e.subject_code,
    code: e.code,
    title: e.title,
    durationMinutes: e.duration_minutes,
    totalQuestions: e.total_questions,
    passingScorePercentage: e.passing_score_percentage,
    description: e.description,
  };
}

export async function getDrillQuestions(
  subjectCode: string,
  count = 10
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
