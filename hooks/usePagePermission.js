'use client';

import { useSelector } from 'react-redux';
import { hasAnyPermission, hasPermission } from '@/utils/permissions';

/**
 * Page-level permission helper — use with RTK Query `{ skip: !canView }`.
 * RoutePermissionGuard already blocks direct URL access; this avoids fetching data.
 */
export function usePagePermission(required) {
  const user = useSelector((state) => state.auth.user);
  const list = Array.isArray(required) ? required : [required];
  const canView = hasAnyPermission(user, list);
  const check = (permission) => hasPermission(user, permission);
  return { user, canView, hasPermission: check };
}
