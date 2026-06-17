/**
 * Invoice Layout Component
 * Syncs title, breadcrumbs, and actions to the global sticky header.
 */
'use client';

import { useMemo } from 'react';
import { Button } from '@heroui/react';
import { Download, Printer, Mail } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { cn } from '@/utils/cn';

function getStatusColor(status) {
    switch (status?.toUpperCase()) {
        case 'PAID':
            return 'bg-success-100 text-success-700 border-success-300';
        case 'PARTIALLY_PAID':
            return 'bg-warning-100 text-warning-700 border-warning-300';
        case 'UNPAID':
            return 'bg-danger-100 text-danger-700 border-danger-300';
        case 'DRAFT':
            return 'bg-gray-100 text-gray-700 border-gray-300';
        case 'CANCELLED':
            return 'bg-gray-100 text-gray-700 border-gray-300';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-300';
    }
}

export default function InvoiceLayout({
    title,
    invoiceNumber = null,
    actions = [],
    breadcrumbs = [],
    children,
    status = null,
    className = '',
    compact = true,
}) {
    const actionsKey = actions
        .map((action, index) => `${index}:${action.label}:${action.loading}:${action.disabled}`)
        .join('|');

    const headerActions = useMemo(() => {
        if (!actions.length) return null;
        return (
            <div className="flex flex-wrap items-center gap-2">
                {actions.map((action, index) => (
                    <Button
                        key={index}
                        color={action.color || 'default'}
                        variant={action.variant || 'flat'}
                        startContent={action.icon}
                        onPress={action.onPress || action.onClick}
                        isDisabled={action.disabled}
                        isLoading={action.loading}
                        className={`text-sm ${action.className || ''}`}
                        size="sm"
                    >
                        {action.label}
                    </Button>
                ))}
            </div>
        );
    }, [actionsKey]);

    const resolvedBreadcrumbs = breadcrumbs.length > 0
        ? breadcrumbs
        : [{ label: 'Invoices', href: '/finance/invoices' }, { label: title }];

    return (
        <div className={cn(compact ? 'space-y-3 pb-4' : 'space-y-4 pb-6', 'w-full', className)}>
            <PageHeader
                title={title}
                breadcrumbs={resolvedBreadcrumbs}
                actions={headerActions}
                actionsKey={actionsKey}
                syncActionsToHeader={actions.length > 0}
            />

            {(status || invoiceNumber) && (
                <div className="flex items-center gap-2 flex-wrap">
                    {invoiceNumber && (
                        <span className="text-xs font-mono text-gray-500">#{invoiceNumber}</span>
                    )}
                    {status && (
                        <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(status)}`}
                        >
                            {status.replace('_', ' ')}
                        </span>
                    )}
                </div>
            )}

            <div className={compact ? 'space-y-3' : 'space-y-4'}>
                {children}
            </div>
        </div>
    );
}

/**
 * Common action button configs for invoice pages
 */
export const invoiceActions = {
    save: (onClick, loading = false) => ({
        label: 'Save Invoice',
        color: 'primary',
        onClick,
        loading,
    }),

    download: (onClick) => ({
        label: 'Download PDF',
        variant: 'bordered',
        icon: <Download className="w-4 h-4" />,
        onClick,
    }),

    print: (onClick) => ({
        label: 'Print',
        variant: 'bordered',
        icon: <Printer className="w-4 h-4" />,
        onClick,
    }),

    email: (onClick) => ({
        label: 'Email',
        variant: 'bordered',
        icon: <Mail className="w-4 h-4" />,
        onClick,
    }),

    edit: (onClick) => ({
        label: 'Edit',
        color: 'primary',
        variant: 'flat',
        onClick,
    }),

    delete: (onClick) => ({
        label: 'Delete',
        color: 'danger',
        variant: 'light',
        onClick,
    }),
};
