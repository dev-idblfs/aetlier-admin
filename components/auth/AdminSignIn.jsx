'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Divider } from '@heroui/react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import { signIn, googleLogin } from '@/redux/slices/authSlice';
import { Form, FormErrorSummary, FormInput, DEFAULT_FORM_OPTIONS } from '@/components/ui';
import { loginSchema } from '@/lib/validation';
import config from '@/config';

const googleClientId = config.googleClientId;

export default function AdminSignIn({ onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const { error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const methods = useForm({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await dispatch(
        signIn({ email: values.email, password: values.password })
      ).unwrap();
      await onSuccess?.(res);
    } catch {
      // error surfaced via slice
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await dispatch(
        googleLogin({ credential: credentialResponse.credential })
      ).unwrap();
      toast.success('Signed in with Google');
      await onSuccess?.(res);
    } catch (err) {
      toast.error(
        typeof err === 'string' ? err : err?.message || 'Google sign-in failed'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form methods={methods} onSubmit={onSubmit} className="space-y-4">
      {(error || methods.formState.errors.root?.message) && (
        <FormErrorSummary error={error || methods.formState.errors.root?.message} />
      )}
      <FormInput
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
      />
      <FormInput
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
      />
      <div className="flex justify-end">
        <a
          href={`${config.frontendUrl.replace(/\/$/, '')}/forgot-password`}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Forgot password?
        </a>
      </div>
      <Button type="submit" color="primary" isLoading={submitting} className="w-full">
        Sign in
      </Button>

      {googleClientId ? (
        <>
          <div className="relative my-2">
            <Divider />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-500">
              or
            </span>
          </div>
          <div className="flex flex-col items-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in was cancelled')}
              text="signin_with"
              shape="rectangular"
              width="320"
            />
          </div>
        </>
      ) : null}
    </Form>
  );
}
