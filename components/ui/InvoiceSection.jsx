/**
 * InvoiceSection Component
 * Reusable section card with header for invoice pages
 */
'use client';

import { Card, CardBody } from '@heroui/react';
import { cn } from '@/utils/cn';

export default function InvoiceSection({
    title,
    children,
    className = '',
    headerAction = null,
    description = null,
    compact = false,
}) {
    return (
        <Card className={cn(compact ? 'mb-4' : 'mb-6', className)}>
            <CardBody className={compact ? 'gap-3 py-4' : undefined}>
                <div
                    className={
                        compact
                            ? 'flex items-start justify-between mb-2'
                            : 'flex items-start justify-between mb-4'
                    }
                >
                    <div className="flex-1">
                        <h3
                            className={
                                compact
                                    ? 'text-base font-semibold text-gray-900'
                                    : 'text-lg font-semibold text-gray-900'
                            }
                        >
                            {title}
                        </h3>
                        {description && (
                            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
                        )}
                    </div>
                    {headerAction && <div className="ml-4">{headerAction}</div>}
                </div>
                {children}
            </CardBody>
        </Card>
    );
}
