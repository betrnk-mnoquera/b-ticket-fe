import { apiClient } from "../client";

export const mediaService = {
  upload(file) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/media/upload", formData);
  },

  get(id) {
    return apiClient.get(`/media/${id}`);
  },

  delete(id) {
    return apiClient.del(`/media/${id}`);
  },
};
