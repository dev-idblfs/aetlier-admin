'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useGetServiceQuery, useUpdateServiceMutation, useGetCategoriesQuery } from '@/redux/services/api';
import { serviceSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormTextarea, FormSelect, FormSwitchRow } from '@/components/ui/FormFields';



export default function EditServicePage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.id;

    const { data: service, isLoading: isLoadingService } = useGetServiceQuery(serviceId);
    const { data: categories } = useGetCategoriesQuery({ type: 'SERVICE' });
    const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();

    const methods = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            description: '',
            category: '',
            duration: '',
            price: '',
            is_active: true,
        },
    });

    const { reset, formState: { isSubmitting } } = methods;

    useEffect(() => {
        if (service) {
            reset({
                name: service.name || '',
                description: service.description || '',
                category: service.category || '',
                duration: service.duration?.toString() || '',
                price: (service.price !== undefined && service.price !== null) ? service.price.toString() : '',
                is_active: service.is_active ?? true,
            });
        }
    }, [service, reset]);

    const onSubmit = async (data) => {
        try {
            await updateService({
                id: serviceId,
                ...data,
                duration: data.duration ? Number(data.duration) : null,
                price: data.price ? Number(data.price) : null,
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
                <Form methods={methods} onSubmit={onSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    name="name"
                                    label="Service Name"
                                    placeholder="Enter service name"
                                    isRequired
                                    className="md:col-span-2"
                                />
                                <FormSelect
                                    name="category"
                                    label="Category"
                                    placeholder="Select category"
                                    isRequired
                                >
                                    {(categories || []).map((cat) => (
                                        <SelectItem key={cat.name} value={cat.name}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </FormSelect>
                                <FormInput
                                    name="duration"
                                    label="Duration (minutes)"
                                    type="number"
                                    placeholder="30"
                                />
                                <FormInput
                                    name="price"
                                    label="Price (₹)"
                                    type="number"
                                    placeholder="500"
                                    className="md:col-span-2"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <FormTextarea
                                name="description"
                                label="Description"
                                placeholder="Enter service description and details"
                                minRows={4}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <FormSwitchRow
                                name="is_active"
                                label="Active Status"
                                description="Service will be available for booking"
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
                            startContent={!isUpdating && !isSubmitting && <Save className="w-4 h-4" />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
