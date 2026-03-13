import { apiClient } from "../client";

export const storeService = {
  getStores(params) {
    return apiClient.get("/stores", params);
  },

  getStore(id) {
    return apiClient.get(`/stores/${id}`);
  },

  createStore(data) {
    return apiClient.post("/stores", data);
  },

  updateStore(id, data) {
    return apiClient.put(`/stores/${id}`, data);
  },

  deleteStore(id) {
    return apiClient.del(`/stores/${id}`);
  },

  updateStatus(id, status) {
    return apiClient.patch(`/stores/${id}/status`, { status });
  },
};
