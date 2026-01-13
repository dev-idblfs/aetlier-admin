/**
 * Admin Sidebar Navigation
 * Mobile-first responsive with overlay on mobile
 * Dynamic navigation fetched from backend API based on user permissions
 */

'use client';

import { useState, useEffect } from 'react';
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
    X,
    Wallet,
    FileText,
    Receipt,
    Contact,
    BarChart3,
    ChevronDown,
    Menu,
    AlertCircle,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { useGetNavigationQuery } from '@/redux/services/api';
import { useSidebar } from './AdminLayout';

/**
 * Icon mapping - Maps icon name strings from backend to Lucide components
 * Add new icons here as needed
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
    const { user, isAuthenticated } = useSelector((state) => state.auth);
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

    const handleLogout = () => {
        dispatch(logout());
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
        if (!navItems || navItems.length === 0) return;

        navItems.forEach(item => {
            if (item.children && item.children.length > 0) {
                const isChildActive = item.children.some(child =>
                    pathname === child.href || pathname.startsWith(child.href + '/')
                );
                if (isChildActive && !expandedSections[item.label]) {
                    setExpandedSections(prev => ({ ...prev, [item.label]: true }));
                }
            }
        });
    }, [pathname, navItems]);

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
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

                {/* Close button for mobile */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {/* Collapse button for desktop */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
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
                        {navItems.map((item) => {
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
                                                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                                                ${isActive
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                                            <AnimatePresence mode="wait">
                                                {(!isCollapsed || isMobileOpen) && (
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
                                            {(!isCollapsed || isMobileOpen) && (
                                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            )}
                                        </button>
                                        <AnimatePresence>
                                            {isExpanded && (!isCollapsed || isMobileOpen) && (
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
                                                                        flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm
                                                                        ${isChildActive
                                                                            ? 'bg-primary-50 text-primary-700 font-medium'
                                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                        }
                                                                    `}
                                                                >
                                                                    <ChildIcon className={`w-4 h-4 shrink-0 ${isChildActive ? 'text-primary-600' : ''}`} />
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
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                                            ${isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                                        <AnimatePresence mode="wait">
                                            {(!isCollapsed || isMobileOpen) && (
                                                <motion.span
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    className="font-medium whitespace-nowrap"
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
                    {(!isCollapsed || isMobileOpen) && user && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-3 py-2 mb-2"
                        >
                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <p className="text-xs text-primary-600 capitalize mt-1">
                                {user.role?.replace('_', ' ')}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <AnimatePresence mode="wait">
                        {(!isCollapsed || isMobileOpen) && (
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
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 280 }}
                className="hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-40 flex-col"
            >
                {sidebarContent}
            </motion.aside>

            {/* Mobile Sidebar */}
            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: isMobileOpen ? 0 : '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="md:hidden fixed left-0 top-0 h-screen w-70 bg-white border-r border-gray-100 z-50 flex flex-col"
            >
                {sidebarContent}
            </motion.aside>
        </>
    );
}
