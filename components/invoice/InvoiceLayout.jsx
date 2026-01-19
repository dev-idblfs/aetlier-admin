/**
 * Invoice Layout Component
 * Provides consistent header, breadcrumbs, and action bar for invoice pages
 */
'use client';

import { Button, Breadcrumbs, BreadcrumbItem } from '@heroui/react';
import { ArrowLeft, Download, Printer, Mail, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvoiceLayout({
    title,
    invoiceNumber = null,
    actions = [],
    breadcrumbs = [],
    onBack,
    children,
    showBackButton = true,
    status = null,
    className = '',
    maxWidth = 'max-w-6xl', // Default to 6xl for forms (smaller than 7xl)
}) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    const getStatusColor = (status) => {
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
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${className}`}>
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-2">
                <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <div className="py-3 border-b border-gray-100">
                            <Breadcrumbs>
                                {breadcrumbs.map((crumb, index) => (
                                    <BreadcrumbItem key={index} href={crumb.href}>
                                        {crumb.label}
                                    </BreadcrumbItem>
                                ))}
                            </Breadcrumbs>
                        </div>
                    )}

                    {/* Header Bar */}
                    <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Left: Title and Back Button */}
                        <div className="flex items-center gap-4">
                            {showBackButton && (
                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={handleBack}
                                    aria-label="Go back"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {title}
                                    </h1>
                                    {invoiceNumber && (
                                        <span className="text-sm font-mono text-gray-500">
                                            #{invoiceNumber}
                                        </span>
                                    )}
                                    {status && (
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                                                status
                                            )}`}
                                        >
                                            {status.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Action Buttons */}
                        {actions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        color={action.color || 'default'}
                                        variant={action.variant || 'flat'}
                                        startContent={action.icon}
                                        onPress={action.onClick}
                                        isDisabled={action.disabled}
                                        isLoading={action.loading}
                                        className={`text-sm ${action.className || ''}`}
                                        size="sm"
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`${maxWidth} mx-auto`}>
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
