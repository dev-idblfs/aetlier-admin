'use client';

import { useDisclosure } from '@heroui/react';
import { toast } from 'react-hot-toast';

/**
 * Shared bulk delete/cancel flow: modal disclosure + confirm handler.
 */
export default function useBulkDeleteAction(mutationHook, entityLabel = 'items') {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [runBulk, { isLoading }] = mutationHook();

  const handleBulkConfirm = async (selectedIds, clearSelection) => {
    if (!selectedIds?.length) return;
    try {
      const result = await runBulk({ ids: selectedIds }).unwrap();
      const deleted = result?.deleted_ids?.length ?? 0;
      const failed = result?.failed?.length ?? 0;
      if (deleted > 0) {
        toast.success(
          `${deleted} ${entityLabel} ${deleted === 1 ? '' : ''}processed`,
        );
      }
      if (failed > 0) {
        const firstReason = result.failed[0]?.reason;
        toast.error(
          `${failed} could not be processed${firstReason ? `: ${firstReason}` : ''}`,
        );
      }
      clearSelection();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.data?.detail || `Failed to process ${entityLabel}`);
    }
  };

  return {
    isBulkOpen: isOpen,
    onBulkOpen: onOpen,
    onBulkOpenChange: onOpenChange,
    handleBulkConfirm,
    isBulkLoading: isLoading,
  };
}
