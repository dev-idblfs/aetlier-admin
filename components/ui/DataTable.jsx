/**
 * DataTable — mobile-first responsive table
 *
 * - < lg: card list (primary + secondary visible; tertiary expandable; actions menu)
 * - ≥ lg: table; tertiary columns hidden until xl when column.hideBelow === 'xl'
 *
 * Column shape:
 * { key, label, sortable?, render?, priority?: 'primary'|'secondary'|'tertiary'|'actions',
 *   hideBelow?: 'xl'|'lg'|false, className?, align?: 'left'|'right'|'center' }
 */

'use client'

import { useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Pagination,
  Skeleton,
  Spinner,
} from '@heroui/react'
import { ChevronDown, ChevronUp, MoreVertical } from '@/lib/icons'
import EmptyState from './EmptyState'
import { cn } from '@/utils/cn'

const toIdString = (id) => String(id)

const inferPriority = (column, index, columns) => {
  if (column.priority) return column.priority
  if (column.key === 'actions' || column.key === 'action') return 'actions'
  if (index === 0) return 'primary'
  const nonActionIndex =
    columns
      .slice(0, index + 1)
      .filter((c) => c.key !== 'actions' && c.key !== 'action').length - 1
  if (nonActionIndex <= 2) return 'secondary'
  return 'tertiary'
}

const cellAlign = (align) => {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

const hideBelowClass = (hideBelow) => {
  if (hideBelow === 'xl') return 'hidden xl:table-cell'
  if (hideBelow === 'lg') return 'hidden lg:table-cell'
  return ''
}

function resolveColumns(columns) {
  return columns.map((col, index) => {
    const priority = inferPriority(col, index, columns)
    const hideBelow =
      col.hideBelow !== undefined
        ? col.hideBelow
        : priority === 'tertiary'
          ? 'xl'
          : false
    return { ...col, priority, hideBelow }
  })
}

function SortIcon({ active, direction }) {
  if (!active) {
    return <ChevronUp className="w-3.5 h-3.5 text-gray-300" aria-hidden />
  }
  return direction === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5 text-primary-500" aria-hidden />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-primary-500" aria-hidden />
  )
}

