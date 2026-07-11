'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';

import {
    useGetDoctorQuery,
    useUpdateDoctorMutation,
    useGetDoctorVerificationQuery,
} from '@/redux/services/api';
import { FormPageLayout, FormCompactCard, FormSectionCard } from '@/components/ui';
import DoctorForm from '@/features/doctors/components/DoctorForm';
import DoctorServiceAssignments from '@/features/doctors/components/DoctorServiceAssignments';
import VerificationStatusBadge from '@/components/verification/VerificationStatusBadge';
import DocumentReviewCard from '@/components/verification/DocumentReviewCard';
import VerificationActions from '@/components/verification/VerificationActions';
import AuditTimeline from '@/components/verification/AuditTimeline';
import VerificationReviewSteps from '@/components/verification/VerificationReviewSteps';
import { VERIFICATION_STATUS } from '@/constants/verification';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

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
        <FormCompactCard>
            <FormSectionCard embedded title="Verification">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs text-gray-500">Review submitted credentials and documents</p>
                    <VerificationStatusBadge status={verification.status} />
                </div>

                <div className="space-y-3">
                    <VerificationReviewSteps
                        verification={verification}
                        canVerify={canVerify}
                        canApprove={canApprove}
                    />

                    {verification.status === VERIFICATION_STATUS.REJECTED && verification.rejection_reason && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-sm font-medium text-red-700">Rejection reason</p>
                            <p className="text-sm text-red-600 mt-1">{verification.rejection_reason}</p>
                        </div>
                    )}

                    {verification.documents?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Uploaded documents</p>
                            {verification.documents.map((doc) => (
                                <DocumentReviewCard key={doc.id} doc={doc} onUpdated={refetch} />
                            ))}
                        </div>
                    )}

                    <VerificationActions verification={verification} onUpdated={refetch} />
                    <AuditTimeline verificationId={verification.id} />
                </div>
            </FormSectionCard>
        </FormCompactCard>
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

    return (
        <FormPageLayout
            title="Edit Doctor"
            breadcrumbs={[
                { label: 'Doctors', href: '/doctors' },
                { label: doctor.first_name ? `${doctor.first_name} ${doctor.last_name || ''}`.trim() : 'Edit' },
            ]}
            cancelHref="/doctors"
        >
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
                }}
                onSubmit={onSubmit}
                isLoading={isUpdating}
                submitLabel="Save Changes"
                emailReadOnly
            />

            {(doctor?.user_id || doctor?.id) && (
                <div className="mt-3 space-y-3">
                    <DoctorServiceAssignments doctorId={doctor.user_id || doctor.id} />
                    <VerificationSection doctorUserId={doctor.user_id || doctor.id} />
                </div>
            )}
        </FormPageLayout>
    );
}
