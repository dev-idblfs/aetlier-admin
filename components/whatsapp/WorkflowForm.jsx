'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { Button, SelectItem } from '@/lib/heroui';
import { Form, FormErrorSummary, FormInput, FormSelect } from '@/components/ui';
import { whatsappWorkflowSchema, blankMessage, messageToForm } from '@/lib/validation/whatsapp';
import MessageFields from './MessageFields';

export default function WorkflowForm({ workflow, templates, onSave, onClose }) {
  const methods = useForm({
    resolver: zodResolver(whatsappWorkflowSchema),
    defaultValues: workflow ? { ...workflow, steps: workflow.steps.map(messageToForm) } : {
      name: '15-day lead follow-up', kind: 'lead', steps: [0, 24, 72, 168, 240, 360].map(blankMessage),
    },
  });
  const { fields, append, remove, replace } = useFieldArray({ control: methods.control, name: 'steps' });
  const submit = async (values) => {
    try { await onSave(values); onClose(); }
    catch (error) { methods.setError('root', { message: getApiErrorMessage(error, 'Could not save workflow') }); }
  };
  const reviewDefaults = () => {
    methods.setValue('kind', 'review');
    methods.setValue('name', 'Post-appointment review request');
    replace([blankMessage(2), blankMessage(72)]);
  };

  return (
    <Form methods={methods} onSubmit={submit} className="space-y-5">
      <FormErrorSummary error={methods.formState.errors.root?.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput name="name" label="Workflow name" />
        <FormSelect name="kind" label="Trigger" isDisabled={Boolean(workflow)}>
          <SelectItem key="lead">New lead</SelectItem><SelectItem key="review">Appointment completed</SelectItem>
        </FormSelect>
      </div>
      {!workflow && <Button variant="flat" size="sm" onPress={reviewDefaults}>Use review-request defaults</Button>}
      <p className="text-sm text-gray-600">New workflows start paused. Activate after choosing approved templates. Only eligible records created or completed after first activation are enrolled.</p>
      {fields.map((field, index) => (
        <section key={field.id} className="rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Message {index + 1}</h3>
            <Button variant="light" color="danger" size="sm" isDisabled={fields.length === 1} onPress={() => remove(index)}>Remove message {index + 1}</Button>
          </div>
          <MessageFields prefix={`steps.${index}`} templates={templates} showDelay />
        </section>
      ))}
      {methods.formState.errors.steps?.message && <p role="alert" className="text-sm text-danger">{methods.formState.errors.steps.message}</p>}
      <Button variant="flat" isDisabled={fields.length >= 8} onPress={() => append(blankMessage())}>Add message</Button>
      <div className="flex justify-end gap-2">
        <Button variant="flat" onPress={onClose}>Cancel</Button>
        <Button color="primary" type="submit" isLoading={methods.formState.isSubmitting}>Save paused workflow</Button>
      </div>
    </Form>
  );
}
