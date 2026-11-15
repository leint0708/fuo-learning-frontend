import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginForm } from "@/features/auth/LoginForm";
import { RegisterForm } from "@/features/auth/RegisterForm";

describe("Authentication Forms (LoginForm & RegisterForm)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("LoginForm", () => {
    it("associates labels with inputs and provides autocomplete attributes", () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <LoginForm />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText("Địa chỉ email");
      const passwordInput = screen.getByLabelText("Mật khẩu");

      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(emailInput).toHaveAttribute("inputMode", "email");
      expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("toggles password visibility when clicking the eye toggle button", () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <LoginForm />
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText("Mật khẩu");
      const toggleButton = screen.getByRole("button", { name: "Hiện mật khẩu" });

      expect(passwordInput).toHaveAttribute("type", "password");
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");
      expect(
        screen.getByRole("button", { name: "Ẩn mật khẩu" })
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("displays an accessible alert when submitted with empty fields", async () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <LoginForm />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole("button", { name: "Đăng nhập" });
      fireEvent.click(submitBtn);

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(
        "Vui lòng điền đầy đủ email và mật khẩu."
      );
    });
  });

  describe("RegisterForm", () => {
    it("associates all four labels with inputs and unifies primary submit button", () => {
      render(
        <MemoryRouter initialEntries={["/register"]}>
          <RegisterForm />
        </MemoryRouter>
      );

      expect(screen.getByLabelText("Họ và tên")).toHaveAttribute(
        "autoComplete",
        "name"
      );
      expect(screen.getByLabelText("Địa chỉ email")).toHaveAttribute(
        "autoComplete",
        "email"
      );
      expect(
        screen.getByLabelText("Mật khẩu (tối thiểu 8 ký tự)")
      ).toHaveAttribute("autoComplete", "new-password");
      expect(screen.getByLabelText("Xác nhận mật khẩu")).toHaveAttribute(
        "autoComplete",
        "new-password"
      );

      const submitBtn = screen.getByRole("button", { name: "Tạo tài khoản" });
      expect(submitBtn.className).toContain("bg-color-2");
    });

    it("shows live inline password length and mismatch hints and toggles visibility", async () => {
      render(
        <MemoryRouter initialEntries={["/register"]}>
          <RegisterForm />
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText(
        "Mật khẩu (tối thiểu 8 ký tự)"
      );
      const confirmInput = screen.getByLabelText("Xác nhận mật khẩu");

      fireEvent.change(passwordInput, { target: { value: "short" } });
      expect(
        screen.getByText(/Cần thêm 3 ký tự nữa/i)
      ).toBeInTheDocument();

      fireEvent.change(passwordInput, { target: { value: "Password123" } });
      fireEvent.change(confirmInput, { target: { value: "Password999" } });

      expect(
        screen.getByText("Mật khẩu xác nhận chưa khớp.")
      ).toBeInTheDocument();

      const toggleConfirmBtn = screen.getByRole("button", {
        name: "Hiện mật khẩu xác nhận",
      });
      fireEvent.click(toggleConfirmBtn);
      await waitFor(() => {
        expect(confirmInput).toHaveAttribute("type", "text");
      });
    });
  });
});
