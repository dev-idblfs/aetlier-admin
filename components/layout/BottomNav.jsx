/**
 * Bottom Navigation Bar
 * Mobile-only tab bar driven by permission-filtered navigation from the API.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    LayoutDashboard,
    Calendar,
    UserCog,
    Wallet,
    Target,
    Menu,
} from 'lucide-react';
import { useGetNavigationQuery } from '@/redux/services/api';
import { filterNavItemsByPermission, withUserPermissions } from '@/utils/navAccess';

const ICON_MAP = {
    LayoutDashboard,
    Calendar,
    UserCog,
    Wallet,
    Target,
    Menu,
};

function flattenNav(items = []) {
    const links = [];
    for (const item of items) {
        if (item.href) {
            links.push({
                label: item.label,
                href: item.href,
                icon: ICON_MAP[item.icon] || LayoutDashboard,
            });
        }
        if (item.children?.length) {
            links.push(...flattenNav(item.children));
        }
    }
    return links;
}

export default function BottomNav() {
    const pathname = usePathname();
    const { user, permissions, isAuthenticated } = useSelector((state) => state.auth);

    const { data: navItems = [] } = useGetNavigationQuery(undefined, {
        skip: !isAuthenticated || !user,
    });

    const visibleNavItems = useMemo(
        () => filterNavItemsByPermission(navItems, withUserPermissions(user, permissions)),
        [navItems, user, permissions],
    );

    const tabs = flattenNav(visibleNavItems).slice(0, 5);

    if (tabs.length === 0) {
        return null;
    }

    const isActive = (href) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
            <div className="flex items-stretch h-16">
                {tabs.map(({ label, href, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`
                                flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1
                                transition-colors duration-150 relative
                                ${active ? 'text-primary-600' : 'text-gray-400 active:text-gray-600'}
                            `}
                        >
                            {active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-600" />
                            )}
                            <Icon
                                className={`w-5 h-5 transition-transform duration-150 ${active ? 'scale-110' : ''}`}
                                strokeWidth={active ? 2.5 : 1.75}
                            />
                            <span className={`text-[10px] font-medium leading-none ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                                {label.length > 10 ? label.slice(0, 9) + '…' : label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
