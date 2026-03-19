import { apiClient } from "../client";

export const planService = {
  getPlans(params) {
    return apiClient.get("/plans", params);
  },

  getPlan(id) {
    return apiClient.get(`/plans/${id}`);
  },

  createPlan(data) {
    return apiClient.post("/plans", data);
  },

  updatePlan(id, data) {
    return apiClient.put(`/plans/${id}`, data);
  },

  deletePlan(id) {
    return apiClient.del(`/plans/${id}`);
  },

  toggleActive(id) {
    return apiClient.patch(`/plans/${id}/toggle`);
  },

  getStats() {
    return apiClient.get("/plans/stats");
  },
};
