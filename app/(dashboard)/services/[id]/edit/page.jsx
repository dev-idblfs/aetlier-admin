'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';

import { useGetServiceQuery, useUpdateServiceMutation } from '@/redux/services/api';
import ServiceForm from '@/features/services/components/ServiceForm';

export default function EditServicePage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params.id;

    const { data: service, isLoading: isLoadingService } = useGetServiceQuery(serviceId);
    const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();

    const onSubmit = async (data) => {
        try {
            await updateService({
                id: serviceId,
                ...data,
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
        <ServiceForm
            initialData={service}
            title="Edit Service"
            subtitle="Update service information"
            submitLabel="Save Changes"
            onSubmit={onSubmit}
            isLoading={isUpdating}
        />
    );
}
