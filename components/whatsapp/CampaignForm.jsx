'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { Button, SelectItem } from '@/lib/heroui';
import { Form, FormErrorSummary, FormInput, FormSelect } from '@/components/ui';
import { whatsappCampaignSchema, blankMessage, messageToForm } from '@/lib/validation/whatsapp';
import { useMutateWhatsAppWorkspaceMutation } from '@/redux/services/api';
import MessageFields from './MessageFields';

export default function CampaignForm({ campaign, templates, onSave, onClose }) {
  const [preview, setPreview] = useState(null);
  const [mutate, { isLoading: previewing }] = useMutateWhatsAppWorkspaceMutation();
  const methods = useForm({ resolver: zodResolver(whatsappCampaignSchema), defaultValues: campaign ? {
    ...campaign, message: messageToForm(campaign.message),
  } : { name: '', audience: { kind: 'leads', lead_statuses: ['NEW', 'CONTACTED', 'QUALIFIED'] }, message: blankMessage() } });
  const submit = async (values) => {
    try { await onSave(values); onClose(); }
    catch (error) { methods.setError('root', { message: getApiErrorMessage(error, 'Could not save campaign') }); }
  };
  const previewAudience = async () => {
    try { setPreview(await mutate({ resource: 'audience-previews', body: methods.getValues('audience') }).unwrap()); }
    catch (error) { methods.setError('root', { message: getApiErrorMessage(error, 'Could not preview audience') }); }
  };

  return (
    <Form methods={methods} onSubmit={submit} className="space-y-5">
      <FormErrorSummary error={methods.formState.errors.root?.message} />
      <FormInput name="name" label="Campaign name" />
      <FormSelect name="audience.kind" label="Audience">
        <SelectItem key="leads">Active leads</SelectItem><SelectItem key="patients">Patients</SelectItem>
      </FormSelect>
      <FormSelect name="audience.lead_statuses" label="Lead statuses" selectionMode="multiple">
        {['NEW', 'CONTACTED', 'QUALIFIED'].map((status) => <SelectItem key={status}>{status}</SelectItem>)}
      </FormSelect>
      <p className="text-sm text-gray-600">Recipients need a verified phone and explicit WhatsApp marketing consent. Paused, opted-out, inactive, and deleted contacts are excluded. Duplicate phones receive one message.</p>
      <Button variant="flat" onPress={previewAudience} isLoading={previewing}>Preview audience</Button>
      {preview && <p role="status" className="text-sm">{preview.eligible} eligible of {preview.matched} contacts; {preview.excluded} excluded. Eligibility is checked again at send time.</p>}
      <MessageFields prefix="message" templates={templates} />
      <div className="flex justify-end gap-2">
        <Button variant="flat" onPress={onClose}>Cancel</Button>
        <Button color="primary" type="submit" isLoading={methods.formState.isSubmitting}>Save draft</Button>
      </div>
    </Form>
  );
}
