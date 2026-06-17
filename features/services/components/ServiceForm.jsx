'use client';

import { Save } from 'lucide-react';
import { Button, SelectItem } from '@heroui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useGetCategoriesQuery } from '@/redux/services/api';
import { serviceSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormTextarea, FormSelect, FormSwitchRow, FormRow, FormDivider } from '@/components/ui/FormFields';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';

export default function ServiceForm({
    initialData,
    onSubmit,
    isLoading,
    title,
    breadcrumbs = [],
    submitLabel = 'Save',
    cancelHref = '/services',
}) {
    const { data: categories } = useGetCategoriesQuery({ type: 'SERVICE' });

    const defaultValues = {
        name: initialData?.name || '',
        description: initialData?.description || '',
        category: initialData?.category || '',
        duration: initialData?.duration?.toString() || '',
        price: (initialData?.price !== undefined && initialData?.price !== null) ? initialData.price.toString() : '',
        is_active: initialData?.is_active ?? true,
    };

    const methods = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues,
    });

    const { formState: { isSubmitting } } = methods;

    const handleSubmit = async (data) => {
        const formattedData = {
            ...data,
            duration: data.duration ? Number(data.duration) : null,
            price: data.price ? Number(data.price) : null,
        };
        await onSubmit(formattedData, methods);
    };

    return (
        <FormPageLayout
            title={title}
            breadcrumbs={breadcrumbs}
            cancelHref={cancelHref}
        >
            <Form methods={methods} onSubmit={handleSubmit}>
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
                                {submitLabel}
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Service Details">
                        <FormRow columns={3}>
                            <FormInput
                                name="name"
                                label="Service Name"
                                placeholder="Enter service name"
                                isRequired
                                className="lg:col-span-2"
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
                            />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Description">
                        <FormTextarea
                            name="description"
                            label="Description"
                            placeholder="Enter service description and details"
                            minRows={3}
                        />
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Visibility">
                        <FormSwitchRow
                            name="is_active"
                            label="Active Status"
                            description="Service will be available for booking"
                        />
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
