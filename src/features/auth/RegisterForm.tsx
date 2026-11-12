import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { registerUser } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { loginSuccess } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      setError(err instanceof Error ? err.message : "Đăng ký không thành công.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-space-4">
      <Card className="w-full max-w-md p-space-6 bg-color-7 border-2 border-color-1 shadow-sm">
        <div className="text-center mb-space-5">
          <div className="inline-flex w-12 h-12 rounded-full bg-color-3 text-color-7 items-center justify-center mb-space-2 border-2 border-color-1 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-text-xl font-bold text-color-1">Đăng ký tài khoản</h2>
          <p className="text-text-xs text-color-1/70 mt-1">
            Bắt đầu luyện tập trắc nghiệm hiệu quả cùng FUO Learning.
          </p>
        </div>

        {error && (
          <div className="mb-space-4 p-space-3 bg-color-4/10 border-2 border-color-4 text-color-4 rounded-2xl flex items-center gap-space-2 text-text-xs font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-space-3">
          <div>
            <label className="block text-text-xs font-bold text-color-1 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              className="w-full px-space-4 py-space-2 rounded-full border-2 border-color-1 bg-color-6 text-color-1 placeholder-color-1/40 outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-all text-text-sm"
            />
          </div>

          <div>
            <label className="block text-text-xs font-bold text-color-1 mb-1">
              Địa chỉ email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@fpt.edu.vn"
              required
              className="w-full px-space-4 py-space-2 rounded-full border-2 border-color-1 bg-color-6 text-color-1 placeholder-color-1/40 outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-all text-text-sm"
            />
          </div>

          <div>
            <label className="block text-text-xs font-bold text-color-1 mb-1">
              Mật khẩu (tối thiểu 8 ký tự)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-space-4 py-space-2 rounded-full border-2 border-color-1 bg-color-6 text-color-1 placeholder-color-1/40 outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-all text-text-sm"
            />
          </div>

          <div>
            <label className="block text-text-xs font-bold text-color-1 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-space-4 py-space-2 rounded-full border-2 border-color-1 bg-color-6 text-color-1 placeholder-color-1/40 outline-none focus-visible:ring-4 focus-visible:ring-color-5 transition-all text-text-sm"
            />
          </div>

          <Button
            type="submit"
            variant="accent"
            isLoading={isLoading}
            className="w-full mt-space-3"
          >
            Tạo tài khoản
          </Button>
        </form>

        <div className="mt-space-5 pt-space-4 border-t-2 border-color-1 text-center text-text-xs text-color-1">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-bold text-color-2 underline hover:text-color-1 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};
