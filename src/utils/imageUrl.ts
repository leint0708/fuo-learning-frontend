import { API_BASE_URL } from "@/api/client";

/**
 * Resolves an image URL (relative or absolute) to a full, valid image URL.
 * Handles:
 * - Null / undefined / empty strings -> null
 * - Absolute URLs (http://, https://, data:, blob:) -> preserved and URI-encoded
 * - Relative URLs (/static/...) -> prefixed with API_BASE_URL (if provided) and URI-encoded
 * - Unencoded whitespace and special characters -> safely encoded without double-encoding
 */
export function resolveImageUrl(
  url: string | null | undefined,
  baseUrl: string = API_BASE_URL
): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // Absolute URLs or data/blob schemes
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    try {
      return encodeURI(decodeURI(trimmed));
    } catch {
      return encodeURI(trimmed);
    }
  }

  const cleanBase = (baseUrl || "").replace(/\/+$/, "");
  let normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // If cleanBase points to the backend asset server, strip /static/exams because Worker Assets serves ./exams directly at root
  if (cleanBase && normalizedPath.startsWith("/static/exams/")) {
    normalizedPath = normalizedPath.replace(/^\/static\/exams/, "");
  }

  const combined = cleanBase ? `${cleanBase}${normalizedPath}` : normalizedPath;

  try {
    return encodeURI(decodeURI(combined));
  } catch {
    return encodeURI(combined);
  }
}
