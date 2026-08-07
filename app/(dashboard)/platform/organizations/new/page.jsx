'use client'

/**
 * Platform organization onboarding wizard — multi-step provision flow.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Switch, Button as HeroButton } from '@heroui/react'
import Cookies from 'js-cookie'
import {
  FormPageLayout,
  FormCompactCard,
  FormSectionCard,
  FormActions,
  Button,
  LinkButton,
} from '@/components/ui'
import { FormInput, FormTextarea } from '@/components/ui/FormFields'
import { organizationOnboardSchema } from '@/lib/validation'
import {
  useCreateOrganizationMutation,
  useSwitchOrganizationContextMutation,
} from '@/redux/services/api'
import { setActiveOrganization } from '@/redux/slices/authSlice'
import { useDispatch } from 'react-redux'
import config from '@/config'
import { storeRefreshToken } from '@/services/sessionApi'

const STEPS = [
  { id: 'identity', label: 'Identity' },
  { id: 'branding', label: 'Branding' },
  { id: 'business', label: 'Business & tax' },
  { id: 'features', label: 'Features' },
  { id: 'review', label: 'Review' },
]

const defaults = {
  slug: '',
  name: '',
  display_name: '',
  owner_email: '',
  owner_name: '',
  owner_password: '',
  phone: '',
  support_email: '',
  address_line1: '',
  address_line2: '',
  address_city: '',
  address_state: '',
  address_postal_code: '',
  address_country: 'IN',
  primary_color: '#6B4EFF',
  logo_url: '',
  map_url: '',
  business_name: '',
  business_email: '',
  business_phone: '',
  business_address: '',
  business_gstin: '',
  business_pan: '',
  timezone: 'Asia/Kolkata',
  locale: 'en-IN',
  invoice_prefix: 'INV',
  expense_prefix: 'EXP',
  default_tax_rate: 18,
  tax_type: 'GST',
  enable_cgst_sgst: true,
  currency_code: 'INR',
  currency_symbol: '₹',
  default_due_days: 7,
  default_terms: '',
  default_notes: '',
  feature_whatsapp: false,
  feature_livekit: true,
  feature_facescan: false,
  feature_online_consultation: true,
  feature_referrals: false,
  feature_public_catalog: false,
  feature_public_booking: false,
  feature_booking_webhooks: false,
}

function buildPayload(values) {
  const businessName = values.business_name || values.display_name || values.name
  const businessEmail = values.business_email || values.owner_email
  const businessAddress =
    values.business_address ||
    [values.address_line1, values.address_city, values.address_state, values.address_postal_code]
      .filter(Boolean)
      .join(', ')

  return {
    slug: values.slug.trim(),
    name: values.name.trim(),
    display_name: values.display_name?.trim() || values.name.trim(),
    owner_email: values.owner_email.trim(),
    owner_name: values.owner_name?.trim() || undefined,
    owner_password: values.owner_password || undefined,
    phone: values.phone || undefined,
    support_email: values.support_email || undefined,
    logo_url: values.logo_url || undefined,
    primary_color: values.primary_color || undefined,
    address: {
      line1: values.address_line1 || undefined,
      line2: values.address_line2 || undefined,
      city: values.address_city || undefined,
      state: values.address_state || undefined,
      postal_code: values.address_postal_code || undefined,
      country: values.address_country || 'IN',
    },
    branding: {
      logo_url: values.logo_url || undefined,
      primary_color: values.primary_color || undefined,
      map_url: values.map_url || undefined,
    },
    business: {
      business_name: businessName,
      business_email: businessEmail,
      business_phone: values.business_phone || values.phone || undefined,
      business_address: businessAddress || undefined,
      business_gstin: values.business_gstin || undefined,
      business_pan: values.business_pan || undefined,
      timezone: values.timezone,
      locale: values.locale,
    },
    invoice: {
      invoice_prefix: values.invoice_prefix,
      expense_prefix: values.expense_prefix,
      default_tax_rate: Number(values.default_tax_rate),
      tax_type: values.tax_type,
      enable_cgst_sgst: values.enable_cgst_sgst,
      currency_code: values.currency_code,
      currency_symbol: values.currency_symbol,
      default_due_days: Number(values.default_due_days),
      default_terms: values.default_terms || undefined,
      default_notes: values.default_notes || undefined,
    },
    feature_flags: {
      whatsapp: values.feature_whatsapp,
      livekit: values.feature_livekit,
      facescan: values.feature_facescan,
      online_consultation: values.feature_online_consultation,
      referrals: values.feature_referrals,
      public_catalog: values.feature_public_catalog,
      public_booking: values.feature_public_booking,
      booking_webhooks: values.feature_booking_webhooks,
    },
    seed_template: true,
  }
}

export default function NewOrganizationPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [createOrg, { isLoading }] = useCreateOrganizationMutation()
  const [switchOrg] = useSwitchOrganizationContextMutation()

  const form = useForm({
    resolver: zodResolver(organizationOnboardSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  const { control, handleSubmit, trigger, getValues, watch } = form
  const watched = watch()

  useEffect(() => {
    if (!watched.business_name && (watched.display_name || watched.name)) {
      form.setValue('business_name', watched.display_name || watched.name)
    }
  }, [watched.display_name, watched.name]) // eslint-disable-line react-hooks/exhaustive-deps

  const stepFields = useMemo(
    () => ({
      0: ['slug', 'name', 'owner_email'],
      1: [],
      2: [],
      3: [],
      4: [],
    }),
    []
  )

  const handleNext = async () => {
    setError('')
    const ok = await trigger(stepFields[step] || [])
    if (!ok) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const onSubmit = async (values) => {
    setError('')
    try {
      const payload = buildPayload(values)
      const res = await createOrg({
        ...payload,
        idempotencyKey: `onboard-${payload.slug}-${Date.now()}`,
      }).unwrap()
      setResult(res)
    } catch (err) {
      setError(
        err?.data?.error?.message ||
          err?.data?.detail?.error?.message ||
          (typeof err?.data?.detail === 'string' ? err.data.detail : null) ||
          'Failed to provision organization'
      )
    }
  }

  const handleEnterOrg = async () => {
    const orgId = result?.organization?.id
    if (!orgId) return
    try {
      const tokens = await switchOrg(orgId).unwrap()
      if (tokens?.access_token) {
        Cookies.set(config.tokenKey, tokens.access_token, { expires: 7 })
      }
      if (tokens?.refresh_token) {
        storeRefreshToken(tokens.refresh_token)
      }
      dispatch(setActiveOrganization(orgId))
      router.push(
        result?.onboarding_status === 'complete' ? '/' : '/onboarding'
      )
    } catch (err) {
      setError('Created, but could not switch organization context.')
    }
  }

  if (result?.organization) {
    const org = result.organization
    return (
      <FormPageLayout
        title="Organization created"
        cancelHref="/platform/organizations"
        breadcrumbs={[
          { label: 'Platform', href: '/platform/organizations' },
          { label: 'Onboard', href: '/platform/organizations/new' },
          { label: 'Success' },
        ]}
        maxWidth="md"
      >
        <FormCompactCard>
          <FormSectionCard title="Success" description="Share these credentials with the clinic owner.">
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-gray-500">Organization</span>
                <br />
                <strong>{org.display_name || org.name}</strong> ({org.slug})
              </p>
              <p>
                <span className="text-gray-500">Owner email</span>
                <br />
                <strong>{org.owner_email || getValues('owner_email')}</strong>
              </p>
              {result.owner_temporary_password ? (
                <p className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <span className="text-amber-800 text-xs uppercase tracking-wide">
                    Temporary password (shown once)
                  </span>
                  <br />
                  <code className="text-base font-semibold text-amber-950">
                    {result.owner_temporary_password}
                  </code>
                </p>
              ) : null}
              <p className="text-gray-500">
                Onboarding status: <strong>{result.onboarding_status}</strong>
              </p>
            </div>
            <FormActions inline className="mt-6 justify-between sm:justify-between">
              <LinkButton href="/platform/organizations" variant="light">
                Back to list
              </LinkButton>
              <Button onClick={handleEnterOrg}>Enter organization</Button>
            </FormActions>
          </FormSectionCard>
        </FormCompactCard>
      </FormPageLayout>
    )
  }

  return (
    <FormPageLayout
      title="Onboard organization"
      cancelHref="/platform/organizations"
      breadcrumbs={[
        { label: 'Platform', href: '/platform/organizations' },
        { label: 'Onboard organization' },
      ]}
      maxWidth="lg"
    >
      <nav className="flex flex-wrap gap-2 mb-4" aria-label="Onboarding steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => i <= step && setStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              i === step
                ? 'bg-primary-600 text-white border-primary-600'
                : i < step
                  ? 'bg-primary-50 text-primary-700 border-primary-100'
                  : 'bg-white text-gray-500 border-gray-200'
            }`}
            aria-current={i === step ? 'step' : undefined}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </nav>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormCompactCard>
          {error ? (
            <p className="text-sm text-red-600 mb-3" role="alert">
              {error}
            </p>
          ) : null}

          {step === 0 && (
            <FormSectionCard
              title="Identity"
              description="Clinic identity and owner account for admin access."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="slug" control={control} label="Slug" placeholder="acme-clinic" isRequired />
                <FormInput name="name" control={control} label="Legal name" isRequired />
                <FormInput name="display_name" control={control} label="Display name" />
                <FormInput name="phone" control={control} label="Phone" />
                <FormInput name="owner_email" control={control} label="Owner email" type="email" isRequired />
                <FormInput name="owner_name" control={control} label="Owner name" />
                <FormInput
                  name="owner_password"
                  control={control}
                  label="Owner password"
                  type="password"
                  description="Leave blank to auto-generate"
                />
                <FormInput name="support_email" control={control} label="Support email" type="email" />
                <FormInput name="address_line1" control={control} label="Address line 1" />
                <FormInput name="address_line2" control={control} label="Address line 2" />
                <FormInput name="address_city" control={control} label="City" />
                <FormInput name="address_state" control={control} label="State" />
                <FormInput name="address_postal_code" control={control} label="Postal code" />
                <FormInput name="address_country" control={control} label="Country" />
              </div>
            </FormSectionCard>
          )}

          {step === 1 && (
            <FormSectionCard title="Branding" description="Optional logo URL and accent color.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="logo_url" control={control} label="Logo URL" />
                <FormInput name="primary_color" control={control} label="Primary color" />
                <FormInput name="map_url" control={control} label="Map URL" className="md:col-span-2" />
              </div>
            </FormSectionCard>
          )}

          {step === 2 && (
            <FormSectionCard
              title="Business & tax"
              description="Used for invoices and clinic profile. India defaults applied."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="business_name" control={control} label="Business name" />
                <FormInput name="business_email" control={control} label="Business email" type="email" />
                <FormInput name="business_phone" control={control} label="Business phone" />
                <FormInput name="business_gstin" control={control} label="GSTIN" />
                <FormInput name="business_pan" control={control} label="PAN" />
                <FormInput name="timezone" control={control} label="Timezone" />
                <FormTextarea
                  name="business_address"
                  control={control}
                  label="Business address"
                  className="md:col-span-2"
                />
                <FormInput name="invoice_prefix" control={control} label="Invoice prefix" />
                <FormInput name="expense_prefix" control={control} label="Expense prefix" />
                <FormInput name="default_tax_rate" control={control} label="Default tax %" type="number" />
                <FormInput name="default_due_days" control={control} label="Due days" type="number" />
                <FormInput name="currency_code" control={control} label="Currency code" />
                <FormInput name="currency_symbol" control={control} label="Currency symbol" />
                <Controller
                  name="enable_cgst_sgst"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 md:col-span-2">
                      <div>
                        <p className="text-sm font-medium">Enable CGST / SGST split</p>
                        <p className="text-xs text-gray-500">Recommended for India GST invoices</p>
                      </div>
                      <Switch isSelected={field.value} onValueChange={field.onChange} />
                    </div>
                  )}
                />
                <FormTextarea name="default_terms" control={control} label="Default terms" className="md:col-span-2" />
              </div>
            </FormSectionCard>
          )}

          {step === 3 && (
            <FormSectionCard
              title="Features"
              description="Toggles use shared platform connections — no API keys needed."
            >
              <div className="space-y-3">
                {[
                  ['feature_whatsapp', 'WhatsApp', 'Uses platform WhatsApp Business connection'],
                  ['feature_livekit', 'Live video (LiveKit)', 'Online consultations'],
                  ['feature_facescan', 'Face scan', 'AI skin analysis'],
                  ['feature_online_consultation', 'Online consultation booking', 'Patient booking mode'],
                  ['feature_referrals', 'Referrals & coins', 'Loyalty program'],
                  ['feature_public_catalog', 'Public catalog API', 'Services & categories via API key'],
                  ['feature_public_booking', 'Public booking API', 'Create appointments via API key'],
                  ['feature_booking_webhooks', 'Booking webhooks', 'Outbound appointment event webhooks'],
                ].map(([name, label, hint]) => (
                  <Controller
                    key={name}
                    name={name}
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-gray-500">{hint}</p>
                        </div>
                        <Switch isSelected={field.value} onValueChange={field.onChange} />
                      </div>
                    )}
                  />
                ))}
              </div>
            </FormSectionCard>
          )}

          {step === 4 && (
            <FormSectionCard title="Review" description="Confirm details before provisioning.">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Slug</dt>
                  <dd className="font-medium">{watched.slug}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Name</dt>
                  <dd className="font-medium">{watched.display_name || watched.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Owner</dt>
                  <dd className="font-medium">{watched.owner_email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Business</dt>
                  <dd className="font-medium">
                    {watched.business_name || watched.display_name || watched.name}
                  </dd>
                </div>
              </dl>
            </FormSectionCard>
          )}

          <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-gray-100">
            <HeroButton variant="light" type="button" onPress={handleBack} isDisabled={step === 0}>
              Back
            </HeroButton>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit" isLoading={isLoading}>
                Create organization
              </Button>
            )}
          </div>
        </FormCompactCard>
      </form>
    </FormPageLayout>
  )
}
