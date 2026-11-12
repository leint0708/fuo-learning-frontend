import { create } from "zustand";
import type { UserProfile } from "@/types/auth";
import { apiClient } from "@/api/client";

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginSuccess: (token: string, user: UserProfile) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("fuo_auth_token"),
  user: null,
  isAuthenticated: !!localStorage.getItem("fuo_auth_token"),
  isLoading: true,

  loginSuccess: (token: string, user: UserProfile) => {
    localStorage.setItem("fuo_auth_token", token);
    set({
      accessToken: token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem("fuo_auth_token");
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateUser: (user: UserProfile) => {
    set({ user });
  },

  initAuth: async () => {
    const token = localStorage.getItem("fuo_auth_token");
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const profile = await apiClient<{
        id: string;
        email: string;
        full_name: string;
        created_at: string;
      }>("/api/v1/auth/me");

      set({
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          createdAt: profile.created_at,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("fuo_auth_token");
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
