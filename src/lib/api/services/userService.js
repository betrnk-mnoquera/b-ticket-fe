import { apiClient } from "../client";

export const userService = {
  getUsers(params) {
    return apiClient.get("/users", params);
  },

  getUser(id) {
    return apiClient.get(`/users/${id}`);
  },

  createUser(data) {
    return apiClient.post("/users", data);
  },

  updateUser(id, data) {
    return apiClient.put(`/users/${id}`, data);
  },

  deleteUser(id) {
    return apiClient.del(`/users/${id}`);
  },

  getStats() {
    return apiClient.get("/users/stats");
  },
};
