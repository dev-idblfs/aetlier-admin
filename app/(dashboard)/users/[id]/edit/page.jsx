'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Select, SelectItem, Switch, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useGetUserQuery, useUpdateUserMutation } from '@/redux/services/api';

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

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        user_type: 'PATIENT',
        is_active: true,
        is_verified: false,
    });

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

            setFormData({
                email: user.email || '',
                first_name: firstName,
                last_name: lastName,
                phone: user.phone || '',
                user_type: user.user_type || 'PATIENT',
                is_active: user.is_active ?? true,
                is_verified: user.is_verified ?? false,
            });
        }
    }, [user]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.email || !formData.first_name) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            // Combine first_name and last_name into name for API
            const name = `${formData.first_name} ${formData.last_name}`.trim();

            await updateUser({
                id: userId,
                name: name,
                phone: formData.phone,
                is_active: formData.is_active,
                is_verified: formData.is_verified,
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
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    placeholder="Enter first name"
                                    value={formData.first_name}
                                    onValueChange={(value) => handleChange('first_name', value)}
                                    isRequired
                                />
                                <Input
                                    label="Last Name"
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onValueChange={(value) => handleChange('last_name', value)}
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={formData.email}
                                    onValueChange={(value) => handleChange('email', value)}
                                    isRequired
                                    isReadOnly
                                    description="Email cannot be changed"
                                />
                                <Input
                                    label="Phone"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    value={formData.phone}
                                    onValueChange={(value) => handleChange('phone', value)}
                                />
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="User Type"
                                    placeholder="Select user type"
                                    selectedKeys={[formData.user_type]}
                                    onSelectionChange={(keys) => handleChange('user_type', Array.from(keys)[0])}
                                >
                                    {USER_TYPES.map((type) => (
                                        <SelectItem key={type.key} value={type.key}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Status Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Active Status</p>
                                    <p className="text-sm text-gray-600">User can login and access the system</p>
                                </div>
                                <Switch
                                    isSelected={formData.is_active}
                                    onValueChange={(value) => handleChange('is_active', value)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Email Verified</p>
                                    <p className="text-sm text-gray-600">Mark user's email as verified</p>
                                </div>
                                <Switch
                                    isSelected={formData.is_verified}
                                    onValueChange={(value) => handleChange('is_verified', value)}
                                />
                            </div>
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
                            isLoading={isUpdating}
                            startContent={!isUpdating && <Save className="w-4 h-4" />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
