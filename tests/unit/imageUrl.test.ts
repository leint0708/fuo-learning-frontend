import { describe, it, expect } from "vitest";
import { resolveImageUrl } from "@/utils/imageUrl";

describe("resolveImageUrl Utility", () => {
  it("returns null for null, undefined, or empty values", () => {
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl(undefined)).toBeNull();
    expect(resolveImageUrl("")).toBeNull();
    expect(resolveImageUrl("   ")).toBeNull();
  });

  it("preserves absolute HTTP and HTTPS URLs", () => {
    const url = "https://cdn.example.com/exams/MAD101/Q1.webp";
    expect(resolveImageUrl(url)).toBe(url);
  });

  it("safely encodes spaces in absolute URLs without double encoding", () => {
    const unencoded = "https://cdn.example.com/exams/MAD101 - FA25/Q1.webp";
    expect(resolveImageUrl(unencoded)).toBe(
      "https://cdn.example.com/exams/MAD101%20-%20FA25/Q1.webp"
    );

    const alreadyEncoded = "https://cdn.example.com/exams/MAD101%20-%20FA25/Q1.webp";
    expect(resolveImageUrl(alreadyEncoded)).toBe(alreadyEncoded);
  });

  it("preserves data and blob URIs", () => {
    const dataUri = "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP";
    expect(resolveImageUrl(dataUri)).toBe(dataUri);

    const blobUri = "blob:http://localhost:5173/550e8400-e29b-41d4-a716-446655440000";
    expect(resolveImageUrl(blobUri)).toBe(blobUri);
  });

  it("prefixes API_BASE_URL to relative paths and maps /static/exams to root for Worker Assets", () => {
    const relativePath = "/static/exams/MAD101/Q1.webp";

    // Without trailing slash in baseUrl
    expect(resolveImageUrl(relativePath, "http://localhost:8787")).toBe(
      "http://localhost:8787/MAD101/Q1.webp"
    );

    // With trailing slash in baseUrl
    expect(resolveImageUrl(relativePath, "http://localhost:8787/")).toBe(
      "http://localhost:8787/MAD101/Q1.webp"
    );

    // Relative path without leading slash
    expect(resolveImageUrl("static/exams/MAD101/Q1.webp", "http://localhost:8787")).toBe(
      "http://localhost:8787/MAD101/Q1.webp"
    );

    // Non-exam relative path preserves its path
    expect(resolveImageUrl("/assets/logo.png", "http://localhost:8787")).toBe(
      "http://localhost:8787/assets/logo.png"
    );
  });

  it("properly encodes special characters and spaces in relative paths", () => {
    const relativePathWithSpaces = "/static/exams/MAD101/MAD101 - FA25 - FEB5/Q1.webp";
    expect(resolveImageUrl(relativePathWithSpaces, "http://localhost:8787")).toBe(
      "http://localhost:8787/MAD101/MAD101%20-%20FA25%20-%20FEB5/Q1.webp"
    );
  });

  it("returns normalized relative path when baseUrl is empty", () => {
    const relative = "/static/exams/MAD101/Q1.webp";
    expect(resolveImageUrl(relative, "")).toBe("/static/exams/MAD101/Q1.webp");

    const withSpaces = "/static/exams/MAD101 - FA25/Q1.webp";
    expect(resolveImageUrl(withSpaces, "")).toBe("/static/exams/MAD101%20-%20FA25/Q1.webp");
  });
});
