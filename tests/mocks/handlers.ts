import { http, HttpResponse } from "msw";

export const handlers = [
  // Auth handlers
  http.post("*/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === "test@fpt.edu.vn" && body.password === "Password123") {
      return HttpResponse.json({
        access_token: "mock_jwt_token_12345",
        token_type: "bearer",
        user: {
          id: "usr_mock_1",
          email: "test@fpt.edu.vn",
          full_name: "Nguyen Van A",
          created_at: new Date().toISOString(),
        },
      });
    }
    return HttpResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }),

  http.post("*/api/v1/auth/register", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string; full_name?: string };
    if (!body.email || !body.password) {
      return HttpResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    return HttpResponse.json(
      {
        access_token: "mock_jwt_token_new",
        token_type: "bearer",
        user: {
          id: "usr_mock_new",
          email: body.email,
          full_name: body.full_name || "New Learner",
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.get("*/api/v1/auth/me", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({
      id: "usr_mock_1",
      email: "test@fpt.edu.vn",
      full_name: "Nguyen Van A",
      created_at: "2026-01-01T00:00:00.000Z",
    });
  }),

  // Subjects handlers
  http.get("*/api/v1/subjects", () => {
    return HttpResponse.json([
      {
        id: "sub_1",
        code: "MAD101",
        title: "Discrete Mathematics",
        description: "Logic, sets, relations, combinatorics, graph theory.",
        total_exams: 5,
      },
      {
        id: "sub_2",
        code: "NWC204",
        title: "Computer Networking",
        description: "OSI and TCP/IP models, routing, switching.",
        total_exams: 3,
      },
    ]);
  }),

  http.get("*/api/v1/subjects/:code/exams", ({ params }) => {
    const { code } = params;
    return HttpResponse.json([
      {
        id: "exam_1",
        subject_code: code,
        code: `${code} - FA25 - FEB5`,
        title: `${code} Final Exam FA25`,
        duration_minutes: 60,
        total_questions: 50,
        passing_score_percentage: 70.0,
      },
      {
        id: "exam_2",
        subject_code: code,
        code: `${code} - SP26 - FE`,
        title: `${code} Practice Exam SP26`,
        duration_minutes: 45,
        total_questions: 20,
        passing_score_percentage: 70.0,
      },
    ]);
  }),

  // Attempts handlers
  http.post("*/api/v1/exams/:examId/attempts", ({ params }) => {
    const { examId } = params;
    return HttpResponse.json(
      {
        attempt_id: "att_mock_100",
        exam_id: examId,
        exam_title: "Discrete Mathematics FA25",
        status: "in_progress",
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        time_remaining_seconds: 3600,
        questions: [
          {
            question_id: "q_1",
            question_number: 1,
            question_id_code: "Q1",
            question_type: "single_choice",
            question_text: "What is the truth value of the compound proposition?",
            image_url: "/static/exams/MAD101/Q1.webp",
            options: {
              A: "Proposition is true",
              B: "Proposition is false",
              C: "Contradiction",
              D: "Tautology",
            },
            selected_options: null,
          },
          {
            question_id: "q_2",
            question_number: 2,
            question_id_code: "Q2",
            question_type: "single_choice",
            question_text: "Translate the statement into logical expressions.",
            image_url: "/static/exams/MAD101/Q2.webp",
            options: {
              A: "p ∧ q",
              B: "p ∨ q",
              C: "¬p ∧ ¬q",
              D: "p → q",
            },
            selected_options: null,
          },
        ],
      },
      { status: 201 }
    );
  }),

  http.get("*/api/v1/attempts/:attemptId", ({ params }) => {
    const { attemptId } = params;
    return HttpResponse.json({
      attempt_id: attemptId,
      exam_id: "exam_1",
      exam_title: "Discrete Mathematics FA25",
      status: "in_progress",
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3000 * 1000).toISOString(),
      time_remaining_seconds: 3000,
      questions: [
        {
          question_id: "q_1",
          question_number: 1,
          question_id_code: "Q1",
          question_type: "single_choice",
          question_text: "Question 1",
          image_url: "/static/exams/MAD101/Q1.webp",
          options: { A: "A", B: "B", C: "C", D: "D" },
          selected_options: "C",
        },
      ],
    });
  }),

  http.put("*/api/v1/attempts/:attemptId/answers", async ({ request }) => {
    const body = (await request.json()) as { question_id: string; selected_options: string };
    return HttpResponse.json({
      question_id: body.question_id,
      selected_options: body.selected_options,
      saved_at: new Date().toISOString(),
    });
  }),

  http.post("*/api/v1/attempts/:attemptId/submit", ({ params }) => {
    return HttpResponse.json({
      attempt_id: params.attemptId,
      status: "completed",
      total_questions: 20,
      correct_answers_count: 17,
      total_score: 8.5,
      percentage_score: 85.0,
      is_passed: true,
      submitted_at: new Date().toISOString(),
      duration_seconds: 1450,
    });
  }),

  http.get("*/api/v1/attempts/:attemptId/review", ({ params }) => {
    return HttpResponse.json({
      attempt_id: params.attemptId,
      exam_title: "Discrete Mathematics FA25",
      percentage_score: 85.0,
      is_passed: true,
      submitted_at: new Date().toISOString(),
      questions: [
        {
          question_id: "q_1",
          question_number: 1,
          question_id_code: "Q1",
          question_type: "single_choice",
          question_text: "Question 1 text",
          image_url: "/static/exams/MAD101/Q1.webp",
          options: { A: "A", B: "B", C: "C", D: "D" },
          selected_options: "C",
          correct_answer: "C",
          is_correct: true,
          ai_explanation: "Bước 1: Phân tích mệnh đề...",
          option_by_option_analysis: { A: "Sai vì...", B: "Sai vì...", C: "Đúng", D: "Sai" },
        },
      ],
    });
  }),

  // Drills
  http.get("*/api/v1/questions/drills", () => {
    return HttpResponse.json([
      {
        question_id: "drill_1",
        subject_code: "MAD101",
        question_type: "single_choice",
        question_text: "Topical drill question 1",
        image_url: "/static/exams/MAD101/Q1.webp",
        options: { A: "Opt A", B: "Opt B", C: "Opt C", D: "Opt D" },
      },
    ]);
  }),

  http.post("*/api/v1/questions/:questionId/check", async ({ request }) => {
    const body = (await request.json()) as { selected_options: string };
    const isCorrect = body.selected_options === "C";
    return HttpResponse.json({
      question_id: "drill_1",
      selected_options: body.selected_options,
      correct_answer: "C",
      is_correct: isCorrect,
      ai_explanation: "Lý do lựa chọn đáp án C...",
      option_by_option_analysis: {
        A: "Sai vì lý do 1",
        B: "Sai vì lý do 2",
        C: "Đúng theo công thức",
        D: "Sai vì lý do 4",
      },
    });
  }),
];
