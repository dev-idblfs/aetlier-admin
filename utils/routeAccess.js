/**
 * Dynamic admin route rules — loaded from backend presets on app init.
 * Fallback: constants/routePermissions.js (static).
 */
import {
  hasAnyPermission,
  isSuperAdmin,
} from '@/utils/permissions';
import {
  ADMIN_DASHBOARD_PATHS,
  ADMIN_ROUTE_RULES,
} from '@/constants/routePermissions';

let dynamicRouteRules = null;

/** Called once when /settings/navigation/permission-presets loads. */
export function setDynamicRouteRules(rules) {
  if (Array.isArray(rules) && rules.length > 0) {
    dynamicRouteRules = rules;
  }
}

function getActiveRouteRules() {
  return dynamicRouteRules || ADMIN_ROUTE_RULES;
}

export function resolveAdminRouteAccess(pathname, user) {
  if (!user) {
    return { allowed: false };
  }

  if (isSuperAdmin(user)) {
    return { allowed: true };
  }

  const permissions = user.permissions || [];
  const normalized =
    !pathname || pathname === '' ? '/' : pathname.replace(/\/$/, '') || '/';

  if (ADMIN_DASHBOARD_PATHS.includes(normalized)) {
    return { allowed: true };
  }

  if (!permissions.length) {
    return { allowed: false, reason: 'no_permissions' };
  }

  const rules = [...getActiveRouteRules()].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );

  const rule = rules.find(
    (r) =>
      normalized === r.prefix || normalized.startsWith(`${r.prefix}/`),
  );

  if (!rule) {
    return { allowed: false, reason: 'unknown_route' };
  }

  const allowed = hasAnyPermission(user, rule.any);
  return { allowed, required: rule.any };
}

/** Lookup preset permission strings for a href (create form hint). */
export function getPresetPermissionsForHref(href, presets) {
  if (!presets?.by_href || !href) return [];
  const key = href.replace(/\/$/, '') || '/';
  return presets.by_href[key] || [];
}

export function getPresetPermissionsForLabel(label, presets) {
  if (!presets?.by_label || !label) return [];
  return presets.by_label[label] || [];
}
