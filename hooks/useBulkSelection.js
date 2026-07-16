'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

const toIdString = (id) => String(id);

/**
 * Manages row selection for paginated list tables.
 * Clears selection when page changes or when visible row ids change (filter/data),
 * not when parent passes a new array reference with the same rows.
 */
export default function useBulkSelection(
  items = [],
  currentPage = 1,
  itemsPerPage = 10,
) {
  const [selectedIds, setSelectedIds] = useState([]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const visibleItemIdsKey = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items
      .slice(start, start + itemsPerPage)
      .map((item) => toIdString(item.id))
      .join('|');
  }, [items, currentPage, itemsPerPage]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, visibleItemIdsKey]);

  const onSelectionChange = useCallback((ids) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback(
    (id) => selectedIds.some((selectedId) => toIdString(selectedId) === toIdString(id)),
    [selectedIds],
  );

  return {
    selectedIds,
    setSelectedIds,
    onSelectionChange,
    clearSelection,
    isSelected,
    selectedCount: selectedIds.length,
    pageItems,
  };
}
