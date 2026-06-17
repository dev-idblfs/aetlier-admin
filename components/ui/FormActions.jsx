/**
 * FormActions — submit/cancel row; use inline=true inside FormCompactCard footer.
 */

'use client';

import Card from './Card';
import { cn } from '@/utils/cn';

export default function FormActions({ children, inline = false, className = '' }) {
    const layoutClass = cn(
        'flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full',
        '[&_button]:w-full sm:[&_button]:w-auto',
        '[&_a]:w-full sm:[&_a]:w-auto',
        '[&_a_button]:w-full sm:[&_a_button]:w-auto',
        className
    );

    if (inline) {
        return <div className={layoutClass}>{children}</div>;
    }

    return (
        <Card padding="sm" className={layoutClass}>
            {children}
        </Card>
    );
}
