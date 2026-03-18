import { apiClient } from "../client";

export const productService = {
  getProducts(params) {
    return apiClient.get("/products", params);
  },

  getProduct(id) {
    return apiClient.get(`/products/${id}`);
  },

  createProduct(data) {
    return apiClient.post("/products", data);
  },

  updateProduct(id, data) {
    return apiClient.put(`/products/${id}`, data);
  },

  deleteProduct(id) {
    return apiClient.del(`/products/${id}`);
  },
};
