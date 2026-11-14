/**
 * Error extraction and normalization utilities.
 * Ensures no raw '[object Object]' or unformatted JSON errors are ever presented to users.
 */

export const COMMON_ERROR_MESSAGES: Record<string, string> = {
  "Exam not found": "Không tìm thấy đề thi.",
  "User already has an ongoing active attempt on this exam":
    "Bạn đang có một bài thi chưa hoàn thành cho đề này.",
  "Invalid email or password": "Email hoặc mật khẩu không chính xác.",
  "Missing required fields": "Vui lòng điền đầy đủ các thông tin bắt buộc.",
  "Request validation failed": "Dữ liệu yêu cầu không hợp lệ.",
  "An unexpected error occurred": "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.",
  "Unauthorized": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
  "Forbidden": "Bạn không có quyền thực hiện thao tác này.",
  "Subject not found": "Không tìm thấy môn học.",
  "Attempt not found": "Không tìm thấy phiên làm bài.",
  "Failed to fetch": "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.",
  "NetworkError when attempting to fetch resource.":
    "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.",
};

/**
 * Extracts a human-readable string message from arbitrary JSON response data or error objects.
 * Handles nested backend error schemas:
 * - Hono / FUO: { error: { code: string, message: string, details?: Array<{ field: string, message: string }> } }
 * - Standard: { message: string } or { error: string }
 * - FastAPI: { detail: string } or { detail: Array<{ msg: string, loc: string[] }> }
 * - Validation errors: { errors: Array<string | { message: string }> } or { errors: Record<string, string[]> }
 */
export function extractErrorMessageFromData(data: unknown): string | null {
  if (!data) return null;

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (trimmed && trimmed !== "[object Object]") {
      return trimmed;
    }
    return null;
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // 1. Check nested error object or string: e.g. { error: { message: "...", code: "..." } } or { error: "..." }
    if (obj.error !== undefined && obj.error !== null) {
      if (typeof obj.error === "string") {
        const trimmed = obj.error.trim();
        if (trimmed && trimmed !== "[object Object]") return trimmed;
      } else if (typeof obj.error === "object") {
        const nested = obj.error as Record<string, unknown>;
        let mainMsg = "";

        if (typeof nested.message === "string" && nested.message.trim() && nested.message !== "[object Object]") {
          mainMsg = nested.message.trim();
        } else if (typeof nested.code === "string" && nested.code.trim()) {
          mainMsg = nested.code.trim();
        }

        // Check if there are validation details: e.g. details: [{ field: "email", message: "..." }]
        if (Array.isArray(nested.details) && nested.details.length > 0) {
          const detailMsgs = nested.details
            .map((d) => {
              if (typeof d === "string") return d;
              if (d && typeof d === "object") {
                const item = d as Record<string, unknown>;
                if (item.field && item.message) return `${item.field}: ${item.message}`;
                if (item.message) return String(item.message);
                if (item.msg) return String(item.msg);
              }
              return "";
            })
            .filter(Boolean);

          if (detailMsgs.length > 0) {
            return mainMsg ? `${mainMsg}: ${detailMsgs.join(", ")}` : detailMsgs.join(", ");
          }
        }

        if (mainMsg) return mainMsg;

        // Recursive check in nested error
        const subMsg = extractErrorMessageFromData(nested);
        if (subMsg) return subMsg;
      }
    }

    // 2. Check message field: e.g. { message: "..." }
    if (obj.message !== undefined && obj.message !== null) {
      if (typeof obj.message === "string") {
        const trimmed = obj.message.trim();
        if (trimmed && trimmed !== "[object Object]") return trimmed;
      } else if (typeof obj.message === "object") {
        const subMsg = extractErrorMessageFromData(obj.message);
        if (subMsg) return subMsg;
      }
    }

    // 3. Check detail field (FastAPI / RFC 7807)
    if (obj.detail !== undefined && obj.detail !== null) {
      if (typeof obj.detail === "string") {
        const trimmed = obj.detail.trim();
        if (trimmed && trimmed !== "[object Object]") return trimmed;
      } else if (Array.isArray(obj.detail)) {
        const msgs = obj.detail
          .map((d) => {
            if (typeof d === "string") return d;
            if (d && typeof d === "object") {
              const item = d as Record<string, unknown>;
              const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : undefined;
              const msg = item.msg || item.message;
              if (field && msg) return `${field}: ${msg}`;
              if (msg) return String(msg);
            }
            return "";
          })
          .filter(Boolean);

        if (msgs.length > 0) return msgs.join(", ");
      }
    }

    // 4. Check errors field
    if (obj.errors !== undefined && obj.errors !== null) {
      if (Array.isArray(obj.errors)) {
        const msgs = obj.errors
          .map((e) => {
            if (typeof e === "string") return e;
            if (e && typeof e === "object") {
              const item = e as Record<string, unknown>;
              return item.message || item.msg ? String(item.message || item.msg) : "";
            }
            return "";
          })
          .filter(Boolean);
        if (msgs.length > 0) return msgs.join(", ");
      } else if (typeof obj.errors === "object") {
        const entries = Object.entries(obj.errors as Record<string, unknown>).map(([k, v]) => {
          if (Array.isArray(v)) return `${k}: ${v.join(", ")}`;
          if (typeof v === "string") return `${k}: ${v}`;
          return "";
        }).filter(Boolean);
        if (entries.length > 0) return entries.join("; ");
      }
    }

    // 5. Check error_description (OAuth2 standard)
    if (typeof obj.error_description === "string") {
      const trimmed = obj.error_description.trim();
      if (trimmed && trimmed !== "[object Object]") return trimmed;
    }

    // 6. Check other common string fields
    for (const key of ["msg", "title", "reason", "statusText"]) {
      if (typeof obj[key] === "string") {
        const trimmed = (obj[key] as string).trim();
        if (trimmed && trimmed !== "[object Object]") return trimmed;
      }
    }
  }

  return null;
}

/**
 * Translates known backend messages to friendly Vietnamese text if a mapping exists.
 */
export function translateErrorMessage(message: string): string {
  const trimmed = message.trim();
  if (COMMON_ERROR_MESSAGES[trimmed]) {
    return COMMON_ERROR_MESSAGES[trimmed];
  }

  // Handle prefix matches e.g. "Request validation failed: ..."
  if (trimmed.startsWith("Request validation failed: ")) {
    return `Dữ liệu không hợp lệ: ${trimmed.substring("Request validation failed: ".length)}`;
  }

  return trimmed;
}

/**
 * Universally extract a safe, user-facing error message from any caught error.
 * Guarantees that '[object Object]' is never returned.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau."
): string {
  if (!error) return fallback;

  // If already a string
  if (typeof error === "string") {
    const trimmed = error.trim();
    if (!trimmed || trimmed === "[object Object]") return fallback;
    return translateErrorMessage(trimmed);
  }

  // If it's an instance of ApiError or native Error
  if (error instanceof Error) {
    const hasValidMessage =
      typeof error.message === "string" &&
      error.message.trim() &&
      error.message !== "[object Object]";

    // If ApiError or error object carries a details object
    const details = (error as { details?: unknown }).details;
    if (details) {
      const extractedFromDetails = extractErrorMessageFromData(details);
      if (extractedFromDetails) {
        return translateErrorMessage(extractedFromDetails);
      }
    }

    if (hasValidMessage) {
      return translateErrorMessage(error.message);
    }
  }

  // If it's a plain object (e.g. rejected promise with payload)
  if (typeof error === "object") {
    const extracted = extractErrorMessageFromData(error);
    if (extracted) {
      return translateErrorMessage(extracted);
    }
  }

  return fallback;
}
