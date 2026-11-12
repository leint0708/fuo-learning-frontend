import { apiClient } from "./client";
import type { LoginCredentials, RegisterCredentials, AuthResponse, UserProfile } from "@/types/auth";

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      full_name: credentials.fullName,
    }),
  });
}

export async function getMe(): Promise<UserProfile> {
  const profile = await apiClient<{
    id: string;
    email: string;
    full_name: string;
    created_at: string;
  }>("/api/v1/auth/me");

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    createdAt: profile.created_at,
  };
}

export async function getUserStats() {
  return apiClient<{
    total_attempts_count: number;
    total_exams_passed: number;
    overall_pass_rate: number;
    overall_average_score: number;
    total_practice_duration_minutes: number;
    subject_breakdowns: Array<{
      subject_code: string;
      subject_title: string;
      attempts_count: number;
      average_score: number;
      passed_exams_count: number;
    }>;
  }>("/api/v1/users/me/stats");
}
