import { apiClient } from "../client";

export const organizationService = {
  getOrganizations(params) {
    return apiClient.get("/organizations", params);
  },

  getOrganization(id) {
    return apiClient.get(`/organizations/${id}`);
  },

  createOrganization(data) {
    return apiClient.post("/organizations", data);
  },

  updateOrganization(id, data) {
    return apiClient.put(`/organizations/${id}`, data);
  },

  deleteOrganization(id) {
    return apiClient.del(`/organizations/${id}`);
  },
};
