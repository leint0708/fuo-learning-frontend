import { describe, it, expect } from "vitest";
import { getSubjects, getSubjectExams, getDrillQuestions } from "@/api/subjects";

describe("Subjects API Client Contract Tests", () => {
  it("fetches the list of all subjects", async () => {
    const subjects = await getSubjects();
    expect(subjects).toBeDefined();
    expect(subjects.length).toBeGreaterThan(0);
    expect(subjects[0]?.code).toBe("MAD101");
    expect(subjects[0]?.title).toBe("Discrete Mathematics");
  });

  it("fetches exams under a specific subject code", async () => {
    const exams = await getSubjectExams("MAD101");
    expect(exams).toBeDefined();
    expect(exams.length).toBeGreaterThan(0);
    expect(exams[0]?.subjectCode).toBe("MAD101");
    expect(exams[0]?.totalQuestions).toBe(50);
  });

  it("fetches drill practice questions from question bank", async () => {
    const drills = await getDrillQuestions("MAD101", 5);
    expect(drills).toBeDefined();
    expect(drills.length).toBeGreaterThan(0);
    expect(drills[0]?.options).toHaveProperty("A");
  });
});
