'use client';

import { Chip } from '@heroui/react';
import { cn } from '@/utils/cn';

const STATUS_MAP = {
  scheduled: { label: 'Scheduled', color: 'default' },
  ready: { label: 'Waiting for you', color: 'warning', pulse: true },
  in_progress: { label: 'In progress', color: 'primary' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'danger' },
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
    consultation?.status ||
    'scheduled';
  const key = String(raw).toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_MAP[key] || {
    label: String(raw).replace(/_/g, ' '),
    color: 'default',
  };

  const patientWaiting =
    consultation?.active_session?.patient_joined_at &&
    !consultation?.active_session?.doctor_joined_at;
  const label =
    patientWaiting && key !== 'in_progress' ? 'Waiting for you' : config.label;
  const color =
    patientWaiting && key !== 'in_progress' ? 'warning' : config.color;
  const pulse =
    patientWaiting || config.pulse;

  return (
    <Chip
      size={size}
      variant="flat"
      color={color}
      className={cn('capitalize', className)}
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
