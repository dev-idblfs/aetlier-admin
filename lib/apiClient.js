/**
 * API Client with Axios
 * Centralized HTTP client with auth handling
 */

import axios from "axios";
import Cookies from "js-cookie";
import config from "@/config";

const apiClient = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (requestConfig) => {
    const token = Cookies.get(config.tokenKey);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      // Clear tokens and redirect to login
      Cookies.remove(config.tokenKey);
      Cookies.remove(config.refreshTokenKey);

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
