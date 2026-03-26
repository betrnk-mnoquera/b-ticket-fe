import { apiClient } from "../client";

export const businessTypeService = {
  getAll(params) {
    return apiClient.get("/business-types", params);
  },

  get(id) {
    return apiClient.get(`/business-types/${id}`);
  },

  create(data) {
    return apiClient.post("/business-types", data);
  },

  update(id, data) {
    return apiClient.put(`/business-types/${id}`, data);
  },

  delete(id) {
    return apiClient.del(`/business-types/${id}`);
  },
};
