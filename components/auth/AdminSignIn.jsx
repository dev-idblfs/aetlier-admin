'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@heroui/react';
import { signIn } from '@/redux/slices/authSlice';
import { Form, FormErrorSummary, FormInput, DEFAULT_FORM_OPTIONS } from '@/components/ui';
import { loginSchema } from '@/lib/validation';

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
      <Button type="submit" color="primary" isLoading={submitting} className="w-full">
        Sign in
      </Button>
    </Form>
  );
}
