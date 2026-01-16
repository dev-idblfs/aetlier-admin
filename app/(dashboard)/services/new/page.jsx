'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Textarea, Switch, Select, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useCreateServiceMutation } from '@/redux/services/api';

const SERVICE_CATEGORIES = [
    { key: 'medi-care', label: 'Medi Care' },
    { key: 'skin-treatment', label: 'Skin Treatment' },
    { key: 'laser-treatments', label: 'Laser Treatments' },
    { key: 'semi-permanent-makeup', label: 'Semi Permanent Makeup' },
    { key: 'hair-treatments', label: 'Hair Treatments' },
    { key: 'gynae-care', label: 'Gynae Care' },
    { key: 'skincare', label: 'Skincare' },
    { key: 'wellness', label: 'Wellness' },
    { key: 'cosmetic', label: 'Cosmetic' },
    { key: 'therapy', label: 'Therapy' },
];

export default function NewServicePage() {
    const router = useRouter();
    const [createService, { isLoading }] = useCreateServiceMutation();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'medi-care',
        duration: '',
        price: '',
        is_active: true,
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await createService({
                ...formData,
                duration: formData.duration ? parseInt(formData.duration) : null,
                price: formData.price ? parseFloat(formData.price) : null,
            }).unwrap();

            toast.success('Service created successfully');
            router.push('/services');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create service');
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
                        <h1 className="text-2xl font-bold text-gray-900">Add New Service</h1>
                        <p className="text-sm text-gray-600">Create a new service offering</p>
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
                                    label="Service Name"
                                    placeholder="Enter service name"
                                    value={formData.name}
                                    onValueChange={(value) => handleChange('name', value)}
                                    isRequired
                                    className="md:col-span-2"
                                />
                                <Select
                                    label="Category"
                                    placeholder="Select category"
                                    selectedKeys={[formData.category]}
                                    onSelectionChange={(keys) => handleChange('category', Array.from(keys)[0])}
                                    isRequired
                                >
                                    {SERVICE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.key} value={cat.key}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Input
                                    label="Duration (minutes)"
                                    type="number"
                                    placeholder="30"
                                    value={formData.duration}
                                    onValueChange={(value) => handleChange('duration', value)}
                                />
                                <Input
                                    label="Price (₹)"
                                    type="number"
                                    placeholder="500"
                                    value={formData.price}
                                    onValueChange={(value) => handleChange('price', value)}
                                    className="md:col-span-2"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <Textarea
                                label="Description"
                                placeholder="Enter service description and details"
                                value={formData.description}
                                onValueChange={(value) => handleChange('description', value)}
                                minRows={4}
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Active Status</p>
                                <p className="text-sm text-gray-600">Service will be available for booking</p>
                            </div>
                            <Switch
                                isSelected={formData.is_active}
                                onValueChange={(value) => handleChange('is_active', value)}
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
                            isLoading={isLoading}
                            startContent={!isLoading && <Save className="w-4 h-4" />}
                        >
                            Create Service
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
