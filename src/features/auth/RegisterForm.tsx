import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { registerUser } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/utils/error";

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { loginSuccess } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isPasswordTooShort = password.length > 0 && password.length < 8;
  const isPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    document.title = "Đăng ký tài khoản | FUO Learning";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
      return;
    }

    // Verbatim requirement rule: password minimum 8 characters
    if (password.length < 8) {
      setError("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerUser({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
      loginSuccess(response.access_token, {
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.full_name,
        createdAt: response.user.created_at,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Đăng ký không thành công."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-space-3 sm:p-space-6">
      <Card className="w-full max-w-md p-space-4 sm:p-space-6 bg-color-7 border-2 border-color-1 shadow-sm rounded-3xl">
        <div className="text-center mb-space-5">
          <div
            data-impeccable-ignore="hard-offset-shadow"
            className="inline-flex w-12 h-12 rounded-full bg-color-2 text-color-7 items-center justify-center mb-space-2 border-2 border-color-1 shadow-sm"
          >
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-text-xl font-bold text-color-1">Đăng ký tài khoản</h1>
          <p className="text-text-xs text-color-1/80 mt-space-1">
            Bắt đầu luyện tập trắc nghiệm hiệu quả cùng FUO Learning.
          </p>
        </div>

        {error && (
          <div
            id="register-error"
            role="alert"
            aria-live="assertive"
            className="mb-space-4 px-space-4 py-space-3 bg-color-4/15 border-2 border-color-4 text-color-1 rounded-2xl flex items-start gap-space-2 text-[13px] sm:text-text-xs font-bold"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-color-4" />
            <span>{typeof error === "string" ? error : getErrorMessage(error)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-3" noValidate>
          <div className="flex flex-col gap-space-1">
            <label
              htmlFor="register-full-name"
              className="block text-text-xs font-bold text-color-1"
            >
              Họ và tên
            </label>
            <input
              id="register-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nguyễn Văn A"
              required
              disabled={isLoading}
              aria-invalid={!!error && !fullName.trim()}
              aria-describedby={error ? "register-error" : undefined}
              className={clsx(
                "w-full px-space-4 py-space-2 rounded-full border-2 bg-color-6 text-color-1 placeholder:text-color-1/70 outline-none hover:border-color-2 focus-visible:ring-4 focus-visible:ring-color-5 transition-all duration-fast text-text-sm disabled:opacity-60 disabled:cursor-not-allowed",
                error && !fullName.trim() ? "border-color-4" : "border-color-1"
              )}
            />
          </div>

          <div className="flex flex-col gap-space-1">
            <label
              htmlFor="register-email"
              className="block text-text-xs font-bold text-color-1"
            >
              Địa chỉ email
            </label>
            <input
              id="register-email"
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
              aria-invalid={!!error && !email.trim()}
              aria-describedby={error ? "register-error" : undefined}
              className={clsx(
                "w-full px-space-4 py-space-2 rounded-full border-2 bg-color-6 text-color-1 placeholder:text-color-1/70 outline-none hover:border-color-2 focus-visible:ring-4 focus-visible:ring-color-5 transition-all duration-fast text-text-sm disabled:opacity-60 disabled:cursor-not-allowed",
                error && !email.trim() ? "border-color-4" : "border-color-1"
              )}
            />
          </div>

          <div className="flex flex-col gap-space-1">
            <label
              htmlFor="register-password"
              className="block text-text-xs font-bold text-color-1"
            >
              Mật khẩu (tối thiểu 8 ký tự)
            </label>
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Tối thiểu 8 ký tự"
                required
                minLength={8}
                disabled={isLoading}
                aria-invalid={isPasswordTooShort}
                aria-describedby={
                  isPasswordTooShort ? "register-password-hint" : undefined
                }
                className={clsx(
                  "w-full pl-space-4 pr-14 py-space-2 rounded-full border-2 bg-color-6 text-color-1 placeholder:text-color-1/70 outline-none hover:border-color-2 focus-visible:ring-4 focus-visible:ring-color-5 transition-all duration-fast text-text-sm disabled:opacity-60 disabled:cursor-not-allowed",
                  isPasswordTooShort ? "border-color-4" : "border-color-1"
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
            {isPasswordTooShort && (
              <span
                id="register-password-hint"
                className="text-text-xs font-bold text-color-1 px-space-2"
              >
                Cần thêm {8 - password.length} ký tự nữa (tối thiểu 8 ký tự).
              </span>
            )}
          </div>

          <div className="flex flex-col gap-space-1">
            <label
              htmlFor="register-confirm-password"
              className="block text-text-xs font-bold text-color-1"
            >
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nhập lại mật khẩu"
                required
                minLength={8}
                disabled={isLoading}
                aria-invalid={isPasswordMismatch}
                aria-describedby={
                  isPasswordMismatch ? "register-confirm-hint" : undefined
                }
                className={clsx(
                  "w-full pl-space-4 pr-14 py-space-2 rounded-full border-2 bg-color-6 text-color-1 placeholder:text-color-1/70 outline-none hover:border-color-2 focus-visible:ring-4 focus-visible:ring-color-5 transition-all duration-fast text-text-sm disabled:opacity-60 disabled:cursor-not-allowed",
                  isPasswordMismatch ? "border-color-4" : "border-color-1"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={
                  showConfirmPassword
                    ? "Ẩn mật khẩu xác nhận"
                    : "Hiện mật khẩu xác nhận"
                }
                aria-pressed={showConfirmPassword}
                className="absolute right-space-1 top-1/2 -translate-y-1/2 w-11 h-11 inline-flex items-center justify-center rounded-full text-color-1/80 hover:text-color-1 hover:bg-color-7/80 outline-none focus-visible:ring-2 focus-visible:ring-color-5 transition-colors duration-fast disabled:opacity-50 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {isPasswordMismatch && (
              <span
                id="register-confirm-hint"
                className="text-text-xs font-bold text-color-1 px-space-2"
              >
                Mật khẩu xác nhận chưa khớp.
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full mt-space-2"
          >
            Tạo tài khoản
          </Button>
        </form>

        <div className="mt-space-5 pt-space-4 border-t-2 border-color-1 text-center text-text-xs text-color-1">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="inline-flex items-center min-h-11 font-bold text-color-2 underline hover:text-color-1 rounded-full px-space-2 outline-none focus-visible:ring-2 focus-visible:ring-color-5 transition-colors duration-fast"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};
