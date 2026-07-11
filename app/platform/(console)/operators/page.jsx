'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { ListPageLayout, ResponsiveTable } from '@/components/ui';
import {
  useListPlatformOperatorsQuery,
  useCreatePlatformOperatorMutation,
  useUpdatePlatformOperatorMutation,
} from '@/redux/services/platformApi';
import {
  hasPlatformCapability,
  PLATFORM_CAPS,
} from '@/utils/platformCapabilities';
import { platformApiErrorMessage } from '@/features/platform/tenants/tenantUi';
import { formatDate } from '@/utils/dateFormatters';

const CAP_FIELDS = [
  { key: 'tenants_read', label: 'tenants_read' },
  { key: 'tenants_onboard', label: 'tenants_onboard' },
  { key: 'tenants_suspend', label: 'tenants_suspend' },
  { key: 'tenants_retry', label: 'tenants_retry' },
  { key: 'operators_manage', label: 'operators_manage' },
];

export default function PlatformOperatorsPage() {
  const { capabilities } = useSelector((state) => state.platformAuth);
  const canManage = hasPlatformCapability(
    capabilities,
    PLATFORM_CAPS.OPERATORS_MANAGE
  );
  const { data, isLoading, refetch } = useListPlatformOperatorsQuery(undefined, {
    skip: !canManage,
  });
  const [createOp, { isLoading: creating }] = useCreatePlatformOperatorMutation();
  const [updateOp, { isLoading: updating }] = useUpdatePlatformOperatorMutation();
  const createModal = useDisclosure();
  const [form, setForm] = useState({
    email: '',
    password: '',
    tenants_read: true,
    tenants_onboard: false,
    tenants_suspend: false,
    tenants_retry: false,
    operators_manage: false,
  });

  if (!canManage) {
    return (
      <ListPageLayout title="Operators" breadcrumbs={[{ label: 'Operators' }]}>
        <p className="text-sm text-gray-600">
          Requires operators_manage capability.
        </p>
      </ListPageLayout>
    );
  }

  const handleCreate = async () => {
    try {
      await createOp(form).unwrap();
      toast.success('Operator created');
      createModal.onClose();
      setForm({
        email: '',
        password: '',
        tenants_read: true,
        tenants_onboard: false,
        tenants_suspend: false,
        tenants_retry: false,
        operators_manage: false,
      });
      refetch();
    } catch (error) {
      toast.error(platformApiErrorMessage(error, 'Create failed'));
    }
  };

  const toggleActive = async (row) => {
    try {
      await updateOp({ id: row.id, is_active: !row.is_active }).unwrap();
      toast.success(row.is_active ? 'Disabled' : 'Enabled');
      refetch();
    } catch (error) {
      toast.error(platformApiErrorMessage(error, 'Update failed'));
    }
  };

  const toggleCap = async (row, key) => {
    try {
      await updateOp({
        id: row.id,
        [key]: !row.capabilities?.[key],
      }).unwrap();
      refetch();
    } catch (error) {
      toast.error(platformApiErrorMessage(error, 'Capability update failed'));
    }
  };

  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <div>
          <p className="font-medium">{row.email}</p>
          <p className="text-xs text-gray-500">
            {row.created_at ? formatDate(row.created_at) : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'active',
      label: 'Active',
      render: (row) => (
        <Chip size="sm" color={row.is_active ? 'success' : 'default'} variant="flat">
          {row.is_active ? 'yes' : 'no'}
        </Chip>
      ),
    },
    {
      key: 'caps',
      label: 'Capabilities',
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {CAP_FIELDS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className="text-left"
              onClick={() => toggleCap(row, key)}
              aria-label={`Toggle ${label}`}
            >
              <Chip
                size="sm"
                variant={row.capabilities?.[key] ? 'solid' : 'bordered'}
                color={row.capabilities?.[key] ? 'primary' : 'default'}
              >
                {label}
              </Chip>
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <ListPageLayout
      title="Operators"
      description="Platform operators (control plane). Separate from clinic admins."
      showDescription
      breadcrumbs={[
        { label: 'Platform', href: '/platform' },
        { label: 'Operators' },
      ]}
      actions={
        <Button
          color="primary"
          size="sm"
          startContent={<Plus className="w-4 h-4" />}
          onPress={createModal.onOpen}
        >
          Add operator
        </Button>
      }
    >
      <ResponsiveTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading || updating}
        emptyState={{ title: 'No operators', description: 'Create the first one.' }}
        actions={[
          {
            label: 'Enable / Disable',
            onClick: toggleActive,
          },
        ]}
      />

      <Modal isOpen={createModal.isOpen} onOpenChange={createModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>New platform operator</ModalHeader>
              <ModalBody className="gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onValueChange={(v) => setForm((f) => ({ ...f, email: v }))}
                />
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onValueChange={(v) => setForm((f) => ({ ...f, password: v }))}
                />
                {CAP_FIELDS.map(({ key, label }) => (
                  <Switch
                    key={key}
                    isSelected={form[key]}
                    onValueChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  >
                    {label}
                  </Switch>
                ))}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isLoading={creating}
                  onPress={handleCreate}
                >
                  Create
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </ListPageLayout>
  );
}
