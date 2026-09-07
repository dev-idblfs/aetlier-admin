/**
 * Roles Management Page
 * Mobile-first responsive with card/table view
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import {
    Card,
    CardBody,
    Button,
    Chip,
    Input,
    Textarea,
    useDisclosure,
    Spinner,
    Tabs,
    Tab,
    Checkbox,
    Avatar,
    Pagination,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from '@/lib/heroui';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Key,
    Users,
    Lock,
    MoreVertical,
} from '@/lib/icons';
import { toast } from 'react-hot-toast';
import { ListPageLayout, ConfirmModal, MobileCard, EmptyState, SearchInput, FormModal, DetailModal, BulkActionBar, DataTable } from '@/components/ui';
import {
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useBulkDeleteRolesMutation,
    useGetPermissionsQuery,
    useAddPermissionToRoleMutation,
    useRemovePermissionFromRoleMutation,
    useGetUsersQuery,
    useAssignUserRoleMutation,
    useRevokeUserRoleMutation,
} from '@/redux/services/api';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roleSchema } from '@/lib/validation';
import { FormInput, FormTextarea, FormSwitchRow } from '@/components/ui/FormFields';
import { isSuperAdmin, hasPermission, PERMISSIONS } from '@/utils/permissions';
import useBulkSelection from '@/hooks/useBulkSelection';
import useBulkDeleteAction from '@/hooks/useBulkDeleteAction';

export default function RolesPage() {
    const [selectedTab, setSelectedTab] = useState('roles');

    return (
        <ListPageLayout
            title="Roles"
            breadcrumbs={[{ label: 'Roles' }]}
        >
            <Tabs
                selectedKey={selectedTab}
                onSelectionChange={setSelectedTab}
                color="primary"
                variant="underlined"
                classNames={{
                    tabList: "gap-4 md:gap-6 w-full overflow-x-auto",
                    tab: "min-w-fit px-0",
                }}
            >
                <Tab
                    key="roles"
                    title={
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Roles</span>
                        </div>
                    }
                >
                    <RolesTab />
                </Tab>
                <Tab
                    key="users"
                    title={
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>User Roles</span>
                        </div>
                    }
                >
                    <UserRolesTab />
                </Tab>
            </Tabs>
        </ListPageLayout>
    );
}

// ============================================================================
// ROLES TAB
// ============================================================================

function RolesTab() {
    const currentUser = useSelector((state) => state.auth.user);
    const canCreate = hasPermission(currentUser, PERMISSIONS.ROLE_CREATE);
    const canUpdate = hasPermission(currentUser, PERMISSIONS.ROLE_UPDATE);
    const canDeleteRoles = hasPermission(currentUser, PERMISSIONS.ROLE_DELETE);
    const canManagePermissions = hasPermission(currentUser, PERMISSIONS.PERMISSION_ASSIGN);
    const canEditSystemFlags = isSuperAdmin(currentUser);

    const { data: roles = [], isLoading, error } = useGetRolesQuery();
    const { data: permissions = [] } = useGetPermissionsQuery();
    const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
    const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
    const [addPermissionToRole] = useAddPermissionToRoleMutation();
    const [removePermissionFromRole] = useRemovePermissionFromRoleMutation();

    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { isOpen: isPermOpen, onOpen: onPermOpen, onOpenChange: onPermOpenChange, onClose: onPermClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
    const [editingRole, setEditingRole] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const methods = useForm({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            name: '',
            description: '',
            grants_admin_portal: false,
            prefer_admin_redirect_on_login: false,
        },
    });

    const { reset, handleSubmit: hookFormSubmit, formState: { errors } } = methods;

    const handleCreate = () => {
        setEditingRole(null);
        reset({
            name: '',
            description: '',
            grants_admin_portal: false,
            prefer_admin_redirect_on_login: false,
        });
        onOpen();
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        reset({
            name: role.name,
            description: role.description || '',
            grants_admin_portal: role.grants_admin_portal || false,
            prefer_admin_redirect_on_login: role.prefer_admin_redirect_on_login || false,
        });
        onOpen();
    };

    const handleManagePermissions = (role) => {
        setSelectedRole(role);
        onPermOpen();
    };

    const onSubmit = async (data) => {
        try {
            if (editingRole) {
                await updateRole({ id: editingRole.id, ...data }).unwrap();
                toast.success('Role updated successfully');
            } else {
                await createRole(data).unwrap();
                toast.success('Role created successfully');
            }
            onClose();
        } catch (err) {
            toast.error(err.data?.detail || 'Failed to save role');
        }
    };

    const handleDelete = async (role) => {
        if (!confirm(`Are you sure you want to delete the "${role.name}" role?`)) return;

        try {
            await deleteRole(role.id).unwrap();
            toast.success('Role deleted successfully');
        } catch (err) {
            toast.error(err.data?.detail || 'Failed to delete role');
        }
    };

    const handleDeleteClick = (role) => {
        setRoleToDelete(role);
        onDeleteOpen();
    };

    const handleDeleteConfirm = async () => {
        if (!roleToDelete) return;
        try {
            await deleteRole(roleToDelete.id).unwrap();
            toast.success('Role deleted successfully');
            onDeleteOpenChange(false);
        } catch (err) {
            toast.error(err.data?.detail || 'Failed to delete role');
        }
    };

    const handleTogglePermission = async (permission) => {
        if (!selectedRole) return;

        const hasPermission = selectedRole.permissions?.some(p => p.id === permission.id);

        try {
            if (hasPermission) {
                await removePermissionFromRole({
                    roleId: selectedRole.id,
                    permissionId: permission.id,
                }).unwrap();
                toast.success(`Removed "${permission.name}" from "${selectedRole.name}"`);
            } else {
                await addPermissionToRole({
                    roleId: selectedRole.id,
                    permissionId: permission.id,
                }).unwrap();
                toast.success(`Added "${permission.name}" to "${selectedRole.name}"`);
            }
        } catch (err) {
            toast.error(err.data?.detail || 'Failed to update permissions');
        }
    };

    // System roles that cannot be deleted
    const systemRoles = ['super_admin', 'admin', 'doctor', 'patient'];
    const roleList = Array.isArray(roles) ? roles : [];

    // Pagination — keep hooks above early returns (Rules of Hooks)
    const totalPages = Math.ceil(roleList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRoles = roleList.slice(startIndex, startIndex + itemsPerPage);
    const selectableRoles = paginatedRoles.filter((role) => !systemRoles.includes(role.name));
    const {
        selectedIds,
        onSelectionChange,
        clearSelection,
        selectedCount,
    } = useBulkSelection(selectableRoles, 1, selectableRoles.length || itemsPerPage);
    const {
        isBulkOpen,
        onBulkOpen,
        onBulkOpenChange,
        handleBulkConfirm,
        isBulkLoading,
    } = useBulkDeleteAction(useBulkDeleteRolesMutation, 'roles');

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardBody className="text-center py-12 text-red-500">
                    Failed to load roles. Please try again.
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                    Showing {roleList.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, roleList.length)} of {roleList.length} role{roleList.length !== 1 ? 's' : ''}
                </span>
                {canCreate && (
                    <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={handleCreate}
                        size="sm"
                    >
                        <span className="hidden sm:inline">Create Role</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                )}
            </div>

            <BulkActionBar
                count={selectedCount}
                onDelete={onBulkOpen}
                onClear={clearSelection}
                canDelete={canDeleteRoles}
            />

            <DataTable
                columns={[
                    {
                        key: 'name',
                        label: 'Role',
                        priority: 'primary',
                        render: (role) => (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Shield className="w-4 h-4 text-primary-500 shrink-0" />
                                <span className="font-medium text-gray-900">{role.name}</span>
                                {systemRoles.includes(role.name) && (
                                    <Chip size="sm" color="warning" variant="flat">System</Chip>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: 'description',
                        label: 'Description',
                        priority: 'secondary',
                        render: (role) => (
                            <span className="text-sm text-gray-500">{role.description || '—'}</span>
                        ),
                    },
                    {
                        key: 'permissions',
                        label: 'Permissions',
                        priority: 'secondary',
                        render: (role) => (
                            <span className="text-sm text-gray-500">{role.permissions?.length || 0}</span>
                        ),
                    },
                ]}
                data={paginatedRoles}
                selectable={canDeleteRoles}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
                isRowSelectable={(role) => !systemRoles.includes(role.name)}
                page={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                emptyState={{
                    icon: 'file',
                    title: 'No roles',
                    description: 'Create your first role to get started',
                    actionLabel: 'Create Role',
                    onAction: handleCreate,
                }}
                actions={(role) => [
                    ...(canManagePermissions
                        ? [{
                            key: 'permissions',
                            label: 'Manage permissions',
                            icon: <Key className="w-4 h-4" />,
                            onClick: handleManagePermissions,
                        }]
                        : []),
                    ...(canUpdate
                        ? [{
                            key: 'edit',
                            label: 'Edit',
                            icon: <Edit className="w-4 h-4" />,
                            onClick: handleEdit,
                        }]
                        : []),
                    ...(canDeleteRoles && !systemRoles.includes(role.name)
                        ? [{
                            key: 'delete',
                            label: 'Delete',
                            icon: <Trash2 className="w-4 h-4" />,
                            danger: true,
                            onClick: handleDeleteClick,
                        }]
                        : []),
                ]}
                renderMobileCard={(role, { actions }) => (
                    <RoleMobileCard
                        role={role}
                        isSystem={systemRoles.includes(role.name)}
                        actions={actions}
                    />
                )}
            />

            {/* Create/Edit Role Modal */}
            <FormModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onClose={onClose}
                onSubmit={hookFormSubmit(onSubmit)}
                title={editingRole ? 'Edit Role' : 'Create Role'}
                submitLabel={editingRole ? 'Update' : 'Create'}
                isLoading={isCreating || isUpdating}
            >
                <FormProvider {...methods}>
                    <div className="space-y-4">
                        <FormInput
                            name="name"
                            label="Role Name"
                            labelPlacement="outside"
                            placeholder="e.g., manager"
                            isDisabled={editingRole && systemRoles.includes(editingRole.name)}
                            size="sm"
                        />
                        <FormTextarea
                            name="description"
                            label="Description"
                            labelPlacement="outside"
                            placeholder="Describe what this role can do..."
                        />
                        <FormSwitchRow
                            name="grants_admin_portal"
                            label="Admin portal access"
                            description="Allow this role to use the admin app (requires the admin.portal.access permission)"
                            isDisabled={editingRole && systemRoles.includes(editingRole.name) && !canEditSystemFlags}
                        />
                        <FormSwitchRow
                            name="prefer_admin_redirect_on_login"
                            label="Default to admin app on login"
                            description="Users with this role land on the admin app when it's their only context"
                            isDisabled={editingRole && systemRoles.includes(editingRole.name) && !canEditSystemFlags}
                        />
                    </div>
                </FormProvider>
            </FormModal>

            {/* Manage Permissions Modal */}
            <DetailModal
                isOpen={isPermOpen}
                onOpenChange={onPermOpenChange}
                title={
                    <div className="flex flex-col items-start gap-1">
                        <span>Manage Permissions</span>
                        <span className="text-sm font-normal text-gray-500">{selectedRole?.name}</span>
                    </div>
                }
                size="2xl"
            >
                <div className="space-y-2">
                    {permissions.map((permission) => {
                        const hasPermission = selectedRole?.permissions?.some(p => p.id === permission.id);
                        return (
                            <motion.div
                                key={permission.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${hasPermission
                                    ? 'bg-primary-50 border-primary-200'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="font-medium text-sm truncate">{permission.name}</span>
                                    </div>
                                    {permission.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{permission.description}</p>
                                    )}
                                </div>
                                <Checkbox
                                    isSelected={hasPermission}
                                    onValueChange={() => handleTogglePermission(permission)}
                                    className="ml-2"
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </DetailModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => onDeleteOpenChange(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Role"
                message={`Are you sure you want to delete the "${roleToDelete?.name}" role? This action cannot be undone.`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
            />

            <ConfirmModal
                isOpen={isBulkOpen}
                onClose={() => onBulkOpenChange(false)}
                onConfirm={() => handleBulkConfirm(selectedIds, clearSelection)}
                title={`Delete ${selectedCount} roles?`}
                message="Selected custom roles will be soft-deleted."
                confirmLabel="Delete"
                type="danger"
                isLoading={isBulkLoading}
            />
        </div>
    );
}

// Role Mobile Card Component
function RoleMobileCard({ role, isSystem, actions = [] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{role.name}</span>
                            {isSystem && (
                                <Chip size="sm" color="warning" variant="flat">System</Chip>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">{role.description || 'No description'}</p>
                        <p className="text-xs text-gray-400 mt-1">{role.permissions?.length || 0} permissions</p>
                    </div>
                </div>
                {actions.length > 0 ? (
                    <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light" aria-label="Row actions" className="min-w-9 min-h-9 shrink-0">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Role actions">
                            {actions.map((action, index) => (
                                <DropdownItem
                                    key={action.key || index}
                                    color={action.color || (action.danger ? 'danger' : 'default')}
                                    className={action.danger || action.color === 'danger' ? 'text-danger' : undefined}
                                    startContent={action.icon}
                                    onPress={() => action.onClick?.()}
                                >
                                    {action.label}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                ) : null}
            </div>
        </motion.div>
    );
}

// ============================================================================
// USER ROLES TAB
// ============================================================================

function UserRolesTab() {
    const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery();
    const { data: roles = [], isLoading: isLoadingRoles } = useGetRolesQuery();
    const [assignRole, { isLoading: isAssigning }] = useAssignUserRoleMutation();
    const [revokeRole, { isLoading: isRevoking }] = useRevokeUserRoleMutation();

    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [selectedUser, setSelectedUser] = useState(null);

    const users = usersData?.users || usersData || [];

    const handleManageRoles = (user) => {
        setSelectedUser(user);
        onOpen();
    };

    const handleToggleRole = async (role) => {
        if (!selectedUser) return;

        const hasRole = selectedUser.roles?.some(r => r.id === role.id);

        try {
            if (hasRole) {
                await revokeRole({ userId: selectedUser.id, roleId: role.id }).unwrap();
                toast.success(`Removed "${role.name}" from user`);
            } else {
                await assignRole({ userId: selectedUser.id, roleId: role.id }).unwrap();
                toast.success(`Assigned "${role.name}" to user`);
            }
            // Update local state
            setSelectedUser(prev => ({
                ...prev,
                roles: hasRole
                    ? prev.roles.filter(r => r.id !== role.id)
                    : [...(prev.roles || []), role]
            }));
        } catch (err) {
            toast.error(err.data?.detail || 'Failed to update user role');
        }
    };

    if (isLoadingUsers || isLoadingRoles) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-4">
            <DataTable
                columns={[
                    {
                        key: 'user',
                        label: 'User',
                        priority: 'primary',
                        render: (user) => (
                            <div className="flex items-center gap-2 min-w-0">
                                <Avatar
                                    name={user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    size="sm"
                                    className="bg-primary-100 shrink-0"
                                    classNames={{ name: 'text-primary-600 font-medium' }}
                                />
                                <span className="font-medium text-gray-900 truncate">
                                    {user.name || 'Unknown'}
                                </span>
                            </div>
                        ),
                    },
                    {
                        key: 'email',
                        label: 'Email',
                        priority: 'secondary',
                        render: (user) => (
                            <span className="text-sm text-gray-500 break-all">{user.email}</span>
                        ),
                    },
                    {
                        key: 'roles',
                        label: 'Roles',
                        priority: 'secondary',
                        render: (user) => (
                            <div className="flex flex-wrap gap-1">
                                {user.roles?.length > 0 ? (
                                    user.roles.map((role) => (
                                        <Chip
                                            key={role.id}
                                            size="sm"
                                            color={
                                                role.name === 'super_admin' ? 'danger' :
                                                    role.name === 'admin' ? 'warning' :
                                                        role.name === 'doctor' ? 'secondary' :
                                                            'default'
                                            }
                                            variant="flat"
                                        >
                                            {role.name}
                                        </Chip>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-sm">No roles</span>
                                )}
                            </div>
                        ),
                    },
                ]}
                data={users}
                emptyMessage="No users found"
                actions={[
                    {
                        key: 'manage',
                        label: 'Manage roles',
                        icon: <Shield className="w-4 h-4" />,
                        onClick: handleManageRoles,
                    },
                ]}
                renderMobileCard={(user, { actions }) => (
                    <UserRoleMobileCard
                        user={user}
                        actions={actions}
                    />
                )}
            />

            {/* Manage User Roles Modal */}
            <DetailModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                title={
                    <div className="flex flex-col gap-1">
                        <span>Manage Roles</span>
                        <span className="text-sm font-normal text-gray-500">{selectedUser?.name || selectedUser?.email}</span>
                    </div>
                }
            >
                <div className="space-y-3">
                    {roles.map((role) => {
                        const hasRole = selectedUser?.roles?.some(r => r.id === role.id);
                        return (
                            <motion.div
                                key={role.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center justify-between p-3 rounded-lg border ${hasRole ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-gray-500 shrink-0" />
                                        <span className="font-medium truncate">{role.name}</span>
                                    </div>
                                    {role.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{role.description}</p>
                                    )}
                                </div>
                                <Checkbox
                                    isSelected={hasRole}
                                    onValueChange={() => handleToggleRole(role)}
                                    isDisabled={isAssigning || isRevoking}
                                    className="shrink-0 ml-3"
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </DetailModal>
        </div>
    );
}

// User Role Mobile Card Component
function UserRoleMobileCard({ user, actions = [] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                        name={user.name?.charAt(0)?.toUpperCase() || 'U'}
                        size="md"
                        className="bg-primary-100 shrink-0"
                        classNames={{
                            name: 'text-primary-600 font-medium',
                        }}
                    />
                    <div className="min-w-0">
                        <span className="font-medium text-gray-900 block truncate">{user.name || 'Unknown'}</span>
                        <span className="text-sm text-gray-500 block truncate">{user.email}</span>
                    </div>
                </div>
                {actions.length > 0 ? (
                    <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light" aria-label="Row actions" className="min-w-9 min-h-9 shrink-0">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="User role actions">
                            {actions.map((action, index) => (
                                <DropdownItem
                                    key={action.key || index}
                                    color={action.color || (action.danger ? 'danger' : 'default')}
                                    startContent={action.icon}
                                    onPress={() => action.onClick?.()}
                                >
                                    {action.label}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                ) : null}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                    {user.roles?.length > 0 ? (
                        user.roles.map((role) => (
                            <Chip
                                key={role.id}
                                size="sm"
                                color={
                                    role.name === 'super_admin' ? 'danger' :
                                        role.name === 'admin' ? 'warning' :
                                            role.name === 'doctor' ? 'secondary' :
                                                'default'
                                }
                                variant="flat"
                            >
                                {role.name}
                            </Chip>
                        ))
                    ) : (
                        <span className="text-gray-400 text-sm">No roles assigned</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
