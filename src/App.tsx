import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useMatch } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";

// Code-split Feature Views
const LoginForm = lazy(() =>
  import("@/features/auth/LoginForm").then((m) => ({ default: m.LoginForm }))
);
const RegisterForm = lazy(() =>
  import("@/features/auth/RegisterForm").then((m) => ({ default: m.RegisterForm }))
);
const ProfileView = lazy(() =>
  import("@/features/auth/ProfileView").then((m) => ({ default: m.ProfileView }))
);
const SubjectCatalogView = lazy(() =>
  import("@/features/subjects/SubjectCatalogView").then((m) => ({
    default: m.SubjectCatalogView,
  }))
);
const SubjectDetailView = lazy(() =>
  import("@/features/subjects/SubjectDetailView").then((m) => ({
    default: m.SubjectDetailView,
  }))
);
const ExamWorkspaceView = lazy(() =>
  import("@/features/exam/ExamWorkspaceView").then((m) => ({
    default: m.ExamWorkspaceView,
  }))
);
const ReviewView = lazy(() =>
  import("@/features/review/ReviewView").then((m) => ({ default: m.ReviewView }))
);
const PracticeWorkspaceView = lazy(() =>
  import("@/features/practice/PracticeWorkspaceView").then((m) => ({
    default: m.PracticeWorkspaceView,
  }))
);

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();
  const isPracticeCockpit = Boolean(useMatch("/subjects/:code/practice/:mode"));
  const isExamCockpit = Boolean(useMatch("/attempts/:attemptId"));
  const isCockpitRoute = isPracticeCockpit || isExamCockpit;

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-dvh flex flex-col bg-color-6 text-color-1">
      {!isCockpitRoute && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Suspense
          fallback={
            <div
              role="status"
              aria-live="polite"
              className="flex-1 flex items-center justify-center p-space-6"
            >
              <div
                data-impeccable-ignore="hard-offset-shadow"
                className="px-space-5 py-space-3 rounded-full bg-color-7 border-2 border-color-1 shadow-sm text-text-xs font-bold text-color-1"
              >
                Đang tải trang...
              </div>
            </div>
          }
        >
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
              path="/subjects/:code/practice/:mode"
              element={
                <ProtectedRoute>
                  <PracticeWorkspaceView />
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
        </Suspense>
      </main>
      {!isCockpitRoute && <Footer />}
    </div>
  );
};

export default App;
