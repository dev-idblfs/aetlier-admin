/**
 * Collapsible Filter Panel Component
 * Mobile-first with expandable sections
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FilterPanel({
    children,
    title = 'Filters',
    activeFiltersCount = 0,
    onClearAll,
    className = '',
    defaultExpanded = false,
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">{title}</span>
                    {activeFiltersCount > 0 && (
                        <Chip size="sm" color="primary" variant="flat">
                            {activeFiltersCount}
                        </Chip>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && onClearAll && (
                        <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearAll();
                            }}
                            startContent={<X className="w-3 h-3" />}
                        >
                            <span className="hidden sm:inline">Clear All</span>
                        </Button>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Filter Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 md:p-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
