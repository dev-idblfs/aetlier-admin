/**
 * ResponsiveTable — compatibility wrapper around DataTable.
 * Prefer importing DataTable directly for new code.
 */

'use client'

import DataTable from './DataTable'

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
  sortConfig,
  onSort,
  renderMobileCard,
  className = '',
  page,
  totalPages,
  onPageChange,
  isRowSelectable,
  rowClassName,
  error,
  onRetry,
  cardBelow = 'lg',
}) {
  // Map legacy sortable flag onto columns when parent controlled sort isn't used
  const mappedColumns = columns.map((col) => ({
    ...col,
    sortable:
      col.sortable !== undefined
        ? col.sortable
        : Boolean(sortable && onSort == null),
  }))

  // Controlled sort from parent: keep desktop visual via column click → onSort
  const columnsWithSortHandler =
    sortable && onSort
      ? mappedColumns.map((col) => ({
          ...col,
          sortable: col.sortable !== false,
        }))
      : mappedColumns

  return (
    <DataTable
      columns={columnsWithSortHandler}
      data={data}
      isLoading={isLoading}
      emptyState={emptyState}
      emptyMessage={emptyState?.title || 'No data found'}
      onRowClick={onRowClick}
      actions={actions}
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      renderMobileCard={renderMobileCard}
      className={className}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      isRowSelectable={isRowSelectable}
      rowClassName={rowClassName}
      error={error}
      onRetry={onRetry}
      cardBelow={cardBelow}
    />
  )
}
