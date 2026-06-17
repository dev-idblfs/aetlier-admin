/**
 * ListPageLayout — compact shell for list/index pages.
 * Syncs title, breadcrumbs, and actions to the sticky header (desktop).
 */

'use client';

import PageHeader from './PageHeader';
import { cn } from '@/utils/cn';

export default function ListPageLayout({
    title,
    description,
    showDescription = false,
    breadcrumbs = [],
    actions,
    actionsKey,
    toolbar,
    children,
    className = '',
}) {
    return (
        <div className={cn('space-y-3 pb-4 md:pb-4 w-full min-w-0', className)}>
            <PageHeader
                title={title}
                description={description}
                showDescription={showDescription}
                breadcrumbs={breadcrumbs}
                actions={actions}
                actionsKey={actionsKey}
                syncActionsToHeader={Boolean(actions)}
            />
            {toolbar && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0 [&>*]:w-full sm:[&>*]:w-auto sm:[&>*:first-child]:flex-1">
                    {toolbar}
                </div>
            )}
            <div className="min-w-0 space-y-3">{children}</div>
        </div>
    );
}
