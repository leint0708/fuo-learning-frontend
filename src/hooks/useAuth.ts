import { useAuthStore } from "@/stores/authStore";

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, isLoading, loginSuccess, logout, initAuth } =
    useAuthStore();

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    loginSuccess,
    logout,
    initAuth,
  };
};
