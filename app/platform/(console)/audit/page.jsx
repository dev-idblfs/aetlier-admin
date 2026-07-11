'use client';

import { useSelector } from 'react-redux';
import Link from 'next/link';
import { ListPageLayout, ResponsiveTable } from '@/components/ui';
import { useListPlatformAuditQuery } from '@/redux/services/platformApi';
import {
  hasPlatformCapability,
  PLATFORM_CAPS,
} from '@/utils/platformCapabilities';
import { formatDate } from '@/utils/dateFormatters';

export default function PlatformAuditPage() {
  const { capabilities } = useSelector((state) => state.platformAuth);
  const canRead = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_READ
  );
  const { data, isLoading } = useListPlatformAuditQuery(
    { limit: 100 },
    { skip: !canRead }
  );

  if (!canRead) {
    return (
      <ListPageLayout title="Audit" breadcrumbs={[{ label: 'Audit' }]}>
        <p className="text-sm text-gray-600">Requires tenants_read.</p>
      </ListPageLayout>
    );
  }

  const columns = [
    {
      key: 'when',
      label: 'When',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.created_at ? formatDate(row.created_at) : '—'}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => <span className="font-medium text-sm">{row.action}</span>,
    },
    {
      key: 'actor',
      label: 'Actor',
      render: (row) => (
        <span className="text-sm">{row.actor_email || 'system'}</span>
      ),
    },
    {
      key: 'tenant',
      label: 'Tenant',
      render: (row) =>
        row.tenant_id ? (
          <Link
            href={`/platform/tenants/${row.tenant_id}`}
            className="text-sm text-primary-600 hover:underline"
          >
            {String(row.tenant_id).slice(0, 8)}…
          </Link>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
  ];

  return (
    <ListPageLayout
      title="Audit log"
      description="Control-plane actions (onboard, suspend, operator changes)."
      showDescription
      breadcrumbs={[
        { label: 'Platform', href: '/platform' },
        { label: 'Audit' },
      ]}
    >
      <ResponsiveTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyState={{
          title: 'No audit events',
          description: 'Actions will appear here as operators use the console.',
        }}
      />
    </ListPageLayout>
  );
}
