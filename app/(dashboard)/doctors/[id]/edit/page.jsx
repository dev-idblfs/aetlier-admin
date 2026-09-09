'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button, Spinner } from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import { Calendar } from '@/lib/icons';

import {
    useGetDoctorQuery,
    useUpdateDoctorMutation,
    useGetDoctorVerificationQuery,
    useGetAppointmentsQuery,
} from '@/redux/services/api';
import { FormPageLayout, FormCompactCard, FormSectionCard, EntityLink, StatusBadge, Alert, RelatedLinks } from '@/components/ui';
import DoctorForm from '@/features/doctors/components/DoctorForm';
import DoctorServiceAssignments from '@/features/doctors/components/DoctorServiceAssignments';
import DocumentReviewCard from '@/components/verification/DocumentReviewCard';
import VerificationActions from '@/components/verification/VerificationActions';
import AuditTimeline from '@/components/audit/AuditTimeline';
import VerificationReviewSteps from '@/components/verification/VerificationReviewSteps';
import { VERIFICATION_STATUS } from '@/constants/verification';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

function AppointmentsContext({ doctorUserId }) {
    const user = useSelector((s) => s.auth.user);
    const canViewAppointments = hasPermission(user, PERMISSIONS.APPOINTMENT_READ_ANY);

    const { data: appointmentsData, isLoading } = useGetAppointmentsQuery(
        { doctor_id: doctorUserId, page: 1, page_size: 5 },
        { skip: !doctorUserId || !canViewAppointments }
    );

    if (!canViewAppointments) return null;

    const appointments = appointmentsData?.items || appointmentsData || [];
    const hasAppointments = appointments.length > 0;

    if (isLoading) {
        return (
            <Alert
                variant="info"
                icon={<Calendar className="w-4 h-4" />}
                compact
                message="Loading upcoming appointments..."
            />
        );
    }

    if (!hasAppointments) return null;

    return (
        <Alert
            variant="info"
            icon={<Calendar className="w-4 h-4" />}
            compact
        >
            <div className="text-sm space-y-1">
                <p className="font-medium">
                    <EntityLink href={`/appointments?doctor_id=${doctorUserId}`}>
                        {appointments.length} upcoming appointment{appointments.length !== 1 ? 's' : ''}
                    </EntityLink>
                </p>
                {appointments.slice(0, 2).map((apt) => (
                    <p key={apt.id} className="text-xs text-gray-600">
                        {apt.appointment_date} · <StatusBadge status={apt.status} size="sm" />
                    </p>
                ))}
            </div>
        </Alert>
    );
}

function VerificationSection({ doctorUserId }) {
    const user = useSelector((s) => s.auth.user);
    const canVerify = hasPermission(user, PERMISSIONS.VERIFICATION_VERIFY_ANY);
    const canApprove = hasPermission(user, PERMISSIONS.VERIFICATION_APPROVE_ANY);
    const { data: verification, isLoading, refetch } = useGetDoctorVerificationQuery(doctorUserId, {
        skip: !doctorUserId,
    });

    if (isLoading) {
        return (
            <FormCompactCard>
                <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                </div>
            </FormCompactCard>
        );
    }

    if (!verification) {
        return (
            <FormCompactCard>
                <FormSectionCard embedded title="Verification">
                    <p className="text-sm text-gray-500">No verification submission found for this doctor.</p>
                </FormSectionCard>
            </FormCompactCard>
        );
    }

    return (
        <div className="space-y-3">
            <FormCompactCard>
                <FormSectionCard
                    embedded
                    title="Review steps"
                    description="Credentials and status for this doctor"
                    headerAction={<StatusBadge status={verification.status} size="sm" />}
                >
                    <VerificationReviewSteps
                        verification={verification}
                        canVerify={canVerify}
                        canApprove={canApprove}
                    />
                    {verification.status === VERIFICATION_STATUS.REJECTED && verification.rejection_reason ? (
                        <Alert
                            variant="danger"
                            title="Rejection reason"
                            message={verification.rejection_reason}
                            compact
                            className="mt-3"
                        />
                    ) : null}
                </FormSectionCard>
            </FormCompactCard>

            {verification.documents?.length > 0 ? (
                <FormCompactCard>
                    <FormSectionCard embedded title="Documents">
                        <div className="space-y-2">
                            {verification.documents.map((doc) => (
                                <DocumentReviewCard key={doc.id} doc={doc} onUpdated={refetch} />
                            ))}
                        </div>
                    </FormSectionCard>
                </FormCompactCard>
            ) : null}

            <FormCompactCard>
                <FormSectionCard embedded title="Actions">
                    <VerificationActions verification={verification} onUpdated={refetch} />
                </FormSectionCard>
            </FormCompactCard>

            <FormCompactCard>
                <FormSectionCard embedded title="Audit history">
                    <AuditTimeline
                        entityType="doctor_verifications"
                        entityId={verification.id}
                        compact
                    />
                </FormSectionCard>
            </FormCompactCard>
        </div>
    );
}

