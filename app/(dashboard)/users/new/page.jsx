'use client';

import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCreateUserMutation } from '@/redux/services/api';
import { userSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormSelect, FormSwitchRow, FormRow, FormDivider } from '@/components/ui/FormFields';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';

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
            const name = `${data.first_name} ${data.last_name}`.trim();

            await createUser({
                email: data.email,
                name: name,
                phone: data.phone,
                password: data.password,
                is_active: data.is_active,
            }).unwrap();

            toast.success('User created successfully');
            router.push('/users');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create user');
        }
    };

    return (
        <FormPageLayout
            title="Add New User"
            breadcrumbs={[
                { label: 'Users', href: '/users' },
                { label: 'Add New' },
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
                                isLoading={isLoading || isSubmitting}
                                startContent={!isLoading && !isSubmitting && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Create User
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Basic Information">
                        <FormRow columns={3}>
                            <FormInput name="first_name" label="First Name" placeholder="Enter first name" isRequired />
                            <FormInput name="last_name" label="Last Name" placeholder="Enter last name" isRequired />
                            <FormInput name="email" label="Email" type="email" placeholder="user@example.com" isRequired />
                            <FormInput name="phone" label="Phone" type="tel" placeholder="+91 9876543210" />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Account Settings">
                        <FormRow columns={3}>
                            <FormInput
                                name="password"
                                label="Password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                isRequired
                                description="Minimum 8 characters"
                            />
                            <FormSelect name="user_type" label="User Type" placeholder="Select user type">
                                {USER_TYPES.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                                ))}
                            </FormSelect>
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
