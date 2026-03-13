import { apiClient } from "../client";

export const lineOfBusinessService = {
  getAll(params) {
    return apiClient.get("/line-of-business", params);
  },

  get(id) {
    return apiClient.get(`/line-of-business/${id}`);
  },

  create(data) {
    return apiClient.post("/line-of-business", data);
  },

  update(id, data) {
    return apiClient.put(`/line-of-business/${id}`, data);
  },

  delete(id) {
    return apiClient.del(`/line-of-business/${id}`);
  },
};
