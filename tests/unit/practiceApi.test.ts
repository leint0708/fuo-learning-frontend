import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { getPracticeQuestions, syncSubjectProgressWithServer } from "@/api/practice";
import { startExamAttempt } from "@/api/attempts";

describe("getPracticeQuestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requests the full subject bank with all=true&count=10000 when count is omitted and returns >60 questions", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/questions/drills", ({ request }) => {
        capturedUrl = request.url;
        const questions = Array.from({ length: 65 }, (_, idx) => ({
          question_id: `nwc_${idx + 1}`,
          subject_code: "NWC204",
          question_type: "single_choice",
          question_text: `NWC204 question ${idx + 1}`,
          image_url: null,
          options: { A: "A", B: "B", C: "C", D: "D" },
        }));
        return HttpResponse.json(questions);
      })
    );

    const result = await getPracticeQuestions("NWC204");
    const capturedParams = new URL(capturedUrl).searchParams;

    expect(capturedParams.get("subject_code")).toBe("NWC204");
    expect(capturedParams.get("all")).toBe("true");
    expect(capturedParams.get("count")).toBe("10000");
    expect(result).toHaveLength(65);
    expect(result[64]?.questionId).toBe("nwc_65");
  });

  it("preserves explicit count parameter without all=true when specified", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/questions/drills", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      })
    );

    await getPracticeQuestions("MAD101", 25);
    const capturedParams = new URL(capturedUrl).searchParams;

    expect(capturedParams.get("subject_code")).toBe("MAD101");
    expect(capturedParams.get("count")).toBe("25");
    expect(capturedParams.get("all")).toBeNull();
  });

  it("posts custom subject attempts to /api/v1/subjects/:code/attempts with >50 question_count", async () => {
    let capturedBody: any = null;
    let capturedUrl = "";

    server.use(
      http.post("*/api/v1/subjects/:code/attempts", async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            attempt_id: "att_120",
            exam_id: "exam_1",
            exam_title: "Đề tùy chỉnh - MAD101 (120 câu)",
            status: "in_progress",
            started_at: new Date().toISOString(),
            expires_at: null,
            time_remaining_seconds: 5400,
            questions: Array.from({ length: 120 }, (_, i) => ({
              question_id: `q_${i + 1}`,
              question_number: i + 1,
              question_id_code: `Q${i + 1}`,
              question_type: "single_choice",
              question_text: `Q${i + 1}`,
              image_url: null,
              options: { A: "A", B: "B", C: "C", D: "D" },
              selected_options: null,
            })),
          },
          { status: 201 }
        );
      })
    );

    const session = await startExamAttempt("custom-MAD101", {
      questionCount: 120,
      durationMinutes: 90,
      feedbackMode: "instant",
      benchmarkMode: "ai",
    });

    expect(capturedUrl).toContain("/api/v1/subjects/MAD101/attempts");
    expect(capturedBody.question_count).toBe(120);
    expect(session.questions).toHaveLength(120);
  });

  it("syncs local unsynced mastery delta to server and updates localStorage with server union", async () => {
    localStorage.clear();
    localStorage.setItem("fuo_cram_mastered_MAD101", JSON.stringify(["q1", "q2"]));

    let putPayload: any = null;
    server.use(
      http.put("*/api/v1/subjects/MAD101/practice/progress", async ({ request }) => {
        putPayload = await request.json();
        return HttpResponse.json({
          subject_code: "MAD101",
          cram_mastered_ids: ["q1", "q2", "q3", "q4"],
          learn_mastered_ids: ["q1"],
          card_stats: {},
        });
      })
    );

    const synced = await syncSubjectProgressWithServer("MAD101");

    expect(putPayload.cram_mastered_ids).toEqual(["q1", "q2"]);
    expect(synced.cramMasteredIds).toEqual(["q1", "q2", "q3", "q4"]);
    expect(JSON.parse(localStorage.getItem("fuo_cram_mastered_MAD101") || "[]")).toEqual([
      "q1",
      "q2",
      "q3",
      "q4",
    ]);
  });

  it("reconciles server cram_active_batch into localStorage during syncSubjectProgressWithServer", async () => {
    localStorage.clear();
    server.use(
      http.get("*/api/v1/subjects/MAD101/practice/progress", () => {
        return HttpResponse.json({
          subject_code: "MAD101",
          cram_mastered_ids: ["q1", "q2"],
          learn_mastered_ids: [],
          card_stats: {},
          cram_active_batch: {
            scope: "deck",
            batch_question_ids: ["q1", "q2", "q3", "q4"],
            active_queue_ids: ["q3", "q4"],
            queue_pointer: 0,
            mastered_in_batch_ids: ["q1", "q2"],
            missed_ids: ["q3"],
            updated_at: "2026-11-19T14:00:00.000Z",
          },
        });
      })
    );

    const synced = await syncSubjectProgressWithServer("MAD101");
    expect(synced.cramActiveBatch?.batchQuestionIds).toEqual(["q1", "q2", "q3", "q4"]);
    expect(synced.cramActiveBatch?.activeQueueIds).toEqual(["q3", "q4"]);
    expect(synced.cramActiveBatch?.missedIds).toEqual(["q3"]);
  });
});
