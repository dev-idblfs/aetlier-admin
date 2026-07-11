'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Eye } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { useSelector } from 'react-redux';
import {
  ListPageLayout,
  ResponsiveTable,
  SearchInput,
} from '@/components/ui';
import { useListPlatformTenantsQuery } from '@/redux/services/platformApi';
import {
  hasPlatformCapability,
  PLATFORM_CAPS,
} from '@/utils/platformCapabilities';
import {
  TenantStatusChip,
  formatProvisionStep,
} from '@/features/platform/tenants/tenantUi';
import { formatDate } from '@/utils/dateFormatters';

export default function PlatformTenantsPage() {
  const router = useRouter();
  const { capabilities } = useSelector((state) => state.platformAuth);
  const canRead = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_READ
  );
  const canOnboard = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_ONBOARD
  );

  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useListPlatformTenantsQuery(undefined, {
    skip: !canRead,
  });

  const items = useMemo(() => {
    const list = data?.items || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        t.slug?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q)
    );
  }, [data, search]);

  if (!canRead) {
    return (
      <ListPageLayout title="Tenants" breadcrumbs={[{ label: 'Tenants' }]}>
        <p className="text-sm text-gray-600">
          You do not have the tenants_read capability.
        </p>
      </ListPageLayout>
    );
  }

  const columns = [
    {
      key: 'name',
      label: 'Clinic',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <TenantStatusChip status={row.status} />,
    },
    {
      key: 'mode',
      label: 'Data plane',
      render: (row) => (
        <Chip size="sm" variant="bordered">
          {row.data_plane_mode}
        </Chip>
      ),
    },
    {
      key: 'step',
      label: 'Provision',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatProvisionStep(row.registry?.provision_step)}
        </span>
      ),
    },
    {
      key: 'created',
      label: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.created_at ? formatDate(row.created_at) : '—'}
        </span>
      ),
    },
  ];

  return (
    <ListPageLayout
      title="Tenants"
      description="Clinic tenants on the control plane."
      breadcrumbs={[
        { label: 'Platform', href: '/platform' },
        { label: 'Tenants' },
      ]}
      actions={
        canOnboard ? (
          <Button
            as={Link}
            href="/platform/tenants/new"
            color="primary"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
          >
            Onboard
          </Button>
        ) : null
      }
      toolbar={
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search slug, name, status..."
        />
      }
    >
      {error && (
        <p className="text-sm text-danger mb-2">
          Failed to load tenants. Check platform API / control DB.
        </p>
      )}
      <ResponsiveTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyState={{
          title: 'No tenants yet',
          description: 'Onboard the first clinic to get started.',
          actionLabel: canOnboard ? 'Onboard tenant' : undefined,
          onAction: canOnboard
            ? () => router.push('/platform/tenants/new')
            : undefined,
        }}
        onRowClick={(row) => router.push(`/platform/tenants/${row.id}`)}
        actions={[
          {
            label: 'View',
            icon: <Eye className="w-4 h-4" />,
            onClick: (row) => router.push(`/platform/tenants/${row.id}`),
          },
        ]}
      />
    </ListPageLayout>
  );
}
