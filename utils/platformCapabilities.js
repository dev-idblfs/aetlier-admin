/**
 * Platform operator capability checks (control plane).
 * Keys match backend require_platform_capability(...).
 */

export const PLATFORM_CAPS = {
  TENANTS_READ: "tenants_read",
  TENANTS_ONBOARD: "tenants_onboard",
  TENANTS_SUSPEND: "tenants_suspend",
  TENANTS_RETRY: "tenants_retry",
  OPERATORS_MANAGE: "operators_manage",
};

export function hasPlatformCapability(capabilities, key) {
  if (!capabilities || typeof capabilities !== "object") return false;
  return Boolean(capabilities[key]);
}

export function hasAnyPlatformCapability(capabilities, keys) {
  return keys.some((key) => hasPlatformCapability(capabilities, key));
}
