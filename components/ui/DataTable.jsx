/**
 * Reusable Data Table Component
 */

'use client';

import { useState } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Spinner,
    Pagination,
} from '@heroui/react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * DataTable - Reusable table with sorting, pagination
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column definitions [{key, label, sortable, render}]
 * @param {Array} props.data - Row data
 * @param {boolean} props.isLoading - Loading state
 * @param {number} props.page - Current page (1-indexed)
 * @param {number} props.totalPages - Total pages
 * @param {function} props.onPageChange - Page change handler
 * @param {function} props.onRowClick - Row click handler
 * @param {string} props.emptyMessage - Message when no data
 */
export default function DataTable({
    columns = [],
    data = [],
    isLoading = false,
    page = 1,
    totalPages = 1,
    onPageChange,
    onRowClick,
    emptyMessage = 'No data found',
    className = '',
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        if (!columns.find(col => col.key === key)?.sortable) return;

        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spinner size="lg" color="primary" />
            </div>
        );
    }

    return (
        <div className={className}>
            <Table
                aria-label="Data table"
                classNames={{
                    wrapper: 'shadow-none border border-gray-100 rounded-xl',
                    th: 'bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider',
                    td: 'py-4',
                }}
            >
                <TableHeader>
                    {columns.map((column) => (
                        <TableColumn
                            key={column.key}
                            className={column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                            onClick={() => handleSort(column.key)}
                        >
                            <div className="flex items-center gap-1">
                                {column.label}
                                {column.sortable && renderSortIcon(column.key)}
                            </div>
                        </TableColumn>
                    ))}
                </TableHeader>
                <TableBody emptyContent={emptyMessage}>
                    {sortedData.map((row, index) => (
                        <TableRow
                            key={row.id || index}
                            className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                            onClick={() => onRowClick?.(row)}
                        >
                            {columns.map((column) => (
                                <TableCell key={column.key}>
                                    {column.render ? column.render(row) : row[column.key]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        total={totalPages}
                        page={page}
                        onChange={onPageChange}
                        color="primary"
                        showControls
                    />
                </div>
            )}
        </div>
    );
}
