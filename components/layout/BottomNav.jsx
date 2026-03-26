/**
 * Bottom Navigation Bar
 * Mobile-only (md:hidden) fixed tab bar with 5 primary sections.
 * Mirrors a native-app bottom tab bar for future Capacitor conversion.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    UserCog,
    Wallet,
    Settings,
} from 'lucide-react';

const TABS = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Doctors', href: '/doctors', icon: UserCog },
    { label: 'Schedule', href: '/appointments', icon: Calendar },
    { label: 'Finance', href: '/finance', icon: Wallet },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (href) => {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
            <div className="flex items-stretch h-16">
                {TABS.map(({ label, href, icon: Icon }) => {
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
                            {/* Active indicator pill above icon */}
                            {active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-600" />
                            )}
                            <Icon
                                className={`w-5 h-5 transition-transform duration-150 ${active ? 'scale-110' : ''}`}
                                strokeWidth={active ? 2.5 : 1.75}
                            />
                            <span className={`text-[10px] font-medium leading-none ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
