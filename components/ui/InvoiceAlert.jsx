/**
 * InvoiceAlert Component
 * Reusable alert/banner for invoice pages
 */
'use client';

import { Card, CardBody, Button } from '@heroui/react';
import { X } from 'lucide-react';

export default function InvoiceAlert({
    variant = 'info',
    title,
    message,
    icon = null,
    className = 'mb-6',
    onDismiss = null,
    dismissible = false,
}) {
    const variantStyles = {
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            iconColor: 'text-blue-600',
            titleColor: 'text-blue-900',
            messageColor: 'text-blue-700',
        },
        warning: {
            bg: 'bg-warning-50',
            border: 'border-warning-200',
            iconColor: 'text-warning-600',
            titleColor: 'text-warning-800',
            messageColor: 'text-warning-700',
        },
        danger: {
            bg: 'bg-danger-50',
            border: 'border-danger-200',
            iconColor: 'text-danger-600',
            titleColor: 'text-danger-900',
            messageColor: 'text-danger-700',
        },
        success: {
            bg: 'bg-success-50',
            border: 'border-success-200',
            iconColor: 'text-success-600',
            titleColor: 'text-success-900',
            messageColor: 'text-success-700',
        },
    };

    const styles = variantStyles[variant];

    return (
        <Card className={`${styles.bg} ${styles.border} ${className}`}>
            <CardBody>
                <div className="flex items-start gap-3">
                    {icon && (
                        <div className={`shrink-0 ${styles.iconColor}`}>
                            {icon}
                        </div>
                    )}
                    <div className="flex-1">
                        {title && (
                            <h4 className={`font-semibold mb-1 ${styles.titleColor}`}>
                                {title}
                            </h4>
                        )}
                        <p className={`text-sm ${styles.messageColor}`}>
                            {message}
                        </p>
                    </div>
                    {dismissible && onDismiss && (
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={onDismiss}
                            className={styles.iconColor}
                        >
                            <X size={16} />
                        </Button>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
