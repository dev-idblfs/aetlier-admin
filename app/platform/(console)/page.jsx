'use client';

import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { Button, Card, CardBody } from '@heroui/react';
import { useSelector } from 'react-redux';
import { ListPageLayout } from '@/components/ui';
import {
  useListPlatformTenantsQuery,
  useGetCutoverStatusQuery,
} from '@/redux/services/platformApi';
import {
  hasPlatformCapability,
  PLATFORM_CAPS,
} from '@/utils/platformCapabilities';
import { TenantStatusChip } from '@/features/platform/tenants/tenantUi';

export default function PlatformOverviewPage() {
  const { capabilities } = useSelector((state) => state.platformAuth);
  const canRead = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_READ
  );
  const canOnboard = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_ONBOARD
  );

  const { data, isLoading } = useListPlatformTenantsQuery(undefined, {
    skip: !canRead,
  });
  const { data: cutover } = useGetCutoverStatusQuery(undefined, {
    skip: !canRead,
  });

  const items = data?.items || [];
  const byStatus = items.reduce((acc, t) => {
    const key = (t.status || 'unknown').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <ListPageLayout
      title="Platform overview"
      description="Control-plane console for clinic tenants."
      showDescription
      breadcrumbs={[{ label: 'Platform' }]}
      actions={
        canOnboard ? (
          <Button
            as={Link}
            href="/platform/tenants/new"
            color="primary"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
          >
            Onboard tenant
          </Button>
        ) : null
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card shadow="none" className="border border-gray-200">
          <CardBody className="gap-1">
            <p className="text-xs text-gray-500">Total tenants</p>
            <p className="text-2xl font-semibold text-gray-900">
              {isLoading ? '—' : data?.total ?? items.length}
            </p>
          </CardBody>
        </Card>
        {['active', 'provisioning', 'failed', 'suspended'].map((status) => (
          <Card key={status} shadow="none" className="border border-gray-200">
            <CardBody className="gap-2">
              <TenantStatusChip status={status} />
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? '—' : byStatus[status] || 0}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {cutover && (
        <Card
          shadow="none"
          className={`border mt-2 ${
            cutover.tenant1_registered
              ? 'border-success-200 bg-success-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <CardBody className="gap-1">
            <p className="text-sm font-medium text-gray-900">
              Tenant #1 cutover
            </p>
            <p className="text-sm text-gray-700">{cutover.message}</p>
            <p className="text-xs text-gray-600">
              Old clinic data is never copied — only registered in place.{" "}
              {cutover.next_step}
            </p>
          </CardBody>
        </Card>
      )}

      <Card shadow="none" className="border border-gray-200 mt-2">
        <CardBody className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Tenants</p>
              <p className="text-xs text-gray-500">
                List, onboard, suspend, and retry provision
              </p>
            </div>
          </div>
          <Button as={Link} href="/platform/tenants" size="sm" variant="flat">
            Open
          </Button>
        </CardBody>
      </Card>
    </ListPageLayout>
  );
}
