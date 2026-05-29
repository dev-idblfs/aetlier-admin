'use client';

import { Chip } from '@heroui/react';
import {
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
} from '@/constants/verification';

export default function VerificationStatusBadge({ status, size = 'sm' }) {
  const normalized = status?.toLowerCase?.() || status;
  return (
    <Chip
      color={VERIFICATION_STATUS_COLORS[normalized] || 'default'}
      size={size}
      variant="flat"
    >
      {VERIFICATION_STATUS_LABELS[normalized] || status || 'Unknown'}
    </Chip>
  );
}
