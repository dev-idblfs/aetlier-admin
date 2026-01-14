'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Select, SelectItem, Textarea, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useGetAppointmentQuery, useUpdateAppointmentMutation, useGetDoctorsQuery } from '@/redux/services/api';

const APPOINTMENT_STATUSES = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'completed', label: 'Completed' },
];

export default function EditAppointmentPage() {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params.id;

    const { data: appointment, isLoading: isLoadingAppointment } = useGetAppointmentQuery(appointmentId);
    const { data: doctorsData } = useGetDoctorsQuery({});
    const [updateAppointment, { isLoading: isUpdating }] = useUpdateAppointmentMutation();

    const doctors = doctorsData?.doctors || doctorsData || [];

    const [formData, setFormData] = useState({
        status: 'pending',
        doctor_id: '',
        notes: '',
    });

    useEffect(() => {
        if (appointment) {
            setFormData({
                status: appointment.status || 'pending',
                doctor_id: appointment.doctor_id?.toString() || '',
                notes: appointment.notes || '',
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
                doctor_id: formData.doctor_id ? parseInt(formData.doctor_id) : null,
                notes: formData.notes,
            }).unwrap();

            toast.success('Appointment updated successfully');
            router.push('/appointments');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update appointment');
        }
    };

    if (isLoadingAppointment) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-gray-600 mb-4">Appointment not found</p>
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
                        <h1 className="text-2xl font-bold text-gray-900">Edit Appointment</h1>
                        <p className="text-sm text-gray-600">Update appointment details</p>
                    </div>
                </div>

                {/* Appointment Info */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Appointment Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600">Patient</p>
                            <p className="font-medium">{appointment.user_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Service</p>
                            <p className="font-medium">{appointment.service_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Preferred Date</p>
                            <p className="font-medium">{appointment.preferred_date || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Preferred Time</p>
                            <p className="font-medium">{appointment.preferred_time || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Update Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Status"
                                    placeholder="Select status"
                                    selectedKeys={[formData.status]}
                                    onSelectionChange={(keys) => handleChange('status', Array.from(keys)[0])}
                                    className="md:col-span-2"
                                >
                                    {APPOINTMENT_STATUSES.map((status) => (
                                        <SelectItem key={status.key} value={status.key}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Assign Doctor"
                                    placeholder="Select doctor"
                                    selectedKeys={formData.doctor_id ? [formData.doctor_id] : []}
                                    onSelectionChange={(keys) => handleChange('doctor_id', Array.from(keys)[0])}
                                    className="md:col-span-2"
                                >
                                    {doctors.map((doctor) => (
                                        <SelectItem key={doctor.id.toString()} value={doctor.id.toString()}>
                                            {doctor.name || `${doctor.first_name} ${doctor.last_name}`}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <Textarea
                                label="Notes"
                                placeholder="Add any notes or special instructions"
                                value={formData.notes}
                                onValueChange={(value) => handleChange('notes', value)}
                                minRows={4}
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
