/**
 * Reusable Page Header Component
 * Syncs title, breadcrumbs, and optional actions to the sticky Header (desktop).
 * Renders a mobile action bar in the page body when actions are header-synced.
 */

'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { useSidebar } from '@/components/layout';
import { cn } from '@/utils/cn';

/**
 * PageHeader - Page title with breadcrumbs and actions
 */
export default function PageHeader({
    title,
    description,
    showDescription,
    syncActionsToHeader = false,
    cancelHref,
    breadcrumbs = [],
    actions,
    actionsKey,
    className = '',
}) {
    const { setPageTitle, setBreadcrumbs, setHeaderActions } = useSidebar();

    const crumbsKey = breadcrumbs.map(c => `${c.label}:${c.href || ''}`).join('|');

    const cancelAction = useMemo(() => {
        if (!cancelHref) return null;
        return (
            <Link href={cancelHref} className="w-full sm:w-auto">
                <Button variant="flat" size="sm" className="w-full sm:w-auto">
                    Cancel
                </Button>
            </Link>
        );
    }, [cancelHref]);

    const syncedActions = actions ?? cancelAction;
    const syncedActionsKey = actionsKey ?? (cancelHref ? `cancel:${cancelHref}` : 'none');

    useEffect(() => {
        setPageTitle(title || '');
        setBreadcrumbs(breadcrumbs);
        if (syncActionsToHeader) {
            setHeaderActions(syncedActions);
        }
        return () => {
            setPageTitle('');
            setBreadcrumbs([]);
            setHeaderActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, crumbsKey, syncActionsToHeader, syncedActionsKey]);

    const shouldShowDescription = showDescription ?? Boolean(description);
    const showDesktopBodyActions = syncedActions && !syncActionsToHeader;
    const showMobileSyncedActions = syncedActions && syncActionsToHeader;

    const hasBodyContent = shouldShowDescription || showDesktopBodyActions || showMobileSyncedActions;

    if (!hasBodyContent) return null;

    return (
        <div className={cn('space-y-2 mb-1', className)}>
            {(shouldShowDescription || showDesktopBodyActions) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    {shouldShowDescription && description && (
                        <p className="text-sm text-gray-500 flex-1">{description}</p>
                    )}
                    {showDesktopBodyActions && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                            {syncedActions}
                        </div>
                    )}
                </div>
            )}

            {showMobileSyncedActions && (
                <div className="md:hidden flex flex-col gap-2 w-full [&_button]:w-full [&_button]:min-h-10 [&_a]:block [&_a]:w-full [&_.flex]:flex-col [&_.flex]:w-full [&_.flex]:gap-2">
                    {syncedActions}
                </div>
            )}
        </div>
    );
}
