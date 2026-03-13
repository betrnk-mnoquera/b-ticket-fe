import { apiClient } from "../client";

export const authService = {
  login(data) {
    return apiClient.post("/auth/login", data);
  },

  register(data) {
    return apiClient.post("/auth/register", data);
  },

  logout() {
    return apiClient.post("/auth/logout");
  },

  me() {
    return apiClient.get("/auth/me");
  },

  refreshToken() {
    return apiClient.post("/auth/refresh");
  },

  validateToken() {
    return apiClient.post("/auth/validate-token");
  },
};
