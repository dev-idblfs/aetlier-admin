/**
 * Reusable Page Header Component
 */

'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

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
    return (
        <div className={`mb-8 ${className}`}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center gap-1">
                            {index > 0 && <ChevronRight className="w-4 h-4" />}
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="hover:text-gray-900 transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-gray-900 font-medium">{crumb.label}</span>
                            )}
                        </div>
                    ))}
                </nav>
            )}

            {/* Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-gray-500 mt-1">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
