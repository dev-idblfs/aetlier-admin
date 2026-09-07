'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from '@/lib/icons';
import { Select, SelectItem, Pagination } from '@/lib/heroui';
import { ListPageLayout, ResponsiveTable, StatusBadge, EntityLink, FilterBar, Alert } from '@/components/ui';
import { useGetPendingVerificationsQuery } from '@/redux/services/api';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

const STATUS_FILTERS = [
  { key: '', label: 'Pending only (default)' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

export default function VerificationQueuePage() {
  const router = useRouter();
  const user = useSelector((s) => s.auth.user);
  const canView = hasPermission(user, PERMISSIONS.VERIFICATION_VERIFY_ANY);

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useGetPendingVerificationsQuery(
    {
      status_filter: statusFilter || undefined,
      skip: (page - 1) * pageSize,
      limit: pageSize,
    },
    { skip: !canView },
  );

  const verifications = data?.verifications || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Client-side search filter (API does not support q/search param yet)
  const filteredVerifications = search.trim()
    ? verifications.filter((v) =>
        v.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.doctor_email?.toLowerCase().includes(search.toLowerCase())
      )
    : verifications;

  if (!canView) {
    return (
      <ListPageLayout
        title="Doctor verification"
        breadcrumbs={[{ label: 'Verification' }]}
      >
        <Alert
          variant="warning"
          title="Permission required"
          message="You do not have permission to view the verification queue."
        />
      </ListPageLayout>
    );
  }

  const columns = [
    {
      key: 'doctor',
      label: 'Doctor',
      render: (row) => (
        <div>
          <EntityLink
            href={row.doctor_user_id ? `/doctors/${row.doctor_user_id}/edit` : undefined}
            label={row.doctor_name || '—'}
          />
          <p className="text-xs text-gray-500">{row.specializations?.join(', ')}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="text-gray-700">{row.doctor_email || '—'}</span>,
    },
    {
      key: 'documents',
      label: 'Documents',
      render: (row) => row.document_count ?? 0,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'submitted',
      label: 'Submitted',
      render: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
    },
  ];

  return (
    <ListPageLayout
      title="Doctor verification"
      breadcrumbs={[{ label: 'Verification' }]}
    >
      <Alert
        variant="info"
        title="Approval workflow"
        compact
      >
        <ol className="list-decimal list-inside space-y-0.5 text-sm">
          <li>Open a submission and preview each document</li>
          <li>Approve or reject individual documents (permission: verification.verify.any)</li>
          <li>Approve or reject the overall application (permission: verification.approve.any)</li>
          <li>On approval, the doctor profile is published automatically</li>
        </ol>
      </Alert>

      <FilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by doctor name or email..."
        activeFiltersCount={statusFilter ? 1 : 0}
        onClearAll={() => {
          setStatusFilter('');
          setPage(1);
        }}
      >
        <Select
          aria-label="Status"
          placeholder="Status"
          selectedKeys={statusFilter ? [statusFilter] : ['']}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0];
            setStatusFilter(val === '' ? '' : String(val));
            setPage(1);
          }}
          size="sm"
        >
          {STATUS_FILTERS.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              {f.label}
            </SelectItem>
          ))}
        </Select>
      </FilterBar>

      <ResponsiveTable
        columns={columns}
        data={filteredVerifications}
        isLoading={isLoading}
        emptyState={{
          title: 'No verification submissions found',
          description: search
            ? 'Try adjusting your search or filters.'
            : 'New doctor signups will appear here when they upload documents.',
        }}
        actions={[
          {
            key: 'review',
            label: 'Review',
            icon: <Eye className="w-4 h-4" />,
            onClick: (row) => router.push(`/verification/${row.id}`),
          },
        ]}
      />

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination total={totalPages} page={page} onChange={setPage} />
        </div>
      )}
    </ListPageLayout>
  );
}
