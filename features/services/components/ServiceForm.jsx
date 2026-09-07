'use client';

import { useMemo, useState } from 'react';
import { Save } from '@/lib/icons';
import { Button, SelectItem } from '@/lib/heroui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';

import {
    useGetCategoriesQuery,
    useUploadServiceImageMutation,
    useGetDoctorsQuery,
} from '@/redux/services/api';
import { serviceSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import {
    FormInput,
    FormTextarea,
    FormSelect,
    FormSwitchRow,
    FormRow,
    FormDivider,
} from '@/components/ui/FormFields';
import {
    FormPageLayout,
    FormSectionCard,
    FormActions,
    FormCompactCard,
    FormFileUpload,
    FormRepeater,
    RelatedLinks,
} from '@/components/ui';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import { normalizeApiList } from '@/utils/normalizeApiList';

const FEE_FIELDS = [
    { key: 'name', label: 'Charge name', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'number', min: 0 },
];

const CONTENT_BLOCK_FIELDS = [
    {
        key: 'title',
        label: 'Title',
        type: 'text',
        required: true,
    },
    {
        key: 'type',
        label: 'Type',
        type: 'select',
        options: [
            { value: 'text', label: 'Text' },
            { value: 'list', label: 'List' },
        ],
    },
    {
        key: 'body',
        label: 'Content',
        type: 'textarea',
        fullWidth: true,
        showWhen: (item) => item.type === 'text',
    },
    {
        key: 'items',
        label: 'List items',
        type: 'tags',
        fullWidth: true,
        showWhen: (item) => item.type === 'list',
    },
];

export default function ServiceForm({
    initialData,
    serviceId,
    onSubmit,
    isLoading,
    title,
    breadcrumbs = [],
    submitLabel = 'Save',
    cancelHref = '/services',
}) {
    const authUser = useSelector((s) => s.auth.user);
    const canAssignDoctors = hasPermission(authUser, PERMISSIONS.DOCTOR_UPDATE);
    const { data: categories } = useGetCategoriesQuery({ type: 'SERVICE' });
    const { data: doctorsData } = useGetDoctorsQuery(
        { active_only: false },
        { skip: !canAssignDoctors }
    );
    const [uploadServiceImage] = useUploadServiceImageMutation();
    const [pendingImageFile, setPendingImageFile] = useState(null);

    const doctorOptions = useMemo(() => {
        const list = normalizeApiList(doctorsData);
        return list
            .map((d) => ({
                id: d.user_id || d.id,
                name:
                    d.name ||
                    [d.first_name, d.last_name].filter(Boolean).join(' ') ||
                    'Doctor',
            }))
            .filter((d) => d.id);
    }, [doctorsData]);

    const defaultValues = {
        name: initialData?.name || '',
        description: initialData?.description || '',
        category_id: initialData?.category_id || '',
        duration: initialData?.duration?.toString() || '',
        base_price:
            initialData?.base_price != null
                ? String(initialData.base_price)
                : '',
        selling_price:
            initialData?.selling_price != null
                ? String(initialData.selling_price)
                : initialData?.price != null
                  ? String(initialData.price)
                  : '',
        fees: initialData?.fees || [],
        content_blocks: initialData?.content_blocks || [],
        image_url: initialData?.image_url || '',
        is_active: initialData?.is_active ?? true,
        doctor_ids: [],
    };

    const methods = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues,
    });

    const {
        control,
        formState: { isSubmitting },
        setValue,
        watch,
    } = methods;

    const selectedDoctorIds = watch('doctor_ids') || [];

    const handleSelectAllDoctors = () => {
        setValue(
            'doctor_ids',
            doctorOptions.map((d) => String(d.id)),
            { shouldDirty: true }
        );
    };

    const handleClearDoctors = () => {
        setValue('doctor_ids', [], { shouldDirty: true });
    };

    const handleImageFileSelect = async (file) => {
        setPendingImageFile(file);

        if (!file) {
            methods.setValue('image_url', '');
            return;
        }

        if (serviceId) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const result = await uploadServiceImage({
                    id: serviceId,
                    formData,
                }).unwrap();
                methods.setValue('image_url', result.image_url || '');
                setPendingImageFile(null);
                toast.success('Image uploaded');
            } catch (error) {
                toast.error(error?.data?.detail || 'Failed to upload image');
            }
        }
    };

    const handleSubmit = async (data) => {
        const sellingPrice = data.selling_price
            ? Number(data.selling_price)
            : null;

        const formattedData = {
            ...data,
            duration: data.duration ? Number(data.duration) : null,
            base_price: data.base_price ? Number(data.base_price) : undefined,
            selling_price: sellingPrice,
            price: sellingPrice,
            fees: (data.fees || []).map((fee) => ({
                name: fee.name,
                amount: Number(fee.amount) || 0,
            })),
            content_blocks: (data.content_blocks || []).map((block, index) => ({
                title: block.title,
                type: block.type,
                body: block.type === 'text' ? block.body || '' : undefined,
                items: block.type === 'list' ? block.items || [] : [],
                sort_order: block.sort_order ?? index,
            })),
        };

        if (canAssignDoctors && Array.isArray(data.doctor_ids) && data.doctor_ids.length > 0) {
            formattedData.doctor_ids = data.doctor_ids.map(String);
        } else {
            delete formattedData.doctor_ids;
        }

        await onSubmit(formattedData, methods, { pendingImageFile });
    };

    const categoryId = watch('category_id') || initialData?.category_id;
    const categoryName =
        (categories || []).find((c) => String(c.id) === String(categoryId))?.name ||
        initialData?.category?.name ||
        'Category';
    const relatedItems = serviceId
        ? [
              {
                  label: categoryName,
                  href: '/services/categories',
                  meta: 'Category',
              },
              {
                  label: 'All services',
                  href: '/services',
                  meta: 'List',
              },
          ]
        : [
              {
                  label: 'Manage categories',
                  href: '/services/categories',
                  meta: 'Categories',
              },
          ];

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
                                startContent={
                                    !isLoading && !isSubmitting && (
                                        <Save className="w-4 h-4" />
                                    )
                                }
                                className="w-full sm:w-auto"
                            >
                                {submitLabel}
                            </Button>
                        </FormActions>
                    )}
                >
                    <RelatedLinks title="Related" items={relatedItems} />

                    <FormDivider />

                    <FormSectionCard embedded title="Service Details">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Controller
                                name="image_url"
                                control={control}
                                render={({ field }) => (
                                    <FormFileUpload
                                        compact
                                        label="Image"
                                        description="PNG, JPEG, WebP · 5MB"
                                        accept="image/*"
                                        value={field.value}
                                        onChange={field.onChange}
                                        onFileSelect={handleImageFileSelect}
                                        className="sm:w-48 shrink-0"
                                    />
                                )}
                            />

                            <div className="flex-1 min-w-0 space-y-3">
                                <FormRow columns={2}>
                                    <FormInput
                                        name="name"
                                        label="Service Name"
                                        placeholder="Enter service name"
                                        isRequired
                                        className="sm:col-span-1"
                                    />
                                    <FormSelect
                                        name="category_id"
                                        label="Category"
                                        placeholder="Select category"
                                        isRequired
                                    >
                                        {(categories || []).map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </FormSelect>
                                </FormRow>

                                <FormRow columns={3}>
                                    <FormInput
                                        name="duration"
                                        label="Duration (min)"
                                        type="number"
                                        placeholder="30"
                                        isRequired
                                    />
                                    <FormInput
                                        name="base_price"
                                        label="Base price"
                                        type="number"
                                        placeholder="MRP"
                                    />
                                    <FormInput
                                        name="selling_price"
                                        label="Selling price"
                                        type="number"
                                        placeholder="Price"
                                        isRequired
                                    />
                                </FormRow>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <FormRepeater
                                name="fees"
                                label="Additional charges"
                                emptyItem={{ name: '', amount: 0 }}
                                fields={FEE_FIELDS}
                                addLabel="Add charge"
                                compact
                                inline
                            />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Description">
                        <FormTextarea
                            name="description"
                            label="Description"
                            placeholder="Brief overview for customers"
                            minRows={2}
                        />

                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <FormRepeater
                                name="content_blocks"
                                label="Content sections"
                                description="Pre-care, post-care, steps, FAQs"
                                emptyItem={{
                                    title: '',
                                    type: 'text',
                                    body: '',
                                    items: [],
                                    sort_order: 0,
                                }}
                                fields={CONTENT_BLOCK_FIELDS}
                                addLabel="Add section"
                                compact
                                reorderable
                            />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Visibility">
                        <FormSwitchRow
                            name="is_active"
                            label="Active"
                            description="Available for booking"
                        />
                    </FormSectionCard>

                    {canAssignDoctors && (
                        <>
                            <FormDivider />
                            <FormSectionCard
                                embedded
                                title="Assign to doctors"
                                description={
                                    serviceId
                                        ? 'Add this service to selected doctors (merge). To remove, edit the doctor’s services list. Online Consultation is online-only; other services default to in-clinic.'
                                        : 'Optionally attach this service to one or more doctors on create. Online Consultation is online-only; other services default to in-clinic. Set each doctor’s consultation fee on their profile.'
                                }
                            >
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        onPress={handleSelectAllDoctors}
                                        isDisabled={doctorOptions.length === 0}
                                    >
                                        Select all
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        onPress={handleClearDoctors}
                                        isDisabled={selectedDoctorIds.length === 0}
                                    >
                                        Clear
                                    </Button>
                                    <span className="text-xs text-gray-500 self-center">
                                        {selectedDoctorIds.length} selected
                                    </span>
                                </div>
                                <FormSelect
                                    name="doctor_ids"
                                    label="Doctors"
                                    placeholder="Select doctors"
                                    selectionMode="multiple"
                                    description="Requires doctor.update.any"
                                >
                                    {doctorOptions.map((doc) => (
                                        <SelectItem key={String(doc.id)} value={String(doc.id)}>
                                            {doc.name}
                                        </SelectItem>
                                    ))}
                                </FormSelect>
                            </FormSectionCard>
                        </>
                    )}
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
