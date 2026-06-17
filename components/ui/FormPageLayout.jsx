/**
 * FormPageLayout — consistent shell for create/edit form pages.
 * Syncs title + breadcrumbs to the sticky header via PageHeader.
 */

'use client';

import PageHeader from './PageHeader';
import { cn } from '@/utils/cn';

const MAX_WIDTH = {
    full: 'w-full max-w-none',
    sm: 'max-w-2xl mx-auto',
    md: 'max-w-3xl mx-auto',
    lg: 'max-w-4xl mx-auto',
    xl: 'max-w-5xl mx-auto',
};

export default function FormPageLayout({
    title,
    breadcrumbs = [],
    cancelHref,
    actions,
    children,
    maxWidth = 'full',
    variant = 'compact',
    className = '',
}) {
    return (
        <div
            className={cn(
                'min-w-0',
                variant === 'compact' ? 'space-y-3 pb-4 md:pb-4' : 'space-y-6 pb-8',
                MAX_WIDTH[maxWidth] || MAX_WIDTH.full,
                className
            )}
        >
            <PageHeader
                title={title}
                showDescription={false}
                breadcrumbs={breadcrumbs}
                cancelHref={cancelHref}
                actions={actions}
                syncActionsToHeader={Boolean(cancelHref || actions)}
            />
            <div className="min-w-0">{children}</div>
        </div>
    );
}
