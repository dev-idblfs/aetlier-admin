'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Button } from '@heroui/react';
import { signIn } from '@/redux/slices/authSlice';

export default function AdminSignIn({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const { error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || submitting) return;

    setSubmitting(true);
    try {
      const res = await dispatch(
        signIn({ email: form.email, password: form.password })
      ).unwrap();
      await onSuccess?.(res);
    } catch {
      // error surfaced via slice
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <Input
        name="email"
        label="Email"
        type="email"
        variant="bordered"
        value={form.email}
        onChange={onChange}
        required
        autoComplete="email"
      />
      <Input
        name="password"
        label="Password"
        type="password"
        variant="bordered"
        value={form.password}
        onChange={onChange}
        required
        autoComplete="current-password"
      />
      <Button type="submit" color="primary" isLoading={submitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
