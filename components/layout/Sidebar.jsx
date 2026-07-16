/**
 * Admin Sidebar Navigation
 * Desktop: fixed left rail. Mobile: left drawer overlay opened from the header menu.
 * Dynamic navigation fetched from backend API based on user permissions
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Calendar,
    Users,
    UserCog,
    Briefcase,
    Settings,
    Shield,
    Key,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Wallet,
    FileText,
    Receipt,
    Contact,
    BarChart3,
    ChevronDown,
    Menu,
    X,
    AlertCircle,
    Target,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { useGetNavigationQuery } from '@/redux/services/api';
import { filterNavItemsByPermission, withUserPermissions } from '@/utils/navAccess';
import { getDisplayRole } from '@/utils/permissions';
import { useSidebar } from './AdminLayout';

/**
 * Icon mapping - Maps icon name strings from backend to Lucide components
 *
 * HOW TO ADD A NEW MODULE'S ICON:
 * 1. Pick an icon from https://lucide.dev
 * 2. Import it below (in the lucide-react import block above)
 * 3. Add it to ICON_MAP with the EXACT same string you use in the
 *    Alembic migration: add_nav_item(..., icon='YourIconName', ...)
 *
 * If you skip this step, the sidebar silently falls back to LayoutDashboard.
 */
const ICON_MAP = {
    LayoutDashboard,
    Calendar,
    Users,
    UserCog,
    Briefcase,
    Settings,
    Shield,
    Key,
    Wallet,
    FileText,
    Receipt,
    Contact,
    BarChart3,
    Menu,
    Target,
};

/**
 * Get icon component from string name
 */
const getIcon = (iconName) => {
    if (!iconName) return LayoutDashboard;
    return ICON_MAP[iconName] || LayoutDashboard;
};

/**
 * Loading skeleton for navigation items
 */
const NavSkeleton = () => (
    <div className="space-y-2 px-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        ))}
    </div>
);

/**
 * Error state for navigation
 */
const NavError = ({ onRetry }) => (
    <div className="px-3 py-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">Failed to load navigation</p>
        <button
            onClick={onRetry}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
            Try again
        </button>
    </div>
);

export default function Sidebar() {
    const { isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed } = useSidebar();
    const pathname = usePathname();
    const dispatch = useDispatch();
    const { user, permissions, isAuthenticated } = useSelector((state) => state.auth);
    const [expandedSections, setExpandedSections] = useState({});

    // Fetch navigation from API
    const {
        data: navItems = [],
        isLoading,
        isError,
        refetch
    } = useGetNavigationQuery(undefined, {
        skip: !isAuthenticated || !user,
    });

    const visibleNavItems = useMemo(
        () => filterNavItemsByPermission(navItems, withUserPermissions(user, permissions)),
        [navItems, user, permissions],
    );

    const handleLogout = () => {
        dispatch(logout({ returnPath: pathname }));
    };

    const handleNavClick = () => {
        setIsMobileOpen(false);
    };

    const toggleSection = (label) => {
        setExpandedSections(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    // Auto-expand sections based on current path
    useEffect(() => {
        if (!visibleNavItems || visibleNavItems.length === 0) return;

        visibleNavItems.forEach(item => {
            if (item.children && item.children.length > 0) {
                const isChildActive = item.children.some(child =>
                    pathname === child.href || pathname.startsWith(child.href + '/')
                );
                if (isChildActive && !expandedSections[item.label]) {
                    setExpandedSections(prev => ({ ...prev, [item.label]: true }));
                }
            }
        });
    }, [pathname, visibleNavItems]);

    // Close mobile drawer when viewport crosses to desktop
    useEffect(() => {
        const media = window.matchMedia('(min-width: 768px)');
        const handleChange = (event) => {
            if (event.matches) setIsMobileOpen(false);
        };
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, [setIsMobileOpen]);

    // Lock body scroll while the mobile drawer is open
    useEffect(() => {
        if (!isMobileOpen) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isMobileOpen]);

    // Close mobile drawer on Escape
    useEffect(() => {
        if (!isMobileOpen) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setIsMobileOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileOpen, setIsMobileOpen]);

    const showLabels = !isCollapsed || isMobileOpen;

    const renderSidebarContent = () => (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                <AnimatePresence mode="wait">
                    {showLabels && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <span className="font-bold text-xl text-gray-900">Admin</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Close drawer on mobile */}
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close navigation menu"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {/* Collapse button for desktop */}
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
                {isLoading ? (
                    <NavSkeleton />
                ) : isError ? (
                    <NavError onRetry={refetch} />
                ) : (
                    <ul className="space-y-1">
                        {visibleNavItems.map((item) => {
                            const hasChildren = item.children && item.children.length > 0;
                            const isExpanded = expandedSections[item.label];
                            const IconComponent = getIcon(item.icon);
                            const isActive = item.href ? (
                                pathname === item.href ||
                                (item.href !== '/' && pathname.startsWith(item.href))
                            ) : (
                                item.children?.some(child =>
                                    pathname === child.href || pathname.startsWith(child.href + '/')
                                )
                            );

                            if (hasChildren) {
                                return (
                                    <li key={item.id || item.label}>
                                        <button
                                            onClick={() => toggleSection(item.label)}
                                            className={`
                                                w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all
                                                ${isActive
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                                            <AnimatePresence mode="wait">
                                                {showLabels && (
                                                    <motion.span
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        className="flex-1 font-medium whitespace-nowrap text-left"
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                            {showLabels && (
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            )}
                                        </button>
                                        <AnimatePresence>
                                            {isExpanded && showLabels && (
                                                <motion.ul
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1 overflow-hidden"
                                                >
                                                    {item.children.map((child) => {
                                                        const ChildIcon = getIcon(child.icon);
                                                        const isChildActive = pathname === child.href ||
                                                            pathname.startsWith(child.href + '/');
                                                        return (
                                                            <li key={child.id || child.href}>
                                                                <Link
                                                                    href={child.href || '#'}
                                                                    onClick={handleNavClick}
                                                                    className={`
                                                                        flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all text-xs
                                                                        ${isChildActive
                                                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                        }
                                                                    `}
                                                                >
                                                                    <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isChildActive ? 'text-primary-600' : ''}`} />
                                                                    <span>{child.label}</span>
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </li>
                                );
                            }

                            // Regular nav item (no children)
                            return (
                                <li key={item.id || item.href}>
                                    <Link
                                        href={item.href || '#'}
                                        onClick={handleNavClick}
                                        className={`
                                            flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all
                                            ${isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                                        <AnimatePresence mode="wait">
                                            {showLabels && (
                                                <motion.span
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    className="font-medium whitespace-nowrap text-sm"
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </nav>

            {/* User & Logout */}
            <div className="p-3 border-t border-gray-100">
                <AnimatePresence mode="wait">
                    {showLabels && user && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-3 py-2 mb-2"
                        >
                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <p className="text-xs text-primary-600 capitalize mt-1">
                                {getDisplayRole(user)}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <AnimatePresence mode="wait">
                        {showLabels && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-medium"
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop fixed sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 280 }}
                className="hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-40 flex-col"
            >
                {renderSidebarContent()}
            </motion.aside>

            {/* Mobile left drawer */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.button
                            type="button"
                            aria-label="Close navigation overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 z-40 bg-black/40"
                            onClick={() => setIsMobileOpen(false)}
                        />
                        <motion.aside
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation menu"
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="md:hidden fixed left-0 top-0 h-screen w-[min(280px,85vw)] bg-white border-r border-gray-100 z-50 flex flex-col shadow-xl"
                        >
                            {renderSidebarContent()}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
