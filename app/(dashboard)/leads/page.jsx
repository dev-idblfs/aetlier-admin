/**
 * Leads Management Page
 * Admin view of captured leads with status filters and inline update.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Target,
    Trash2,
    Eye,
    X,
    Mail,
    Phone,
} from 'lucide-react';
import {
    Button,
    useDisclosure,
    Chip,
    Pagination,
    Select,
    SelectItem,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import {
    PageHeader,
    StatusBadge,
    ResponsiveTable,
    ConfirmModal,
    SearchInput,
} from '@/components/ui';
import {
    useGetLeadsQuery,
    useUpdateLeadMutation,
    useDeleteLeadMutation,
} from '@/redux/services/api';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

const STATUS_COLORS = {
    NEW: 'primary',
    CONTACTED: 'warning',
    QUALIFIED: 'secondary',
    CONVERTED: 'success',
    LOST: 'danger',
};

const SOURCE_LABELS = {
    WEBSITE_POPUP: 'Website Popup',
    GOOGLE_ONE_TAP: 'Google One Tap',
    MANUAL: 'Manual',
};

export default function LeadsPage() {
    const router = useRouter();
    const user = useSelector((s) => s.auth.user);

    const canWrite = hasPermission(user, PERMISSIONS.LEAD_WRITE);
    const canDelete = hasPermission(user, PERMISSIONS.LEAD_DELETE);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLead, setSelectedLead] = useState(null);
    const pageSize = 20;

    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();

    const { data, isLoading, refetch } = useGetLeadsQuery({
        page: currentPage,
        page_size: pageSize,
        status: statusFilter || undefined,
        search: search || undefined,
    });

    const [updateLead] = useUpdateLeadMutation();
    const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();

    const leads = data?.leads || [];
    const totalPages = data?.pages || 1;
    const totalCount = data?.total || 0;

    const handleSearchChange = (value) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (status) => {
        setStatusFilter(prev => prev === status ? '' : status);
        setCurrentPage(1);
    };

    const handleStatusUpdate = async (lead, newStatus) => {
        try {
            await updateLead({ id: lead.id, status: newStatus }).unwrap();
            toast.success('Status updated');
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteClick = (lead) => {
        setSelectedLead(lead);
        onDeleteOpen();
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteLead(selectedLead.id).unwrap();
            toast.success('Lead deleted');
            onDeleteOpenChange(false);
            refetch();
        } catch {
            toast.error('Failed to delete lead');
        }
    };

    const columns = [
        {
            key: 'contact',
            label: 'Contact',
            render: (row) => {
                const name = row.user?.full_name || row.user?.name || '—';
                return (
                    <div>
                        <p className="font-medium text-gray-900">{name}</p>
                        {row.user?.email && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {row.user.email}
                            </p>
                        )}
                        {row.user?.phone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {row.user.phone}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'interest',
            label: 'Interest',
            render: (row) => (
                <span className="text-sm text-gray-700">{row.interest || '—'}</span>
            ),
        },
        {
            key: 'source',
            label: 'Source',
            render: (row) => (
                <Chip size="sm" variant="flat" color="default">
                    {SOURCE_LABELS[row.source] || row.source}
                </Chip>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) =>
                canWrite ? (
                    <Select
                        size="sm"
                        aria-label="Lead status"
                        selectedKeys={[row.status]}
                        onSelectionChange={(keys) => {
                            const val = [...keys][0];
                            if (val && val !== row.status) handleStatusUpdate(row, val);
                        }}
                        classNames={{ trigger: 'min-h-unit-8 h-8' }}
                    >
                        {LEAD_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </Select>
                ) : (
                    <Chip size="sm" color={STATUS_COLORS[row.status] || 'default'} variant="flat">
                        {row.status}
                    </Chip>
                ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (row) =>
                row.created_at
                    ? new Date(row.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })
                    : '—',
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Leads"
                description="Manage and track potential customers"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Leads' },
                ]}
            />

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-2">
                <Chip
                    key="all"
                    variant={!statusFilter ? 'solid' : 'bordered'}
                    color={!statusFilter ? 'primary' : 'default'}
                    className="cursor-pointer"
                    onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
                >
                    All
                </Chip>
                {LEAD_STATUSES.map((s) => (
                    <Chip
                        key={s}
                        variant={statusFilter === s ? 'solid' : 'bordered'}
                        color={statusFilter === s ? STATUS_COLORS[s] : 'default'}
                        className="cursor-pointer"
                        onClick={() => handleStatusFilterChange(s)}
                    >
                        {s}
                    </Chip>
                ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search by name, email or phone..."
                    fullWidth
                    className="flex-1"
                />
                {search && (
                    <Button
                        variant="flat"
                        size="sm"
                        isIconOnly
                        onPress={() => handleSearchChange('')}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Count */}
            <div className="text-sm text-gray-500">
                {totalCount} lead{totalCount !== 1 ? 's' : ''} found
            </div>

            {/* Table */}
            <ResponsiveTable
                columns={columns}
                data={leads}
                isLoading={isLoading}
                emptyState={{
                    icon: 'file',
                    title: 'No leads found',
                    description: search || statusFilter
                        ? 'Try adjusting your search or filter'
                        : 'Leads captured from the website will appear here',
                }}
                actions={[
                    {
                        label: 'View',
                        icon: <Eye className="w-4 h-4" />,
                        onClick: (lead) => router.push(`/leads/${lead.id}`),
                    },
                    ...(canDelete
                        ? [{
                            label: 'Delete',
                            icon: <Trash2 className="w-4 h-4" />,
                            color: 'danger',
                            onClick: handleDeleteClick,
                        }]
                        : []),
                ]}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        total={totalPages}
                        page={currentPage}
                        onChange={(page) => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        showControls
                    />
                </div>
            )}

            {/* Delete confirmation */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                title="Delete Lead"
                description={`Are you sure you want to permanently delete this lead? This cannot be undone.`}
                confirmLabel="Delete"
                confirmColor="danger"
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </div>
    );
}
