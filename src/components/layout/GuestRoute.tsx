import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

/**
 * Route guard for public-only authentication pages (/login, /register).
 * Prevents logged-in users from revisiting auth forms via direct URL or browser Back.
 */
export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const hasStoredToken =
    typeof window !== "undefined" && Boolean(window.localStorage.getItem("fuo_auth_token"));

  if (isLoading && hasStoredToken) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-color-6">
        <div className="flex flex-col items-center gap-space-3 p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm">
          <div className="w-10 h-10 border-4 border-color-2 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-text-sm text-color-1">Đang xác thực thông tin...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
