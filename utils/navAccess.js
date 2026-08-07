/**
 * Filter sidebar navigation using the same rules as RoutePermissionGuard.
 */
import { isSuperAdmin } from '@/utils/permissions';
import { resolveAdminRouteAccess } from '@/utils/routeAccess';

/** href prefix → organization feature_flag key */
const NAV_FEATURE_FLAGS = {
  '/facescan': 'facescan',
  '/referral': 'referrals',
  '/referrals': 'referrals',
};

function getActiveOrgFeatureFlags(user) {
  const orgs = user?.organizations || [];
  const activeId = user?.active_organization_id || user?.organization_id;
  const active = orgs.find((o) => o.id === activeId) || orgs[0];
  return active?.feature_flags || {};
}

function isNavFeatureAllowed(href, user) {
  if (!href) return true;
  const normalized = href.replace(/\/$/, '') || '/';
  const flags = getActiveOrgFeatureFlags(user);
  for (const [prefix, flag] of Object.entries(NAV_FEATURE_FLAGS)) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      // Missing flag (legacy Aetlier) → allow; explicit false → hide
      if (flags && Object.prototype.hasOwnProperty.call(flags, flag)) {
        return !!flags[flag];
      }
      return true;
    }
  }
  return true;
}

export function canAccessNavHref(href, user) {
  if (!user || !href) return false;
  const normalized = href.replace(/\/$/, '') || '/';
  if (!isNavFeatureAllowed(normalized, user)) return false;
  return resolveAdminRouteAccess(normalized, user).allowed;
}

/** Merge top-level auth permissions when user.permissions is not yet populated. */
export function withUserPermissions(user, permissions = []) {
  if (!user) return null;
  if (user.permissions?.length) return user;
  if (permissions?.length) {
    return { ...user, permissions };
  }
  return user;
}

/**
 * Returns only nav items the user may view. Parent sections stay visible when
 * at least one child is accessible; parent href is dropped when denied.
 */
export function filterNavItemsByPermission(items, user) {
  if (!items?.length) return [];
  if (isSuperAdmin(user)) return items;

  const filtered = [];

  for (const item of items) {
    const children = item.children?.length
      ? filterNavItemsByPermission(item.children, user)
      : [];

    const hrefAllowed = item.href ? canAccessNavHref(item.href, user) : false;

    if (children.length > 0) {
      filtered.push({
        ...item,
        href: hrefAllowed ? item.href : null,
        children,
      });
      continue;
    }

    if (item.href && hrefAllowed) {
      filtered.push({ ...item, children: undefined });
    }
  }

  return filtered;
}
