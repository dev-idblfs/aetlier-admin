'use client';

/**
 * Platform console shell. Reuses AdminLayout SidebarContext so PageHeader /
 * ListPageLayout sync titles into the sticky header.
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { SidebarContext } from '@/components/layout/AdminLayout';
import PlatformSidebar from './PlatformSidebar';
import PlatformHeader from './PlatformHeader';
import { fetchPlatformOperator } from '@/redux/slices/platformAuthSlice';

export default function PlatformLayout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { operator, isLoading, isAuthenticated } = useSelector(
    (state) => state.platformAuth
  );

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [headerActions, setHeaderActions] = useState(null);

  useEffect(() => {
    dispatch(fetchPlatformOperator());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const query = searchParams.toString();
      const returnTo = encodeURIComponent(
        `${pathname}${query ? `?${query}` : ''}`
      );
      router.push(`/platform/login?returnTo=${returnTo}`);
    }
  }, [isLoading, isAuthenticated, router, pathname, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600">Loading platform console...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !operator) {
    return null;
  }

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        setIsMobileOpen,
        isCollapsed,
        setIsCollapsed,
        pageTitle,
        setPageTitle,
        breadcrumbs,
        setBreadcrumbs,
        headerActions,
        setHeaderActions,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <PlatformSidebar />
        <div
          className={`
            min-h-screen flex flex-col transition-all duration-300
            ${isCollapsed ? 'md:ml-[80px]' : 'md:ml-[260px]'}
          `}
        >
          <PlatformHeader />
          <main className="flex-1 p-3 md:p-4 pb-8">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
