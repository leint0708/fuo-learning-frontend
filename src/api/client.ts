import { extractErrorMessageFromData } from "@/utils/error";

export class ApiError extends Error {
  public status: number;
  public details?: unknown;
  public code?: string;

  constructor(status: number, message: string, details?: unknown, code?: string) {
    const safeMessage =
      typeof message === "string" && message.trim() && message !== "[object Object]"
        ? message.trim()
        : `Lỗi kết nối máy chủ (${status})`;
    super(safeMessage);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("fuo_auth_token");
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    let details: unknown = null;
    let code: string | undefined = undefined;

    try {
      const text = await response.text();
      try {
        const errorJson = JSON.parse(text);
        details = errorJson;

        if (errorJson && typeof errorJson === "object") {
          const errObj = errorJson as Record<string, unknown>;
          if (errObj.error && typeof errObj.error === "object") {
            const nested = errObj.error as Record<string, unknown>;
            if (typeof nested.code === "string") {
              code = nested.code;
            }
          }
        }

        const extracted = extractErrorMessageFromData(errorJson);
        if (extracted) {
          errorMessage = extracted;
        }
      } catch {
        // Not JSON: check if plain text error response (ignore HTML responses like default nginx 502)
        if (text && text.trim() && !text.startsWith("<!DOCTYPE") && !text.startsWith("<html")) {
          errorMessage = text.trim();
        }
      }
    } catch {
      // Body reading failed, retain fallback HTTP error
    }

    if (response.status === 401) {
      // Clear token on unauthorized if needed
      localStorage.removeItem("fuo_auth_token");
    }

    throw new ApiError(response.status, errorMessage, details, code);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
