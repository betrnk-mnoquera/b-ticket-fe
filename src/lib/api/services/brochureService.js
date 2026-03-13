import { apiClient } from "../client";

export const brochureService = {
  getBrochures(params) {
    return apiClient.get("/brochures", params);
  },

  getBrochure(id) {
    return apiClient.get(`/brochures/${id}`);
  },

  createBrochure(data) {
    return apiClient.post("/brochures", data);
  },

  updateBrochure(id, data) {
    return apiClient.put(`/brochures/${id}`, data);
  },

  deleteBrochure(id) {
    return apiClient.del(`/brochures/${id}`);
  },

  publish(id) {
    return apiClient.post(`/brochures/${id}/publish`);
  },

  getStats() {
    return apiClient.get("/brochures/stats");
  },
};
