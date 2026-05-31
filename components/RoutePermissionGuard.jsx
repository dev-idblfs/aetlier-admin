'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import AccessDenied from '@/components/AccessDenied';
import { resolveAdminRouteAccess } from '@/utils/routeAccess';
import { withUserPermissions } from '@/utils/navAccess';

export default function RoutePermissionGuard({ children }) {
  const pathname = usePathname();
  const user = useSelector((state) => state.auth.user);
  const permissions = useSelector((state) => state.auth.permissions);
  const authUser = withUserPermissions(user, permissions);

  const access = useMemo(
    () => resolveAdminRouteAccess(pathname, authUser),
    [pathname, authUser],
  );

  if (!user) {
    return null;
  }

  if (!access.allowed) {
    return <AccessDenied />;
  }

  return children;
}
