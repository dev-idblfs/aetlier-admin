'use client';

import { FormProvider } from 'react-hook-form';

export const DEFAULT_FORM_OPTIONS = {
  mode: 'onTouched',
  reValidateMode: 'onChange',
};

export function Form({ methods, onSubmit, children, className = '' }) {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className={className} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}

/**
 * Non-field server / form-level error banner (use only for errors without a field).
 */
export function FormErrorSummary({ error, className = '' }) {
  if (!error) return null;

  const message =
    typeof error === 'string' ? error : error?.message || error?.root?.message;

  if (!message) return null;

  return (
    <p
      className={`rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
      role="alert"
    >
      {message}
    </p>
  );
}
