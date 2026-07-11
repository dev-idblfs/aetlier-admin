import { Chip } from '@heroui/react';

const STATUS_COLOR = {
  active: 'success',
  provisioning: 'warning',
  failed: 'danger',
  suspended: 'default',
};

export const PROVISION_STEPS = [
  'Accepted',
  'DB created',
  'Roles granted',
  'Migrated',
  'Seeded',
  'Admin created',
  'Health OK',
  'Active',
];

export function TenantStatusChip({ status }) {
  const key = (status || '').toLowerCase();
  return (
    <Chip size="sm" variant="flat" color={STATUS_COLOR[key] || 'default'}>
      {status || 'unknown'}
    </Chip>
  );
}

export function formatProvisionStep(step) {
  if (step == null) return '—';
  return PROVISION_STEPS[step] ?? `Step ${step}`;
}

export function platformApiErrorMessage(error, fallback = 'Request failed') {
  const detail = error?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return error?.data?.message || fallback;
}
