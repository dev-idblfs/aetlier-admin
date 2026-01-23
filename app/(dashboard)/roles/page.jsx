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
} from '@heroui/react';
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Key,
    Users,
    Lock,
    ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageHeader, ConfirmModal, MobileCard, EmptyState, SearchInput, FormModal, DetailModal } from '@/components/ui';
import {
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useGetPermissionsQuery,
    useAddPermissionToRoleMutation,
    useRemovePermissionFromRoleMutation,
    useGetUsersQuery,
    useAssignUserRoleMutation,
    useRevokeUserRoleMutation,
} from '@/redux/services/api';
import { motion } from 'framer-motion';

export default function RolesPage() {
    const [selectedTab, setSelectedTab] = useState('roles');

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <PageHeader
                title="Roles"
                description="Manage user roles and permissions"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Roles' },
                ]}
            />

            {/* Tabs - Scrollable on mobile */}
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
        </div>
    );
}

// ============================================================================
// ROLES TAB
// ============================================================================

function RolesTab() {
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
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleCreate = () => {
        setEditingRole(null);
        setFormData({ name: '', description: '' });
        onOpen();
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({ name: role.name, description: role.description || '' });
        onOpen();
    };

    const handleManagePermissions = (role) => {
        setSelectedRole(role);
        onPermOpen();
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Role name is required');
            return;
        }

        try {
            if (editingRole) {
                await updateRole({ id: editingRole.id, ...formData }).unwrap();
                toast.success('Role updated successfully');
            } else {
                await createRole(formData).unwrap();
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

    // System roles that cannot be deleted
    const systemRoles = ['super_admin', 'admin', 'doctor', 'patient'];

    // Pagination
    const totalPages = Math.ceil(roles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRoles = roles.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                    Showing {roles.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, roles.length)} of {roles.length} role{roles.length !== 1 ? 's' : ''}
                </span>
                <Button
                    color="primary"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleCreate}
                    size="sm"
                >
                    <span className="hidden sm:inline">Create Role</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card>
                    <CardBody className="p-0">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedRoles.map((role) => (
                                    <tr key={role.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-primary-500" />
                                                <span className="font-medium text-gray-900">{role.name}</span>
                                                {systemRoles.includes(role.name) && (
                                                    <Chip size="sm" color="warning" variant="flat">System</Chip>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {role.description || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                                startContent={<Key className="w-3 h-3" />}
                                                onPress={() => handleManagePermissions(role)}
                                            >
                                                {role.permissions?.length || 0}
                                            </Button>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="flat" isIconOnly onPress={() => handleEdit(role)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {!systemRoles.includes(role.name) && (
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="danger"
                                                        isIconOnly
                                                        onPress={() => handleDeleteClick(role)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {paginatedRoles.length === 0 ? (
                    <EmptyState
                        icon="file"
                        title="No roles"
                        description="Create your first role to get started"
                        actionLabel="Create Role"
                        onAction={handleCreate}
                    />
                ) : (
                    paginatedRoles.map((role) => (
                        <RoleMobileCard
                            key={role.id}
                            role={role}
                            isSystem={systemRoles.includes(role.name)}
                            onEdit={() => handleEdit(role)}
                            onDelete={() => handleDeleteClick(role)}
                            onManagePermissions={() => handleManagePermissions(role)}
                        />
                    ))
                )}
            </div>

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
                        classNames={{
                            wrapper: "gap-2",
                            item: "w-8 h-8 text-sm",
                        }}
                    />
                </div>
            )}

            {/* Create/Edit Role Modal */}
            <FormModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onClose={onClose}
                onSubmit={handleSubmit}
                title={editingRole ? 'Edit Role' : 'Create Role'}
                submitLabel={editingRole ? 'Update' : 'Create'}
                isLoading={isCreating || isUpdating}
            >
                <div className="space-y-4">
                    <Input
                        label="Role Name"
                        labelPlacement="outside"
                        placeholder="e.g., manager"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        isDisabled={editingRole && systemRoles.includes(editingRole.name)}
                        size="sm"
                    />
                    <Textarea
                        label="Description"
                        labelPlacement="outside"
                        placeholder="Describe what this role can do..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                </div>
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
        </div>
    );
}

// Role Mobile Card Component
function RoleMobileCard({ role, isSystem, onEdit, onDelete, onManagePermissions }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{role.name}</span>
                            {isSystem && (
                                <Chip size="sm" color="warning" variant="flat">System</Chip>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1">{role.description || 'No description'}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<Key className="w-3 h-3" />}
                    onPress={onManagePermissions}
                >
                    {role.permissions?.length || 0} permissions
                </Button>

                <div className="flex gap-1">
                    <Button size="sm" variant="flat" isIconOnly onPress={onEdit}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    {!isSystem && (
                        <Button size="sm" variant="flat" color="danger" isIconOnly onPress={onDelete}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
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
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card>
                    <CardBody className="p-0">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    name={user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    size="sm"
                                                    className="bg-primary-100"
                                                    classNames={{
                                                        name: 'text-primary-600 font-medium',
                                                    }}
                                                />
                                                <span className="font-medium text-gray-900">{user.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                                        <td className="px-4 py-3">
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
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                                startContent={<Shield className="w-3 h-3" />}
                                                onPress={() => handleManageRoles(user)}
                                            >
                                                Manage
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {users.length === 0 ? (
                    <EmptyState
                        icon="search"
                        title="No users"
                        description="No users found in the system"
                    />
                ) : (
                    users.map((user) => (
                        <UserRoleMobileCard
                            key={user.id}
                            user={user}
                            onManageRoles={() => handleManageRoles(user)}
                        />
                    ))
                )}
            </div>

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
function UserRoleMobileCard({ user, onManageRoles }) {
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
                <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    isIconOnly
                    onPress={onManageRoles}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
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
