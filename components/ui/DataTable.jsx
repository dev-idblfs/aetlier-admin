/**
 * Reusable Data Table Component
 */

'use client';

import { useState, useMemo } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Spinner,
    Pagination,
    Checkbox,
} from '@heroui/react';
import { ChevronUp, ChevronDown } from '@/lib/icons';

const SELECT_COLUMN_KEY = '__select__';

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
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    rowClassName,
    isRowSelectable,
}) {
    const canSelectRow = isRowSelectable || (() => true);
    const selectableRows = data.filter(canSelectRow);
    const toIdString = (id) => String(id);
    const selectedIdSet = useMemo(
        () => new Set(selectedIds.map(toIdString)),
        [selectedIds],
    );
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // HeroUI TableHeader must use columns+render — never null/false children
    // (otherwise: Cannot read properties of undefined (reading 'isRowHeader'))
    const headerColumns = useMemo(() => {
        const cols = (columns || []).filter(Boolean).map((column) => ({
            ...column,
            key: String(column.key),
        }));
        if (!selectable) return cols;
        return [
            {
                key: SELECT_COLUMN_KEY,
                label: '',
                sortable: false,
            },
            ...cols,
        ];
    }, [columns, selectable]);

    const handleSort = (key) => {
        if (key === SELECT_COLUMN_KEY) return;
        if (!columns.find((col) => col.key === key)?.sortable) return;

        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedData = useMemo(() => {
        const rows = [...(data || [])];
        if (!sortConfig.key) return rows;
        return rows.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
        ) : (
            <ChevronDown className="w-4 h-4" />
        );
    };

    const handleSelectAll = () => {
        if (!onSelectionChange) return;
        const pageIds = selectableRows.map((item) => item.id);
        if (
            pageIds.length > 0 &&
            pageIds.every((id) => selectedIdSet.has(toIdString(id)))
        ) {
            onSelectionChange([]);
        } else {
            onSelectionChange(pageIds);
        }
    };

    const handleSelectRow = (id) => {
        if (!onSelectionChange) return;
        const sid = toIdString(id);
        if (selectedIdSet.has(sid)) {
            onSelectionChange(
                selectedIds.filter((itemId) => toIdString(itemId) !== sid),
            );
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const renderCell = (row, columnKey) => {
        if (columnKey === SELECT_COLUMN_KEY) {
            if (!canSelectRow(row)) return null;
            return (
                <Checkbox
                    isSelected={selectedIdSet.has(toIdString(row.id))}
                    onValueChange={() => handleSelectRow(row.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select row ${row.id}`}
                />
            );
        }
        const column = columns.find((col) => String(col.key) === String(columnKey));
        if (!column) return null;
        return column.render ? column.render(row) : row[column.key];
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
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.key}
                            width={column.key === SELECT_COLUMN_KEY ? 48 : undefined}
                            className={
                                column.sortable
                                    ? 'cursor-pointer hover:bg-gray-100'
                                    : ''
                            }
                            onClick={() => handleSort(column.key)}
                        >
                            {column.key === SELECT_COLUMN_KEY ? (
                                <Checkbox
                                    isSelected={
                                        selectableRows.length > 0 &&
                                        selectableRows.every((row) =>
                                            selectedIdSet.has(toIdString(row.id)),
                                        )
                                    }
                                    isIndeterminate={
                                        selectableRows.some((row) =>
                                            selectedIdSet.has(toIdString(row.id)),
                                        ) &&
                                        !selectableRows.every((row) =>
                                            selectedIdSet.has(toIdString(row.id)),
                                        )
                                    }
                                    onValueChange={handleSelectAll}
                                    aria-label="Select all rows"
                                />
                            ) : (
                                <div className="flex items-center gap-1">
                                    {column.label}
                                    {column.sortable && renderSortIcon(column.key)}
                                </div>
                            )}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={sortedData}
                    emptyContent={emptyMessage}
                >
                    {(row) => (
                        <TableRow
                            key={row.id ?? JSON.stringify(row)}
                            className={[
                                onRowClick ? 'cursor-pointer hover:bg-gray-50' : '',
                                selectedIdSet.has(toIdString(row.id))
                                    ? 'bg-primary-50'
                                    : '',
                                typeof rowClassName === 'function'
                                    ? rowClassName(row)
                                    : rowClassName || '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onClick={() => onRowClick?.(row)}
                        >
                            {(columnKey) => (
                                <TableCell>{renderCell(row, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
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
