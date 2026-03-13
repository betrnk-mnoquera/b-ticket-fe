import { apiClient } from "../client";

export const couponService = {
  getCoupons(params) {
    return apiClient.get("/coupons", params);
  },

  getCoupon(id) {
    return apiClient.get(`/coupons/${id}`);
  },

  createCoupon(data) {
    return apiClient.post("/coupons", data);
  },

  updateCoupon(id, data) {
    return apiClient.put(`/coupons/${id}`, data);
  },

  deleteCoupon(id) {
    return apiClient.del(`/coupons/${id}`);
  },

  updateStatus(id, status) {
    return apiClient.patch(`/coupons/${id}/status`, { status });
  },

  getRedemptions(id) {
    return apiClient.get(`/coupons/${id}/redemptions`);
  },

  redeem(id) {
    return apiClient.post(`/coupons/${id}/redeem`);
  },

  getStats() {
    return apiClient.get("/coupons/stats");
  },
};
