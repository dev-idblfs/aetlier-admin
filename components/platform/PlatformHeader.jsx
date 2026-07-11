'use client';

import { useDispatch, useSelector } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, ArrowLeft } from 'lucide-react';
import {
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { platformLogout } from '@/redux/slices/platformAuthSlice';
import { useSidebar } from '@/components/layout/AdminLayout';

function getBackHref(breadcrumbs) {
  for (let i = breadcrumbs.length - 1; i >= 0; i -= 1) {
    if (breadcrumbs[i]?.href) return breadcrumbs[i].href;
  }
  return '/platform';
}

export default function PlatformHeader() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { operator } = useSelector((state) => state.platformAuth);
  const { setIsMobileOpen, pageTitle, breadcrumbs, headerActions } =
    useSidebar();

  const displayTitle =
    pageTitle ||
    (breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].label
      : 'Platform');

  const handleLogout = () => {
    dispatch(platformLogout({ returnPath: pathname }));
  };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-3 md:px-4 sticky top-0 z-30">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        {pathname !== '/platform' && (
          <button
            type="button"
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100"
            onClick={() => router.push(getBackHref(breadcrumbs))}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <h1 className="text-base font-semibold text-gray-900 truncate">
          {displayTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {headerActions && (
          <div className="hidden md:flex items-center gap-2">{headerActions}</div>
        )}

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-gray-50"
              aria-label="Platform operator menu"
            >
              <Avatar
                name={operator?.email?.[0]?.toUpperCase() || 'P'}
                size="sm"
                className="bg-primary-100 text-primary-700"
              />
              <span className="hidden sm:block text-sm text-gray-700 max-w-[160px] truncate">
                {operator?.email}
              </span>
            </button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Operator actions">
            <DropdownItem
              key="logout"
              startContent={<LogOut className="w-4 h-4" />}
              color="danger"
              className="text-danger"
              onPress={handleLogout}
            >
              Sign out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  );
}
