/**
 * Mobile Card Component
 * Base card component for mobile list items
 */

'use client';

import { ChevronRight, MoreVertical } from 'lucide-react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { motion } from 'framer-motion';

export default function MobileCard({
    children,
    onClick,
    actions = [],
    className = '',
    showArrow = false,
    isSelected = false,
    ...props
}) {
    const hasActions = actions.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                bg-white rounded-lg border border-gray-200 p-4
                ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}
                ${isSelected ? 'ring-2 ring-primary-500 border-primary-500' : ''}
                ${className}
            `}
            onClick={onClick}
            {...props}
        >
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    {children}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {hasActions && (
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                                {actions.map((action, index) => (
                                    <DropdownItem
                                        key={index}
                                        color={action.color || 'default'}
                                        startContent={action.icon}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            action.onClick?.();
                                        }}
                                    >
                                        {action.label}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    )}

                    {showArrow && onClick && (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Subcomponents for structured content
MobileCard.Header = function MobileCardHeader({ children, className = '' }) {
    return (
        <div className={`flex items-center gap-2 mb-2 ${className}`}>
            {children}
        </div>
    );
};

MobileCard.Title = function MobileCardTitle({ children, className = '' }) {
    return (
        <h3 className={`font-medium text-gray-900 truncate ${className}`}>
            {children}
        </h3>
    );
};

MobileCard.Subtitle = function MobileCardSubtitle({ children, className = '' }) {
    return (
        <p className={`text-sm text-gray-500 ${className}`}>
            {children}
        </p>
    );
};

MobileCard.Meta = function MobileCardMeta({ children, className = '' }) {
    return (
        <div className={`flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500 ${className}`}>
            {children}
        </div>
    );
};

MobileCard.Badge = function MobileCardBadge({ children, color = 'default', className = '' }) {
    const colorClasses = {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-primary-100 text-primary-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        danger: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]} ${className}`}>
            {children}
        </span>
    );
};

MobileCard.Actions = function MobileCardActions({ children, className = '' }) {
    return (
        <div className={`flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 ${className}`}>
            {children}
        </div>
    );
};
