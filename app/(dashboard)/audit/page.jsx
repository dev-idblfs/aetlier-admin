'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Pagination,
  Spinner,
} from '@heroui/react';
import { RefreshCw, Filter, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { ListPageLayout, Card, DataTable } from '@/components/ui';
import AuditTimeline from '@/components/audit/AuditTimeline';
import { useGetAuditLogsQuery } from '@/redux/services/api';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

const ENTITY_TYPES = [
  { value: '', label: 'All entities' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'prescriptions', label: 'Prescriptions' },
  { value: 'users', label: 'Users' },
  { value: 'doctor_profiles', label: 'Doctors' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'consultation_sessions', label: 'Consultation sessions' },
];

export default function AuditExplorerPage() {
  const { user } = useSelector((state) => state.auth);
  const canView = hasPermission(user, PERMISSIONS.AUDIT_READ_ANY);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    entity_type: '',
    entity_id: '',
    action: '',
    date_from: '',
    date_to: '',
  });
  const [selectedEntry, setSelectedEntry] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetAuditLogsQuery(
    {
      page,
      page_size: 20,
      entity_type: filters.entity_type || undefined,
      entity_id: filters.entity_id || undefined,
      action: filters.action || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    },
    { skip: !canView }
  );

  const entries = data?.entries || data?.items || [];
  const totalPages = data?.total_pages || 1;

  const columns = [
    {
      key: 'created_at',
      label: 'When',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (row) => (
        <div>
          <p className="text-sm font-medium capitalize text-gray-900">
            {row.entity_type?.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-gray-500 font-mono truncate max-w-[140px]">
            {row.entity_id}
          </p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <Chip size="sm" variant="flat" className="capitalize">
          {row.action?.replace(/[._]/g, ' ')}
        </Chip>
      ),
    },
    {
      key: 'actor',
      label: 'Actor',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.actor_name || row.actor_type || 'System'}
        </span>
      ),
    },
  ];

  if (!canView) {
    return (
      <ListPageLayout title="Audit log" breadcrumbs={[{ label: 'Audit' }]}>
        <Card padding="md">
          <p className="text-sm text-gray-600">You do not have permission to view audit logs.</p>
        </Card>
      </ListPageLayout>
    );
  }

  return (
    <ListPageLayout
      title="Audit explorer"
      breadcrumbs={[{ label: 'Audit' }]}
      actions={
        <Button
          variant="flat"
          size="sm"
          startContent={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
          onPress={() => refetch()}
        >
          Refresh
        </Button>
      }
    >
      <Card padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select
            label="Entity type"
            labelPlacement="outside"
            size="sm"
            selectedKeys={filters.entity_type ? [filters.entity_type] : []}
            onSelectionChange={(keys) =>
              setFilters((f) => ({ ...f, entity_type: Array.from(keys)[0] || '' }))
            }
          >
            {ENTITY_TYPES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Entity ID"
            labelPlacement="outside"
            size="sm"
            value={filters.entity_id}
            onChange={(e) => setFilters((f) => ({ ...f, entity_id: e.target.value }))}
          />
          <Input
            label="Action"
            labelPlacement="outside"
            size="sm"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          />
          <Input
            type="date"
            label="From"
            labelPlacement="outside"
            size="sm"
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
          />
          <Input
            type="date"
            label="To"
            labelPlacement="outside"
            size="sm"
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="light"
            size="sm"
            startContent={<X className="w-4 h-4" />}
            onPress={() =>
              setFilters({
                entity_type: '',
                entity_id: '',
                action: '',
                date_from: '',
                date_to: '',
              })
            }
          >
            Clear filters
          </Button>
        </div>
      </Card>

      <Card padding="none">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={entries}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyMessage="No audit entries found"
            onRowClick={setSelectedEntry}
          />
        )}
      </Card>

      {selectedEntry && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Entry detail</h3>
            <Button size="sm" variant="light" onPress={() => setSelectedEntry(null)}>
              Close
            </Button>
          </div>
          <AuditTimeline
            entityType={selectedEntry.entity_type}
            entityId={selectedEntry.entity_id}
            compact
          />
        </Card>
      )}
    </ListPageLayout>
  );
}
