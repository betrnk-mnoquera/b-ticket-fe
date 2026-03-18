import { getToken, clearToken } from "./token";
import { toCamelCase, toSnakeCase } from "./transform";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function request(endpoint, options = {}) {
  const { body, isFormData = false, ...customOptions } = options;

  const token = getToken();

  const headers = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...customOptions.headers,
  };

  const config = {
    ...customOptions,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(toSnakeCase(body));
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Handle Laravel validation errors
    if (error.errors) {
      const firstField = Object.keys(error.errors)[0];
      const firstMsg = error.errors[firstField]?.[0] || error.errors[firstField];
      throw new Error(firstMsg || `Validation failed`);
    }
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null;

  const data = await response.json();
  return toCamelCase(data);
}

export function get(endpoint, params = {}) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = query ? `${endpoint}?${query}` : endpoint;
  return request(url, { method: "GET" });
}

export function post(endpoint, body, options = {}) {
  return request(endpoint, { ...options, method: "POST", body });
}

export function put(endpoint, body, options = {}) {
  return request(endpoint, { ...options, method: "PUT", body });
}

export function patch(endpoint, body, options = {}) {
  return request(endpoint, { ...options, method: "PATCH", body });
}

export function del(endpoint, options = {}) {
  return request(endpoint, { ...options, method: "DELETE" });
}

export const apiClient = { get, post, put, patch, del };
