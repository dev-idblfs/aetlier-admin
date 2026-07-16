'use client';

import { Trash2, X } from 'lucide-react';
import { Button } from '@heroui/react';
import { cn } from '@/utils/cn';

export default function BulkActionBar({
  count = 0,
  onDelete,
  onClear,
  canDelete = true,
  deleteLabel = 'Delete',
  className = '',
}) {
  if (!count || !canDelete) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2',
        className,
      )}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium text-gray-700">
        {count} selected on this page
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          color="danger"
          variant="flat"
          startContent={<Trash2 className="h-4 w-4" />}
          onPress={onDelete}
          aria-label={`${deleteLabel} ${count} selected items`}
        >
          {deleteLabel} ({count})
        </Button>
        <Button
          size="sm"
          variant="light"
          startContent={<X className="h-4 w-4" />}
          onPress={onClear}
          aria-label="Clear selection"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
