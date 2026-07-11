'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, SelectItem, Card, CardBody } from '@heroui/react';
import { Save, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  FormPageLayout,
  FormSectionCard,
  FormActions,
  FormCompactCard,
  Form,
  FormInput,
  FormSelect,
  FormRow,
  FormDivider,
} from '@/components/ui';
import { platformTenantOnboardSchema } from '@/lib/validation';
import { useCreatePlatformTenantMutation } from '@/redux/services/platformApi';
import {
  hasPlatformCapability,
  PLATFORM_CAPS,
} from '@/utils/platformCapabilities';
import {
  platformApiErrorMessage,
  TenantStatusChip,
} from '@/features/platform/tenants/tenantUi';

export default function PlatformOnboardTenantPage() {
  const router = useRouter();
  const { capabilities } = useSelector((state) => state.platformAuth);
  const canOnboard = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.TENANTS_ONBOARD
  );
  const [createTenant, { isLoading }] = useCreatePlatformTenantMutation();
  const [result, setResult] = useState(null);

  const methods = useForm({
    resolver: zodResolver(platformTenantOnboardSchema),
    defaultValues: {
      slug: '',
      name: '',
      data_plane_mode: 'hosted',
      database_url: '',
      admin_email: '',
      admin_name: '',
      market: '',
      default_currency: 'INR',
      timezone: 'Asia/Kolkata',
      country: 'IN',
      plan_tier: '',
    },
  });

  const mode = useWatch({ control: methods.control, name: 'data_plane_mode' });
  const { isSubmitting } = methods.formState;

  const onSubmit = async (values) => {
    try {
      const body = {
        slug: values.slug.trim().toLowerCase(),
        name: values.name.trim(),
        data_plane_mode: values.data_plane_mode,
        admin_email: values.admin_email.trim(),
        run_provision: true,
      };
      if (values.admin_name?.trim()) body.admin_name = values.admin_name.trim();
      if (values.market?.trim()) body.market = values.market.trim();
      if (values.default_currency?.trim()) {
        body.default_currency = values.default_currency.trim();
      }
      if (values.timezone?.trim()) body.timezone = values.timezone.trim();
      if (values.country?.trim()) body.country = values.country.trim();
      if (values.plan_tier?.trim()) body.plan_tier = values.plan_tier.trim();
      if (values.data_plane_mode === 'byo' && values.database_url?.trim()) {
        body.database_url = values.database_url.trim();
      }

      const created = await createTenant(body).unwrap();
      setResult(created);
      toast.success(
        created.status === 'active'
          ? 'Tenant provisioned'
          : `Tenant created (${created.status})`
      );
    } catch (error) {
      toast.error(platformApiErrorMessage(error, 'Failed to onboard tenant'));
    }
  };

  const handleCopyPassword = async () => {
    if (!result?.temporary_admin_password) return;
    try {
      await navigator.clipboard.writeText(result.temporary_admin_password);
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  if (!canOnboard) {
    return (
      <FormPageLayout
        title="Onboard tenant"
        breadcrumbs={[
          { label: 'Tenants', href: '/platform/tenants' },
          { label: 'Onboard' },
        ]}
        cancelHref="/platform/tenants"
      >
        <p className="text-sm text-gray-600">
          You do not have the tenants_onboard capability.
        </p>
      </FormPageLayout>
    );
  }

  if (result) {
    return (
      <FormPageLayout
        title="Tenant onboarded"
        breadcrumbs={[
          { label: 'Tenants', href: '/platform/tenants' },
          { label: result.slug },
        ]}
        cancelHref={`/platform/tenants/${result.id}`}
      >
        <Card shadow="none" className="border border-gray-200">
          <CardBody className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {result.name}
              </h2>
              <TenantStatusChip status={result.status} />
            </div>
            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-gray-500">Slug</dt>
                <dd className="font-medium">{result.slug}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Mode</dt>
                <dd className="font-medium">{result.data_plane_mode}</dd>
              </div>
              {result.admin_email && (
                <div>
                  <dt className="text-gray-500">Clinic admin email</dt>
                  <dd className="font-medium">{result.admin_email}</dd>
                </div>
              )}
              {result.clinic_host_hint && (
                <div>
                  <dt className="text-gray-500">Clinic admin host</dt>
                  <dd className="font-medium break-all">
                    {result.clinic_host_hint}
                  </dd>
                </div>
              )}
            </dl>

            {result.temporary_admin_password && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                <p className="text-sm font-medium text-amber-900">
                  One-time clinic admin password
                </p>
                <p className="text-xs text-amber-800">
                  Copy now — it is not stored and will not be shown again.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-sm bg-white px-2 py-1 rounded border border-amber-200">
                    {result.temporary_admin_password}
                  </code>
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Copy className="w-4 h-4" />}
                    onPress={handleCopyPassword}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {result.registry?.last_error && (
              <p className="text-sm text-danger">{result.registry.last_error}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                color="primary"
                onPress={() => router.push(`/platform/tenants/${result.id}`)}
              >
                Open tenant
              </Button>
              <Button
                variant="flat"
                onPress={() => router.push('/platform/tenants')}
              >
                Back to list
              </Button>
            </div>
          </CardBody>
        </Card>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout
      title="Onboard tenant"
      breadcrumbs={[
        { label: 'Tenants', href: '/platform/tenants' },
        { label: 'Onboard' },
      ]}
      cancelHref="/platform/tenants"
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <FormCompactCard
          footer={
            <FormActions inline>
              <Button
                color="primary"
                type="submit"
                isLoading={isLoading || isSubmitting}
                startContent={
                  !isLoading && !isSubmitting && <Save className="w-4 h-4" />
                }
                className="w-full sm:w-auto"
              >
                Create & provision
              </Button>
            </FormActions>
          }
        >
          <FormSectionCard embedded title="Clinic">
            <FormRow columns={2}>
              <FormInput
                name="name"
                label="Clinic name"
                placeholder="Aura Clinic Mumbai"
                isRequired
              />
              <FormInput
                name="slug"
                label="Slug"
                placeholder="aura-mumbai"
                description="Used in {slug}.admin.* host"
                isRequired
              />
            </FormRow>
          </FormSectionCard>

          <FormDivider />

          <FormSectionCard embedded title="Data plane">
            <FormRow columns={2}>
              <FormSelect
                name="data_plane_mode"
                label="Mode"
                placeholder="Select mode"
              >
                <SelectItem key="hosted" textValue="Hosted">
                  Hosted (Plan A CREATE DATABASE)
                </SelectItem>
                <SelectItem key="byo" textValue="BYO">
                  BYO (bring your own Postgres)
                </SelectItem>
              </FormSelect>
              {mode === 'byo' && (
                <FormInput
                  name="database_url"
                  label="Database URL"
                  placeholder="postgresql://user:pass@host/dbname"
                  description="Must be empty Postgres 14+"
                  isRequired
                />
              )}
            </FormRow>
          </FormSectionCard>

          <FormDivider />

          <FormSectionCard embedded title="First clinic admin">
            <FormRow columns={2}>
              <FormInput
                name="admin_email"
                label="Admin email"
                type="email"
                placeholder="admin@clinic.com"
                isRequired
              />
              <FormInput
                name="admin_name"
                label="Admin name"
                placeholder="Clinic Admin"
              />
            </FormRow>
          </FormSectionCard>

          <FormDivider />

          <FormSectionCard embedded title="Optional locale">
            <FormRow columns={3}>
              <FormInput name="market" label="Market" placeholder="IN" />
              <FormInput
                name="default_currency"
                label="Currency"
                placeholder="INR"
              />
              <FormInput
                name="timezone"
                label="Timezone"
                placeholder="Asia/Kolkata"
              />
              <FormInput name="country" label="Country" placeholder="IN" />
              <FormInput name="plan_tier" label="Plan tier" placeholder="standard" />
            </FormRow>
          </FormSectionCard>
        </FormCompactCard>
      </Form>
    </FormPageLayout>
  );
}
