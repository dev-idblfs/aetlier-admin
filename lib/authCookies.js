/**
 * Access-token cookie helpers for admin Bearer auth.
 *
 * Production refresh tokens should be HttpOnly Set-Cookie from the backend
 * (JS cannot set HttpOnly). These helpers only manage the short-lived access
 * token cookie used for Authorization headers.
 */

import Cookies from "js-cookie";
import config from "@/config";

function getAccessTokenCookieOptions() {
  const isBrowser = typeof window !== "undefined";
  const hostname = isBrowser ? window.location.hostname : "";
  const onAetlierDomain = hostname.endsWith("aetlier.com");
  const secure =
    isBrowser &&
    (window.location.protocol === "https:" || onAetlierDomain);

  return {
    expires: 7,
    path: "/",
    secure,
    sameSite: onAetlierDomain ? "None" : "Lax",
  };
}

export function setAccessTokenCookie(token) {
  if (!token) return;
  Cookies.set(config.tokenKey, token, getAccessTokenCookieOptions());
}

export function getAccessTokenCookie() {
  return Cookies.get(config.tokenKey);
}

export function removeAccessTokenCookie() {
  const opts = { path: "/" };
  Cookies.remove(config.tokenKey, opts);
  Cookies.remove(config.refreshTokenKey, opts);
}
