'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { Button } from '@/lib/heroui';
import { Form, FormTextarea, FormErrorSummary } from '@/components/ui';
import { useGetWhatsAppWorkspaceQuery, useMutateWhatsAppWorkspaceMutation } from '@/redux/services/api';
import { whatsappReplySchema } from '@/lib/validation/whatsapp';

export default function ConversationPanel({ conversation, canReply }) {
  const { data, error, isLoading } = useGetWhatsAppWorkspaceQuery({ resource: `conversations/${conversation.id}` });
  const [mutate] = useMutateWhatsAppWorkspaceMutation();
  const methods = useForm({ resolver: zodResolver(whatsappReplySchema), defaultValues: { text: '' } });
  const items = [...(data?.events || []), ...(data?.messages || []).map((m) => ({ ...m, direction: 'outbound' }))]
    .sort((a, b) => a.at.localeCompare(b.at));
  const submit = async (body) => {
    try { await mutate({ resource: `conversations/${conversation.id}/messages`, body }).unwrap(); methods.reset(); }
    catch (e) { methods.setError('root', { message: getApiErrorMessage(e, 'Reply was not confirmed. Check delivery before retrying.') }); }
  };
  return (
    <div className="space-y-4">
      {isLoading && <p role="status">Loading conversation…</p>}
      {error && <p role="alert">Could not load this conversation.</p>}
      <p className="text-sm text-gray-600">Replies are available within 24 hours of the contact’s last incoming message. Replying keeps automation paused for staff takeover.</p>
      <ol className="space-y-3 max-h-96 overflow-y-auto" aria-label="Recent messages">
        {items.map((item) => <li key={item.id} className={`rounded-xl border p-3 ${item.direction === 'outbound' ? 'bg-primary-50 border-primary-100' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-xs text-gray-600 mb-1">{item.direction === 'outbound' ? 'Business' : 'Contact'} · {new Date(`${item.at}Z`).toLocaleString()} {item.status ? `· ${item.status}` : ''}</p>
          <p className="text-sm whitespace-pre-wrap break-words">{item.text}</p>
        </li>)}
      </ol>
      {canReply && <Form methods={methods} onSubmit={submit} className="space-y-3">
        <FormErrorSummary error={methods.formState.errors.root?.message} />
        <FormTextarea name="text" label="Reply" minRows={3} />
        <Button type="submit" color="primary" isLoading={methods.formState.isSubmitting}>Send reply</Button>
      </Form>}
    </div>
  );
}