export default function EditDoctorPage() {
    const router = useRouter();
    const params = useParams();
    const doctorId = params.id;

    const { data: doctor, isLoading: isLoadingDoctor } = useGetDoctorQuery(doctorId);
    const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();

    const onSubmit = async (data) => {
        try {
            await updateDoctor({
                id: doctorId,
                ...data,
            }).unwrap();

            toast.success('Doctor updated successfully');
            router.push('/doctors');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update doctor');
        }
    };

    if (isLoadingDoctor) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <p className="text-gray-600 mb-4">Doctor not found</p>
                <Button onPress={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const doctorUserId = doctor.user_id || doctor.id;
    const displayName = doctor.first_name
        ? `${doctor.first_name} ${doctor.last_name || ''}`.trim()
        : 'Edit';
    const relatedItems = [
        {
            label: displayName !== 'Edit' ? displayName : 'User account',
            href: doctorUserId ? `/users/${doctorUserId}/edit` : null,
            meta: 'User',
        },
        {
            label: 'Appointments',
            href: doctorUserId ? `/appointments?doctor_id=${doctorUserId}` : null,
            meta: 'List',
        },
        {
            label: 'Verification queue',
            href: `/verification?q=${encodeURIComponent(doctor.email || displayName)}`,
            meta: 'Verify',
        },
    ];

    return (
        <FormPageLayout
            title="Edit Doctor"
            breadcrumbs={[
                { label: 'Doctors', href: '/doctors' },
                { label: displayName },
            ]}
            cancelHref="/doctors"
        >
            <div className="mb-3">
                <RelatedLinks title="Related" items={relatedItems} />
            </div>

            <DoctorForm
                key={doctor.id}
                defaultValues={{
                    first_name: doctor.first_name || '',
                    last_name: doctor.last_name || '',
                    email: doctor.email || '',
                    phone: doctor.phone || '',
                    specializations: doctor.specializations || [],
                    qualifications: doctor.qualifications || [],
                    bio: doctor.bio || '',
                    consultation_fee: doctor.consultation_fee || 0,
                    experience_years: doctor.experience_years || 0,
                    languages: doctor.languages || [],
                    is_active: doctor.is_active ?? true,
                    accepts_online_consultation: doctor.accepts_online_consultation ?? false,
                    can_prescribe: doctor.can_prescribe ?? false,
                    registration_number: doctor.registration_number || '',
                    registration_council: doctor.registration_council || '',
                    rx_practice_address: doctor.rx_practice_address || '',
                }}
                onSubmit={onSubmit}
                isLoading={isUpdating}
                submitLabel="Save Changes"
                emailReadOnly
                doctorId={doctorUserId}
            />

            {doctorUserId && (
                <div className="mt-3 space-y-3">
                    <AppointmentsContext doctorUserId={doctorUserId} />
                    <DoctorServiceAssignments doctorId={doctorUserId} />
                    <VerificationSection doctorUserId={doctorUserId} />
                </div>
            )}
        </FormPageLayout>
    );
}
