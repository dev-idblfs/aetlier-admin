/**
 * Responsive Table Component
 * Auto-switches between table (desktop) and card (mobile) views at md breakpoint
 */

'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Skeleton, Checkbox } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from './EmptyState';

export default function ResponsiveTable({
    columns = [],
    data = [],
    isLoading = false,
    emptyState = {},
    onRowClick,
    actions = [],
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    sortable = false,
    sortConfig = { key: null, direction: 'asc' },
    onSort,
    renderMobileCard,
    className = '',
}) {
    const handleSort = (key) => {
        if (!sortable || !onSort) return;
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        onSort({ key, direction });
    };

    const handleSelectAll = () => {
        if (!onSelectionChange) return;
        if (selectedIds.length === data.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(data.map(item => item.id));
        }
    };

    const handleSelectRow = (id) => {
        if (!onSelectionChange) return;
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-3 h-3 text-gray-300" />;
        }
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="w-3 h-3 text-primary-500" />
            : <ChevronDown className="w-3 h-3 text-primary-500" />;
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className={className}>
                {/* Desktop skeleton */}
                <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
                {/* Mobile skeleton */}
                <div className="md:hidden space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (data.length === 0) {
        return (
            <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
                <EmptyState
                    icon={emptyState.icon || 'inbox'}
                    title={emptyState.title || 'No data found'}
                    description={emptyState.description || 'There are no items to display.'}
                    actionLabel={emptyState.actionLabel}
                    onAction={emptyState.onAction}
                />
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {selectable && (
                                    <th className="px-4 py-3 w-12">
                                        <Checkbox
                                            isSelected={selectedIds.length === data.length}
                                            isIndeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                                            onChange={handleSelectAll}
                                            size="sm"
                                        />
                                    </th>
                                )}
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                                            }`}
                                        style={{ width: column.width }}
                                        onClick={() => column.sortable !== false && handleSort(column.key)}
                                    >
                                        <div className="flex items-center gap-1">
                                            {column.label}
                                            {sortable && column.sortable !== false && (
                                                <SortIcon columnKey={column.key} />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {actions.length > 0 && (
                                    <th className="px-4 py-3 w-12 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <AnimatePresence>
                                {data.map((row, rowIndex) => (
                                    <motion.tr
                                        key={row.id || rowIndex}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`
                                            ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                                            ${selectedIds.includes(row.id) ? 'bg-primary-50' : ''}
                                        `}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {selectable && (
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    isSelected={selectedIds.includes(row.id)}
                                                    onChange={() => handleSelectRow(row.id)}
                                                    size="sm"
                                                />
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                                                {column.render ? column.render(row) : row[column.key]}
                                            </td>
                                        ))}
                                        {actions.length > 0 && (
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button isIconOnly size="sm" variant="light">
                                                            <MoreVertical className="w-4 h-4 text-gray-500" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu aria-label="Row actions">
                                                        {actions.map((action, actionIndex) => (
                                                            <DropdownItem
                                                                key={actionIndex}
                                                                color={action.color || 'default'}
                                                                startContent={action.icon}
                                                                onClick={() => action.onClick?.(row)}
                                                            >
                                                                {action.label}
                                                            </DropdownItem>
                                                        ))}
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </td>
                                        )}
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                <AnimatePresence>
                    {data.map((row, index) => (
                        <motion.div
                            key={row.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {renderMobileCard ? (
                                renderMobileCard(row, {
                                    isSelected: selectedIds.includes(row.id),
                                    onSelect: () => handleSelectRow(row.id),
                                    onClick: () => onRowClick?.(row),
                                    actions: actions.map(a => ({
                                        ...a,
                                        onClick: () => a.onClick?.(row),
                                    })),
                                })
                            ) : (
                                <DefaultMobileCard
                                    row={row}
                                    columns={columns}
                                    actions={actions}
                                    selectable={selectable}
                                    isSelected={selectedIds.includes(row.id)}
                                    onSelect={() => handleSelectRow(row.id)}
                                    onClick={() => onRowClick?.(row)}
                                />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Default mobile card when no custom renderer is provided
function DefaultMobileCard({ row, columns, actions, selectable, isSelected, onSelect, onClick }) {
    const primaryColumn = columns[0];
    const secondaryColumns = columns.slice(1, 4); // Show up to 3 secondary columns

    return (
        <div
            className={`
                bg-white rounded-lg border border-gray-200 p-4
                ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}
                ${isSelected ? 'ring-2 ring-primary-500 border-primary-500' : ''}
            `}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {selectable && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            isSelected={isSelected}
                            onChange={onSelect}
                            size="sm"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    {/* Primary field */}
                    <div className="font-medium text-gray-900 truncate">
                        {primaryColumn?.render
                            ? primaryColumn.render(row[primaryColumn.key], row)
                            : row[primaryColumn?.key]}
                    </div>

                    {/* Secondary fields */}
                    <div className="mt-2 space-y-1">
                        {secondaryColumns.map((column) => (
                            <div key={column.key} className="flex items-center text-sm">
                                <span className="text-gray-500 mr-2">{column.label}:</span>
                                <span className="text-gray-900">
                                    {column.render
                                        ? column.render(row[column.key], row)
                                        : row[column.key]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                {actions.length > 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                                {actions.map((action, index) => (
                                    <DropdownItem
                                        key={index}
                                        color={action.color || 'default'}
                                        startContent={action.icon}
                                        onClick={() => action.onClick?.(row)}
                                    >
                                        {action.label}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                )}
            </div>
        </div>
    );
}
