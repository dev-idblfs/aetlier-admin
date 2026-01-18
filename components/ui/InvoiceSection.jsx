/**
 * InvoiceSection Component
 * Reusable section card with header for invoice pages
 */
'use client';

import { Card, CardBody } from '@heroui/react';

export default function InvoiceSection({
    title,
    children,
    className = 'mb-6',
    headerAction = null,
    description = null,
}) {
    return (
        <Card className={className}>
            <CardBody>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        {description && (
                            <p className="text-sm text-gray-600 mt-1">{description}</p>
                        )}
                    </div>
                    {headerAction && (
                        <div className="ml-4">
                            {headerAction}
                        </div>
                    )}
                </div>
                {children}
            </CardBody>
        </Card>
    );
}
