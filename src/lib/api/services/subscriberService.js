import { apiClient } from "../client";

export const subscriberService = {
  getSubscribers(params) {
    return apiClient.get("/subscribers", params);
  },

  getSubscriber(id) {
    return apiClient.get(`/subscribers/${id}`);
  },

  createSubscriber(data) {
    return apiClient.post("/subscribers", data);
  },

  updateSubscriber(id, data) {
    return apiClient.put(`/subscribers/${id}`, data);
  },

  deleteSubscriber(id) {
    return apiClient.del(`/subscribers/${id}`);
  },

  changePlan(id, plan) {
    return apiClient.patch(`/subscribers/${id}/plan`, { plan });
  },

  getStats() {
    return apiClient.get("/subscribers/stats");
  },
};
