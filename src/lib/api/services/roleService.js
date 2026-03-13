import { apiClient } from "../client";

export const roleService = {
  getRoles(params) {
    return apiClient.get("/roles", params);
  },

  getRole(id) {
    return apiClient.get(`/roles/${id}`);
  },

  createRole(data) {
    return apiClient.post("/roles", data);
  },

  updateRole(id, data) {
    return apiClient.put(`/roles/${id}`, data);
  },

  deleteRole(id) {
    return apiClient.del(`/roles/${id}`);
  },

  getPermissions() {
    return apiClient.get("/permissions");
  },
};
