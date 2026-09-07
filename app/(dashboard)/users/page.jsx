/**
 * Users Management Page
 * Mobile-first responsive with card/table view switching at md breakpoint
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users as UsersIcon,
    Search,
    Shield,
    Eye,
    X,
    ChevronDown,
    Plus,
    Edit,
    Trash2,
    UserPlus,
} from '@/lib/icons';
import {
    Button,
    Select,
    SelectItem,
    useDisclosure,
    Avatar,
    Chip,
    Input,
    Switch,
    Pagination,
} from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import {
    ListPageLayout,
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
    BulkActionBar,
    FilterBar,
    Alert,
    EntityLink,
    SectionCard,
} from '@/components/ui';
import {
    useGetUsersQuery,
    useGetRolesQuery,
    useDeleteUserMutation,
    useBulkDeleteUsersMutation,
    useAssignUserRoleMutation,
    useRevokeUserRoleMutation,
} from '@/redux/services/api';
import { formatDate } from '@/utils/dateFormatters';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import useBulkSelection from '@/hooks/useBulkSelection';
import useBulkDeleteAction from '@/hooks/useBulkDeleteAction';

export default function UsersPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange, onClose: onDetailClose } = useDisclosure();
    const { isOpen: isRoleOpen, onOpen: onRoleOpen, onOpenChange: onRoleOpenChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange, onClose: onDeleteClose } = useDisclosure();

    const authUser = useSelector((s) => s.auth.user);
    const canDelete = hasPermission(authUser, PERMISSIONS.USER_DELETE);
    const canCreate = hasPermission(authUser, PERMISSIONS.USER_CREATE);
    const canUpdate = hasPermission(authUser, PERMISSIONS.USER_UPDATE_ANY);
    const canView = hasPermission(authUser, PERMISSIONS.USER_READ_ANY);

    // API hooks
    const { data: usersData, isLoading, isError, error, refetch } = useGetUsersQuery({}, { skip: !canView });
    const { data: rolesData } = useGetRolesQuery(undefined, { skip: !canView });
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
    const [assignRole, { isLoading: isAssigning }] = useAssignUserRoleMutation();
    const [revokeRole, { isLoading: isRevoking }] = useRevokeUserRoleMutation();

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, roleFilter]);

    const roles = useMemo(() => rolesData || [], [rolesData]);

    // Extract users array from response
    const usersArray = useMemo(() => {
        if (Array.isArray(usersData)) return usersData;
        if (usersData?.users && Array.isArray(usersData.users)) return usersData.users;
        return [];
    }, [usersData]);

    // Filter users
    const filteredUsers = useMemo(() => {
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

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;

    const {
        selectedIds,
        onSelectionChange,
        clearSelection,
        selectedCount,
        pageItems: users,
    } = useBulkSelection(filteredUsers, currentPage, itemsPerPage);
    const {
        isBulkOpen,
        onBulkOpen,
        onBulkOpenChange,
        handleBulkConfirm,
        isBulkLoading,
    } = useBulkDeleteAction(useBulkDeleteUsersMutation, 'users');

    // Role filter options
    const roleOptions = useMemo(() => {
        const uniqueRoles = new Set();
        usersArray.forEach(user => {
            (user.roles || []).forEach(role => uniqueRoles.add(role.name));
        });
        return Array.from(uniqueRoles).map(name => ({ value: name, label: name }));
    }, [usersArray]);

    // Active filters count
    const activeFiltersCount = [search, roleFilter].filter(Boolean).length;

    const handleClearFilters = () => {
        setSearch('');
        setRoleFilter('');
    };

    // Handlers
    const handleAddUser = () => {
        router.push('/users/new');
    };

    const handleEditUser = (user) => {
        router.push(`/users/${user.id}/edit`);
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
            key: 'type',
            label: 'Type',
            render: (row) => (
                <Chip size="sm" variant="flat" color="default">
                    {row.user_type || 'PATIENT'}
                </Chip>
            ),
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
                return <StatusBadge status={row.is_active !== false ? 'active' : 'inactive'} />;
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
    ];

    return (
        <ListPageLayout
            title="Users"
            breadcrumbs={[{ label: 'Users' }]}
            actions={canCreate ? (
                <Button
                    color="primary"
                    size="sm"
                    startContent={<UserPlus className="w-4 h-4" />}
                    onPress={handleAddUser}
                    className="min-h-11"
                >
                    Add User
                </Button>
            ) : null}
        >
            {isError && (
                <Alert
                    variant="danger"
                    title="Failed to load users"
                    message={error?.data?.detail || error?.message || 'Unable to fetch users. Please try again.'}
                    className="mb-4"
                />
            )}

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search users..."
                activeFiltersCount={activeFiltersCount}
                onClearAll={handleClearFilters}
            >
                <Select
                    label="Role"
                    placeholder="All roles"
                    selectedKeys={roleFilter ? [roleFilter] : ['all']}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] || ''
                        setRoleFilter(value === 'all' ? '' : value)
                    }}
                    size="sm"
                    classNames={{ trigger: 'bg-white' }}
                >
                    <SelectItem key="all" value="all">All roles</SelectItem>
                    {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </Select>
            </FilterBar>

            {/* Results count */}
            <div className="text-sm text-gray-500">
                Showing {filteredUsers.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </div>

            <BulkActionBar
                count={selectedCount}
                onDelete={onBulkOpen}
                onClear={clearSelection}
                canDelete={canDelete}
            />

            {/* Table/Cards */}
            <ResponsiveTable
                columns={columns}
                data={users}
                isLoading={isLoading}
                selectable={canDelete}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
                emptyState={{
                    icon: 'search',
                    title: 'No users found',
                    description: search || roleFilter ? 'Try adjusting your filters' : 'No users in the system yet',
                }}
                actions={[
                    { key: 'view', label: 'View Details', icon: <Eye className="w-4 h-4" />, onClick: handleViewDetails },
                    ...(canUpdate
                        ? [
                            { key: 'edit', label: 'Edit User', icon: <Edit className="w-4 h-4" />, onClick: handleEditUser },
                            { key: 'role', label: 'Manage Roles', icon: <Shield className="w-4 h-4" />, onClick: handleRoleManagement },
                        ]
                        : []),
                    ...(canDelete
                        ? [{ key: 'delete', label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: handleDeleteClick, danger: true }]
                        : []),
                ]}
                renderMobileCard={(user, { onClick, actions }) => (
                    <UserMobileCard user={user} onClick={() => handleViewDetails(user)} actions={actions} />
                )}
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
                        classNames={{
                            wrapper: "gap-2",
                            item: "w-8 h-8 text-sm",
                        }}
                    />
                </div>
            )}

            {/* Create/Edit User Modal - REMOVED, using dedicated pages now */}

            {/* Detail Modal */}
            <DetailModal
                isOpen={isDetailOpen}
                onOpenChange={onDetailOpenChange}
                title="User Details"
                editLabel={canUpdate ? "Edit User" : undefined}
                onEdit={canUpdate ? () => handleEditUser(selectedUser) : undefined}
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
                                <StatusBadge status={selectedUser.is_active !== false ? 'active' : 'inactive'} />
                            } />
                            <DetailRow label="Joined" value={formatDate(selectedUser.created_at)} />
                            <DetailRow label="Type" value={
                                <StatusBadge status={selectedUser.user_type || 'PATIENT'} showIcon={false} />
                            } />
                            <DetailRow label="Roles" value={
                                <div className="flex flex-wrap gap-1">
                                    {(selectedUser.roles || []).map(role => (
                                        <StatusBadge key={role.id} status={role.name} showIcon={false} />
                                    ))}
                                    {(!selectedUser.roles || selectedUser.roles.length === 0) && 'No roles'}
                                </div>
                            } />
                        </div>

                        {/* Related Records */}
                        <SectionCard title="Related Records" embedded className="mt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Appointments</p>
                                    <EntityLink 
                                        href={selectedUser.email ? `/appointments?q=${encodeURIComponent(selectedUser.email)}` : '/appointments'}
                                        className="text-sm"
                                    >
                                        View appointments
                                    </EntityLink>
                                    {!selectedUser.email && (
                                        <p className="text-xs text-gray-400 mt-1">Search by name in appointments list</p>
                                    )}
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Invoices</p>
                                    <EntityLink 
                                        href={selectedUser.email ? `/finance/invoices?search=${encodeURIComponent(selectedUser.email)}` : '/finance/invoices'}
                                        className="text-sm"
                                    >
                                        View invoices
                                    </EntityLink>
                                    {!selectedUser.email && (
                                        <p className="text-xs text-gray-400 mt-1">Search by email in invoices list</p>
                                    )}
                                </div>
                            </div>
                        </SectionCard>
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

            <ConfirmModal
                isOpen={isBulkOpen}
                onClose={() => onBulkOpenChange(false)}
                onConfirm={() => handleBulkConfirm(selectedIds, clearSelection)}
                title={`Delete ${selectedCount} users?`}
                message="Selected users will be soft-deleted and hidden from listings."
                confirmLabel="Delete"
                type="danger"
                isLoading={isBulkLoading}
            />
        </ListPageLayout>
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
                <StatusBadge status={user.is_active !== false ? 'active' : 'inactive'} />
            </MobileCard.Header>
            <MobileCard.Meta>
                <StatusBadge status={user.user_type || 'PATIENT'} showIcon={false} size="sm" />
                {(user.roles || []).map(role => (
                    <StatusBadge key={role.id} status={role.name} showIcon={false} size="sm" />
                ))}
                {(!user.roles || user.roles.length === 0) && <span className="text-gray-400">No roles</span>}
            </MobileCard.Meta>
        </MobileCard>
    );
}
