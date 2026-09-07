/**
 * FilterBar — search + collapsible filters.
 * Filters toggle works on all viewports (hide/show). Defaults open on md+.
 */

'use client';

import { useEffect, useState } from 'react';
import { Filter, X } from '@/lib/icons';
import { Button, Chip } from '@/lib/heroui';
import SearchInput from './SearchInput';
import { cn } from '@/utils/cn';

export default function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  activeFiltersCount = 0,
  onClearAll,
  children,
  className = '',
  defaultExpanded,
}) {
  const hasFilters = Boolean(children);
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof defaultExpanded === 'boolean') return defaultExpanded;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 768px)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof defaultExpanded === 'boolean') return undefined;
    const media = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsExpanded(media.matches);
    // Only auto-open when crossing to desktop; do not force-close on resize mid-session
    const onChange = (event) => {
      if (event.matches) setIsExpanded(true);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [defaultExpanded]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        {onSearchChange ? (
          <div className="flex-1 min-w-0">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        ) : null}
        {hasFilters ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="md"
              variant={isExpanded ? 'flat' : 'bordered'}
              className="min-h-11 sm:min-h-10"
              onPress={() => setIsExpanded((open) => !open)}
              startContent={<Filter className="w-4 h-4" />}
              aria-expanded={isExpanded}
              aria-controls="admin-filter-panel"
              aria-label={isExpanded ? 'Hide filters' : 'Show filters'}
            >
              {isExpanded ? 'Hide filters' : 'Filters'}
              {activeFiltersCount > 0 ? (
                <Chip size="sm" color="primary" variant="flat" className="ml-1">
                  {activeFiltersCount}
                </Chip>
              ) : null}
            </Button>
            {activeFiltersCount > 0 && onClearAll ? (
              <Button
                size="md"
                variant="light"
                color="danger"
                className="min-h-11 sm:min-h-10"
                onPress={onClearAll}
                startContent={<X className="w-3.5 h-3.5" />}
                aria-label="Clear all filters"
              >
                Clear
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasFilters && isExpanded ? (
        <div
          id="admin-filter-panel"
          className="rounded-xl border border-gray-200 bg-white p-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end [&>*]:min-w-0">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
