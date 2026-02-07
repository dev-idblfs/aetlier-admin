'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useGetUserQuery, useUpdateUserMutation } from '@/redux/services/api';
import { userUpdateSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormSelect, FormSwitchRow } from '@/components/ui/FormFields';

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
            // Handle cases where API returns 'name' instead of first_name/last_name
            let firstName = user.first_name || '';
            let lastName = user.last_name || '';

            // If name exists but first_name doesn't, try to split name
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
                password: '', // Password should be empty for security/updates
                user_type: user.user_type || 'PATIENT',
                is_active: user.is_active ?? true,
                is_verified: user.is_verified ?? false,
            });
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        try {
            // Combine first_name and last_name into name for API
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
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-gray-600 mb-4">User not found</p>
                <Button onPress={() => router.back()}>Go Back</Button>
            </div>
        );
    }

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
                        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                        <p className="text-sm text-gray-600">Update user account information</p>
                    </div>
                </div>

                {/* Form */}
                <Form methods={methods} onSubmit={onSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    name="first_name"
                                    label="First Name"
                                    placeholder="Enter first name"
                                    isRequired
                                />
                                <FormInput
                                    name="last_name"
                                    label="Last Name"
                                    placeholder="Enter last name"
                                    isRequired
                                />
                                <FormInput
                                    name="email"
                                    label="Email"
                                    type="email"
                                    placeholder="user@example.com"
                                    isRequired
                                    isReadOnly
                                    description="Email cannot be changed"
                                />
                                <FormInput
                                    name="phone"
                                    label="Phone"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelect
                                    name="user_type"
                                    label="User Type"
                                    placeholder="Select user type"
                                >
                                    {USER_TYPES.map((type) => (
                                        <SelectItem key={type.key} value={type.key}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </FormSelect>
                                <FormInput
                                    name="password"
                                    label="New Password"
                                    type="password"
                                    placeholder="Leave blank to keep current"
                                    description="Minimum 8 characters"
                                />
                            </div>
                        </div>

                        {/* Status Settings */}
                        <div className="space-y-4">
                            <FormSwitchRow
                                name="is_active"
                                description="User can login and access the system"
                                label="Active Status"
                            />
                            <FormSwitchRow
                                name="is_verified"
                                label="Email Verified"
                                description="Mark user's email as verified"
                            />
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
                            isLoading={isUpdating || isSubmitting}
                            startContent={(!isUpdating && !isSubmitting) && <Save className="w-4 h-4" />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
