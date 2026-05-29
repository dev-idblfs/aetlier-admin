'use client';

import { Spinner } from '@heroui/react';
import { useGetVerificationAuditQuery } from '@/redux/services/api';

const ACTION_LABELS = {
  document_uploaded: 'Document uploaded',
  document_verified: 'Document approved',
  document_rejected: 'Document rejected',
  status_approved: 'Verification approved',
  status_rejected: 'Verification rejected',
  status_updated: 'Status updated',
};

export default function AuditTimeline({ verificationId }) {
  const { data, isLoading, isError } = useGetVerificationAuditQuery(verificationId, {
    skip: !verificationId,
  });

  if (!verificationId) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load audit history.</p>;
  }

  const entries = data?.entries || [];

  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No audit history yet.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Audit history</p>
      <ul className="space-y-2 border-l-2 border-gray-200 pl-4">
        {entries.map((entry) => (
          <li key={entry.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary-400" />
            <p className="text-sm font-medium text-gray-800">
              {ACTION_LABELS[entry.action] || entry.action}
            </p>
            <p className="text-xs text-gray-500">
              {entry.actor_name || 'System'}
              {entry.created_at && ` · ${new Date(entry.created_at).toLocaleString()}`}
            </p>
            {entry.metadata?.rejection_reason && (
              <p className="text-xs text-red-600 mt-0.5">{entry.metadata.rejection_reason}</p>
            )}
            {entry.metadata?.file_name && (
              <p className="text-xs text-gray-400">{entry.metadata.file_name}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
