/**
 * Permissions Management Page
 * View and manage system permissions
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Textarea,
    useDisclosure,
    Spinner,
    Chip,
} from '@heroui/react';
import {
    Key,
    Plus,
    Lock,
    Search,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useGetPermissionsQuery,
    useCreatePermissionMutation,
} from '@/redux/services/api';
import { PageHeader, SearchInput, EmptyState, FormModal } from '@/components/ui';

export default function PermissionsPage() {
    const { data: permissions = [], isLoading, error } = useGetPermissionsQuery();
    const [createPermission, { isLoading: isCreating }] = useCreatePermissionMutation();

    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const handleCreate = () => {
        setFormData({ name: '', description: '' });
        onOpen();
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Permission name is required');
            return;
        }

        // Validate format
        const formatRegex = /^[a-z]+\.[a-z]+(\.[a-z]+)?$/;
        if (!formatRegex.test(formData.name)) {
            toast.error('Permission must be in format: resource.action or resource.action.scope');
            return;
        }

        try {
            await createPermission(formData).unwrap();
            toast.success('Permission created successfully');
            onClose();
        } catch (err) {
            toast.error(err.data?.detail || 'Failed to create permission');
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
                    Failed to load permissions. Please try again.
                </CardBody>
            </Card>
        );
    }

    // Group permissions by resource
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const [resource] = perm.name.split('.');
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(perm);
        return acc;
    }, {});

    // Filter by search query
    const filteredGroups = Object.entries(groupedPermissions).reduce((acc, [resource, perms]) => {
        if (!searchQuery) {
            acc[resource] = perms;
            return acc;
        }

        const filteredPerms = perms.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredPerms.length > 0) {
            acc[resource] = filteredPerms;
        }
        return acc;
    }, {});

    // Get action color
    const getActionColor = (permName) => {
        if (permName.includes('.create')) return 'success';
        if (permName.includes('.read')) return 'primary';
        if (permName.includes('.update')) return 'warning';
        if (permName.includes('.delete')) return 'danger';
        if (permName.includes('.manage')) return 'secondary';
        return 'default';
    };

    // Get scope badge
    const getScopeBadge = (permName) => {
        if (permName.includes('.any')) return { text: 'any', color: 'danger' };
        if (permName.includes('.own')) return { text: 'own', color: 'primary' };
        if (permName.includes('.assigned')) return { text: 'assigned', color: 'warning' };
        return null;
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <PageHeader
                title="Permissions"
                description="View and manage system permissions"
                actions={
                    <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={handleCreate}
                        className="w-full sm:w-auto"
                    >
                        <span className="sm:inline">Create Permission</span>
                    </Button>
                }
            />

            {/* Search */}
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search permissions..."
            />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardBody className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                                <Key className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-xl sm:text-2xl font-bold">{permissions.length}</p>
                                <p className="text-xs sm:text-sm text-gray-500">Total Permissions</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card>
                        <CardBody className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary-100 flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-600" />
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-xl sm:text-2xl font-bold">{Object.keys(groupedPermissions).length}</p>
                                <p className="text-xs sm:text-sm text-gray-500">Resource Types</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

            {/* Permissions by Resource */}
            <div className="space-y-3 md:space-y-4">
                {Object.entries(filteredGroups).map(([resource, perms], index) => (
                    <PermissionResourceCard
                        key={resource}
                        resource={resource}
                        permissions={perms}
                        getActionColor={getActionColor}
                        getScopeBadge={getScopeBadge}
                        index={index}
                    />
                ))}
            </div>

            {Object.keys(filteredGroups).length === 0 && (
                <EmptyState
                    icon="search"
                    title="No permissions found"
                    description="No permissions found matching your search."
                />
            )}

            {/* Create Permission Modal */}
            <FormModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onClose={onClose}
                onSubmit={handleSubmit}
                title="Create Permission"
                submitLabel="Create"
                isLoading={isCreating}
            >
                <div className="space-y-4">
                    <Input
                        label="Permission Name"
                        labelPlacement="outside"
                        placeholder="e.g., appointment.create.any"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase() }))}
                        description="Format: resource.action.scope (e.g., appointment.read.own)"
                    />
                    <Textarea
                        label="Description"
                        labelPlacement="outside"
                        placeholder="Describe what this permission allows..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Permission Format Guide:</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li><strong>resource:</strong> appointment, user, doctor, service, etc.</li>
                            <li><strong>action:</strong> create, read, update, delete, manage</li>
                            <li><strong>scope:</strong> own (own records), any (all records), assigned (assigned records)</li>
                        </ul>
                    </div>
                </div>
            </FormModal>
        </div>
    );
}

// Collapsible Permission Resource Card Component
function PermissionResourceCard({ resource, permissions, getActionColor, getScopeBadge, index }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card>
                <CardHeader
                    className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center justify-between w-full">
                        <h3 className="text-base md:text-lg font-semibold capitalize flex items-center gap-2">
                            <Key className="w-4 h-4 md:w-5 md:h-5 text-primary-500" />
                            {resource}
                        </h3>
                        <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat">{permissions.length}</Chip>
                            <Button size="sm" variant="light" isIconOnly>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CardBody className="pt-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                                    {permissions.map((perm) => {
                                        const scope = getScopeBadge(perm.name);
                                        return (
                                            <div
                                                key={perm.id}
                                                className="flex flex-col gap-1 p-2 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <span className="text-xs md:text-sm font-mono font-medium truncate">{perm.name}</span>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Chip size="sm" color={getActionColor(perm.name)} variant="flat">
                                                            {perm.name.split('.')[1]}
                                                        </Chip>
                                                        {scope && (
                                                            <Chip size="sm" color={scope.color} variant="dot">
                                                                {scope.text}
                                                            </Chip>
                                                        )}
                                                    </div>
                                                </div>
                                                {perm.description && (
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{perm.description}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardBody>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}
