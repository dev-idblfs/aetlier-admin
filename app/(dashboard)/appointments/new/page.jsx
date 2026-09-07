'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Save } from '@/lib/icons';
import { Button, SelectItem } from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import {
    FormInput,
    FormSelect,
    FormTextarea,
    FormRow,
    FormDivider,
} from '@/components/ui/FormFields';
import {
    FormPageLayout,
    FormSectionCard,
    FormActions,
    FormCompactCard,
} from '@/components/ui';
import {
    useCreateAppointmentMutation,
    useGetServicesQuery,
    useGetDoctorsQuery,
} from '@/redux/services/api';
import {
    hasAnyPermission,
    PERMISSIONS,
} from '@/utils/permissions';
import { withUserPermissions } from '@/utils/navAccess';
import AccessDenied from '@/components/AccessDenied';

const buildCreatePayload = (data) => {
    const nameParts = data.patient_name.trim().split(/\s+/);
    return {
        book_for_other: true,
        patient_first_name: nameParts[0],
        patient_last_name: nameParts.slice(1).join(' ') || nameParts[0],
        patient_email: data.patient_email,
        patient_phone: data.patient_phone || undefined,
        service_id: data.service_id,
        preferred_date: data.preferred_date,
        preferred_time: data.preferred_time,
        special_notes: data.special_notes || '',
        consultation_mode: data.consultation_mode || 'in_person',
        ...(data.doctor_id ? { doctor_id: data.doctor_id } : {}),
    };
};

export default function NewAppointmentPage() {
    const router = useRouter();
    const { user, permissions } = useSelector((state) => state.auth);
    const authUser = withUserPermissions(user, permissions);
    const canCreate = hasAnyPermission(authUser, [
        PERMISSIONS.APPOINTMENT_CREATE,
        PERMISSIONS.APPOINTMENT_UPDATE_ANY,
    ]);
    const canReadServices = hasAnyPermission(authUser, [PERMISSIONS.SERVICE_READ_ANY]);
    const canReadDoctors = hasAnyPermission(authUser, [PERMISSIONS.DOCTOR_READ_ANY]);

    const { data: servicesData } = useGetServicesQuery(undefined, { skip: !canReadServices });
    const { data: doctorsData } = useGetDoctorsQuery(undefined, { skip: !canReadDoctors });
    const [createAppointment, { isLoading }] = useCreateAppointmentMutation();

    const services = servicesData?.services || servicesData || [];
    const doctors = doctorsData?.doctors || doctorsData || [];

    const methods = useForm({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patient_name: '',
            patient_email: '',
            patient_phone: '',
            service_id: '',
            doctor_id: '',
            consultation_mode: 'in_person',
            preferred_date: '',
            preferred_time: '',
            special_notes: '',
        },
    });

    const { formState: { isSubmitting } } = methods;

    const onSubmit = async (data) => {
        try {
            await createAppointment(buildCreatePayload(data)).unwrap();
            toast.success('Appointment created successfully');
            router.push('/appointments');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create appointment');
        }
    };

    if (!canCreate) {
        return (
            <AccessDenied
                title="Access denied"
                message="You need appointment create permission to open this page."
            />
        );
    }

    return (
        <FormPageLayout
            title="Add Appointment"
            breadcrumbs={[
                { label: 'Appointments', href: '/appointments' },
                { label: 'Add New' },
            ]}
            cancelHref="/appointments"
            maxWidth="md"
        >
            <Form methods={methods} onSubmit={onSubmit}>
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
                                Create Appointment
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Patient">
                        <FormRow columns={2}>
                            <FormInput
                                name="patient_name"
                                label="Patient Name"
                                placeholder="Enter patient name"
                                isRequired
                            />
                            <FormInput
                                name="patient_email"
                                label="Patient Email"
                                type="email"
                                placeholder="Enter email"
                                isRequired
                            />
                            <FormInput
                                name="patient_phone"
                                label="Phone Number"
                                placeholder="Enter phone number"
                            />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Booking">
                        <FormRow columns={2}>
                            <FormSelect
                                name="service_id"
                                label="Service"
                                placeholder="Select service"
                            >
                                {services.map((service) => (
                                    <SelectItem
                                        key={service.id}
                                        value={service.id}
                                        textValue={service.name}
                                    >
                                        {service.name}
                                    </SelectItem>
                                ))}
                            </FormSelect>
                            <FormSelect
                                name="doctor_id"
                                label="Doctor (optional)"
                                placeholder="Select doctor"
                            >
                                {doctors.map((doctor) => {
                                    const doctorId = doctor.user_id || doctor.id;
                                    const doctorName =
                                        doctor.name ||
                                        `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() ||
                                        doctor.email ||
                                        String(doctorId);
                                    return (
                                        <SelectItem
                                            key={doctorId}
                                            value={doctorId}
                                            textValue={doctorName}
                                        >
                                            {doctorName}
                                        </SelectItem>
                                    );
                                })}
                            </FormSelect>
                            <FormSelect
                                name="consultation_mode"
                                label="Consultation Mode"
                                placeholder="Select mode"
                            >
                                <SelectItem key="in_person" value="in_person" textValue="In-clinic">
                                    In-clinic
                                </SelectItem>
                                <SelectItem key="online" value="online" textValue="Online">
                                    Online
                                </SelectItem>
                            </FormSelect>
                            <FormInput
                                name="preferred_date"
                                type="date"
                                label="Preferred Date"
                                isRequired
                            />
                            <FormInput
                                name="preferred_time"
                                type="time"
                                label="Preferred Time"
                                isRequired
                            />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Notes">
                        <FormTextarea
                            name="special_notes"
                            label="Special Notes"
                            placeholder="Any special instructions..."
                            minRows={2}
                        />
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
