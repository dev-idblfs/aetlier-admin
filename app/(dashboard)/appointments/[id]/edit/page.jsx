'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, Select, SelectItem, Textarea, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useGetAppointmentQuery, useUpdateAppointmentMutation } from '@/redux/services/api';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import { FormDivider } from '@/components/ui/FormFields';

const APPOINTMENT_STATUSES = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'rescheduled', label: 'Rescheduled' },
    { key: 'invoiced', label: 'Invoiced' },
];

export default function EditAppointmentPage() {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params.id;

    const { data: appointment, isLoading: isLoadingAppointment } = useGetAppointmentQuery(appointmentId);
    const [updateAppointment, { isLoading: isUpdating }] = useUpdateAppointmentMutation();

    const [formData, setFormData] = useState({
        status: 'pending',
        special_notes: '',
    });

    useEffect(() => {
        if (appointment) {
            setFormData({
                status: appointment.status || 'pending',
                special_notes: appointment.special_notes || appointment.doctor_notes || '',
            });
        }
    }, [appointment]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await updateAppointment({
                id: appointmentId,
                status: formData.status,
                special_notes: formData.special_notes,
            }).unwrap();

            toast.success('Appointment updated successfully');
            router.push('/appointments');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update appointment');
        }
    };

    if (isLoadingAppointment) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <p className="text-gray-600 mb-4">Appointment not found</p>
                <Button onPress={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <FormPageLayout
            title="Edit Appointment"
            breadcrumbs={[
                { label: 'Appointments', href: '/appointments' },
                { label: appointment.user_name || 'Edit' },
            ]}
            cancelHref="/appointments"
        >
            <form onSubmit={handleSubmit}>
                <FormCompactCard
                    footer={(
                        <FormActions inline>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={isUpdating}
                                startContent={!isUpdating && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Save Changes
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Appointment Information">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Patient</p>
                                <p className="font-medium">{appointment.user_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Service</p>
                                <p className="font-medium">{appointment.service_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Preferred Date</p>
                                <p className="font-medium">{appointment.preferred_date || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Preferred Time</p>
                                <p className="font-medium">{appointment.preferred_time || 'N/A'}</p>
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Update Details">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <Select
                                label="Status"
                                labelPlacement="outside"
                                placeholder="Select status"
                                selectedKeys={[formData.status]}
                                onSelectionChange={(keys) => handleChange('status', Array.from(keys)[0])}
                                classNames={{ trigger: 'bg-white border border-gray-200 hover:border-gray-300' }}
                            >
                                {APPOINTMENT_STATUSES.map((status) => (
                                    <SelectItem key={status.key} value={status.key}>{status.label}</SelectItem>
                                ))}
                            </Select>
                        </div>
                        <Textarea
                            label="Special notes"
                            labelPlacement="outside"
                            placeholder="Add any notes or special instructions"
                            value={formData.special_notes}
                            onValueChange={(value) => handleChange('special_notes', value)}
                            minRows={3}
                            className="mt-3"
                            classNames={{ inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300' }}
                        />
                    </FormSectionCard>
                </FormCompactCard>
            </form>
        </FormPageLayout>
    );
}
