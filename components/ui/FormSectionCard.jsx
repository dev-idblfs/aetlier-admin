/**
 * FormSectionCard — grouped form section; use embedded=true inside FormCompactCard.
 */

'use client';

import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { cn } from '@/utils/cn';

export default function FormSectionCard({
    title,
    description,
    icon: Icon,
    children,
    embedded = false,
    compact = true,
    className = '',
    contentClassName = '',
}) {
    if (embedded) {
        return (
            <section className={cn('space-y-3', className)}>
                {(title || description) && (
                    <div>
                        {title && (
                            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                        )}
                        {description && (
                            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                        )}
                    </div>
                )}
                <div className={contentClassName}>{children}</div>
            </section>
        );
    }

    const useCompact = compact;
    const showIcon = Icon && !useCompact;

    return (
        <Card padding="none" className={cn('overflow-hidden', className)}>
            {(title || description) && (
                <CardHeader
                    className={cn(
                        'border-none mb-0',
                        useCompact ? 'px-4 pt-4 pb-0' : 'px-6 pt-6 pb-0'
                    )}
                >
                    <div className="flex items-start gap-3">
                        {showIcon && (
                            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Icon className="w-4 h-4 text-primary-600" />
                            </div>
                        )}
                        <div className="min-w-0">
                            {title && (
                                <CardTitle className={useCompact ? 'text-sm' : 'text-base'}>
                                    {title}
                                </CardTitle>
                            )}
                            {description && (
                                <CardDescription className="mt-0.5">{description}</CardDescription>
                            )}
                        </div>
                    </div>
                </CardHeader>
            )}
            <CardContent
                className={cn(
                    useCompact ? 'px-4 pb-4 pt-3' : 'px-6 pb-6 pt-5',
                    contentClassName
                )}
            >
                {children}
            </CardContent>
        </Card>
    );
}
