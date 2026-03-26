/**
 * Admin Header
 * Mobile-first responsive with hamburger menu
 */

'use client';

import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, User, LogOut, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
    Avatar,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Input,
} from '@heroui/react';
import { logout } from '@/redux/slices/authSlice';
import { useSidebar } from './AdminLayout';

export default function Header() {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const { pageTitle, breadcrumbs } = useSidebar();
    const isRoot = pathname === '/';

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-3 md:px-4 sticky top-0 z-30 relative">
            {/* ── Mobile left: back button OR logo ── */}
            <div className="flex items-center md:hidden shrink-0">
                {isRoot ? (
                    <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                ) : (
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors -ml-1"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                )}
            </div>

            {/* ── Mobile center: page title ── */}
            <p className="md:hidden absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-900 truncate max-w-[52vw] pointer-events-none">
                {pageTitle || 'Admin'}
            </p>

            {/* ── Desktop left: back button (when not root) + breadcrumb path + title ── */}
            <div className="hidden md:flex items-center gap-1 min-w-0 flex-1">
                {!isRoot && (
                    <button
                        onClick={() => router.back()}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors shrink-0 mr-1"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                )}
                <div className="flex flex-col justify-center min-w-0">
                    {breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-1 mb-0.5">
                            {breadcrumbs.map((crumb, i) => (
                                <span key={i} className="flex items-center gap-1">
                                    {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors truncate max-w-[120px]">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-[11px] text-gray-400 truncate max-w-[120px]">{crumb.label}</span>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}
                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                        {pageTitle || 'Dashboard'}
                    </p>
                </div>
            </div>

            {/* ── Desktop right: search + bell + user ── */}
            <div className="hidden md:flex items-center gap-3">
                <Input
                    placeholder="Search..."
                    startContent={<Search className="w-4 h-4 text-gray-400" />}
                    classNames={{ inputWrapper: 'bg-gray-50 border-gray-200 hover:bg-gray-100 w-56' }}
                    size="sm"
                />
            </div>

            {/* ── Right side: bell + user (shared mobile & desktop) ── */}
            <div className="flex items-center gap-2 md:gap-3 md:ml-3">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* User Dropdown */}
                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <button className="flex items-center gap-2 md:gap-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <Avatar
                                src={user?.avatar}
                                name={user?.name?.charAt(0).toUpperCase() || 'A'}
                                size="sm"
                                className="bg-primary-100"
                                classNames={{
                                    name: 'text-primary-700 font-semibold',
                                }}
                            />
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'admin'}</p>
                            </div>
                        </button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="User menu">
                        {/* Mobile-only user info */}
                        <DropdownItem key="info" className="md:hidden" textValue="User info">
                            <div className="py-1">
                                <p className="font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </DropdownItem>
                        <DropdownItem key="profile" startContent={<User className="w-4 h-4" />}>
                            Profile
                        </DropdownItem>
                        <DropdownItem
                            key="logout"
                            color="danger"
                            className="text-red-600"
                            startContent={<LogOut className="w-4 h-4" />}
                            onPress={handleLogout}
                        >
                            Logout
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
        </header>
    );
}
