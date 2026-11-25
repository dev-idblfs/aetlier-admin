'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Button, Tabs, Tab, Chip, Select, SelectItem } from '@/lib/heroui';
import { ListPageLayout, DataTable, FormModal, ConfirmModal, StatsCard } from '@/components/ui';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useGetWhatsAppWorkspaceQuery, useMutateWhatsAppWorkspaceMutation } from '@/redux/services/api';
import WorkflowForm from '@/components/whatsapp/WorkflowForm';
import CampaignForm from '@/components/whatsapp/CampaignForm';
import ConnectionPanel from '@/components/whatsapp/ConnectionPanel';
import ConversationPanel from '@/components/whatsapp/ConversationPanel';
import ScheduleForm from '@/components/whatsapp/ScheduleForm';

const dateTime = (value) => value ? new Date(`${value}Z`).toLocaleString() : '—';
const badge = (value) => <Chip size="sm" variant="flat">{value}</Chip>;
const SECTIONS = { overview: 'Overview', workflows: 'Automations', campaigns: 'Campaigns', jobs: 'Delivery history',
  enrollments: 'Enrollments', conversations: 'Conversations', templates: 'Templates', coexistence: 'Connection' };

export default function WhatsAppPage() {
  const user = useSelector((state) => state.auth.user);
  const can = (permission) => hasPermission(user, permission);
  const canView = can(PERMISSIONS.WHATSAPP_READ);
  const canEditWorkflow = can(PERMISSIONS.WHATSAPP_AUTOMATION_UPDATE);
  const canActivate = can(PERMISSIONS.WHATSAPP_AUTOMATION_ACTIVATE);
  const canEditCampaign = can(PERMISSIONS.WHATSAPP_CAMPAIGN_UPDATE);
  const canSend = can(PERMISSIONS.WHATSAPP_CAMPAIGN_SEND);
  const canReadConversations = can(PERMISSIONS.WHATSAPP_CONVERSATION_READ);
  const canReply = can(PERMISSIONS.WHATSAPP_CONVERSATION_REPLY);
  const canReadConnection = can(PERMISSIONS.INTEGRATIONS_WHATSAPP_READ);
  const [section, setSection] = useState('overview');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [mutate, { isLoading: saving }] = useMutateWhatsAppWorkspaceMutation();
  const { currentData: data, isFetching, error, refetch } = useGetWhatsAppWorkspaceQuery({
    resource: section, page, page_size: 25, ...(section === 'jobs' && status ? { status } : {}),
  }, { skip: !canView || section === 'coexistence' || section === 'templates' || (section === 'conversations' && !canReadConversations) });
  const templatesQuery = useGetWhatsAppWorkspaceQuery({ resource: 'templates' }, {
    skip: !canView || !['workflows', 'campaigns', 'templates'].includes(section),
  });
  const templates = templatesQuery.data?.items || [];
  const tabs = Object.entries(SECTIONS).filter(([key]) => (key !== 'conversations' || canReadConversations) && (key !== 'coexistence' || canReadConnection));

  const action = async (request) => {
    await mutate(request).unwrap();
    toast.success('WhatsApp changes saved');
  };
  const confirm = (title, message, request) => setConfirmation({ title, message, request });
  const confirmAction = async () => {
    try { await action(confirmation.request); setConfirmation(null); }
    catch (e) { toast.error(getApiErrorMessage(e, 'Could not complete this action')); }
  };

  const workflowActions = (row) => [
    ...(canEditWorkflow && !row.enabled ? [{ key: 'edit', label: 'Edit workflow', onClick: () => setModal({ type: 'workflow', row }) }] : []),
    ...(canActivate ? [{ key: 'activate', label: row.enabled ? 'Pause workflow' : 'Activate workflow', onClick: () => confirm(
      row.enabled ? 'Pause workflow' : 'Activate workflow',
      row.enabled ? 'Pending messages will wait while this workflow is paused.' : 'Eligible new leads or completed appointments will automatically enter this workflow. Existing enrolled contacts resume their saved message steps.',
      { resource: `workflows/${row.id}/activation`, method: 'PATCH', body: { enabled: !row.enabled } },
    ) }] : []),
  ];
  const campaignActions = (row) => [
    ...(canEditCampaign && row.status === 'draft' ? [{ key: 'edit', label: 'Edit draft', onClick: () => setModal({ type: 'campaign', row }) }] : []),
    ...(canSend && row.status === 'draft' ? [{ key: 'schedule', label: 'Schedule campaign', onClick: () => setModal({ type: 'schedule', row }) }] : []),
    ...(canSend && ['scheduled', 'paused'].includes(row.status) ? [{ key: 'pause', label: row.status === 'paused' ? 'Resume' : 'Pause', onClick: () => confirm(
      row.status === 'paused' ? 'Resume campaign' : 'Pause campaign', 'This changes delivery of pending messages; messages already submitted to WhatsApp cannot be recalled.',
      { resource: `campaigns/${row.id}/${row.status === 'paused' ? 'resume' : 'pause'}` },
    ) }] : []),
    ...(canSend && ['draft', 'scheduled', 'paused'].includes(row.status) ? [{ key: 'cancel', label: 'Cancel campaign', color: 'danger', onClick: () => confirm(
      'Cancel campaign', 'Cancel all pending deliveries for this campaign. Messages already submitted cannot be recalled.',
      { resource: `campaigns/${row.id}/cancel` },
    ) }] : []),
  ];

  const columns = {
    workflows: [
      { key: 'name', label: 'Workflow' }, { key: 'kind', label: 'Trigger', render: (r) => r.kind === 'lead' ? 'New lead' : 'Appointment completed' },
      { key: 'steps', label: 'Sequence', render: (r) => r.steps.map((s) => `${s.delay_hours}h`).join(' → ') },
      { key: 'enabled', label: 'Status', render: (r) => badge(r.enabled ? 'Active' : 'Paused') },
    ],
    campaigns: [{ key: 'name', label: 'Campaign' }, { key: 'audience', label: 'Audience', render: (r) => r.audience.kind },
      { key: 'status', label: 'Status', render: (r) => badge(r.status) }, { key: 'scheduled_at', label: 'Scheduled for', render: (r) => dateTime(r.scheduled_at) }],
    jobs: [{ key: 'template', label: 'Template', render: (r) => r.payload.template_name },
      { key: 'user_id', label: 'Contact', render: (r) => <Link className="text-primary-600 underline" href={`/users/${r.user_id}/edit`}>View contact</Link> },
      { key: 'status', label: 'Status', render: (r) => badge(r.status) }, { key: 'due_at', label: 'Scheduled', render: (r) => dateTime(r.due_at) },
      { key: 'attempts', label: 'Attempts' }, { key: 'error', label: 'Delivery note' }],
    enrollments: [{ key: 'subject_id', label: 'Record', render: (r) => r.subject_id }, { key: 'status', label: 'Status', render: (r) => badge(r.status) },
      { key: 'created_at', label: 'Enrolled', render: (r) => dateTime(r.created_at) }, { key: 'reason', label: 'Stop reason' }],
    conversations: [{ key: 'phone', label: 'Contact phone' }, { key: 'paused', label: 'Automation', render: (r) => badge(r.opted_out ? 'Opted out' : r.paused ? 'Paused for staff' : 'Available') },
      { key: 'last_inbound_at', label: 'Last reply', render: (r) => dateTime(r.last_inbound_at) }],
  };
  const conversationActions = (row) => [
    { key: 'view', label: 'Open conversation', onClick: () => setModal({ type: 'conversation', row }) },
    ...(canReply && !row.opted_out ? [{ key: 'pause', label: row.paused ? 'Resume automation' : 'Pause automation', onClick: () => confirm(
      row.paused ? 'Resume automation' : 'Pause automation', 'This controls pending campaign and workflow messages for this contact.',
      { resource: `conversations/${row.id}`, method: 'PATCH', body: { paused: !row.paused } },
    ) }] : []),
  ];
  const close = () => setModal(null);

  if (!canView) return <ListPageLayout title="WhatsApp"><p>You do not have permission to view WhatsApp automation.</p></ListPageLayout>;

  return <ListPageLayout title="WhatsApp" description="Automated follow-ups, review requests, and campaigns" showDescription breadcrumbs={[{ label: 'WhatsApp' }]}>
    <Tabs aria-label="WhatsApp sections" selectedKey={section} onSelectionChange={(key) => { setSection(key); setPage(1); setStatus(''); }}>
      {tabs.map(([key, label]) => <Tab key={key} title={label} />)}
    </Tabs>
    {error && section !== 'coexistence' && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Could not load WhatsApp data. <Button size="sm" variant="light" onPress={refetch}>Retry</Button></div>}
    {section === 'overview' && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Active workflows" value={data?.active_workflows ?? '—'} />
        <StatsCard title="Queued messages" value={data?.jobs?.pending ?? 0} />
        <StatsCard title="Delivered or read" value={(data?.jobs?.delivered || 0) + (data?.jobs?.read || 0)} />
        <StatsCard title="Needs attention" value={(data?.jobs?.failed || 0) + (data?.jobs?.unknown || 0)} />
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold">Appointment reminders are already automatic</h2>
        <p className="text-sm text-gray-600">The existing reminder service handles 24-hour and 2-hour reminders, plus 15-minute online consultation reminders. It continues to use existing notification preferences.</p>
        <p className="text-sm text-gray-600">Lead and review workflows use approved templates and explicit marketing consent. Each phone receives at most one proactive automation message per 24 hours. Replies pause automation for staff takeover.</p>
        <p className="text-sm text-gray-600">Unknown deliveries are held for reconciliation to prevent duplicate messages. Review-link clicks do not prove a Google review was submitted.</p>
      </section>
    </>}
    {['workflows', 'campaigns'].includes(section) && <div className="flex items-center justify-between gap-3 flex-wrap">
      <p className="text-sm text-gray-600">{section === 'workflows' ? 'Activate a saved sequence to enroll new eligible records automatically.' : 'Create a draft, preview its audience, then schedule delivery.'}</p>
      {(section === 'workflows' ? canEditWorkflow : canEditCampaign) && <Button color="primary" onPress={() => setModal({ type: section === 'workflows' ? 'workflow' : 'campaign' })}>
        {section === 'workflows' ? 'New automation' : 'New campaign'}
      </Button>}
    </div>}
    {templatesQuery.error && ['workflows', 'campaigns', 'templates'].includes(section) && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm">Approved templates could not be loaded. Configure and enable the connection, then <Button size="sm" variant="light" onPress={templatesQuery.refetch}>Retry templates</Button>.</p>}
    {section === 'jobs' && <div className="max-w-xs"><Select label="Delivery status" selectedKeys={status ? new Set([status]) : new Set(['all'])} onSelectionChange={(keys) => { const key = [...keys][0]; setStatus(key === 'all' ? '' : key); setPage(1); }}>
      {['all', 'pending', 'sending', 'sent', 'delivered', 'read', 'failed', 'unknown', 'skipped', 'cancelled'].map((s) => <SelectItem key={s}>{s}</SelectItem>)}
    </Select></div>}
    {columns[section] && <DataTable columns={columns[section]} data={data?.items || []} isLoading={isFetching}
      page={page} totalPages={Math.max(1, Math.ceil((data?.total || 0) / 25))} onPageChange={setPage}
      actions={section === 'workflows' ? workflowActions : section === 'campaigns' ? campaignActions : section === 'conversations' ? conversationActions : []}
      emptyMessage={`No ${section} yet`} />}
    {section === 'templates' && <DataTable data={templates} isLoading={templatesQuery.isFetching} columns={[
      { key: 'name', label: 'Template' }, { key: 'language', label: 'Language' }, { key: 'category', label: 'Category' },
      { key: 'status', label: 'Approval', render: (r) => badge(r.status) },
      { key: 'body', label: 'Message', render: (r) => r.components?.find((c) => c.type === 'BODY')?.text || '—' },
    ]} emptyMessage="No Meta templates found" />}
    {section === 'coexistence' && canReadConnection && <ConnectionPanel canUpdate={can(PERMISSIONS.INTEGRATIONS_WHATSAPP_UPDATE)} />}
    <FormModal isOpen={Boolean(modal)} onOpenChange={(open) => !open && close()} title={modal?.type === 'conversation' ? modal.row.phone : modal?.type === 'schedule' ? 'Schedule campaign' : modal?.type === 'workflow' ? 'Automation workflow' : 'Campaign draft'} size="3xl" showFooter={false}>
      {modal?.type === 'workflow' && <WorkflowForm key={modal.row?.id || 'new-workflow'} workflow={modal.row} templates={templates} onClose={close}
        onSave={(body) => action({ resource: modal.row ? `workflows/${modal.row.id}` : 'workflows', method: modal.row ? 'PUT' : 'POST', body })} />}
      {modal?.type === 'campaign' && <CampaignForm key={modal.row?.id || 'new-campaign'} campaign={modal.row} templates={templates} onClose={close}
        onSave={(body) => action({ resource: modal.row ? `campaigns/${modal.row.id}` : 'campaigns', method: modal.row ? 'PUT' : 'POST', body })} />}
      {modal?.type === 'schedule' && <ScheduleForm campaign={modal.row} onClose={close} onSave={(body) => action({ resource: `campaigns/${modal.row.id}/schedule`, body })} />}
      {modal?.type === 'conversation' && <ConversationPanel conversation={modal.row} canReply={canReply} />}
    </FormModal>
    <ConfirmModal isOpen={Boolean(confirmation)} onClose={() => setConfirmation(null)} title={confirmation?.title} message={confirmation?.message} onConfirm={confirmAction} isLoading={saving} confirmLabel="Confirm" />
  </ListPageLayout>;
}
