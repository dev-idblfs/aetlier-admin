'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCreateServiceMutation, useGetCategoriesQuery } from '@/redux/services/api';
import { serviceSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormTextarea, FormSelect, FormSwitchRow } from '@/components/ui/FormFields';



export default function NewServicePage() {
    const router = useRouter();
    const [createService, { isLoading }] = useCreateServiceMutation();
    const { data: categories } = useGetCategoriesQuery({ type: 'SERVICE' });

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

    const { formState: { isSubmitting } } = methods;

    const onSubmit = async (data) => {
        try {
            await createService({
                ...data,
                duration: data.duration ? Number(data.duration) : null,
                price: data.price ? Number(data.price) : null,
            }).unwrap();

            toast.success('Service created successfully');
            router.push('/services');
        } catch (error) {
            console.error('Service creation error:', error);
            if (error?.status === 422 && error?.data?.detail) {
                // Handle validation errors from backend
                const details = Array.isArray(error.data.detail) ? error.data.detail : [error.data.detail];
                details.forEach((err) => {
                    const fieldName = err.loc?.[1]; // e.g. ["body", "name"] -> "name"
                    if (fieldName && methods.getValues(fieldName) !== undefined) {
                        methods.setError(fieldName, {
                            type: 'server',
                            message: err.msg || 'Invalid value'
                        });
                    } else {
                        toast.error(err.msg || 'Validation error');
                    }
                });
                if (!details.some(err => err.loc?.[1])) {
                    toast.error('Please check the form for errors');
                }
            } else {
                toast.error(error?.data?.detail || 'Failed to create service');
            }
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
                            isLoading={isLoading || isSubmitting}
                            startContent={!isLoading && !isSubmitting && <Save className="w-4 h-4" />}
                        >
                            Create Service
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
