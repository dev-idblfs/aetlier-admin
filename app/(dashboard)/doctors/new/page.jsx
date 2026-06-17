'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { useCreateDoctorMutation } from '@/redux/services/api';
import { FormPageLayout } from '@/components/ui';
import DoctorForm from '@/features/doctors/components/DoctorForm';

export default function NewDoctorPage() {
    const router = useRouter();
    const [createDoctor, { isLoading }] = useCreateDoctorMutation();

    const onSubmit = async (data) => {
        try {
            await createDoctor(data).unwrap();
            toast.success('Doctor created successfully');
            router.push('/doctors');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create doctor');
        }
    };

    return (
        <FormPageLayout
            title="Add New Doctor"
            breadcrumbs={[
                { label: 'Doctors', href: '/doctors' },
                { label: 'Add New' },
            ]}
            cancelHref="/doctors"
        >
            <DoctorForm
                onSubmit={onSubmit}
                isLoading={isLoading}
                submitLabel="Create Doctor"
            />
        </FormPageLayout>
    );
}
