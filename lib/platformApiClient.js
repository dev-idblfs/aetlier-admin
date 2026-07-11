/**
 * Axios client for platform console auth only.
 * Uses platform_access_token — never the clinic admin cookie.
 */

import axios from "axios";
import Cookies from "js-cookie";
import config from "@/config";

const platformApiClient = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "Content-Type": "application/json",
    "X-Client-App": "platform",
  },
});

platformApiClient.interceptors.request.use((requestConfig) => {
  const token = Cookies.get(config.platformTokenKey);
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

platformApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove(config.platformTokenKey);
      if (!window.location.pathname.startsWith("/platform/login")) {
        const returnTo = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `/platform/login?returnTo=${returnTo}`;
      }
    }
    return Promise.reject(error);
  }
);

export default platformApiClient;
