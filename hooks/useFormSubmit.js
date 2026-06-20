'use client';

import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  applyServerErrors,
  getApiErrorMessage,
  parseApiValidationErrors,
} from '@/lib/apiErrors';

/**
 * Wrap async form submit with consistent server error mapping.
 *
 * @param {import('react-hook-form').UseFormReturn} methods
 * @param {object} options
 * @param {(values: object) => Promise<unknown>} options.onSubmit
 * @param {string} [options.fallbackMessage]
 * @param {(result: unknown) => void} [options.onSuccess]
 */
export function useFormSubmit(methods, { onSubmit, fallbackMessage, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (values) => {
      setIsSubmitting(true);
      try {
        const result = await onSubmit(values);
        onSuccess?.(result);
        return result;
      } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const data = error?.data ?? error?.response?.data;

        if (status === 422) {
          const { fieldErrors, formError } = parseApiValidationErrors(data);
          applyServerErrors(methods, fieldErrors);
          if (formError) {
            methods.setError('root', { type: 'server', message: formError });
          }
          if (!Object.keys(fieldErrors).length && formError) {
            toast.error(formError);
          }
        } else {
          toast.error(getApiErrorMessage(error, fallbackMessage));
        }
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [methods, onSubmit, onSuccess, fallbackMessage]
  );

  return { handleSubmit, isSubmitting };
}
