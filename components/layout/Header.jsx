/**
 * Admin Header
 * Mobile-first responsive with hamburger menu
 */

'use client';

import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, User, Menu, LogOut } from 'lucide-react';
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
    const { setIsMobileOpen } = useSidebar();

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            {/* Left side - Hamburger + Search */}
            <div className="flex items-center gap-3 flex-1">
                {/* Hamburger menu for mobile */}
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <Menu className="w-5 h-5 text-gray-600" />
                </button>

                {/* Search */}
                <div className="hidden sm:block flex-1 max-w-md">
                    <Input
                        placeholder="Search..."
                        startContent={<Search className="w-4 h-4 text-gray-400" />}
                        classNames={{
                            inputWrapper: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
                        }}
                        size="sm"
                    />
                </div>

                {/* Mobile search button */}
                <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Search className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-4">
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
