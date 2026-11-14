import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError } from "@/api/client";

describe("apiClient error extraction", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("extracts message from nested { error: { message, code } } and never sets [object Object]", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({
          error: {
            code: "HTTP_400",
            message: "User already has an ongoing active attempt on this exam",
          },
        }),
    } as unknown as Response);

    let caughtError: unknown;
    try {
      await apiClient("/api/v1/test");
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(ApiError);
    const apiError = caughtError as ApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.message).toBe(
      "User already has an ongoing active attempt on this exam"
    );
    expect(apiError.message).not.toBe("[object Object]");
    expect(apiError.code).toBe("HTTP_400");
  });

  it("extracts message and details from { error: { message, details: [...] } }", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      text: async () =>
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: [{ field: "email", message: "Invalid email format" }],
          },
        }),
    } as unknown as Response);

    await expect(apiClient("/api/v1/test")).rejects.toThrow(
      "Request validation failed: email: Invalid email format"
    );
  });

  it("extracts from plain text non-HTML error responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: async () => "Maintenance mode in progress",
    } as unknown as Response);

    await expect(apiClient("/api/v1/test")).rejects.toThrow(
      "Maintenance mode in progress"
    );
  });

  it("falls back to HTTP status when HTML error response is received", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => "<html><body>502 Bad Gateway</body></html>",
    } as unknown as Response);

    await expect(apiClient("/api/v1/test")).rejects.toThrow(
      "HTTP Error 502: Bad Gateway"
    );
  });

  it("clears auth token on 401 Unauthorized", async () => {
    localStorage.setItem("fuo_auth_token", "test-token");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () =>
        JSON.stringify({
          error: {
            code: "HTTP_401",
            message: "Unauthorized",
          },
        }),
    } as unknown as Response);

    await expect(apiClient("/api/v1/test")).rejects.toThrow("Unauthorized");
    expect(localStorage.getItem("fuo_auth_token")).toBeNull();
  });
});
