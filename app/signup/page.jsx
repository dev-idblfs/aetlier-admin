'use client'

/**
 * Public self-serve organization signup (outside dashboard layout).
 */

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Checkbox, Spinner } from '@heroui/react'
import { FormInput } from '@/components/ui/FormFields'
import { FormErrorSummary } from '@/components/ui'
import { organizationSelfSignupSchema } from '@/lib/validation'
import { organizationSignup } from '@/redux/slices/authSlice'
import { canAccessAdminPortal } from '@/utils/permissions'

export const dynamic = 'force-dynamic'

function SignupForm() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { error } = useSelector((s) => s.auth)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const { control, handleSubmit, trigger, getValues, watch } = useForm({
    resolver: zodResolver(organizationSelfSignupSchema),
    defaultValues: {
      slug: '',
      name: '',
      display_name: '',
      owner_email: '',
      owner_name: '',
      owner_password: '',
      phone: '',
      accept_terms: false,
    },
    mode: 'onBlur',
  })

  const [step, setStep] = useState(0)
  const name = watch('name')

  const handleNext = async () => {
    setFormError('')
    const ok = await trigger(['slug', 'name', 'owner_email', 'owner_password'])
    if (!ok) return
    const values = getValues()
    if (!values.display_name && values.name) {
      // display_name filled on submit from name if empty
    }
    setStep(1)
  }

  const onSubmit = async (values) => {
    if (submitting) return
    setSubmitting(true)
    setFormError('')
    try {
      const res = await dispatch(
        organizationSignup({
          slug: values.slug.trim(),
          name: values.name.trim(),
          display_name: values.display_name?.trim() || values.name.trim(),
          owner_email: values.owner_email.trim(),
          owner_name: values.owner_name?.trim() || undefined,
          owner_password: values.owner_password,
          phone: values.phone || undefined,
          accept_terms: true,
        })
      ).unwrap()

      if (!canAccessAdminPortal(res?.user)) {
        setFormError(
          'Account created but admin portal access is missing. Contact support.'
        )
        return
      }

      const status = res?.onboarding_status
      router.replace(status === 'complete' ? '/' : '/onboarding')
    } catch (err) {
      setFormError(typeof err === 'string' ? err : 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your clinic</h1>
          <p className="mt-1 text-sm text-gray-500">
            Start with core clinic tools. Platform integrations can be enabled later.
          </p>
        </div>

        {(formError || error) && (
          <FormErrorSummary error={formError || error} className="mb-4" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 0 && (
            <>
              <FormInput
                name="slug"
                control={control}
                label="Clinic slug"
                placeholder="acme-clinic"
                description="URL-safe id, e.g. acme-clinic"
                isRequired
              />
              <FormInput
                name="name"
                control={control}
                label="Clinic name"
                isRequired
              />
              <FormInput
                name="display_name"
                control={control}
                label="Display name"
                placeholder={name || 'Shown in admin'}
              />
              <FormInput
                name="owner_email"
                control={control}
                label="Your email"
                type="email"
                isRequired
              />
              <FormInput
                name="owner_password"
                control={control}
                label="Password"
                type="password"
                isRequired
              />
              <Button
                type="button"
                color="primary"
                className="w-full"
                onPress={handleNext}
              >
                Continue
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <FormInput name="owner_name" control={control} label="Your name" />
              <FormInput name="phone" control={control} label="Phone" />
              <Controller
                name="accept_terms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    isSelected={field.value}
                    onValueChange={field.onChange}
                  >
                    I accept the terms of service
                  </Checkbox>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="light"
                  className="flex-1"
                  onPress={() => setStep(0)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  className="flex-1"
                  isLoading={submitting}
                >
                  Create organization
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
