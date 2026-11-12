import { describe, it, expect, beforeEach } from "vitest";
import { loginUser, registerUser, getMe } from "@/api/auth";

describe("Auth API Client Contract Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("successfully logs in with valid credentials", async () => {
    const res = await loginUser({
      email: "test@fpt.edu.vn",
      password: "Password123",
    });

    expect(res).toBeDefined();
    expect(res.access_token).toBe("mock_jwt_token_12345");
    expect(res.user.email).toBe("test@fpt.edu.vn");
    expect(res.user.full_name).toBe("Nguyen Van A");
  });

  it("throws ApiError when credentials are invalid", async () => {
    await expect(
      loginUser({
        email: "wrong@fpt.edu.vn",
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("successfully registers a new user", async () => {
    const res = await registerUser({
      email: "newuser@fpt.edu.vn",
      password: "Password123",
      fullName: "Tran Van B",
    });

    expect(res).toBeDefined();
    expect(res.access_token).toBe("mock_jwt_token_new");
    expect(res.user.email).toBe("newuser@fpt.edu.vn");
  });

  it("fetches authenticated profile when token is set", async () => {
    localStorage.setItem("fuo_auth_token", "mock_jwt_token_12345");
    const me = await getMe();

    expect(me).toBeDefined();
    expect(me.email).toBe("test@fpt.edu.vn");
    expect(me.fullName).toBe("Nguyen Van A");
  });
});
