import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, User, LogOut, LogIn } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuthStore } from "@/stores/authStore";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-color-7 border-b-2 border-color-1 shadow-xs">
      <div className="max-w-7xl mx-auto px-space-2 sm:px-space-5 h-16 flex items-center justify-between gap-space-2">
        {/* Brand */}
        <Link
          to="/"
          className="min-h-11 px-space-1 min-w-0 flex items-center gap-space-1 sm:gap-space-2 text-color-1 font-bold text-text-sm sm:text-text-lg hover:text-color-2 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-colors duration-fast"
        >
          <div
            data-impeccable-ignore="hard-offset-shadow"
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-color-2 flex items-center justify-center text-color-7 border-2 border-color-1 shadow-sm"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="truncate">FUO Learning</span>
        </Link>

        {/* Navigation items */}
        <nav className="flex items-center gap-space-2 sm:gap-space-3 shrink-0">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center min-h-11 text-text-sm font-bold text-color-1 hover:text-color-2 px-space-3 py-space-1 rounded-full hover:bg-color-6 outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-colors duration-fast"
          >
            Môn học
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-space-1 sm:gap-space-2">
              <Link
                to="/profile"
                aria-label="Hồ sơ cá nhân"
                title={user?.fullName || "Hồ sơ cá nhân"}
                className="min-h-11 flex items-center gap-space-1 px-space-2 sm:px-space-3 py-space-1 rounded-full border-2 border-color-1 bg-color-6 hover:bg-color-7 font-bold text-[13px] sm:text-text-xs shadow-xs outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-colors duration-fast"
              >
                <User className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{user?.fullName || "Học viên"}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Đăng xuất"
                className="min-h-11 px-space-2 sm:px-space-3 text-color-1 hover:bg-color-4/15 gap-space-1 whitespace-nowrap"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-space-1 sm:gap-space-2">
              <Button
                variant={isLoginPage ? "primary" : "secondary"}
                size="sm"
                onClick={() => navigate("/login")}
                aria-current={isLoginPage ? "page" : undefined}
                className="min-h-11 px-space-2 sm:px-space-3 text-[13px] sm:text-text-xs gap-space-1 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Đăng nhập</span>
              </Button>
              <Button
                variant={isRegisterPage ? "primary" : isLoginPage ? "secondary" : "primary"}
                size="sm"
                onClick={() => navigate("/register")}
                aria-current={isRegisterPage ? "page" : undefined}
                className="min-h-11 px-space-2 sm:px-space-3 text-[13px] sm:text-text-xs whitespace-nowrap"
              >
                Đăng ký
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
