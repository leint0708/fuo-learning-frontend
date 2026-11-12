import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";

// Lazy / Feature views
import { LoginForm } from "@/features/auth/LoginForm";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { ProfileView } from "@/features/auth/ProfileView";
import { SubjectCatalogView } from "@/features/subjects/SubjectCatalogView";
import { SubjectDetailView } from "@/features/subjects/SubjectDetailView";
import { ExamWorkspaceView } from "@/features/exam/ExamWorkspaceView";
import { ReviewView } from "@/features/review/ReviewView";

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-screen flex flex-col bg-color-6 text-color-1">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Protected Learning Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SubjectCatalogView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:code"
            element={
              <ProtectedRoute>
                <SubjectDetailView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attempts/:attemptId"
            element={
              <ProtectedRoute>
                <ExamWorkspaceView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attempts/:attemptId/review"
            element={
              <ProtectedRoute>
                <ReviewView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileView />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
