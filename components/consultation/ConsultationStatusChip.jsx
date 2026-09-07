'use client';

import { Chip } from '@heroui/react';
import { cn } from '@/utils/cn';

/** Call lifecycle labels — distinct from appointment.status (confirmed / completed / invoiced). */
const CALL_STATUS_MAP = {
  scheduled: { label: 'Call scheduled', color: 'default' },
  ready: { label: 'Ready to join', color: 'warning', pulse: true },
  in_progress: { label: 'In call', color: 'primary' },
  completed: { label: 'Call ended', color: 'success' },
  cancelled: { label: 'Call cancelled', color: 'danger' },
  no_show: { label: 'No show', color: 'danger' },
};

export default function ConsultationStatusChip({
  status,
  consultation,
  className,
  size = 'sm',
}) {
  const raw =
    consultation?.consultation_status ||
    status ||
    'scheduled';
  const key = String(raw).toLowerCase().replace(/\s+/g, '_');
  // Do not map appointment.status values (e.g. confirmed) through call labels.
  const config = CALL_STATUS_MAP[key] || {
    label: `Call: ${String(raw).replace(/_/g, ' ')}`,
    color: 'default',
  };

  const patientWaiting =
    consultation?.active_session?.patient_joined_at &&
    !consultation?.active_session?.doctor_joined_at &&
    key !== 'completed' &&
    key !== 'cancelled';
  const label = patientWaiting ? 'Waiting for you' : config.label;
  const color = patientWaiting ? 'warning' : config.color;
  const pulse = patientWaiting || Boolean(config.pulse);

  return (
    <Chip
      size={size}
      variant="flat"
      color={color}
      className={cn('capitalize', className)}
      title="Video consultation status (separate from appointment status)"
      startContent={
        pulse ? (
          <span
            className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"
            aria-hidden="true"
          />
        ) : undefined
      }
    >
      {label}
    </Chip>
  );
}
