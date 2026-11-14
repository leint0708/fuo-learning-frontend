import { describe, it, expect } from "vitest";
import {
  extractErrorMessageFromData,
  translateErrorMessage,
  getErrorMessage,
} from "@/utils/error";
import { ApiError } from "@/api/client";

describe("error utilities", () => {
  describe("extractErrorMessageFromData", () => {
    it("returns null for empty or nullish values", () => {
      expect(extractErrorMessageFromData(null)).toBeNull();
      expect(extractErrorMessageFromData(undefined)).toBeNull();
      expect(extractErrorMessageFromData("")).toBeNull();
      expect(extractErrorMessageFromData("   ")).toBeNull();
    });

    it("rejects '[object Object]' string", () => {
      expect(extractErrorMessageFromData("[object Object]")).toBeNull();
    });

    it("extracts direct string error", () => {
      expect(extractErrorMessageFromData("Something failed")).toBe("Something failed");
    });

    it("extracts message from Hono backend schema { error: { code, message } }", () => {
      const data = {
        error: {
          code: "HTTP_400",
          message: "User already has an ongoing active attempt on this exam",
        },
      };
      expect(extractErrorMessageFromData(data)).toBe(
        "User already has an ongoing active attempt on this exam"
      );
    });

    it("extracts message and details from Hono validation schema", () => {
      const data = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: [
            { field: "email", message: "Invalid email format" },
            { field: "password", message: "Too short" },
          ],
        },
      };
      expect(extractErrorMessageFromData(data)).toBe(
        "Request validation failed: email: Invalid email format, password: Too short"
      );
    });

    it("extracts simple { error: 'string' }", () => {
      expect(extractErrorMessageFromData({ error: "Exam not found" })).toBe("Exam not found");
    });

    it("extracts simple { message: 'string' }", () => {
      expect(extractErrorMessageFromData({ message: "Invalid credentials" })).toBe(
        "Invalid credentials"
      );
    });

    it("extracts from nested { message: { message: 'Deep message' } }", () => {
      expect(
        extractErrorMessageFromData({ message: { message: "Deep message" } })
      ).toBe("Deep message");
    });

    it("extracts from FastAPI string detail { detail: 'Item not found' }", () => {
      expect(extractErrorMessageFromData({ detail: "Item not found" })).toBe("Item not found");
    });

    it("extracts from FastAPI validation array detail", () => {
      const data = {
        detail: [
          { loc: ["body", "question_count"], msg: "field required" },
          { loc: ["body", "duration"], msg: "must be positive" },
        ],
      };
      expect(extractErrorMessageFromData(data)).toBe(
        "question_count: field required, duration: must be positive"
      );
    });

    it("extracts from OAuth2 { error_description: 'Token expired' }", () => {
      expect(
        extractErrorMessageFromData({ error_description: "Token expired" })
      ).toBe("Token expired");
    });

    it("extracts from errors array", () => {
      expect(
        extractErrorMessageFromData({ errors: ["First error", "Second error"] })
      ).toBe("First error, Second error");
    });
  });

  describe("translateErrorMessage", () => {
    it("translates known English backend messages to Vietnamese", () => {
      expect(
        translateErrorMessage("User already has an ongoing active attempt on this exam")
      ).toBe("Bạn đang có một bài thi chưa hoàn thành cho đề này.");

      expect(translateErrorMessage("Exam not found")).toBe("Không tìm thấy đề thi.");
      expect(translateErrorMessage("Invalid email or password")).toBe(
        "Email hoặc mật khẩu không chính xác."
      );
      expect(translateErrorMessage("Unauthorized")).toBe(
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."
      );
    });

    it("translates prefix validation error", () => {
      expect(
        translateErrorMessage("Request validation failed: email is invalid")
      ).toBe("Dữ liệu không hợp lệ: email is invalid");
    });

    it("returns original message if no translation exists", () => {
      expect(translateErrorMessage("Custom domain specific error")).toBe(
        "Custom domain specific error"
      );
    });
  });

  describe("getErrorMessage", () => {
    it("never returns '[object Object]'", () => {
      expect(getErrorMessage("[object Object]")).not.toBe("[object Object]");
      expect(getErrorMessage(new Error("[object Object]"))).not.toBe("[object Object]");
      expect(getErrorMessage({})).not.toBe("[object Object]");
      expect(getErrorMessage({ message: "[object Object]" })).not.toBe("[object Object]");
    });

    it("extracts and translates from ApiError with details", () => {
      const apiErr = new ApiError(
        400,
        "HTTP Error 400",
        {
          error: {
            code: "HTTP_400",
            message: "User already has an ongoing active attempt on this exam",
          },
        }
      );

      expect(getErrorMessage(apiErr)).toBe(
        "Bạn đang có một bài thi chưa hoàn thành cho đề này."
      );
    });

    it("extracts from standard Error", () => {
      const err = new Error("Exam not found");
      expect(getErrorMessage(err)).toBe("Không tìm thấy đề thi.");
    });

    it("handles plain string error", () => {
      expect(getErrorMessage("Invalid email or password")).toBe(
        "Email hoặc mật khẩu không chính xác."
      );
    });

    it("handles plain object without Error wrapper", () => {
      const raw = {
        error: {
          message: "Exam not found",
        },
      };
      expect(getErrorMessage(raw)).toBe("Không tìm thấy đề thi.");
    });

    it("falls back to default fallback message when error is empty or unextractable", () => {
      expect(getErrorMessage(null, "Lỗi mặc định")).toBe("Lỗi mặc định");
      expect(getErrorMessage(undefined, "Lỗi mặc định")).toBe("Lỗi mặc định");
      expect(getErrorMessage({}, "Lỗi mặc định")).toBe("Lỗi mặc định");
    });
  });
});
