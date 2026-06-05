import axios from "axios";
import config from "@/config";

const sessionClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});

export function usesCookieAuth() {
  if (typeof window === "undefined") return false;
  return (process.env.NEXT_PUBLIC_API_URL || "").includes("aetlier.com");
}

const REFRESH_KEY = "aetlier_refresh_token";

export function storeRefreshToken(token) {
  if (!token || usesCookieAuth()) return;
  try {
    localStorage.setItem(REFRESH_KEY, token);
  } catch {
    // ignore
  }
}

export function getRefreshToken() {
  if (usesCookieAuth()) return null;
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function clearRefreshToken() {
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore
  }
}

export async function refreshAccessToken() {
  const body = {};
  const stored = getRefreshToken();
  if (stored) body.refresh_token = stored;

  const { data } = await sessionClient.post("/auth/refresh", body, {
    headers: { "X-Client-App": "admin" },
  });
  if (data?.tokens?.refresh_token) {
    storeRefreshToken(data.tokens.refresh_token);
  }
  return data;
}

export async function fetchAuthSession(accessToken) {
  const { data } = await sessionClient.get("/auth/session", {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });
  return data;
}

export async function logoutAllSessions(accessToken) {
  await sessionClient.post(
    "/auth/logout/all",
    {},
    {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }
  );
}
