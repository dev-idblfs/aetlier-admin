/**
 * Admin Layout Component
 * Mobile-first responsive layout with collapsible sidebar
 */

'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import RoutePermissionGuard from '@/components/RoutePermissionGuard';
import { fetchUserProfile, setPermissions } from '@/redux/slices/authSlice';
import { useLazyGetUserPermissionsQuery, useGetNavigationPermissionPresetsQuery, api } from '@/redux/services/api';
import { canAccessAdminPortal } from '@/utils/permissions';
import { setDynamicRouteRules } from '@/utils/routeAccess';

// Context for sidebar state + page title + breadcrumbs
export const SidebarContext = createContext({
    isMobileOpen: false,
    setIsMobileOpen: () => { },
    isCollapsed: false,
    setIsCollapsed: () => { },
    pageTitle: '',
    setPageTitle: () => { },
    breadcrumbs: [],
    setBreadcrumbs: () => { },
    headerActions: null,
    setHeaderActions: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export default function AdminLayout({ children }) {
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, isLoading, isAuthenticated } = useSelector((state) => state.auth);
    const [fetchPermissions] = useLazyGetUserPermissionsQuery();
    const { data: navPresets } = useGetNavigationPermissionPresetsQuery(undefined, {
        skip: !isAuthenticated,
    });

    useEffect(() => {
        if (navPresets?.route_rules?.length) {
            setDynamicRouteRules(navPresets.route_rules);
        }
    }, [navPresets]);

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [pageTitle, setPageTitle] = useState('');
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [headerActions, setHeaderActions] = useState(null);

    // Fetch user profile on mount
    useEffect(() => {
        dispatch(fetchUserProfile());
    }, [dispatch]);

    // Fetch permissions after user is loaded
    useEffect(() => {
        const loadPermissions = async () => {
            if (user?.id && !user?.permissions?.length) {
                try {
                    const result = await fetchPermissions(user.id).unwrap();
                    const permissionNames = result?.permissions || [];
                    dispatch(setPermissions(permissionNames));
                    dispatch(api.util.invalidateTags(['Navigation']));
                } catch (error) {
                    console.error('Failed to fetch permissions:', error);
                }
            }
        };

        loadPermissions();
    }, [user?.id, dispatch, fetchPermissions]);

    // Check authentication and role
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const query = searchParams.toString();
            const returnTo = encodeURIComponent(
                `${pathname}${query ? `?${query}` : ''}`
            );
            router.push(`/login?returnTo=${returnTo}`);
        }

        if (!isLoading && user && !canAccessAdminPortal(user)) {
            router.push('/unauthorized');
        }
    }, [isLoading, isAuthenticated, user, router, pathname, searchParams]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Spinner size="lg" color="primary" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed, pageTitle, setPageTitle, breadcrumbs, setBreadcrumbs, headerActions, setHeaderActions }}>
            <div className="min-h-screen bg-gray-50">
                <Sidebar />

                {/* Main content - responsive margin */}
                <div className={`
                    min-h-screen flex flex-col transition-all duration-300
                    ${isCollapsed ? 'md:ml-[80px]' : 'md:ml-[280px]'}
                `}>
                    <Header />
                    <main className="flex-1 p-3 md:p-4 pb-24 md:pb-4">
                        <RoutePermissionGuard>{children}</RoutePermissionGuard>
                    </main>
                </div>

                {/* Bottom navigation — mobile only */}
                <BottomNav />
            </div>
        </SidebarContext.Provider>
    );
}
