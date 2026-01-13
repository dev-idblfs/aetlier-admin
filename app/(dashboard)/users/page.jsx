/**
 * Users Management Page
 * Mobile-first responsive with card/table view switching at md breakpoint
 */

'use client';

import { useState, useMemo } from 'react';
import {
    Users as UsersIcon,
    Search,
    MoreVertical,
    Shield,
    Eye,
    X,
    ChevronDown,
    Plus,
    Edit,
    Trash2,
    UserPlus,
} from 'lucide-react';
import {
    Button,
    Select,
    SelectItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    useDisclosure,
    Avatar,
    Chip,
    Input,
    Switch,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import {
    PageHeader,
    StatusBadge,
    Card,
    SearchInput,
    FilterPanel,
    ResponsiveTable,
    MobileCard,
    ConfirmModal,
    FormModal,
    DetailModal,
    DetailRow,
    FormRow,
    FormSwitchRow,
} from '@/components/ui';
import {
    useGetUsersQuery,
    useGetRolesQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useAssignUserRoleMutation,
    useRevokeUserRoleMutation,
} from '@/redux/services/api';
import { formatDate } from '@/utils/dateFormatters';
import { motion } from 'framer-motion';

export default function UsersPage() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState('');

    // Modals
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isRoleOpen, onOpen: onRoleOpen, onOpenChange: onRoleOpenChange } = useDisclosure();
    const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormOpenChange, onClose: onFormClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange, onClose: onDeleteClose } = useDisclosure();

    // Form state
    const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        phone: '',
        password: '',
        is_active: true,
    });

    // API hooks
    const { data: usersData, isLoading, refetch } = useGetUsersQuery({});
    const { data: rolesData } = useGetRolesQuery();
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
    const [assignRole, { isLoading: isAssigning }] = useAssignUserRoleMutation();
    const [revokeRole, { isLoading: isRevoking }] = useRevokeUserRoleMutation();

    const roles = useMemo(() => rolesData || [], [rolesData]);

    // Extract users array from response
    const usersArray = useMemo(() => {
        if (Array.isArray(usersData)) return usersData;
        if (usersData?.users && Array.isArray(usersData.users)) return usersData.users;
        return [];
    }, [usersData]);

    // Filter users
    const users = useMemo(() => {
        let filtered = usersArray;
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(user =>
                user.name?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower)
            );
        }
        if (roleFilter) {
            filtered = filtered.filter(user => {
                const userRoles = user.roles?.map(r => r.name) || [];
                return userRoles.includes(roleFilter);
            });
        }
        return filtered;
    }, [usersArray, search, roleFilter]);

    // Role filter options
    const roleOptions = useMemo(() => {
        const uniqueRoles = new Set();
        usersArray.forEach(user => {
            (user.roles || []).forEach(role => uniqueRoles.add(role.name));
        });
        return [
            { value: '', label: 'All Roles' },
            ...Array.from(uniqueRoles).map(name => ({ value: name, label: name }))
        ];
    }, [usersArray]);

    // Handlers
    const handleAddUser = () => {
        setFormMode('create');
        setFormData({ email: '', name: '', phone: '', password: '', is_active: true });
        onFormOpen();
    };

    const handleEditUser = (user) => {
        setFormMode('edit');
        setSelectedUser(user);
        setFormData({
            email: user.email || '',
            name: user.name || '',
            phone: user.phone || '',
            password: '',
            is_active: user.is_active !== false,
        });
        onFormOpen();
    };

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        onDetailOpen();
    };

    const handleRoleManagement = (user) => {
        setSelectedUser(user);
        setSelectedRoleId('');
        onRoleOpen();
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        onDeleteOpen();
    };

    const handleFormSubmit = async () => {
        if (!formData.name?.trim() || !formData.email?.trim()) {
            toast.error('Name and email are required');
            return;
        }

        try {
            if (formMode === 'create') {
                await createUser({
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone || undefined,
                    password: formData.password || undefined,
                    is_active: formData.is_active,
                }).unwrap();
                toast.success('User created successfully');
            } else {
                await updateUser({
                    id: selectedUser.id,
                    name: formData.name,
                    phone: formData.phone || undefined,
                    is_active: formData.is_active,
                }).unwrap();
                toast.success('User updated successfully');
            }
            onFormClose();
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || `Failed to ${formMode} user`);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.id).unwrap();
            toast.success('User deleted successfully');
            onDeleteClose();
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to delete user');
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRoleId) return;
        try {
            await assignRole({
                userId: selectedUser.id,
                roleId: selectedRoleId,
            }).unwrap();
            toast.success('Role assigned successfully');
            refetch();
            setSelectedRoleId('');
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to assign role');
        }
    };

    const handleRevokeRole = async (roleId) => {
        if (!selectedUser) return;
        try {
            await revokeRole({
                userId: selectedUser.id,
                roleId: roleId,
            }).unwrap();
            toast.success('Role revoked successfully');
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to revoke role');
        }
    };

    // Get roles user doesn't have yet
    const availableRoles = useMemo(() => {
        if (!selectedUser) return roles;
        const userRoleIds = (selectedUser.roles || []).map(r => r.id);
        return roles.filter(role => !userRoleIds.includes(role.id));
    }, [selectedUser, roles]);

    const columns = [
        {
            key: 'user',
            label: 'User',
            render: (row) => {
                if (!row) return null;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={row.picture || row.photo_url}
                            name={row.name || 'U'}
                            size="sm"
                        />
                        <div>
                            <p className="font-medium text-gray-900">{row.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{row.email}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'roles',
            label: 'Roles',
            render: (row) => {
                if (!row) return null;
                return (
                    <div className="flex flex-wrap gap-1">
                        {(row.roles || []).length > 0 ? (
                            row.roles.map((role) => (
                                <StatusBadge key={role.id} status={role.name} />
                            ))
                        ) : (
                            <span className="text-gray-400 text-sm">No roles</span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => {
                if (!row) return null;
                return (
                    <Chip
                        size="sm"
                        color={row.is_active !== false ? 'success' : 'default'}
                        variant="flat"
                    >
                        {row.is_active !== false ? 'Active' : 'Inactive'}
                    </Chip>
                );
            },
        },
        {
            key: 'joined',
            label: 'Joined',
            sortable: true,
            render: (row) => {
                if (!row) return null;
                return <span className="text-gray-600">{formatDate(row.created_at)}</span>;
            },
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => {
                if (!row) return null;
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="light" isIconOnly size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="User actions">
                            <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />} onPress={() => handleViewDetails(row)}>
                                View Details
                            </DropdownItem>
                            <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditUser(row)}>
                                Edit User
                            </DropdownItem>
                            <DropdownItem key="role" startContent={<Shield className="w-4 h-4" />} onPress={() => handleRoleManagement(row)}>
                                Manage Roles
                            </DropdownItem>
                            <DropdownItem key="delete" startContent={<Trash2 className="w-4 h-4" />} className="text-danger" color="danger" onPress={() => handleDeleteClick(row)}>
                                Delete User
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Users"
                description="Manage user accounts and roles"
                actions={
                    <Button
                        color="primary"
                        startContent={<UserPlus className="w-4 h-4" />}
                        onPress={handleAddUser}
                        className="w-full sm:w-auto"
                    >
                        Add User
                    </Button>
                }
            />

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search users..."
                    className="flex-1"
                />
                <div className="flex gap-2">
                    <Select
                        placeholder="Filter by role"
                        selectedKeys={roleFilter ? [roleFilter] : []}
                        onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0] || '')}
                        className="w-full sm:w-40"
                        size="sm"
                        classNames={{ trigger: 'bg-white' }}
                    >
                        {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </Select>
                    {(search || roleFilter) && (
                        <Button
                            variant="flat"
                            size="sm"
                            onPress={() => { setSearch(''); setRoleFilter(''); }}
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500">
                {users.length} user{users.length !== 1 ? 's' : ''}
            </div>

            {/* Table/Cards */}
            <ResponsiveTable
                columns={columns}
                data={users}
                isLoading={isLoading}
                emptyState={{
                    icon: 'search',
                    title: 'No users found',
                    description: search || roleFilter ? 'Try adjusting your filters' : 'No users in the system yet',
                }}
                actions={[
                    { label: 'View Details', icon: <Eye className="w-4 h-4" />, onClick: handleViewDetails },
                    { label: 'Edit User', icon: <Edit className="w-4 h-4" />, onClick: handleEditUser },
                    { label: 'Manage Roles', icon: <Shield className="w-4 h-4" />, onClick: handleRoleManagement },
                    { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: handleDeleteClick, danger: true },
                ]}
                renderMobileCard={(user, { onClick, actions }) => (
                    <UserMobileCard user={user} onClick={() => handleViewDetails(user)} actions={actions} />
                )}
            />

            {/* Create/Edit User Modal */}
            <FormModal
                isOpen={isFormOpen}
                onOpenChange={onFormOpenChange}
                title={formMode === 'create' ? 'Add New User' : 'Edit User'}
                submitLabel={formMode === 'create' ? 'Create User' : 'Save Changes'}
                onSubmit={handleFormSubmit}
                isLoading={isCreating || isUpdating}
            >
                <div className="space-y-4">
                    <Input
                        label="Email"
                        labelPlacement="outside"
                        placeholder="user@example.com"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        isRequired
                        isDisabled={formMode === 'edit'}
                    />
                    <Input
                        label="Name"
                        labelPlacement="outside"
                        placeholder="Full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        isRequired
                    />
                    <Input
                        label="Phone"
                        labelPlacement="outside"
                        placeholder="+1 234 567 890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    {formMode === 'create' && (
                        <Input
                            label="Password"
                            labelPlacement="outside"
                            placeholder="Leave empty to send invite"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            description="If left empty, user can set password via email"
                        />
                    )}
                    <FormSwitchRow
                        label="Active Status"
                        description="User can log in when active"
                        isSelected={formData.is_active}
                        onValueChange={(val) => setFormData({ ...formData, is_active: val })}
                    />
                </div>
            </FormModal>

            {/* Detail Modal */}
            <DetailModal
                isOpen={isDetailOpen}
                onOpenChange={onDetailOpenChange}
                title="User Details"
                editLabel="Edit User"
                onEdit={() => handleEditUser(selectedUser)}
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={selectedUser.picture || selectedUser.photo_url}
                                name={selectedUser.name}
                                size="lg"
                                className="w-16 h-16"
                            />
                            <div>
                                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                <p className="text-gray-500">{selectedUser.email}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DetailRow label="Phone" value={selectedUser.phone} />
                            <DetailRow label="Status" value={
                                <Chip size="sm" color={selectedUser.is_active !== false ? 'success' : 'default'} variant="flat">
                                    {selectedUser.is_active !== false ? 'Active' : 'Inactive'}
                                </Chip>
                            } />
                            <DetailRow label="Joined" value={formatDate(selectedUser.created_at)} />
                            <DetailRow label="Roles" value={
                                <div className="flex flex-wrap gap-1">
                                    {(selectedUser.roles || []).map(role => (
                                        <StatusBadge key={role.id} status={role.name} />
                                    ))}
                                    {(!selectedUser.roles || selectedUser.roles.length === 0) && 'No roles'}
                                </div>
                            } />
                        </div>
                    </div>
                )}
            </DetailModal>

            {/* Role Management Modal */}
            <FormModal
                isOpen={isRoleOpen}
                onOpenChange={onRoleOpenChange}
                title="Manage Roles"
                showFooter={false}
            >
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Avatar src={selectedUser.picture} name={selectedUser.name} size="sm" />
                            <div>
                                <p className="font-medium">{selectedUser.name}</p>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Roles</h4>
                            <div className="flex flex-wrap gap-2">
                                {(selectedUser.roles || []).length > 0 ? (
                                    selectedUser.roles.map(role => (
                                        <Chip key={role.id} onClose={() => handleRevokeRole(role.id)} variant="flat" color="primary" isDisabled={isRevoking}>
                                            {role.name}
                                        </Chip>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-sm">No roles assigned</span>
                                )}
                            </div>
                        </div>
                        {availableRoles.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Assign New Role</h4>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Select
                                        placeholder="Select a role"
                                        selectedKeys={selectedRoleId ? [selectedRoleId] : []}
                                        onSelectionChange={(keys) => setSelectedRoleId(Array.from(keys)[0] || '')}
                                        className="flex-1"
                                        size="sm"
                                    >
                                        {availableRoles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                        ))}
                                    </Select>
                                    <Button color="primary" onPress={handleAssignRole} isLoading={isAssigning} isDisabled={!selectedRoleId} className="w-full sm:w-auto">
                                        Assign
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <Button variant="flat" onPress={() => onRoleOpenChange(false)}>Done</Button>
                        </div>
                    </div>
                )}
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                onConfirm={handleDeleteConfirm}
                title="Delete User"
                message={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}

// Mobile User Card
function UserMobileCard({ user, onClick, actions }) {
    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <Avatar src={user.picture || user.photo_url} name={user.name} size="sm" className="w-10 h-10" />
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{user.name}</MobileCard.Title>
                    <MobileCard.Subtitle>{user.email}</MobileCard.Subtitle>
                </div>
                <Chip size="sm" color={user.is_active !== false ? 'success' : 'default'} variant="flat">
                    {user.is_active !== false ? 'Active' : 'Inactive'}
                </Chip>
            </MobileCard.Header>
            <MobileCard.Meta>
                {(user.roles || []).map(role => (
                    <MobileCard.Badge key={role.id}>{role.name}</MobileCard.Badge>
                ))}
                {(!user.roles || user.roles.length === 0) && <span className="text-gray-400">No roles</span>}
            </MobileCard.Meta>
        </MobileCard>
    );
}
