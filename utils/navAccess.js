/**
 * Filter sidebar navigation using the same rules as RoutePermissionGuard.
 */
import { isSuperAdmin } from '@/utils/permissions';
import { resolveAdminRouteAccess } from '@/utils/routeAccess';

export function canAccessNavHref(href, user) {
  if (!user || !href) return false;
  const normalized = href.replace(/\/$/, '') || '/';
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
