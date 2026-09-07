'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Save } from '@/lib/icons';
import { Button, Input, Select, SelectItem, Textarea, Spinner } from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import { useGetAppointmentQuery, useUpdateAppointmentMutation } from '@/redux/services/api';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import { FormDivider } from '@/components/ui/FormFields';
import PrescriptionPanel from '@/components/prescription/PrescriptionPanel';
import AccessDenied from '@/components/AccessDenied';
import {
    hasAnyPermission,
    PERMISSIONS,
} from '@/utils/permissions';
import { withUserPermissions } from '@/utils/navAccess';
import { APPOINTMENT_STATUSES } from '@/features/appointments/constants';
import {
    getDoctorName,
    getFeeLabel,
    getModeLabel,
    getPatientName,
    getServiceName,
} from '@/features/appointments/utils';
import { formatDate, formatTime } from '@/utils/dateFormatters';

const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 10);
    try {
        return new Date(value).toISOString().slice(0, 10);
    } catch {
        return '';
    }
};

const toTimeInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.slice(0, 5);
    return String(value).slice(0, 5);
};

export default function EditAppointmentPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const appointmentId = params.id;
    const prescribeMode = searchParams.get('prescribe') === '1';

    const { user, permissions } = useSelector((state) => state.auth);
    const authUser = withUserPermissions(user, permissions);

    const canEdit = hasAnyPermission(authUser, [
        PERMISSIONS.APPOINTMENT_UPDATE_ANY,
        PERMISSIONS.APPOINTMENT_UPDATE_OWN,
    ]);
    const canChangeStatus = hasAnyPermission(authUser, [
        PERMISSIONS.APPOINTMENT_APPROVE,
        PERMISSIONS.APPOINTMENT_UPDATE_ANY,
        PERMISSIONS.APPOINTMENT_CHANGE_STATUS,
        PERMISSIONS.APPOINTMENT_CHANGE_STATUS_ASSIGNED,
    ]);
    const canPrescribe = hasAnyPermission(authUser, [
        PERMISSIONS.PRESCRIPTION_CREATE_OWN,
        PERMISSIONS.PRESCRIPTION_READ_ANY,
    ]);
    const canAccessPage = canEdit || canChangeStatus || canPrescribe;

    const { data: appointment, isLoading: isLoadingAppointment } = useGetAppointmentQuery(appointmentId, {
        skip: !canAccessPage || !appointmentId,
    });
    const [updateAppointment, { isLoading: isUpdating }] = useUpdateAppointmentMutation();

    const [formData, setFormData] = useState({
        status: 'pending',
        special_notes: '',
        appointment_date: '',
        appointment_time: '',
    });

    useEffect(() => {
        if (appointment) {
            setFormData({
                status: appointment.status || 'pending',
                special_notes: appointment.special_notes || appointment.doctor_notes || '',
                appointment_date: toDateInputValue(
                    appointment.appointment_date || appointment.preferred_date
                ),
                appointment_time: toTimeInputValue(
                    appointment.appointment_time || appointment.preferred_time
                ),
            });
        }
    }, [appointment]);

    useEffect(() => {
        if (!prescribeMode) return;
        const el = document.getElementById('prescribe-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [prescribeMode, appointment]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canEdit && !canChangeStatus) {
            toast.error('You do not have permission to update this appointment');
            return;
        }

        try {
            const payload = { id: appointmentId };
            if (canChangeStatus) {
                payload.status = formData.status;
            }
            if (canEdit) {
                payload.special_notes = formData.special_notes;
                if (formData.appointment_date) {
                    payload.appointment_date = formData.appointment_date;
                }
                if (formData.appointment_time) {
                    payload.appointment_time = formData.appointment_time;
                }
            }
            await updateAppointment(payload).unwrap();
            toast.success('Appointment updated successfully');
            router.push(`/appointments/${appointmentId}`);
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update appointment');
        }
    };

    if (!canAccessPage) {
        return (
            <AccessDenied
                title="Access denied"
                message="You need appointment update, status change, or prescription permission to open this page."
            />
        );
    }

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

    const doctorUserId =
        appointment.doctor_user_id ||
        appointment.doctor_id ||
        appointment.doctor?.user_id ||
        appointment.doctor?.id;
    const patientName = getPatientName(appointment) || 'N/A';
    const serviceName = getServiceName(appointment) || 'N/A';
    const doctorName = getDoctorName(appointment) || '—';
    const consultationMode = getModeLabel(appointment.consultation_mode);
    const feeLabel = getFeeLabel(appointment);
    const canSave = canEdit || canChangeStatus;

    return (
        <FormPageLayout
            title="Edit Appointment"
            breadcrumbs={[
                { label: 'Appointments', href: '/appointments' },
                {
                    label: patientName !== 'N/A' ? patientName : 'Detail',
                    href: `/appointments/${appointmentId}`,
                },
                { label: 'Edit' },
            ]}
            cancelHref={`/appointments/${appointmentId}`}
        >
            <form onSubmit={handleSubmit}>
                <FormCompactCard
                    footer={canSave ? (
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
                    ) : null}
                >
                    <FormSectionCard embedded title="Operational summary">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Patient</p>
                                <p className="font-medium">{patientName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Service</p>
                                <p className="font-medium">{serviceName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Doctor</p>
                                <p className="font-medium">{doctorName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Mode</p>
                                <p className="font-medium">{consultationMode}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Scheduled</p>
                                <p className="font-medium">
                                    {formatDate(
                                        appointment.appointment_date ||
                                            appointment.preferred_date
                                    )}{' '}
                                    {formatTime(
                                        appointment.appointment_time ||
                                            appointment.preferred_time
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Fee / payment</p>
                                <p className="font-medium">
                                    {appointment.invoice_number
                                        ? `${appointment.invoice_number}${
                                              feeLabel ? ` · ${feeLabel}` : ''
                                          }`
                                        : feeLabel
                                          ? `${feeLabel} · Pay at clinic`
                                          : 'Pay at clinic'}
                                </p>
                            </div>
                            {appointment.patient_info?.phone ? (
                                <div>
                                    <p className="text-gray-500 text-xs">Phone</p>
                                    <p className="font-medium">
                                        {appointment.patient_info.phone}
                                    </p>
                                </div>
                            ) : null}
                            {appointment.patient_info?.email || appointment.user?.email ? (
                                <div>
                                    <p className="text-gray-500 text-xs">Email</p>
                                    <p className="font-medium truncate">
                                        {appointment.patient_info?.email ||
                                            appointment.user?.email}
                                    </p>
                                </div>
                            ) : null}
                            <div>
                                <p className="text-gray-500 text-xs">Created</p>
                                <p className="font-medium">
                                    {appointment.created_at
                                        ? new Date(appointment.created_at).toLocaleString('en-US', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })
                                        : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Updated</p>
                                <p className="font-medium">
                                    {appointment.updated_at
                                        ? new Date(appointment.updated_at).toLocaleString('en-US', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })
                                        : '—'}
                                </p>
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Prescription">
                        <PrescriptionPanel
                            appointmentId={appointmentId}
                            appointmentStatus={formData.status || appointment.status}
                            doctorUserId={doctorUserId}
                            autoFocus={prescribeMode}
                        />
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Update Details">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {canChangeStatus && (
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
                            )}
                            {canEdit && (
                                <>
                                    <Input
                                        type="date"
                                        label="Appointment date"
                                        labelPlacement="outside"
                                        value={formData.appointment_date}
                                        onChange={(e) => handleChange('appointment_date', e.target.value)}
                                        classNames={{ inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300' }}
                                    />
                                    <Input
                                        type="time"
                                        label="Appointment time"
                                        labelPlacement="outside"
                                        value={formData.appointment_time}
                                        onChange={(e) => handleChange('appointment_time', e.target.value)}
                                        classNames={{ inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300' }}
                                    />
                                </>
                            )}
                        </div>
                        {canEdit && (
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
                        )}
                        {!canEdit && !canChangeStatus && (
                            <p className="text-sm text-gray-500">
                                You can view prescriptions here, but you do not have permission to edit appointment details.
                            </p>
                        )}
                    </FormSectionCard>
                </FormCompactCard>
            </form>
        </FormPageLayout>
    );
}
