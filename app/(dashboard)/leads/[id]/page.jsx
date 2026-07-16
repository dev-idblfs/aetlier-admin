/**
 * Lead Detail Page
 * View contact info and edit lead status, notes, and scheduling.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    SelectItem,
    Chip,
    Spinner,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { Save, Mail, Phone, User } from 'lucide-react';
import {
    ListPageLayout,
    Form,
    FormErrorSummary,
    FormInput,
    FormTextarea,
    FormSelect,
    DEFAULT_FORM_OPTIONS,
} from '@/components/ui';
import { leadUpdateSchema } from '@/lib/validation';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import {
    useGetLeadQuery,
    useUpdateLeadMutation,
} from '@/redux/services/api';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

const SOURCE_LABELS = {
    WEBSITE_POPUP: 'Website Popup',
    GOOGLE_ONE_TAP: 'Google One Tap',
    CONTACT_FORM: 'Contact Form',
    HOMEPAGE_FORM: 'Homepage Form',
    CLINIC_CAMP: 'Women Health Camp',
    MANUAL: 'Manual',
};

export default function LeadDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const user = useSelector((s) => s.auth.user);
    const canWrite = hasPermission(user, PERMISSIONS.LEAD_WRITE);

    const { data: lead, isLoading } = useGetLeadQuery(id, { skip: !id });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!lead) {
        return (
            <ListPageLayout
                title="Lead Details"
                breadcrumbs={[
                    { label: 'Leads', href: '/leads' },
                    { label: 'Not found' },
                ]}
            >
                <div className="text-center py-20">
                    <p className="text-gray-500">Lead not found.</p>
                    <Button
                        variant="light"
                        onPress={() => router.push('/leads')}
                        className="mt-4"
                    >
                        Back to Leads
                    </Button>
                </div>
            </ListPageLayout>
        );
    }

    const fullName = lead.user?.full_name || lead.user?.name || '—';

    return (
        <ListPageLayout
            title="Lead Details"
            breadcrumbs={[
                { label: 'Leads', href: '/leads' },
                { label: fullName },
            ]}
            className="max-w-2xl"
        >
            {/* Contact Info (read-only) */}
            <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Contact Info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-400">Name</p>
                            <p className="text-sm font-medium text-gray-900">{fullName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm text-gray-900">{lead.user?.email || '—'}</p>
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    color={lead.user?.is_verified ? 'success' : 'default'}
                                >
                                    {lead.user?.is_verified ? 'Verified' : 'Unverified'}
                                </Chip>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-400">Phone</p>
                            <p className="text-sm text-gray-900">{lead.user?.phone || '—'}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Source</p>
                        <Chip size="sm" variant="flat" className="mt-0.5">
                            {SOURCE_LABELS[lead.source] || lead.source}
                        </Chip>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Created</p>
                        <p className="text-sm text-gray-900">
                            {lead.created_at
                                ? new Date(lead.created_at).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                : '—'}
                        </p>
                    </div>
                </div>
            </section>

            {/* key prop re-mounts LeadForm if lead.id ever changes */}
            <LeadForm key={lead.id} lead={lead} canWrite={canWrite} />
        </ListPageLayout>
    );
}

/** Editable form — mounted only once lead is loaded so state safely initializes from props */
function LeadForm({ lead, canWrite }) {
    const [updateLead, { isLoading: isSaving }] = useUpdateLeadMutation();

    const methods = useForm({
        ...DEFAULT_FORM_OPTIONS,
        resolver: zodResolver(leadUpdateSchema),
        defaultValues: {
            status: lead.status || 'NEW',
            interest: lead.interest || '',
            notes: lead.notes || '',
            scheduled_call_at: lead.scheduled_call_at
                ? lead.scheduled_call_at.slice(0, 16)
                : '',
        },
    });

    const { handleSubmit, isSubmitting } = useFormSubmit(methods, {
        fallbackMessage: 'Failed to update lead',
        onSubmit: async (values) => {
            await updateLead({
                id: lead.id,
                status: values.status,
                interest: values.interest || undefined,
                notes: values.notes || undefined,
                scheduled_call_at: values.scheduled_call_at || undefined,
            }).unwrap();
        },
        onSuccess: () => toast.success('Lead updated'),
    });

    return (
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Lead Details
            </h2>

            <Form methods={methods} onSubmit={handleSubmit}>
                <FormErrorSummary error={methods.formState.errors.root?.message} />

                <div className="space-y-4">
                    <FormSelect
                        name="status"
                        label="Status"
                        isDisabled={!canWrite}
                    >
                        {LEAD_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </FormSelect>

                    <FormInput
                        name="interest"
                        label="Interest / Service"
                        placeholder="e.g. Skin care, Hair removal..."
                        isDisabled={!canWrite}
                    />

                    <FormInput
                        name="scheduled_call_at"
                        label="Schedule Call At"
                        type="datetime-local"
                        isDisabled={!canWrite}
                    />

                    <FormTextarea
                        name="notes"
                        label="Message / Notes"
                        placeholder="User message and internal notes about this lead..."
                        isDisabled={!canWrite}
                        minRows={3}
                    />
                </div>

                {canWrite && (
                    <Button
                        type="submit"
                        color="primary"
                        startContent={<Save className="w-4 h-4" />}
                        isLoading={isSubmitting || isSaving}
                        className="mt-4"
                    >
                        Save Changes
                    </Button>
                )}
            </Form>
        </section>
    );
}
