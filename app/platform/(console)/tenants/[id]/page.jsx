'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Switch,
  Textarea,
  useDisclosure,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import {
  RefreshCw,
  Pause,
  Play,
  Trash2,
  Copy,
  ExternalLink,
  Save,
} from 'lucide-react';
import {
  ListPageLayout,
  ConfirmModal,
  DetailRow,
} from '@/components/ui';
import {
  useGetPlatformTenantQuery,
  useUpdatePlatformTenantMutation,
  useSuspendPlatformTenantMutation,
  useUnsuspendPlatformTenantMutation,
  useRetryPlatformTenantMutation,
  useDropOrphanPlatformTenantDbMutation,
  useListPlatformAuditQuery,
} from '@/redux/services/platformApi';
import {
  hasPlatformCapability,
  PLATFORM_CAPS,
} from '@/utils/platformCapabilities';
import {
  TenantStatusChip,
  formatProvisionStep,
  platformApiErrorMessage,
  PROVISION_STEPS,
} from '@/features/platform/tenants/tenantUi';
import { formatDate } from '@/utils/dateFormatters';

export default function PlatformTenantDetailPage() {
  const params = useParams();
  const tenantId = params?.id;
  const { capabilities } = useSelector((state) => state.platformAuth);

  const canRead = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_READ
  );
  const canEdit = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_ONBOARD
  );
  const canSuspend = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_SUSPEND
  );
  const canRetry = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_RETRY
  );

  const { data: tenant, isLoading, refetch } = useGetPlatformTenantQuery(
    tenantId,
    { skip: !canRead || !tenantId }
  );
  const { data: auditData } = useListPlatformAuditQuery(
    { tenant_id: tenantId, limit: 20 },
    { skip: !canRead || !tenantId }
  );

  const [updateTenant, { isLoading: saving }] =
    useUpdatePlatformTenantMutation();
  const [suspendTenant, { isLoading: suspending }] =
    useSuspendPlatformTenantMutation();
  const [unsuspendTenant, { isLoading: unsuspending }] =
    useUnsuspendPlatformTenantMutation();
  const [retryTenant, { isLoading: retrying }] =
    useRetryPlatformTenantMutation();
  const [dropOrphan, { isLoading: dropping }] =
    useDropOrphanPlatformTenantDbMutation();

  const [tempPassword, setTempPassword] = useState(null);
  const [form, setForm] = useState({
    name: '',
    market: '',
    default_currency: '',
    timezone: '',
    country: '',
    plan_tier: '',
    internal_notes: '',
    support_labels: '',
    booking_enabled: true,
    mobile_enabled: true,
  });

  const suspendModal = useDisclosure();
  const unsuspendModal = useDisclosure();
  const dropModal = useDisclosure();

  useEffect(() => {
    if (!tenant) return;
    setForm({
      name: tenant.name || '',
      market: tenant.market || '',
      default_currency: tenant.default_currency || '',
      timezone: tenant.timezone || '',
      country: tenant.country || '',
      plan_tier: tenant.plan_tier || '',
      internal_notes: tenant.internal_notes || '',
      support_labels: (tenant.support_labels || []).join(', '),
      booking_enabled: tenant.feature_flags?.booking_enabled !== false,
      mobile_enabled: tenant.feature_flags?.mobile_enabled !== false,
    });
  }, [tenant]);

  const status = (tenant?.status || '').toLowerCase();
  const canRetryNow =
    canRetry && (status === 'failed' || status === 'provisioning');
  const canDropOrphan =
    canRetry &&
    status === 'failed' &&
    tenant?.data_plane_mode === 'hosted' &&
    (tenant?.registry?.provision_step ?? 0) >= 1;
  const step = tenant?.registry?.provision_step ?? 0;

  const handleSave = async () => {
    try {
      await updateTenant({
        id: tenantId,
        name: form.name.trim(),
        market: form.market.trim() || null,
        default_currency: form.default_currency.trim() || null,
        timezone: form.timezone.trim() || null,
        country: form.country.trim() || null,
        plan_tier: form.plan_tier.trim() || null,
        internal_notes: form.internal_notes.trim() || null,
        support_labels: form.support_labels
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        feature_flags: {
          booking_enabled: form.booking_enabled,
          mobile_enabled: form.mobile_enabled,
        },
      }).unwrap();
      toast.success('Tenant updated');
      refetch();
    } catch (error) {
      toast.error(platformApiErrorMessage(error, 'Update failed'));
    }
  };

  const handleRetry = async () => {
    try {
      const result = await retryTenant(tenantId).unwrap();
      if (result.temporary_admin_password) {
        setTempPassword({
          password: result.temporary_admin_password,
          email: result.admin_email,
        });
      }
      toast.success(`Retry finished (${result.status})`);
      refetch();
    } catch (error) {
      toast.error(platformApiErrorMessage(error, 'Retry failed'));
    }
  };

  if (!canRead) {
    return (
      <ListPageLayout
        title="Tenant"
        breadcrumbs={[{ label: 'Tenants', href: '/platform/tenants' }]}
      >
        <p className="text-sm text-gray-600">Missing tenants_read capability.</p>
      </ListPageLayout>
    );
  }

  const actions = (
    <div className="flex flex-wrap gap-2">
      {tenant?.clinic_admin_url && (
        <Button
          size="sm"
          variant="flat"
          as="a"
          href={
            tenant.clinic_admin_url.startsWith('http')
              ? tenant.clinic_admin_url
              : `https://${tenant.clinic_admin_url}`
          }
          target="_blank"
          rel="noopener noreferrer"
          startContent={<ExternalLink className="w-4 h-4" />}
        >
          Open clinic admin
        </Button>
      )}
      {canRetryNow && (
        <Button
          size="sm"
          color="warning"
          variant="flat"
          startContent={<RefreshCw className="w-4 h-4" />}
          isLoading={retrying}
          onPress={handleRetry}
        >
          Retry provision
        </Button>
      )}
      {canSuspend && status === 'active' && (
        <Button
          size="sm"
          color="danger"
          variant="flat"
          startContent={<Pause className="w-4 h-4" />}
          onPress={suspendModal.onOpen}
        >
          Suspend
        </Button>
      )}
      {canSuspend && status === 'suspended' && (
        <Button
          size="sm"
          color="success"
          variant="flat"
          startContent={<Play className="w-4 h-4" />}
          onPress={unsuspendModal.onOpen}
        >
          Unsuspend
        </Button>
      )}
      {canDropOrphan && (
        <Button
          size="sm"
          color="danger"
          variant="bordered"
          startContent={<Trash2 className="w-4 h-4" />}
          onPress={dropModal.onOpen}
        >
          Drop orphan DB
        </Button>
      )}
    </div>
  );

  return (
    <ListPageLayout
      title={tenant?.name || 'Tenant'}
      breadcrumbs={[
        { label: 'Platform', href: '/platform' },
        { label: 'Tenants', href: '/platform/tenants' },
        { label: tenant?.slug || 'Detail' },
      ]}
      actions={actions}
      actionsKey={`tenant-${tenantId}-${status}`}
    >
      {isLoading && <p className="text-sm text-gray-500">Loading tenant...</p>}
      {!isLoading && !tenant && (
        <p className="text-sm text-gray-600">Tenant not found.</p>
      )}

      {tenant && (
        <div className="space-y-3">
          <Card shadow="none" className="border border-gray-200">
            <CardBody className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <TenantStatusChip status={tenant.status} />
                <Chip size="sm" variant="bordered">
                  {tenant.data_plane_mode}
                </Chip>
                <Chip size="sm" variant="flat">
                  {formatProvisionStep(step)}
                </Chip>
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                <DetailRow label="Slug" value={tenant.slug} />
                <DetailRow label="ID" value={tenant.id} />
                <DetailRow
                  label="Clinic admin"
                  value={tenant.clinic_admin_url || '—'}
                />
                <DetailRow
                  label="Created"
                  value={
                    tenant.created_at ? formatDate(tenant.created_at) : '—'
                  }
                />
              </div>
            </CardBody>
          </Card>

          <Card shadow="none" className="border border-gray-200">
            <CardBody className="gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Provision timeline
              </h3>
              <ol className="space-y-1">
                {PROVISION_STEPS.map((label, i) => (
                  <li
                    key={label}
                    className={`text-sm flex gap-2 ${
                      i <= step ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    <span className="w-5 tabular-nums">{i}</span>
                    <span>
                      {label}
                      {i === step ? ' ← current' : ''}
                    </span>
                  </li>
                ))}
              </ol>
              {tenant.registry?.last_error && (
                <div className="mt-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {tenant.registry.last_error}
                </div>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="border border-gray-200">
            <CardBody className="gap-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Metadata & flags
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={form.name}
                  isDisabled={!canEdit}
                  onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
                />
                <Input
                  label="Market (IN / AE / US)"
                  value={form.market}
                  isDisabled={!canEdit}
                  onValueChange={(v) => setForm((f) => ({ ...f, market: v }))}
                />
                <Input
                  label="Currency"
                  value={form.default_currency}
                  isDisabled={!canEdit}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, default_currency: v }))
                  }
                />
                <Input
                  label="Timezone"
                  value={form.timezone}
                  isDisabled={!canEdit}
                  onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
                />
                <Input
                  label="Country"
                  value={form.country}
                  isDisabled={!canEdit}
                  onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}
                />
                <Input
                  label="Plan tier"
                  value={form.plan_tier}
                  isDisabled={!canEdit}
                  onValueChange={(v) => setForm((f) => ({ ...f, plan_tier: v }))}
                />
                <Input
                  label="Support labels (comma-separated)"
                  className="sm:col-span-2"
                  value={form.support_labels}
                  isDisabled={!canEdit}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, support_labels: v }))
                  }
                />
                <Textarea
                  label="Internal notes"
                  className="sm:col-span-2"
                  value={form.internal_notes}
                  isDisabled={!canEdit}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, internal_notes: v }))
                  }
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <Switch
                  isSelected={form.booking_enabled}
                  isDisabled={!canEdit}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, booking_enabled: v }))
                  }
                >
                  Booking enabled
                </Switch>
                <Switch
                  isSelected={form.mobile_enabled}
                  isDisabled={!canEdit}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, mobile_enabled: v }))
                  }
                >
                  Mobile enabled
                </Switch>
              </div>
              {canEdit && (
                <Button
                  color="primary"
                  size="sm"
                  className="w-fit"
                  startContent={<Save className="w-4 h-4" />}
                  isLoading={saving}
                  onPress={handleSave}
                >
                  Save changes
                </Button>
              )}
            </CardBody>
          </Card>

          <Card shadow="none" className="border border-gray-200">
            <CardBody className="gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Audit (this tenant)
              </h3>
              {(auditData?.items || []).length === 0 && (
                <p className="text-sm text-gray-500">No events yet.</p>
              )}
              <ul className="space-y-2">
                {(auditData?.items || []).map((ev) => (
                  <li
                    key={ev.id}
                    className="text-sm border-b border-gray-100 pb-2"
                  >
                    <span className="font-medium">{ev.action}</span>
                    <span className="text-gray-500">
                      {' '}
                      · {ev.actor_email || 'system'} ·{' '}
                      {ev.created_at ? formatDate(ev.created_at) : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          {tempPassword && (
            <Card shadow="none" className="border border-amber-200 bg-amber-50">
              <CardBody className="gap-2">
                <p className="text-sm font-medium text-amber-900">
                  One-time admin password (from retry)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-sm bg-white px-2 py-1 rounded border border-amber-200">
                    {tempPassword.password}
                  </code>
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Copy className="w-4 h-4" />}
                    onPress={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          tempPassword.password
                        );
                        toast.success('Copied');
                      } catch {
                        toast.error('Copy failed');
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={suspendModal.isOpen}
        onOpenChange={suspendModal.onOpenChange}
        title="Suspend tenant?"
        message="Clinic APIs will return 403 until unsuspended."
        confirmLabel="Suspend"
        type="danger"
        isLoading={suspending}
        onConfirm={async () => {
          try {
            await suspendTenant(tenantId).unwrap();
            toast.success('Tenant suspended');
            suspendModal.onClose();
            refetch();
          } catch (error) {
            toast.error(platformApiErrorMessage(error, 'Suspend failed'));
          }
        }}
      />
      <ConfirmModal
        isOpen={unsuspendModal.isOpen}
        onOpenChange={unsuspendModal.onOpenChange}
        title="Unsuspend tenant?"
        message="Restore active status for this clinic."
        confirmLabel="Unsuspend"
        type="success"
        isLoading={unsuspending}
        onConfirm={async () => {
          try {
            await unsuspendTenant(tenantId).unwrap();
            toast.success('Tenant unsuspended');
            unsuspendModal.onClose();
            refetch();
          } catch (error) {
            toast.error(platformApiErrorMessage(error, 'Unsuspend failed'));
          }
        }}
      />
      <ConfirmModal
        isOpen={dropModal.isOpen}
        onOpenChange={dropModal.onOpenChange}
        title="Drop orphan database?"
        message="This runs DROP DATABASE for a failed hosted tenant. Irreversible."
        confirmLabel="Drop database"
        type="danger"
        isLoading={dropping}
        onConfirm={async () => {
          try {
            await dropOrphan(tenantId).unwrap();
            toast.success('Orphan database dropped');
            dropModal.onClose();
            refetch();
          } catch (error) {
            toast.error(platformApiErrorMessage(error, 'Drop failed'));
          }
        }}
      />
    </ListPageLayout>
  );
}
