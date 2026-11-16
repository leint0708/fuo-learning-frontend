import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { getPracticeQuestions } from "@/api/practice";

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
});
