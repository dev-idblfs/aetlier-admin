'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import {
    useCreateServiceMutation,
    useUploadServiceImageMutation,
} from '@/redux/services/api';
import ServiceForm from '@/features/services/components/ServiceForm';
import { applyServerErrors, parseApiValidationErrors, getApiErrorMessage } from '@/lib/apiErrors';

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
            if (error?.status === 422) {
                const { fieldErrors, formError } = parseApiValidationErrors(error?.data);
                applyServerErrors(methods, fieldErrors);
                if (formError) {
                    methods.setError('root', { type: 'server', message: formError });
                }
            } else {
                toast.error(getApiErrorMessage(error, 'Failed to create service'));
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
