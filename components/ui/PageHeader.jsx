/**
 * Reusable Page Header Component
 */

'use client';

import { useEffect } from 'react';
import { useSidebar } from '@/components/layout';
// PageHeader — syncs title + breadcrumbs to the header bar.
// The title and breadcrumbs are rendered IN the sticky header, not here.

/**
 * PageHeader - Page title with breadcrumbs and actions
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {Array} props.breadcrumbs - Breadcrumb items [{label, href}]
 * @param {React.ReactNode} props.actions - Action buttons
 */
export default function PageHeader({
    title,
    description,
    breadcrumbs = [],
    actions,
    className = '',
}) {
    const { setPageTitle, setBreadcrumbs } = useSidebar();

    // Stable string key — avoids infinite loop from inline array literals
    // creating a new object reference on every render
    const crumbsKey = breadcrumbs.map(c => `${c.label}:${c.href || ''}`).join('|');

    useEffect(() => {
        setPageTitle(title || '');
        setBreadcrumbs(breadcrumbs);
        return () => {
            setPageTitle('');
            setBreadcrumbs([]);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, crumbsKey]);

    // Nothing to render? Skip the wrapper entirely.
    const hasContent = description || actions;

    if (!hasContent) return null;

    return (
        <div className={`flex items-center justify-between gap-3 mb-4 ${className}`}>
            {description && (
                <p className="text-sm text-gray-500 flex-1">{description}</p>
            )}
            {actions && (
                <div className="flex items-center gap-2 shrink-0">{actions}</div>
            )}
        </div>
    );
}
