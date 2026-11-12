import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-color-6">
        <div className="flex flex-col items-center gap-space-3 p-space-6 bg-color-7 border-2 border-color-1 rounded-3xl shadow-sm">
          <div className="w-10 h-10 border-4 border-color-2 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-text-sm text-color-1">Đang xác thực thông tin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
