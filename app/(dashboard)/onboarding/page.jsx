'use client'

/**
 * First-login organization setup wizard for client admins.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Switch } from '@heroui/react'
import {
  FormPageLayout,
  FormCompactCard,
  FormSectionCard,
  Button,
} from '@/components/ui'
import { FormInput, FormTextarea } from '@/components/ui/FormFields'
import { organizationSetupSchema } from '@/lib/validation'
import {
  useGetOrganizationOnboardingQuery,
  useUpdateOrganizationOnboardingMutation,
  useUploadOrganizationLogoMutation,
} from '@/redux/services/api'

const STEPS = [
  { id: 'profile', label: 'Clinic profile' },
  { id: 'invoice', label: 'Tax & invoices' },
  { id: 'team', label: 'Invite team' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, activeOrganizationId, organizations } = useSelector((s) => s.auth)
  const orgId =
    activeOrganizationId ||
    user?.organization_id ||
    organizations?.[0]?.id ||
    null

  const { data, isLoading } = useGetOrganizationOnboardingQuery(orgId, {
    skip: !orgId,
  })
  const [updateOnboarding, { isLoading: isSaving }] =
    useUpdateOrganizationOnboardingMutation()
  const [uploadLogo, { isLoading: isUploading }] =
    useUploadOrganizationLogoMutation()

  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  const org = data?.organization
  const defaults = useMemo(
    () => ({
      display_name: org?.display_name || org?.name || '',
      phone: org?.phone || '',
      support_email: org?.support_email || '',
      primary_color: org?.primary_color || '#6B4EFF',
      logo_url: org?.logo_url || '',
      business_name: '',
      business_email: org?.owner_email || user?.email || '',
      business_phone: org?.phone || '',
      business_address: '',
      business_gstin: '',
      business_pan: '',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      invoice_prefix: 'INV',
      default_tax_rate: 18,
      enable_cgst_sgst: true,
      invite_email: '',
    }),
    [org, user?.email]
  )

  const form = useForm({
    resolver: zodResolver(organizationSetupSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  const { control, reset, trigger, getValues } = form

  useEffect(() => {
    if (org) reset(defaults)
  }, [org?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data?.onboarding_status === 'complete') {
      router.replace('/')
    }
  }, [data?.onboarding_status, router])

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !orgId) return
    setError('')
    try {
      const res = await uploadLogo({ id: orgId, file }).unwrap()
      if (res?.logo_url) {
        form.setValue('logo_url', res.logo_url)
      }
    } catch (err) {
      setError('Logo upload failed. You can continue and add it later in Settings.')
    }
  }

  const saveStep = async (markComplete = false) => {
    setError('')
    const values = getValues()
    try {
      await updateOnboarding({
        id: orgId,
        step: STEPS[step]?.id,
        status: markComplete ? 'complete' : 'in_progress',
        display_name: values.display_name,
        phone: values.phone || undefined,
        support_email: values.support_email || undefined,
        primary_color: values.primary_color || undefined,
        logo_url: values.logo_url || undefined,
        branding: {
          logo_url: values.logo_url || undefined,
          primary_color: values.primary_color || undefined,
        },
        business: {
          business_name: values.business_name,
          business_email: values.business_email,
          business_phone: values.business_phone || undefined,
          business_address: values.business_address,
          business_gstin: values.business_gstin || undefined,
          business_pan: values.business_pan || undefined,
          timezone: values.timezone,
          locale: values.locale,
        },
        invoice: {
          invoice_prefix: values.invoice_prefix,
          default_tax_rate: Number(values.default_tax_rate),
          enable_cgst_sgst: values.enable_cgst_sgst,
        },
        invite_email: values.invite_email || undefined,
      }).unwrap()
      if (markComplete) {
        router.replace('/')
      }
    } catch (err) {
      setError(
        err?.data?.error?.message ||
          err?.data?.detail?.error?.message ||
          'Could not save onboarding progress'
      )
    }
  }

  const handleNext = async () => {
    if (step === 0) {
      const ok = await trigger(['display_name'])
      if (!ok) return
      await saveStep(false)
      setStep(1)
      return
    }
    if (step === 1) {
      const ok = await trigger([
        'business_name',
        'business_email',
        'business_address',
      ])
      if (!ok) return
      await saveStep(false)
      setStep(2)
      return
    }
    await saveStep(true)
  }

  if (!orgId) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">No active organization found.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">Loading setup…</div>
    )
  }

  return (
    <FormPageLayout
      title="Finish clinic setup"
      breadcrumbs={[{ label: 'Onboarding' }]}
      maxWidth="lg"
    >
      <nav className="flex flex-wrap gap-2 mb-4" aria-label="Setup steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => i <= step && setStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
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

      {data?.missing_fields?.length ? (
        <p className="text-xs text-amber-700 mb-3">
          Still needed: {data.missing_fields.join(', ')}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleNext()
        }}
      >
        <FormCompactCard>
          {error ? (
            <p className="text-sm text-red-600 mb-3" role="alert">
              {error}
            </p>
          ) : null}

          {step === 0 && (
            <FormSectionCard
              title="Confirm clinic profile"
              description="Pre-filled from provisioning — adjust as needed."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="display_name" control={control} label="Display name" isRequired />
                <FormInput name="phone" control={control} label="Phone" />
                <FormInput name="support_email" control={control} label="Support email" type="email" />
                <FormInput name="primary_color" control={control} label="Primary color" />
                <FormInput name="logo_url" control={control} label="Logo URL" className="md:col-span-2" />
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Upload logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="mt-1 block w-full text-sm"
                    aria-label="Upload organization logo"
                  />
                  {isUploading ? (
                    <p className="text-xs text-gray-500 mt-1">Uploading…</p>
                  ) : null}
                </div>
              </div>
            </FormSectionCard>
          )}

          {step === 1 && (
            <FormSectionCard
              title="Tax & invoice preferences"
              description="These power invoices for your clinic."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="business_name" control={control} label="Business name" isRequired />
                <FormInput name="business_email" control={control} label="Business email" type="email" isRequired />
                <FormInput name="business_phone" control={control} label="Business phone" />
                <FormInput name="business_gstin" control={control} label="GSTIN" />
                <FormInput name="business_pan" control={control} label="PAN" />
                <FormInput name="invoice_prefix" control={control} label="Invoice prefix" />
                <FormInput name="default_tax_rate" control={control} label="Default tax %" type="number" />
                <FormTextarea
                  name="business_address"
                  control={control}
                  label="Business address"
                  className="md:col-span-2"
                  isRequired
                />
                <Controller
                  name="enable_cgst_sgst"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 md:col-span-2">
                      <div>
                        <p className="text-sm font-medium">Enable CGST / SGST</p>
                        <p className="text-xs text-gray-500">India GST split</p>
                      </div>
                      <Switch isSelected={field.value} onValueChange={field.onChange} />
                    </div>
                  )}
                />
              </div>
            </FormSectionCard>
          )}

          {step === 2 && (
            <FormSectionCard
              title="Invite a teammate"
              description="Optional — invite an existing admin user by email."
            >
              <FormInput
                name="invite_email"
                control={control}
                label="Staff email"
                type="email"
                description="User must already have an account"
              />
            </FormSectionCard>
          )}

          <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              isDisabled={step === 0}
            >
              Back
            </Button>
            <div className="flex gap-2">
              {step === STEPS.length - 1 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => saveStep(true)}
                    isLoading={isSaving}
                  >
                    Skip invite & finish
                  </Button>
                  <Button type="submit" isLoading={isSaving}>
                    Finish setup
                  </Button>
                </>
              ) : (
                <Button type="submit" isLoading={isSaving}>
                  Continue
                </Button>
              )}
            </div>
          </div>
        </FormCompactCard>
      </form>
    </FormPageLayout>
  )
}
