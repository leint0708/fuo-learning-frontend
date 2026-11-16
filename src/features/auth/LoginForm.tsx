import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { loginUser } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/error";

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  useEffect(() => {
    document.title = "Đăng nhập | FUO Learning";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({ email: email.trim(), password });
      loginSuccess(response.access_token, {
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.full_name,
        createdAt: response.user.created_at,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Đăng nhập không thành công."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-space-4 sm:p-space-6">
      <Card className="w-full max-w-md p-space-5 sm:p-space-6 bg-color-7 border-2 border-color-1 shadow-sm rounded-3xl">
        <div className="text-center mb-space-5">
          <div
            data-impeccable-ignore="hard-offset-shadow"
            className="inline-flex w-12 h-12 rounded-full bg-color-2 text-color-7 items-center justify-center mb-space-2 border-2 border-color-1 shadow-sm"
          >
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-text-xl font-bold text-color-1">Đăng nhập tài khoản</h1>
          <p className="text-text-xs text-color-1/80 mt-space-1">
            Chào mừng bạn trở lại với hệ thống luyện thi FUO Learning.
          </p>
        </div>

        {error && (
          <div
            id="login-error"
            role="alert"
            aria-live="assertive"
            className="mb-space-4 px-space-4 py-space-3 bg-color-4/15 border-2 border-color-4 text-color-1 rounded-2xl flex items-start gap-space-2 text-[13px] sm:text-text-xs font-bold"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-color-4" />
            <span>{typeof error === "string" ? error : getErrorMessage(error)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-4" noValidate>
          <div className="flex flex-col gap-space-1">
            <label
              htmlFor="login-email"
              className="block text-text-xs font-bold text-color-1"
            >
              Địa chỉ email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="example@fpt.edu.vn"
              required
              disabled={isLoading}
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              className={clsx(
                "w-full px-space-4 py-space-2 rounded-full border-2 bg-color-6 text-color-1 placeholder:text-color-1/70 outline-none hover:border-color-2 focus-visible:ring-4 focus-visible:ring-color-5 transition-all duration-fast text-text-sm disabled:opacity-60 disabled:cursor-not-allowed",
                error ? "border-color-4" : "border-color-1"
              )}
            />
          </div>

          <div className="flex flex-col gap-space-1">
            <label
              htmlFor="login-password"
              className="block text-text-xs font-bold text-color-1"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nhập mật khẩu của bạn"
                required
                disabled={isLoading}
                aria-invalid={!!error}
                aria-describedby={error ? "login-error" : undefined}
                className={clsx(
                  "w-full pl-space-4 pr-14 py-space-2 rounded-full border-2 bg-color-6 text-color-1 placeholder:text-color-1/70 outline-none hover:border-color-2 focus-visible:ring-4 focus-visible:ring-color-5 transition-all duration-fast text-text-sm disabled:opacity-60 disabled:cursor-not-allowed",
                  error ? "border-color-4" : "border-color-1"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                className="absolute right-space-1 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center rounded-full text-color-1/80 hover:text-color-1 hover:bg-color-7/80 outline-none focus-visible:ring-2 focus-visible:ring-color-5 transition-colors duration-fast disabled:opacity-50 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full mt-space-2"
          >
            Đăng nhập
          </Button>
        </form>

        <div className="mt-space-5 pt-space-4 border-t-2 border-color-1 text-center text-text-xs text-color-1">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="inline-flex items-center min-h-11 font-bold text-color-2 underline hover:text-color-1 rounded-full px-space-2 outline-none focus-visible:ring-2 focus-visible:ring-color-5 transition-colors duration-fast"
          >
            Đăng ký ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};
