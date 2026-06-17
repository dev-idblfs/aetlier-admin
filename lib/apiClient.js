/**
 * API Client with Axios
 * Centralized HTTP client with auth handling
 */

import axios from "axios";
import Cookies from "js-cookie";
import config from "@/config";
import {
  clearRefreshToken,
  refreshAccessToken,
  storeRefreshToken,
  usesCookieAuth,
  canRefreshSession,
} from "@/services/sessionApi";

const apiClient = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "Content-Type": "application/json",
    "X-Client-App": "admin",
  },
  withCredentials: true,
  timeout: 30000,
});

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config: requestConfig } = error;

    if (response?.status === 401 && !requestConfig?._retry && canRefreshSession()) {
      try {
        requestConfig._retry = true;
        const refreshed = await refreshAccessToken();
        const nextToken = refreshed?.tokens?.access_token;
        if (nextToken) {
          Cookies.set(config.tokenKey, nextToken, { expires: 7 });
          if (refreshed?.tokens?.refresh_token) {
            storeRefreshToken(refreshed.tokens.refresh_token);
          }
          requestConfig.headers.Authorization = `Bearer ${nextToken}`;
          return apiClient(requestConfig);
        }
      } catch (refreshError) {
        console.warn("Admin token refresh failed:", refreshError);
      }

      Cookies.remove(config.tokenKey);
      Cookies.remove(config.refreshTokenKey);
      clearRefreshToken();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
