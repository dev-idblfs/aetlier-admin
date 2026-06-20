'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, Checkbox, CheckboxGroup, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roleSchema } from '@/lib/validation';
import {
    Form,
    FormErrorSummary,
    FormInput,
    FormTextarea,
    FormDivider,
    DEFAULT_FORM_OPTIONS,
} from '@/components/ui';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import { useGetRolesQuery, useUpdateRoleMutation, useGetPermissionsQuery } from '@/redux/services/api';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { z } from 'zod';

const roleEditSchema = roleSchema.extend({
    permissions: z.array(z.string()).default([]),
});

export default function EditRolePage() {
    const router = useRouter();
    const params = useParams();
    const roleId = params.id;

    const { data: rolesData, isLoading: isLoadingRole } = useGetRolesQuery();
    const { data: permissionsData } = useGetPermissionsQuery();
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

    const roles = rolesData?.roles || rolesData || [];
    const role = roles.find((r) => r.id === parseInt(roleId));
    const permissions = permissionsData?.permissions || permissionsData || [];

    const methods = useForm({
        ...DEFAULT_FORM_OPTIONS,
        resolver: zodResolver(roleEditSchema),
        defaultValues: {
            name: '',
            description: '',
            grants_admin_portal: false,
            prefer_admin_redirect_on_login: false,
            permissions: [],
        },
    });

    useEffect(() => {
        if (role) {
            methods.reset({
                name: role.name || '',
                description: role.description || '',
                grants_admin_portal: role.grants_admin_portal || false,
                prefer_admin_redirect_on_login: role.prefer_admin_redirect_on_login || false,
                permissions: (role.permissions || []).map((p) => p.id.toString()),
            });
        }
    }, [role, methods]);

    const { handleSubmit, isSubmitting } = useFormSubmit(methods, {
        fallbackMessage: 'Failed to update role',
        onSubmit: async (data) => {
            await updateRole({
                id: roleId,
                name: data.name,
                description: data.description,
                permission_ids: data.permissions.map((id) => parseInt(id, 10)),
            }).unwrap();
        },
        onSuccess: () => {
            toast.success('Role updated successfully');
            router.push('/roles');
        },
    });

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
            <Form methods={methods} onSubmit={handleSubmit}>
                <FormCompactCard
                    footer={(
                        <FormActions inline>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={isSubmitting || isUpdating}
                                startContent={!isSubmitting && !isUpdating && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Save Changes
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormErrorSummary error={methods.formState.errors.root?.message} />

                    <FormSectionCard embedded title="Basic Information">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <FormInput
                                name="name"
                                label="Role Name"
                                placeholder="e.g., Manager, Editor, Viewer"
                                isRequired
                            />
                            <FormTextarea
                                name="description"
                                label="Description"
                                placeholder="Describe this role..."
                                minRows={2}
                            />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Permissions">
                        <Controller
                            name="permissions"
                            control={methods.control}
                            render={({ field, fieldState: { error } }) => (
                                <div>
                                    <CheckboxGroup
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        className="gap-2"
                                    >
                                        {permissions.map((permission) => (
                                            <Checkbox key={permission.id} value={permission.id.toString()}>
                                                {permission.name}
                                            </Checkbox>
                                        ))}
                                    </CheckboxGroup>
                                    {error?.message && (
                                        <p className="mt-1 text-sm text-red-600">{error.message}</p>
                                    )}
                                </div>
                            )}
                        />
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
