/**
 * Lead Detail Page
 * View contact info and edit lead status, notes, and scheduling.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Chip,
    Spinner,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Mail, Phone, User } from 'lucide-react';
import { PageHeader } from '@/components/ui';
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
            <div className="text-center py-20">
                <p className="text-gray-500">Lead not found.</p>
                <Button
                    variant="light"
                    startContent={<ArrowLeft className="w-4 h-4" />}
                    onPress={() => router.push('/leads')}
                    className="mt-4"
                >
                    Back to Leads
                </Button>
            </div>
        );
    }

    const fullName = lead.user?.full_name || lead.user?.name || '—';

    return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader
                title="Lead Details"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Leads', href: '/leads' },
                    { label: fullName },
                ]}
                actions={
                    <Button
                        variant="light"
                        startContent={<ArrowLeft className="w-4 h-4" />}
                        onPress={() => router.push('/leads')}
                    >
                        Back
                    </Button>
                }
            />

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
                            <p className="text-sm text-gray-900">{lead.user?.email || '—'}</p>
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
        </div>
    );
}

/** Editable form — mounted only once lead is loaded so state safely initializes from props */
function LeadForm({ lead, canWrite }) {
    const [updateLead, { isLoading: isSaving }] = useUpdateLeadMutation();

    const [form, setForm] = useState({
        status: lead.status || 'NEW',
        interest: lead.interest || '',
        notes: lead.notes || '',
        scheduled_call_at: lead.scheduled_call_at
            ? lead.scheduled_call_at.slice(0, 16)
            : '',
    });

    const handleChange = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSave = async () => {
        try {
            await updateLead({
                id: lead.id,
                status: form.status,
                interest: form.interest || undefined,
                notes: form.notes || undefined,
                scheduled_call_at: form.scheduled_call_at || undefined,
            }).unwrap();
            toast.success('Lead updated');
        } catch {
            toast.error('Failed to update lead');
        }
    };

    return (
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Lead Details
            </h2>

            <Select
                label="Status"
                selectedKeys={[form.status]}
                onSelectionChange={(keys) =>
                    setForm((p) => ({ ...p, status: [...keys][0] || p.status }))
                }
                isDisabled={!canWrite}
                variant="bordered"
            >
                {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                        {s}
                    </SelectItem>
                ))}
            </Select>

            <Input
                label="Interest / Service"
                placeholder="e.g. Skin care, Hair removal..."
                value={form.interest}
                onChange={handleChange('interest')}
                isDisabled={!canWrite}
                variant="bordered"
            />

            <Input
                label="Schedule Call At"
                type="datetime-local"
                value={form.scheduled_call_at}
                onChange={handleChange('scheduled_call_at')}
                isDisabled={!canWrite}
                variant="bordered"
            />

            <Textarea
                label="Notes"
                placeholder="Internal notes about this lead..."
                value={form.notes}
                onChange={handleChange('notes')}
                isDisabled={!canWrite}
                minRows={3}
                variant="bordered"
            />

            {canWrite && (
                <Button
                    color="primary"
                    startContent={<Save className="w-4 h-4" />}
                    onPress={handleSave}
                    isLoading={isSaving}
                >
                    Save Changes
                </Button>
            )}
        </section>
    );
}
