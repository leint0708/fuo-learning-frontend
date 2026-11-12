export interface Subject {
  id: string;
  code: string;
  title: string;
  description: string;
  iconUrl?: string | null;
  totalExams: number;
}

export interface ExamSummary {
  id: string;
  subjectCode: string;
  code: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScorePercentage: number;
}

export interface ExamDetail extends ExamSummary {
  description?: string;
}
