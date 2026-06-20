'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import {
    useCreateServiceMutation,
    useUploadServiceImageMutation,
} from '@/redux/services/api';
import ServiceForm from '@/features/services/components/ServiceForm';

export default function NewServicePage() {
    const router = useRouter();
    const [createService, { isLoading }] = useCreateServiceMutation();
    const [uploadServiceImage] = useUploadServiceImageMutation();

    const onSubmit = async (data, methods, { pendingImageFile } = {}) => {
        try {
            const result = await createService(data).unwrap();

            if (pendingImageFile) {
                const formData = new FormData();
                formData.append('file', pendingImageFile);
                await uploadServiceImage({
                    id: result.id,
                    formData,
                }).unwrap();
            }

            toast.success('Service created successfully');
            router.push('/services');
        } catch (error) {
            console.error('Service creation error:', error);
            if (error?.status === 422 && error?.data?.detail) {
                const details = Array.isArray(error.data.detail)
                    ? error.data.detail
                    : [error.data.detail];
                details.forEach((err) => {
                    const fieldName = err.loc?.[1];
                    if (fieldName && methods.getValues(fieldName) !== undefined) {
                        methods.setError(fieldName, {
                            type: 'server',
                            message: err.msg || 'Invalid value',
                        });
                    } else {
                        toast.error(err.msg || 'Validation error');
                    }
                });
                if (!details.some((err) => err.loc?.[1])) {
                    toast.error('Please check the form for errors');
                }
            } else {
                toast.error(error?.data?.detail || 'Failed to create service');
            }
        }
    };

    return (
        <ServiceForm
            title="Add New Service"
            breadcrumbs={[
                { label: 'Services', href: '/services' },
                { label: 'Add New' },
            ]}
            submitLabel="Create Service"
            onSubmit={onSubmit}
            isLoading={isLoading}
        />
    );
}