function DefaultMobileCard({
  row,
  columns,
  actions,
  selectable,
  isSelected,
  onSelect,
  onClick,
  canSelect,
}) {
  const [expanded, setExpanded] = useState(false)
  const primary = columns.find((c) => c.priority === 'primary') || columns[0]
  const secondary = columns.filter((c) => c.priority === 'secondary')
  const tertiary = columns.filter((c) => c.priority === 'tertiary')
  const actionCols = columns.filter((c) => c.priority === 'actions')
  const hasExpand = tertiary.length > 0

  const renderCell = (column) =>
    column?.render ? column.render(row) : row[column?.key]

  return (
    <article
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-4 min-w-0',
        onClick && 'cursor-pointer active:bg-gray-50',
        isSelected && 'ring-2 ring-primary-500 border-primary-500'
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start gap-3">
        {selectable && canSelect ? (
          <div
            className="pt-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Checkbox
              isSelected={isSelected}
              onValueChange={onSelect}
              size="md"
              aria-label={`Select row ${row.id}`}
              classNames={{ wrapper: 'w-5 h-5' }}
            />
          </div>
        ) : null}

        <div className="flex-1 min-w-0 space-y-2">
          <div className="font-semibold text-gray-900 text-base leading-snug break-words">
            {renderCell(primary)}
          </div>

          {secondary.length > 0 ? (
            <dl className="space-y-1.5">
              {secondary.map((column) => (
                <div
                  key={column.key}
                  className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm min-w-0"
                >
                  <dt className="text-gray-500 shrink-0">{column.label}</dt>
                  <dd className="text-gray-900 min-w-0 break-words">
                    {renderCell(column)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {expanded && tertiary.length > 0 ? (
            <dl className="space-y-1.5 pt-2 border-t border-gray-100">
              {tertiary.map((column) => (
                <div
                  key={column.key}
                  className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm min-w-0"
                >
                  <dt className="text-gray-500 shrink-0">{column.label}</dt>
                  <dd className="text-gray-900 min-w-0 break-words">
                    {renderCell(column)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {(hasExpand || actionCols.length > 0) && (
            <div
              className="flex flex-wrap items-center gap-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {hasExpand ? (
                <Button
                  size="sm"
                  variant="light"
                  className="min-h-10 px-3 text-primary-600"
                  onPress={() => setExpanded((v) => !v)}
                  endContent={
                    expanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  }
                >
                  {expanded ? 'Less' : 'More details'}
                </Button>
              ) : null}
              {actionCols.map((column) => (
                <div key={column.key} className="min-w-0">
                  {renderCell(column)}
                </div>
              ))}
            </div>
          )}
        </div>

        {actions.length > 0 ? (
          <div
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="md"
                  variant="flat"
                  className="min-w-10 min-h-10"
                  aria-label="Row actions"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Row actions">
                {actions.map((action, index) => (
                  <DropdownItem
                    key={action.key || index}
                    color={action.color || (action.danger ? 'danger' : 'default')}
                    startContent={action.icon}
                    onPress={() => action.onClick?.(row)}
                  >
                    {action.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  emptyMessage = 'No data found',
  emptyState,
  className = '',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  rowClassName,
  isRowSelectable,
  actions = [],
  renderMobileCard,
  error = null,
  onRetry,
  cardBelow = 'lg',
}) {
  const canSelectRow = isRowSelectable || (() => true)
  const resolvedColumns = useMemo(() => resolveColumns(columns), [columns])
  const contentColumns = useMemo(
    () => resolvedColumns.filter((c) => c.priority !== 'actions'),
    [resolvedColumns]
  )
  const tableColumns = resolvedColumns

  const selectedIdSet = useMemo(
    () => new Set((selectedIds || []).map(toIdString)),
    [selectedIds]
  )
  const selectableRows = data.filter(canSelectRow)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleSort = (key) => {
    if (!columns.find((col) => col.key === key)?.sortable) return
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  const handleSelectAll = () => {
    if (!onSelectionChange) return
    const pageIds = selectableRows.map((item) => item.id)
    if (
      pageIds.length > 0 &&
      pageIds.every((id) => selectedIdSet.has(toIdString(id)))
    ) {
      onSelectionChange([])
    } else {
      onSelectionChange(pageIds)
    }
  }

  const handleSelectRow = (id) => {
    if (!onSelectionChange) return
    const sid = toIdString(id)
    if (selectedIdSet.has(sid)) {
      onSelectionChange(
        selectedIds.filter((itemId) => toIdString(itemId) !== sid)
      )
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const cardHiddenClass = cardBelow === 'md' ? 'hidden md:block' : 'hidden lg:block'
  const cardsVisibleClass = cardBelow === 'md' ? 'md:hidden' : 'lg:hidden'

  const pagination =
    totalPages > 1 && onPageChange ? (
      <div className="flex justify-center mt-4 px-1">
        <Pagination
          total={totalPages}
          page={page}
          onChange={onPageChange}
          color="primary"
          showControls
          size="sm"
          classNames={{
            wrapper: 'gap-1 sm:gap-2 flex-wrap justify-center',
            item: 'min-w-9 min-h-9 w-9 h-9',
            cursor: 'min-w-9 min-h-9',
          }}
        />
      </div>
    ) : null

  if (error) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-100 bg-red-50 p-6 text-center',
          className
        )}
      >
        <p className="text-sm text-red-800 mb-3">
          {typeof error === 'string' ? error : 'Failed to load data'}
        </p>
        {onRetry ? (
          <Button size="sm" color="danger" variant="flat" onPress={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn(className)}>
        <div
          className={cn(
            cardHiddenClass,
            'rounded-xl border border-gray-100 p-4 space-y-3'
          )}
        >
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <div className={cn(cardsVisibleClass, 'space-y-3')}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <span className="sr-only">
          <Spinner size="md" color="primary" />
          Loading
        </span>
      </div>
    )
  }

  if (!data.length) {
    const empty = emptyState || {
      title: emptyMessage,
      description: 'There are no items to display.',
    }
    return (
      <div
        className={cn('bg-white rounded-xl border border-gray-100', className)}
      >
        <EmptyState
          icon={empty.icon || 'inbox'}
          title={empty.title || emptyMessage}
          description={empty.description}
          actionLabel={empty.actionLabel}
          onAction={empty.onAction}
        />
      </div>
    )
  }

  return (
    <div className={cn('min-w-0 w-full', className)}>
      <div
        className={cn(
          cardHiddenClass,
          'bg-white rounded-xl border border-gray-100 overflow-hidden'
        )}
      >
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-0">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {selectable ? (
                  <th className="px-3 py-3 w-12 sticky left-0 bg-gray-50 z-[1]">
                    <Checkbox
                      isSelected={
                        selectableRows.length > 0 &&
                        selectableRows.every((row) =>
                          selectedIdSet.has(toIdString(row.id))
                        )
                      }
                      isIndeterminate={
                        selectableRows.some((row) =>
                          selectedIdSet.has(toIdString(row.id))
                        ) &&
                        !selectableRows.every((row) =>
                          selectedIdSet.has(toIdString(row.id))
                        )
                      }
                      onValueChange={handleSelectAll}
                      aria-label="Select all rows"
                      size="sm"
                    />
                  </th>
                ) : null}
                {tableColumns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap',
                      cellAlign(column.align),
                      column.sortable &&
                        'cursor-pointer hover:bg-gray-100 select-none',
                      hideBelowClass(column.hideBelow),
                      column.className
                    )}
                    style={column.width ? { width: column.width } : undefined}
                    onClick={() => column.sortable && handleSort(column.key)}
                    scope="col"
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        column.align === 'right' && 'justify-end',
                        column.align === 'center' && 'justify-center'
                      )}
                    >
                      {column.label}
                      {column.sortable ? (
                        <SortIcon
                          active={sortConfig.key === column.key}
                          direction={sortConfig.direction}
                        />
                      ) : null}
                    </div>
                  </th>
                ))}
                {actions.length > 0 &&
                !tableColumns.some((c) => c.priority === 'actions') ? (
                  <th className="px-3 py-3 w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedData.map((row, index) => {
                const rowCls =
                  typeof rowClassName === 'function'
                    ? rowClassName(row)
                    : rowClassName || ''
                return (
                  <tr
                    key={row.id || index}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-gray-50',
                      selectedIdSet.has(toIdString(row.id)) && 'bg-primary-50',
                      rowCls
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable ? (
                      <td
                        className="px-3 py-3.5 sticky left-0 bg-inherit z-[1]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canSelectRow(row) ? (
                          <Checkbox
                            isSelected={selectedIdSet.has(toIdString(row.id))}
                            onValueChange={() => handleSelectRow(row.id)}
                            aria-label={`Select row ${row.id}`}
                            size="sm"
                          />
                        ) : null}
                      </td>
                    ) : null}
                    {tableColumns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-3 py-3.5 text-sm text-gray-900 align-middle max-w-[18rem]',
                          cellAlign(column.align),
                          hideBelowClass(column.hideBelow),
                          column.priority === 'primary' && 'font-medium'
                        )}
                      >
                        <div className="min-w-0 break-words">
                          {column.render ? column.render(row) : row[column.key]}
                        </div>
                      </td>
                    ))}
                    {actions.length > 0 &&
                    !tableColumns.some((c) => c.priority === 'actions') ? (
                      <td
                        className="px-3 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              aria-label="Row actions"
                              className="min-w-9 min-h-9"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Row actions">
                            {actions.map((action, actionIndex) => (
                              <DropdownItem
                                key={action.key || actionIndex}
                                color={
                                  action.color ||
                                  (action.danger ? 'danger' : 'default')
                                }
                                startContent={action.icon}
                                onPress={() => action.onClick?.(row)}
                              >
                                {action.label}
                              </DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {pagination}
      </div>

      <div className={cn(cardsVisibleClass, 'space-y-3')}>
        {sortedData.map((row, index) => {
          const cardProps = {
            isSelected: selectedIdSet.has(toIdString(row.id)),
            onSelect: () => handleSelectRow(row.id),
            onClick: onRowClick ? () => onRowClick(row) : undefined,
            actions: actions.map((a) => ({
              ...a,
              onClick: () => a.onClick?.(row),
            })),
          }
          return (
            <div key={row.id || index} className="min-w-0">
              {renderMobileCard ? (
                renderMobileCard(row, cardProps)
              ) : (
                <DefaultMobileCard
                  row={row}
                  columns={contentColumns.concat(
                    resolvedColumns.filter((c) => c.priority === 'actions')
                  )}
                  actions={actions}
                  selectable={selectable}
                  isSelected={cardProps.isSelected}
                  onSelect={cardProps.onSelect}
                  onClick={cardProps.onClick}
                  canSelect={canSelectRow(row)}
                />
              )}
            </div>
          )
        })}
        {pagination}
      </div>
    </div>
  )
}
