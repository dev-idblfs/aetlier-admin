'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Textarea, Checkbox, CheckboxGroup } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useCreateRoleMutation, useGetPermissionsQuery } from '@/redux/services/api';

export default function NewRolePage() {
    const router = useRouter();
    const [createRole, { isLoading }] = useCreateRoleMutation();
    const { data: permissionsData } = useGetPermissionsQuery();

    const permissions = permissionsData?.permissions || permissionsData || [];

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [],
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name) {
            toast.error('Please enter role name');
            return;
        }

        try {
            await createRole({
                name: formData.name,
                description: formData.description,
                permission_ids: formData.permissions.map(id => parseInt(id)),
            }).unwrap();

            toast.success('Role created successfully');
            router.push('/roles');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create role');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={() => router.back()}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Role</h1>
                        <p className="text-sm text-gray-600">Create a new role with permissions</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="space-y-4">
                                <Input
                                    label="Role Name"
                                    placeholder="e.g., Manager, Editor, Viewer"
                                    value={formData.name}
                                    onValueChange={(value) => handleChange('name', value)}
                                    isRequired
                                />
                                <Textarea
                                    label="Description"
                                    placeholder="Describe the role and its responsibilities"
                                    value={formData.description}
                                    onValueChange={(value) => handleChange('description', value)}
                                    minRows={3}
                                />
                            </div>
                        </div>

                        {/* Permissions */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Permissions</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Select the permissions this role should have
                            </p>
                            <CheckboxGroup
                                value={formData.permissions}
                                onValueChange={(value) => handleChange('permissions', value)}
                                className="gap-3"
                            >
                                {permissions.map((permission) => (
                                    <Checkbox key={permission.id} value={permission.id.toString()}>
                                        <div>
                                            <p className="font-medium">{permission.name}</p>
                                            {permission.description && (
                                                <p className="text-sm text-gray-600">{permission.description}</p>
                                            )}
                                        </div>
                                    </Checkbox>
                                ))}
                            </CheckboxGroup>
                            {permissions.length === 0 && (
                                <p className="text-sm text-gray-500">No permissions available</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            variant="flat"
                            onPress={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            type="submit"
                            isLoading={isLoading}
                            startContent={!isLoading && <Save className="w-4 h-4" />}
                        >
                            Create Role
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
