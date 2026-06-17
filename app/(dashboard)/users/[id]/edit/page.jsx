'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useGetUserQuery, useUpdateUserMutation } from '@/redux/services/api';
import { userUpdateSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormSelect, FormSwitchRow, FormRow, FormDivider } from '@/components/ui/FormFields';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';

const USER_TYPES = [
    { key: 'PATIENT', label: 'Patient' },
    { key: 'DOCTOR', label: 'Doctor' },
    { key: 'ADMIN', label: 'Admin' },
];

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id;

    const { data: user, isLoading: isLoadingUser } = useGetUserQuery(userId);
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

    const methods = useForm({
        resolver: zodResolver(userUpdateSchema),
        defaultValues: {
            email: '',
            first_name: '',
            last_name: '',
            phone: '',
            password: '',
            user_type: 'PATIENT',
            is_active: true,
            is_verified: false,
        },
    });

    const { reset, formState: { isSubmitting } } = methods;

    useEffect(() => {
        if (user) {
            let firstName = user.first_name || '';
            let lastName = user.last_name || '';

            if (!firstName && user.name) {
                const nameParts = user.name.split(' ');
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
            }

            reset({
                email: user.email || '',
                first_name: firstName,
                last_name: lastName,
                phone: user.phone || '',
                password: '',
                user_type: user.user_type || 'PATIENT',
                is_active: user.is_active ?? true,
                is_verified: user.is_verified ?? false,
            });
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        try {
            const name = `${data.first_name} ${data.last_name}`.trim();

            await updateUser({
                id: userId,
                name: name,
                phone: data.phone,
                is_active: data.is_active,
                is_verified: data.is_verified,
                ...(data.password ? { password: data.password } : {}),
            }).unwrap();

            toast.success('User updated successfully');
            router.push('/users');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update user');
        }
    };

    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <p className="text-gray-600 mb-4">User not found</p>
                <Button onPress={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const displayName = user.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user.name || 'Edit';

    return (
        <FormPageLayout
            title="Edit User"
            breadcrumbs={[
                { label: 'Users', href: '/users' },
                { label: displayName },
            ]}
            cancelHref="/users"
        >
            <Form methods={methods} onSubmit={onSubmit}>
                <FormCompactCard
                    footer={(
                        <FormActions inline>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={isUpdating || isSubmitting}
                                startContent={(!isUpdating && !isSubmitting) && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Save Changes
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Basic Information">
                        <FormRow columns={3}>
                            <FormInput name="first_name" label="First Name" placeholder="Enter first name" isRequired />
                            <FormInput name="last_name" label="Last Name" placeholder="Enter last name" isRequired />
                            <FormInput
                                name="email"
                                label="Email"
                                type="email"
                                placeholder="user@example.com"
                                isRequired
                                isReadOnly
                                description="Email cannot be changed"
                            />
                            <FormInput name="phone" label="Phone" type="tel" placeholder="+91 9876543210" />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Account Settings">
                        <FormRow columns={3}>
                            <FormSelect name="user_type" label="User Type" placeholder="Select user type">
                                {USER_TYPES.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                                ))}
                            </FormSelect>
                            <FormInput
                                name="password"
                                label="New Password"
                                type="password"
                                placeholder="Leave blank to keep current"
                                description="Minimum 8 characters"
                            />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Status">
                        <div className="space-y-2">
                            <FormSwitchRow
                                name="is_active"
                                label="Active Status"
                                description="User can login and access the system"
                            />
                            <FormSwitchRow
                                name="is_verified"
                                label="Email Verified"
                                description="Mark user's email as verified"
                            />
                        </div>
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
