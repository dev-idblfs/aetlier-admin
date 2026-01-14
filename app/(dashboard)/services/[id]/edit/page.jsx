'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Textarea, Switch, Select, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useGetServiceQuery, useUpdateServiceMutation } from '@/redux/services/api';

const SERVICE_CATEGORIES = [
    { key: 'consultation', label: 'Consultation' },
    { key: 'treatment', label: 'Treatment' },
    { key: 'surgery', label: 'Surgery' },
    { key: 'diagnostic', label: 'Diagnostic' },
    { key: 'therapy', label: 'Therapy' },
    { key: 'other', label: 'Other' },
];

export default function EditServicePage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.id;

    const { data: service, isLoading: isLoadingService } = useGetServiceQuery(serviceId);
    const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'consultation',
        duration: '',
        price: '',
        is_active: true,
    });

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name || '',
                description: service.description || '',
                category: service.category || 'consultation',
                duration: service.duration?.toString() || '',
                price: service.price?.toString() || '',
                is_active: service.is_active ?? true,
            });
        }
    }, [service]);

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
            await updateService({
                id: serviceId,
                ...formData,
                duration: formData.duration ? parseInt(formData.duration) : null,
                price: formData.price ? parseFloat(formData.price) : null,
            }).unwrap();

            toast.success('Service updated successfully');
            router.push('/services');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update service');
        }
    };

    if (isLoadingService) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-gray-600 mb-4">Service not found</p>
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
                        <h1 className="text-2xl font-bold text-gray-900">Edit Service</h1>
                        <p className="text-sm text-gray-600">Update service information</p>
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
