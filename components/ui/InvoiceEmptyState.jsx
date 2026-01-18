/**
 * InvoiceEmptyState Component
 * Reusable empty/error state for invoice pages
 */
'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';

export default function InvoiceEmptyState({
    icon,
    title,
    message,
    actions = [],
    className = '',
    minHeight = 'min-h-[60vh]',
}) {
    return (
        <div className={`flex flex-col items-center justify-center ${minHeight} gap-4 ${className}`}>
            {icon && <div className="text-gray-400">{icon}</div>}
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 text-center max-w-md">{message}</p>
            {actions.length > 0 && (
                <div className="flex gap-2 mt-2">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            as={action.href ? Link : undefined}
                            href={action.href}
                            onPress={action.onPress}
                            color={action.color || 'primary'}
                            variant={action.variant || 'solid'}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
