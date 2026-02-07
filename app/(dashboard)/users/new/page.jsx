'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCreateUserMutation } from '@/redux/services/api';
import { userSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormSelect, FormSwitchRow } from '@/components/ui/FormFields';

const USER_TYPES = [
    { key: 'PATIENT', label: 'Patient' },
    { key: 'DOCTOR', label: 'Doctor' },
    { key: 'ADMIN', label: 'Admin' },
];

export default function NewUserPage() {
    const router = useRouter();
    const [createUser, { isLoading }] = useCreateUserMutation();

    const methods = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            phone: '',
            user_type: 'PATIENT',
            is_active: true,
            is_verified: false,
        },
    });

    const { formState: { isSubmitting } } = methods;

    const onSubmit = async (data) => {
        try {
            // Combine first_name and last_name into name for API
            const name = `${data.first_name} ${data.last_name}`.trim();

            await createUser({
                email: data.email,
                name: name,
                phone: data.phone,
                password: data.password,
                is_active: data.is_active,
                // Note: is_verified might need separate handling or backend support
            }).unwrap();

            toast.success('User created successfully');
            router.push('/users');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create user');
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
                        <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
                        <p className="text-sm text-gray-600">Create a new user account</p>
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
                                <FormInput
                                    name="password"
                                    label="Password"
                                    type="password"
                                    placeholder="Minimum 8 characters"
                                    isRequired
                                    description="Minimum 8 characters"
                                />
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
                            </div>
                        </div>

                        {/* Status Settings */}
                        <div className="space-y-4">
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
                            isLoading={isLoading || isSubmitting}
                            startContent={!isLoading && !isSubmitting && <Save className="w-4 h-4" />}
                        >
                            Create User
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
