'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, Input, Textarea, Checkbox, CheckboxGroup, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useGetRolesQuery, useUpdateRoleMutation, useGetPermissionsQuery } from '@/redux/services/api';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import { FormDivider } from '@/components/ui/FormFields';

export default function EditRolePage() {
    const router = useRouter();
    const params = useParams();
    const roleId = params.id;

    const { data: rolesData, isLoading: isLoadingRole } = useGetRolesQuery();
    const { data: permissionsData } = useGetPermissionsQuery();
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

    const roles = rolesData?.roles || rolesData || [];
    const role = roles.find(r => r.id === parseInt(roleId));
    const permissions = permissionsData?.permissions || permissionsData || [];

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [],
    });

    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name || '',
                description: role.description || '',
                permissions: (role.permissions || []).map(p => p.id.toString()),
            });
        }
    }, [role]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Please enter role name');
            return;
        }

        try {
            await updateRole({
                id: roleId,
                name: formData.name,
                description: formData.description,
                permission_ids: formData.permissions.map(id => parseInt(id)),
            }).unwrap();

            toast.success('Role updated successfully');
            router.push('/roles');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update role');
        }
    };

    if (isLoadingRole) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!role) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <p className="text-gray-600 mb-4">Role not found</p>
                <Button onPress={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <FormPageLayout
            title="Edit Role"
            breadcrumbs={[
                { label: 'Roles', href: '/roles' },
                { label: role.name || 'Edit' },
            ]}
            cancelHref="/roles"
        >
            <form onSubmit={handleSubmit}>
                <FormCompactCard
                    footer={(
                        <FormActions inline>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={isUpdating}
                                startContent={!isUpdating && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Save Changes
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Basic Information">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <Input
                                label="Role Name"
                                labelPlacement="outside"
                                placeholder="e.g., Manager, Editor, Viewer"
                                value={formData.name}
                                onValueChange={(value) => handleChange('name', value)}
                                isRequired
                                classNames={{
                                    inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
                                }}
                            />
                            <Textarea
                                label="Description"
                                labelPlacement="outside"
                                placeholder="Describe the role and its responsibilities"
                                value={formData.description}
                                onValueChange={(value) => handleChange('description', value)}
                                minRows={2}
                                classNames={{
                                    inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
                                }}
                            />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Permissions">
                        <CheckboxGroup
                            value={formData.permissions}
                            onValueChange={(value) => handleChange('permissions', value)}
                            className="gap-2"
                        >
                            {permissions.map((permission) => (
                                <Checkbox key={permission.id} value={permission.id.toString()}>
                                    <div>
                                        <p className="font-medium text-sm">{permission.name}</p>
                                        {permission.description && (
                                            <p className="text-xs text-gray-600">{permission.description}</p>
                                        )}
                                    </div>
                                </Checkbox>
                            ))}
                        </CheckboxGroup>
                        {permissions.length === 0 && (
                            <p className="text-sm text-gray-500">No permissions available</p>
                        )}
                    </FormSectionCard>
                </FormCompactCard>
            </form>
        </FormPageLayout>
    );
}
