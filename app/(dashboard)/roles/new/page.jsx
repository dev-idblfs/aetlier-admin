'use client';

import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, Checkbox, CheckboxGroup, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useCreateRoleMutation, useGetPermissionsQuery } from '@/redux/services/api';
import { useFormSubmit } from '@/hooks/useFormSubmit';

const roleCreateSchema = roleSchema.extend({
    permissions: z.array(z.string()).default([]),
});

export default function NewRolePage() {
    const router = useRouter();
    const [createRole, { isLoading }] = useCreateRoleMutation();
    const { data: permissionsData, isLoading: isLoadingPermissions } = useGetPermissionsQuery();

    const permissions = permissionsData?.permissions || permissionsData || [];

    const methods = useForm({
        ...DEFAULT_FORM_OPTIONS,
        resolver: zodResolver(roleCreateSchema),
        defaultValues: {
            name: '',
            description: '',
            grants_admin_portal: false,
            prefer_admin_redirect_on_login: false,
            permissions: [],
        },
    });

    const { handleSubmit, isSubmitting } = useFormSubmit(methods, {
        fallbackMessage: 'Failed to create role',
        onSubmit: async (data) => {
            await createRole({
                name: data.name,
                description: data.description,
                permission_ids: data.permissions.map((id) => parseInt(id, 10)),
            }).unwrap();
        },
        onSuccess: () => {
            toast.success('Role created successfully');
            router.push('/roles');
        },
    });

    if (isLoadingPermissions) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <FormPageLayout
            title="Add New Role"
            breadcrumbs={[
                { label: 'Roles', href: '/roles' },
                { label: 'Add New' },
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
                                isLoading={isSubmitting || isLoading}
                                startContent={!isSubmitting && !isLoading && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Create Role
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
                                placeholder="Describe the role and its responsibilities"
                                minRows={2}
                            />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Permissions">
                        <Controller
                            name="permissions"
                            control={methods.control}
                            render={({ field }) => (
                                <CheckboxGroup
                                    value={field.value}
                                    onValueChange={field.onChange}
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
                            )}
                        />
                        {permissions.length === 0 && (
                            <p className="text-sm text-gray-500">No permissions available</p>
                        )}
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
