/**
 * Empty State Component
 * Mobile-first responsive empty state with icon and message
 */

'use client';

import { Inbox, Search, AlertCircle, FileX } from 'lucide-react';
import { Button } from '@heroui/react';

const iconMap = {
    inbox: Inbox,
    search: Search,
    error: AlertCircle,
    file: FileX,
};

export default function EmptyState({
    icon = 'inbox',
    title = 'No data found',
    description = 'There are no items to display.',
    action,
    actionLabel = 'Add New',
    onAction,
    className = '',
}) {
    const IconComponent = typeof icon === 'string' ? iconMap[icon] : icon;

    return (
        <div className={`flex flex-col items-center justify-center py-8 md:py-12 px-4 text-center ${className}`}>
            {IconComponent && (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                </div>
            )}
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-sm md:text-base text-gray-500 max-w-md mb-6">
                {description}
            </p>
            {(action || onAction) && (
                <Button
                    color="primary"
                    onClick={onAction}
                    className="font-medium"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
