import { apiClient } from "../client";

export const adsService = {
  getCampaigns(params) {
    return apiClient.get("/ads/campaigns", params);
  },

  getCampaign(id) {
    return apiClient.get(`/ads/campaigns/${id}`);
  },

  createCampaign(data) {
    return apiClient.post("/ads/campaigns", data);
  },

  updateCampaign(id, data) {
    return apiClient.put(`/ads/campaigns/${id}`, data);
  },

  deleteCampaign(id) {
    return apiClient.del(`/ads/campaigns/${id}`);
  },

  updateStatus(id, status) {
    return apiClient.patch(`/ads/campaigns/${id}/status`, { status });
  },

  getAnalytics(id) {
    return apiClient.get(`/ads/campaigns/${id}/analytics`);
  },

  getPlacements() {
    return apiClient.get("/ads/placements");
  },

  getStats() {
    return apiClient.get("/ads/stats");
  },
};
