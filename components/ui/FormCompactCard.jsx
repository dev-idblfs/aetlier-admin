/**
 * FormCompactCard — single full-width card for dense create/edit forms.
 */

'use client';

import Card from './Card';
import { cn } from '@/utils/cn';

export default function FormCompactCard({ children, footer, className = '' }) {
    return (
        <Card padding="none" className={cn('overflow-hidden min-w-0', className)}>
            <div className="px-3 sm:px-4 py-3 space-y-4">{children}</div>
            {footer && (
                <div
                    className={cn(
                        'border-t border-gray-100 px-3 sm:px-4 py-3',
                        'flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2',
                        'max-md:sticky max-md:bottom-16 max-md:z-20 max-md:bg-white',
                        'max-md:shadow-[0_-4px_12px_rgba(0,0,0,0.05)]'
                    )}
                >
                    {footer}
                </div>
            )}
        </Card>
    );
}
