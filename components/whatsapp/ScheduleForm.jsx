'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { Button } from '@/lib/heroui';
import { Form, FormInput, FormErrorSummary } from '@/components/ui';
import { whatsappScheduleSchema } from '@/lib/validation/whatsapp';

export default function ScheduleForm({ campaign, onSave, onClose }) {
  const methods = useForm({ resolver: zodResolver(whatsappScheduleSchema), defaultValues: { scheduled_at: '' } });
  const submit = async (values) => {
    try { await onSave({ scheduled_at: new Date(values.scheduled_at).toISOString() }); onClose(); }
    catch (e) { methods.setError('root', { message: getApiErrorMessage(e, 'Could not schedule campaign') }); }
  };
  return <Form methods={methods} onSubmit={submit} className="space-y-4">
    <FormErrorSummary error={methods.formState.errors.root?.message} />
    <p className="text-sm">Schedule <strong>{campaign.name}</strong> using this device’s local time. Eligible recipients are selected when you schedule; consent is checked again before sending.</p>
    <FormInput name="scheduled_at" label="Send date and time" type="datetime-local" />
    <Button color="primary" type="submit" isLoading={methods.formState.isSubmitting}>Schedule campaign</Button>
  </Form>;
}
