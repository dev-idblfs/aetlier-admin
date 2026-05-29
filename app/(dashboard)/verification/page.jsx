'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye } from 'lucide-react';
import { Button, Select, SelectItem, Pagination } from '@heroui/react';
import { PageHeader, ResponsiveTable } from '@/components/ui';
import VerificationStatusBadge from '@/components/verification/VerificationStatusBadge';
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

  if (!canView) {
    return (
      <div className="p-6">
        <p className="text-gray-600">You do not have permission to view the verification queue.</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'doctor',
      label: 'Doctor',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.doctor_name || '—'}</p>
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
      render: (row) => <VerificationStatusBadge status={row.status} />,
    },
    {
      key: 'submitted',
      label: 'Submitted',
      render: (row) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button
          size="sm"
          variant="flat"
          startContent={<Eye className="w-4 h-4" />}
          onPress={() => router.push(`/verification/${row.id}`)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor verification"
        description="Review documents, then approve or reject each doctor onboarding request"
        icon={Shield}
      />

      <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-sm text-gray-700 space-y-1">
        <p className="font-medium text-gray-900">Approval workflow</p>
        <ol className="list-decimal list-inside space-y-0.5 text-gray-600">
          <li>Open a submission and preview each document</li>
          <li>Approve or reject individual documents (permission: verification.verify.any)</li>
          <li>Approve or reject the overall application (permission: verification.approve.any)</li>
          <li>On approval, the doctor profile is published automatically</li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select
          label="Status"
          className="max-w-xs"
          selectedKeys={statusFilter ? [statusFilter] : ['']}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0];
            setStatusFilter(val === '' ? '' : String(val));
            setPage(1);
          }}
        >
          {STATUS_FILTERS.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              {f.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <ResponsiveTable
        columns={columns}
        data={verifications}
        isLoading={isLoading}
        emptyState={{
          title: 'No verification submissions found',
          description: 'New doctor signups will appear here when they upload documents.',
        }}
      />

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination total={totalPages} page={page} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
