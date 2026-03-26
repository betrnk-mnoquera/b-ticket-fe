import { apiClient } from "../client";

export const categoryService = {
  getAll(params) {
    return apiClient.get("/categories", params);
  },

  get(id) {
    return apiClient.get(`/categories/${id}`);
  },

  create(data) {
    return apiClient.post("/categories", data);
  },

  update(id, data) {
    return apiClient.put(`/categories/${id}`, data);
  },

  delete(id) {
    return apiClient.del(`/categories/${id}`);
  },
};
