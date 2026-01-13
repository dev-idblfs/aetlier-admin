/**
 * Navigation Management Page
 * Admin interface to manage sidebar navigation items
 */

'use client';

import { useState, useMemo } from 'react';
import {
    Card,
    CardBody,
    Button,
    Chip,
    Input,
    Switch,
    useDisclosure,
    Spinner,
    Select,
    SelectItem,
} from '@heroui/react';
import {
    Menu,
    Plus,
    Edit,
    Trash2,
    GripVertical,
    ChevronRight,
    ChevronDown,
    LayoutDashboard,
    Calendar,
    Users,
    UserCog,
    Briefcase,
    Settings,
    Shield,
    Key,
    Wallet,
    FileText,
    Receipt,
    Contact,
    BarChart3,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageHeader, ConfirmModal, FormModal } from '@/components/ui';
import {
    useGetAllNavigationQuery,
    useCreateNavigationItemMutation,
    useUpdateNavigationItemMutation,
    useDeleteNavigationItemMutation,
    useUpdateNavigationPermissionsMutation,
    useGetPermissionsQuery,
} from '@/redux/services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Available icons for navigation items
const AVAILABLE_ICONS = [
    { name: 'LayoutDashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { name: 'Calendar', icon: Calendar, label: 'Calendar' },
    { name: 'Users', icon: Users, label: 'Users' },
    { name: 'UserCog', icon: UserCog, label: 'User Settings' },
    { name: 'Briefcase', icon: Briefcase, label: 'Briefcase' },
    { name: 'Settings', icon: Settings, label: 'Settings' },
    { name: 'Shield', icon: Shield, label: 'Shield' },
    { name: 'Key', icon: Key, label: 'Key' },
    { name: 'Wallet', icon: Wallet, label: 'Wallet' },
    { name: 'FileText', icon: FileText, label: 'Document' },
    { name: 'Receipt', icon: Receipt, label: 'Receipt' },
    { name: 'Contact', icon: Contact, label: 'Contact' },
    { name: 'BarChart3', icon: BarChart3, label: 'Chart' },
    { name: 'Menu', icon: Menu, label: 'Menu' },
];

const ICON_MAP = Object.fromEntries(
    AVAILABLE_ICONS.map(({ name, icon }) => [name, icon])
);

const getIcon = (iconName) => {
    return ICON_MAP[iconName] || LayoutDashboard;
};

/**
 * Navigation Item Card Component
 */
function NavigationItemCard({ item, onEdit, onDelete, onManagePermissions, level = 0 }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const IconComponent = getIcon(item.icon);
    const hasChildren = item.children && item.children.length > 0;

    return (
        <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
            <Card className="mb-2">
                <CardBody className="p-3">
                    <div className="flex items-center gap-3">
                        {/* Drag Handle */}
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />

                        {/* Expand/Collapse for items with children */}
                        {hasChildren ? (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}

                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${item.is_active ? 'bg-primary-50' : 'bg-gray-100'}`}>
                            <IconComponent className={`w-4 h-4 ${item.is_active ? 'text-primary-600' : 'text-gray-400'}`} />
                        </div>

                        {/* Label & Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-medium ${!item.is_active ? 'text-gray-400' : ''}`}>
                                    {item.label}
                                </span>
                                {!item.is_active && (
                                    <Chip size="sm" variant="flat" color="default">
                                        Inactive
                                    </Chip>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                                {item.href || 'Parent item (no link)'}
                            </p>
                        </div>

                        {/* Permissions count */}
                        <Chip
                            size="sm"
                            variant="flat"
                            color="secondary"
                            className="cursor-pointer"
                            onClick={() => onManagePermissions(item)}
                        >
                            {item.permissions?.length || 0} permissions
                        </Chip>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => onEdit(item)}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => onDelete(item)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Children */}
            <AnimatePresence>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {item.children.map((child) => (
                            <NavigationItemCard
                                key={child.id}
                                item={child}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onManagePermissions={onManagePermissions}
                                level={level + 1}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function NavigationManagementPage() {
    // API hooks
    const { data: navItems = [], isLoading, isError, refetch } = useGetAllNavigationQuery();
    const { data: permissionsData } = useGetPermissionsQuery();
    const [createNavItem, { isLoading: isCreating }] = useCreateNavigationItemMutation();
    const [updateNavItem, { isLoading: isUpdating }] = useUpdateNavigationItemMutation();
    const [deleteNavItem, { isLoading: isDeleting }] = useDeleteNavigationItemMutation();
    const [updatePermissions, { isLoading: isUpdatingPermissions }] = useUpdateNavigationPermissionsMutation();

    // Modal states
    const createModal = useDisclosure();
    const editModal = useDisclosure();
    const deleteModal = useDisclosure();
    const permissionsModal = useDisclosure();

    // Form states
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        label: '',
        href: '',
        icon: 'LayoutDashboard',
        parent_id: '',
        sort_order: 0,
        is_active: true,
    });
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    // Get flat list of parent items for parent selection
    const parentOptions = useMemo(() => {
        const options = [{ id: '', label: 'None (Top Level)' }];
        navItems.forEach((item) => {
            options.push({ id: item.id, label: item.label });
        });
        return options;
    }, [navItems]);

    // Permissions list
    const allPermissions = useMemo(() => {
        if (!permissionsData?.permissions) return [];
        return permissionsData.permissions.map((p) => ({
            id: p.id,
            name: `${p.resource}.${p.action}.${p.scope}`,
            description: p.description,
        }));
    }, [permissionsData]);

    // Handlers
    const resetForm = () => {
        setFormData({
            label: '',
            href: '',
            icon: 'LayoutDashboard',
            parent_id: '',
            sort_order: 0,
            is_active: true,
        });
        setSelectedItem(null);
    };

    const handleCreate = async () => {
        if (!formData.label) {
            toast.error('Label is required');
            return;
        }

        try {
            await createNavItem({
                label: formData.label,
                href: formData.href || null,
                icon: formData.icon,
                parent_id: formData.parent_id || null,
                sort_order: parseInt(formData.sort_order) || 0,
                is_active: formData.is_active,
            }).unwrap();
            toast.success('Navigation item created');
            createModal.onClose();
            resetForm();
        } catch (error) {
            toast.error('Failed to create navigation item');
        }
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({
            label: item.label,
            href: item.href || '',
            icon: item.icon || 'LayoutDashboard',
            parent_id: item.parent_id || '',
            sort_order: item.sort_order || 0,
            is_active: item.is_active !== false,
        });
        editModal.onOpen();
    };

    const handleUpdate = async () => {
        if (!selectedItem || !formData.label) {
            toast.error('Label is required');
            return;
        }

        try {
            await updateNavItem({
                id: selectedItem.id,
                label: formData.label,
                href: formData.href || null,
                icon: formData.icon,
                parent_id: formData.parent_id || null,
                sort_order: parseInt(formData.sort_order) || 0,
                is_active: formData.is_active,
            }).unwrap();
            toast.success('Navigation item updated');
            editModal.onClose();
            resetForm();
        } catch (error) {
            toast.error('Failed to update navigation item');
        }
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        deleteModal.onOpen();
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;

        try {
            await deleteNavItem(selectedItem.id).unwrap();
            toast.success('Navigation item deleted');
            deleteModal.onClose();
            setSelectedItem(null);
        } catch (error) {
            toast.error('Failed to delete navigation item');
        }
    };

    const handleManagePermissions = (item) => {
        setSelectedItem(item);
        setSelectedPermissions(item.permissions?.map((p) => p.id) || []);
        permissionsModal.onOpen();
    };

    const handleSavePermissions = async () => {
        if (!selectedItem) return;

        try {
            await updatePermissions({
                id: selectedItem.id,
                permission_ids: selectedPermissions,
            }).unwrap();
            toast.success('Permissions updated');
            permissionsModal.onClose();
            setSelectedItem(null);
        } catch (error) {
            toast.error('Failed to update permissions');
        }
    };

    const togglePermission = (permId) => {
        setSelectedPermissions((prev) =>
            prev.includes(permId)
                ? prev.filter((id) => id !== permId)
                : [...prev, permId]
        );
    };

    // Navigation Form Fields
    const formFields = (
        <div className="space-y-4">
            <Input
                label="Label"
                placeholder="e.g., Dashboard"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                isRequired
            />
            <Input
                label="URL Path"
                placeholder="e.g., /dashboard"
                value={formData.href}
                onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                description="Leave empty for parent-only items"
            />
            <Select
                label="Icon"
                selectedKeys={formData.icon ? [formData.icon] : []}
                onSelectionChange={(keys) => setFormData({ ...formData, icon: Array.from(keys)[0] })}
            >
                {AVAILABLE_ICONS.map((iconItem) => {
                    const IconComp = iconItem.icon;
                    return (
                        <SelectItem key={iconItem.name} startContent={<IconComp className="w-4 h-4" />}>
                            {iconItem.label}
                        </SelectItem>
                    );
                })}
            </Select>
            <Select
                label="Parent Item"
                selectedKeys={formData.parent_id ? [formData.parent_id] : ['']}
                onSelectionChange={(keys) => setFormData({ ...formData, parent_id: Array.from(keys)[0] || '' })}
            >
                {parentOptions.map((option) => (
                    <SelectItem key={option.id}>{option.label}</SelectItem>
                ))}
            </Select>
            <Input
                label="Sort Order"
                type="number"
                placeholder="0"
                value={formData.sort_order.toString()}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
            <div className="flex items-center justify-between">
                <span className="text-sm">Active</span>
                <Switch
                    isSelected={formData.is_active}
                    onValueChange={(val) => setFormData({ ...formData, is_active: val })}
                />
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Failed to load navigation items</p>
                <Button onPress={refetch}>Try Again</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Navigation Management"
                description="Configure sidebar navigation items and permissions"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Settings', href: '/settings' },
                    { label: 'Navigation' },
                ]}
                actions={
                    <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={() => {
                            resetForm();
                            createModal.onOpen();
                        }}
                    >
                        Add Item
                    </Button>
                }
            />

            {/* Navigation Items List */}
            <div className="space-y-2">
                {navItems.length === 0 ? (
                    <Card>
                        <CardBody className="py-12 text-center">
                            <Menu className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">No navigation items configured</p>
                            <Button
                                color="primary"
                                variant="flat"
                                startContent={<Plus className="w-4 h-4" />}
                                onPress={() => {
                                    resetForm();
                                    createModal.onOpen();
                                }}
                            >
                                Add First Item
                            </Button>
                        </CardBody>
                    </Card>
                ) : (
                    navItems.map((item) => (
                        <NavigationItemCard
                            key={item.id}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onManagePermissions={handleManagePermissions}
                        />
                    ))
                )}
            </div>

            {/* Create Modal */}
            <FormModal
                isOpen={createModal.isOpen}
                onClose={createModal.onClose}
                title="Add Navigation Item"
                onSubmit={handleCreate}
                isLoading={isCreating}
                submitLabel="Create"
            >
                {formFields}
            </FormModal>

            {/* Edit Modal */}
            <FormModal
                isOpen={editModal.isOpen}
                onClose={() => {
                    editModal.onClose();
                    resetForm();
                }}
                title="Edit Navigation Item"
                onSubmit={handleUpdate}
                isLoading={isUpdating}
                submitLabel="Save Changes"
            >
                {formFields}
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => {
                    deleteModal.onClose();
                    setSelectedItem(null);
                }}
                title="Delete Navigation Item"
                message={`Are you sure you want to delete "${selectedItem?.label}"? ${selectedItem?.children?.length > 0
                        ? `This will also delete ${selectedItem.children.length} child item(s).`
                        : ''
                    }`}
                confirmLabel="Delete"
                confirmColor="danger"
                onConfirm={confirmDelete}
                isLoading={isDeleting}
            />

            {/* Permissions Modal */}
            <FormModal
                isOpen={permissionsModal.isOpen}
                onClose={() => {
                    permissionsModal.onClose();
                    setSelectedItem(null);
                }}
                title={`Permissions for "${selectedItem?.label}"`}
                onSubmit={handleSavePermissions}
                isLoading={isUpdatingPermissions}
                submitLabel="Save Permissions"
                size="2xl"
            >
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-500 mb-4">
                        Select which permissions are required to view this navigation item.
                        Users with any of the selected permissions will see this item.
                    </p>
                    {allPermissions.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No permissions available</p>
                    ) : (
                        allPermissions.map((perm) => (
                            <Card
                                key={perm.id}
                                isPressable
                                onPress={() => togglePermission(perm.id)}
                                className={`${selectedPermissions.includes(perm.id)
                                        ? 'border-primary-500 bg-primary-50'
                                        : ''
                                    }`}
                            >
                                <CardBody className="p-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedPermissions.includes(perm.id)}
                                            onChange={() => togglePermission(perm.id)}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <p className="font-mono text-sm">{perm.name}</p>
                                            {perm.description && (
                                                <p className="text-xs text-gray-500">{perm.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>
            </FormModal>
        </div>
    );
}
