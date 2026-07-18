/**
 * Admin Layout Component
 * Desktop sidebar + mobile left-drawer navigation
 */

'use client';

import { useEffect, useState, useRef, createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import Cookies from 'js-cookie';
import Sidebar from './Sidebar';
import Header from './Header';
import RoutePermissionGuard from '@/components/RoutePermissionGuard';
import { fetchUserProfile, setLoading } from '@/redux/slices/authSlice';
import { useGetNavigationPermissionPresetsQuery, api } from '@/redux/services/api';
import { canAccessAdminPortal } from '@/utils/permissions';
import { setDynamicRouteRules } from '@/utils/routeAccess';
import config from '@/config';

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
    const redirectedRef = useRef(false);
    const { user, permissions, isLoading, isAuthenticated } = useSelector((state) => state.auth);
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

    // Fetch user profile on mount only when a token exists
    useEffect(() => {
        const token = Cookies.get(config.tokenKey);
        if (!token) {
            dispatch(setLoading(false));
            return;
        }
        dispatch(fetchUserProfile());
    }, [dispatch]);

    // Hydrate permissions via /auth/me (works for doctors). Admin-only
    // GET /admin/users/:id/permissions is not available to staff roles.
    useEffect(() => {
        const hasPerms = Boolean(user?.permissions?.length || permissions?.length);
        if (user?.id && !hasPerms) {
            dispatch(fetchUserProfile())
                .unwrap()
                .then(() => {
                    dispatch(api.util.invalidateTags(['Navigation']));
                })
                .catch((error) => {
                    console.error('Failed to refresh user permissions:', error);
                });
        }
    }, [user?.id, user?.permissions?.length, permissions?.length, dispatch]);

    // Check authentication and role — redirect once
    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            if (redirectedRef.current) return;
            redirectedRef.current = true;
            const query = searchParams.toString();
            const returnTo = encodeURIComponent(
                `${pathname}${query ? `?${query}` : ''}`
            );
            router.replace(`/login?returnTo=${returnTo}`);
            return;
        }

        if (user && !canAccessAdminPortal(user)) {
            router.replace('/unauthorized');
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
                    <main className="flex-1 p-3 md:p-4">
                        <RoutePermissionGuard>{children}</RoutePermissionGuard>
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
