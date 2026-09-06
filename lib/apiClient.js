/**
 * API Client with Axios
 * Centralized HTTP client with auth handling
 */

import axios from "axios";
import config from "@/config";
import { getAccessTokenCookie, setAccessTokenCookie, removeAccessTokenCookie } from "@/lib/authCookies";
import {
  clearRefreshToken,
  refreshAccessToken,
  storeRefreshToken,
  canRefreshSession,
  usesCookieAuth,
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

function isOnLoginPage() {
  if (typeof window === "undefined") return false;
  return window.location.pathname === "/login";
}

function redirectToLogin() {
  if (typeof window === "undefined" || isOnLoginPage()) return;
  const path = window.location.pathname + window.location.search;
  const safe =
    path.startsWith("/") && !path.startsWith("//") && path !== "/login"
      ? path
      : null;
  const qs = safe ? `?returnTo=${encodeURIComponent(safe)}` : "";
  window.location.href = `/login${qs}`;
}

apiClient.interceptors.request.use(
  (requestConfig) => {
    const token = getAccessTokenCookie();
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

    if (response?.status !== 401 || !requestConfig) {
      return Promise.reject(error);
    }

    // Login / SSO bootstrap must not hard-reload on 401 (infinite loop).
    if (requestConfig.skipAuthRedirect || isOnLoginPage()) {
      return Promise.reject(error);
    }

    if (!requestConfig._retry && canRefreshSession()) {
      try {
        requestConfig._retry = true;
        const refreshed = await refreshAccessToken();
        const nextToken = refreshed?.tokens?.access_token;
        if (nextToken) {
          setAccessTokenCookie(nextToken);
          if (refreshed?.tokens?.refresh_token && !usesCookieAuth()) {
            storeRefreshToken(refreshed.tokens.refresh_token);
          }
          requestConfig.headers.Authorization = `Bearer ${nextToken}`;
          return apiClient(requestConfig);
        }
      } catch (refreshError) {
        console.warn("Admin token refresh failed:", refreshError);
      }
    }

    removeAccessTokenCookie();
    clearRefreshToken();
    redirectToLogin();

    return Promise.reject(error);
  }
);

export default apiClient;
