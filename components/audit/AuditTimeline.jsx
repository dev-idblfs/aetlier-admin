'use client';

import { CheckCircle2, XCircle, AlertCircle, Activity } from 'lucide-react';
import { Spinner } from '@heroui/react';
import { useGetEntityAuditLogsQuery } from '@/redux/services/api';

const ACTION_LABELS = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  'consultation.room_created': 'Consultation room prepared',
  'consultation.token_issued': 'Join link issued',
  'consultation.started': 'Call started',
  'consultation.ended': 'Call ended',
  'prescription.sent': 'Prescription sent',
  'notification.dispatched': 'Notification sent',
  document_uploaded: 'Document uploaded',
  document_verified: 'Document approved',
  document_rejected: 'Document rejected',
  status_approved: 'Verification approved',
  status_rejected: 'Verification rejected',
  status_updated: 'Status updated',
};

function AuditIcon({ action }) {
  if (action?.includes('rejected') || action?.includes('ended')) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  if (
    action?.includes('approved') ||
    action?.includes('verified') ||
    action?.includes('started') ||
    action?.includes('sent')
  ) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }
  if (action?.includes('consultation') || action?.includes('notification')) {
    return <Activity className="h-4 w-4 text-secondary-500" />;
  }
  return <AlertCircle className="h-4 w-4 text-amber-500" />;
}

function formatChanges(changes) {
  if (!changes || typeof changes !== 'object') return null;
  return Object.entries(changes)
    .slice(0, 3)
    .map(([field, diff]) => {
      const oldVal = diff?.old ?? '—';
      const newVal = diff?.new ?? '—';
      return `${field}: ${oldVal} → ${newVal}`;
    })
    .join('; ');
}

/**
 * Reusable global audit timeline for any entity type.
 * verificationId prop kept for backward compatibility with verification pages.
 */
export default function AuditTimeline({
  entityType,
  entityId,
  verificationId,
  title = 'Audit history',
  compact = false,
}) {
  const resolvedType = entityType || (verificationId ? 'doctor_verifications' : null);
  const resolvedId = entityId || verificationId;

  const { data, isLoading, isError } = useGetEntityAuditLogsQuery(
    { entityType: resolvedType, entityId: resolvedId },
    { skip: !resolvedType || !resolvedId }
  );

  if (!resolvedId) return null;

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

  const entries = data?.entries || data?.items || [];

  if (!entries.length) {
    return <p className="text-sm text-gray-500">No audit history yet.</p>;
  }

  return (
    <div className={compact ? 'space-y-3' : ''}>
      {!compact && <p className="text-sm font-medium text-gray-700 mb-3">{title}</p>}
      <ul className="space-y-2 border-l-2 border-gray-200 pl-4">
        {entries.map((entry) => (
          <li key={entry.id} className="relative">
            <span className="absolute -left-[21px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
              <AuditIcon action={entry.action} />
            </span>
            <p className="text-sm font-medium text-gray-800">
              {ACTION_LABELS[entry.action] || entry.action?.replace(/[._]/g, ' ')}
            </p>
            <p className="text-xs text-gray-500">
              {entry.actor_name || entry.actor_type || 'System'}
              {entry.created_at && ` · ${new Date(entry.created_at).toLocaleString()}`}
            </p>
            {formatChanges(entry.changes) && (
              <p className="text-xs text-gray-400 mt-0.5">{formatChanges(entry.changes)}</p>
            )}
            {entry.metadata?.rejection_reason && (
              <p className="text-xs text-red-600 mt-0.5">{entry.metadata.rejection_reason}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
