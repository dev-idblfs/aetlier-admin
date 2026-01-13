/**
 * Admin Layout Component
 * Mobile-first responsive layout with collapsible sidebar
 */

'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';
import Sidebar from './Sidebar';
import Header from './Header';
import { fetchUserProfile, setPermissions } from '@/redux/slices/authSlice';
import { useLazyGetUserPermissionsQuery } from '@/redux/services/api';

// Context for mobile sidebar state
export const SidebarContext = createContext({
    isMobileOpen: false,
    setIsMobileOpen: () => { },
    isCollapsed: false,
    setIsCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export default function AdminLayout({ children }) {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user, isLoading, isAuthenticated } = useSelector((state) => state.auth);
    const [fetchPermissions] = useLazyGetUserPermissionsQuery();

    // Sidebar state
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, []);

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
            router.push('/login');
        }

        if (!isLoading && user && !['admin', 'super_admin', 'superadmin'].includes(user.role)) {
            router.push('/unauthorized');
        }
    }, [isLoading, isAuthenticated, user, router]);

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
        <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }}>
            <div className="min-h-screen bg-gray-50">
                {/* Mobile sidebar backdrop */}
                {isMobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}

                <Sidebar />

                {/* Main content - responsive margin */}
                <div className={`
                    min-h-screen flex flex-col transition-all duration-300
                    md:ml-70
                    ${isCollapsed ? 'md:ml-20' : 'md:ml-70'}
                `}>
                    <Header />
                    <main className="flex-1 p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
