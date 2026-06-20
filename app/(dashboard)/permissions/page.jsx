'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    useDisclosure,
    Spinner,
    Chip,
} from '@heroui/react';
import {
    Key,
    Plus,
    Lock,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useGetPermissionsQuery,
    useCreatePermissionMutation,
} from '@/redux/services/api';
import {
    ListPageLayout,
    SearchInput,
    EmptyState,
    FormModal,
    FormInput,
    FormTextarea,
    DEFAULT_FORM_OPTIONS,
} from '@/components/ui';
import { permissionCreateSchema } from '@/lib/validation';
import { useFormSubmit } from '@/hooks/useFormSubmit';

export default function PermissionsPage() {
    const { data: permissions = [], isLoading, error } = useGetPermissionsQuery();
    const [createPermission, { isLoading: isCreating }] = useCreatePermissionMutation();

    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [searchQuery, setSearchQuery] = useState('');

    const methods = useForm({
        ...DEFAULT_FORM_OPTIONS,
        resolver: zodResolver(permissionCreateSchema),
        defaultValues: { name: '', description: '' },
    });

    const handleCreate = () => {
        methods.reset({ name: '', description: '' });
        onOpen();
    };

    const { handleSubmit: submitHandler, isSubmitting } = useFormSubmit(methods, {
        fallbackMessage: 'Failed to create permission',
        onSubmit: async (data) => {
            await createPermission({
                name: data.name.toLowerCase(),
                description: data.description || undefined,
            }).unwrap();
        },
        onSuccess: () => {
            toast.success('Permission created successfully');
            onClose();
        },
    });

    const onSubmit = methods.handleSubmit(submitHandler);

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

    const groupedPermissions = permissions.reduce((acc, perm) => {
        const [resource] = perm.name.split('.');
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(perm);
        return acc;
    }, {});

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

    const getActionColor = (permName) => {
        if (permName.includes('.create')) return 'success';
        if (permName.includes('.read')) return 'primary';
        if (permName.includes('.update')) return 'warning';
        if (permName.includes('.delete')) return 'danger';
        return 'default';
    };

    const getScopeBadge = (permName) => {
        if (permName.endsWith('.own')) return { text: 'own', color: 'secondary' };
        if (permName.endsWith('.any')) return { text: 'any', color: 'primary' };
        if (permName.endsWith('.assigned')) return { text: 'assigned', color: 'warning' };
        return null;
    };

    return (
        <ListPageLayout
            title="Permissions"
            breadcrumbs={[{ label: 'Permissions' }]}
            actions={(
                <Button
                    color="primary"
                    size="sm"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleCreate}
                >
                    Add Permission
                </Button>
            )}
            toolbar={(
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search permissions..."
                />
            )}
        >
            <div className="space-y-4">
                {Object.entries(filteredGroups).map(([resource, perms], index) => (
                    <PermissionGroup
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

            <FormModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                onClose={onClose}
                onSubmit={handleSubmit}
                title="Create Permission"
                submitLabel="Create"
                isLoading={isCreating || isSubmitting}
            >
                <FormProvider {...methods}>
                    <div className="space-y-4">
                        <FormInput
                            name="name"
                            label="Permission Name"
                            placeholder="e.g., appointment.create.any"
                            description="Format: resource.action.scope (e.g., appointment.read.own)"
                        />
                        <FormTextarea
                            name="description"
                            label="Description"
                            placeholder="Describe what this permission allows..."
                            minRows={2}
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
                </FormProvider>
            </FormModal>
        </ListPageLayout>
    );
}

function PermissionGroup({ resource, permissions, getActionColor, getScopeBadge, index }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-primary-600" />
                        <h3 className="text-lg font-semibold capitalize">{resource}</h3>
                        <Chip size="sm" variant="flat">{permissions.length}</Chip>
                    </div>
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
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
