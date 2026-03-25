'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { Button, Input, SelectItem, Spinner, Textarea, Chip } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    useGetDoctorQuery,
    useUpdateDoctorMutation,
    useGetDoctorVerificationQuery,
    useUpdateVerificationStatusMutation,
} from '@/redux/services/api';
import { doctorSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormTextarea, FormSelect, FormSwitchRow } from '@/components/ui/FormFields';

const SPECIALIZATIONS = [
    'Dermatologist',
    'Gynecologist',
    'Pediatrician',
    'Cardiologist',
    'Neurologist',
    'Orthopedic',
    'General Physician',
    'ENT Specialist',
];

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

const STATUS_COLOR = {
    VERIFIED: 'success',
    REJECTED: 'danger',
    PENDING_REVIEW: 'warning',
    PENDING: 'warning',
    SUBMITTED: 'primary',
};

function VerificationSection({ doctorUserId }) {
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const { data: verification, isLoading, refetch } = useGetDoctorVerificationQuery(doctorUserId);
    const [updateVerificationStatus, { isLoading: isUpdating }] = useUpdateVerificationStatusMutation();

    const handleApprove = async () => {
        try {
            await updateVerificationStatus({
                verificationId: verification.id,
                status: 'VERIFIED',
            }).unwrap();
            toast.success('Verification approved');
            refetch();
        } catch (err) {
            toast.error(err?.data?.detail || 'Failed to approve verification');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please enter a rejection reason');
            return;
        }
        try {
            await updateVerificationStatus({
                verificationId: verification.id,
                status: 'REJECTED',
                rejection_reason: rejectionReason.trim(),
            }).unwrap();
            toast.success('Verification rejected');
            setRejectingId(null);
            setRejectionReason('');
            refetch();
        } catch (err) {
            toast.error(err?.data?.detail || 'Failed to reject verification');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6 flex justify-center">
                <Spinner size="sm" />
            </div>
        );
    }

    if (!verification) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification</h2>
                <p className="text-sm text-gray-500">No verification submission found for this doctor.</p>
            </div>
        );
    }

    const isPending = ['PENDING', 'PENDING_REVIEW', 'SUBMITTED'].includes(verification.status);

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Verification</h2>
                <Chip color={STATUS_COLOR[verification.status] || 'default'} size="sm" variant="flat">
                    {verification.status?.replace('_', ' ')}
                </Chip>
            </div>

            {/* Documents list */}
            {verification.documents?.length > 0 && (
                <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</p>
                    {verification.documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        {doc.document_type?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {doc.is_verified ? 'Verified' : 'Pending review'}
                                    </p>
                                </div>
                            </div>
                            {doc.document_url && (
                                <a
                                    href={doc.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                >
                                    View <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Rejection reason display */}
            {verification.status === 'REJECTED' && verification.rejection_reason && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                    <p className="text-sm text-red-600 mt-1">{verification.rejection_reason}</p>
                </div>
            )}

            {/* Action buttons — only shown when pending */}
            {isPending && (
                <div className="space-y-3">
                    {rejectingId === verification.id ? (
                        <div className="space-y-2">
                            <Textarea
                                label="Rejection Reason"
                                placeholder="Explain why this verification is being rejected…"
                                value={rejectionReason}
                                onValueChange={setRejectionReason}
                                minRows={2}
                                labelPlacement="outside"
                                classNames={{ inputWrapper: 'bg-white border border-gray-200' }}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={() => { setRejectingId(null); setRejectionReason(''); }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    color="danger"
                                    isLoading={isUpdating}
                                    startContent={!isUpdating && <XCircle className="w-4 h-4" />}
                                    onPress={handleReject}
                                >
                                    Confirm Reject
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                color="success"
                                size="sm"
                                isLoading={isUpdating}
                                startContent={!isUpdating && <CheckCircle className="w-4 h-4" />}
                                onPress={handleApprove}
                            >
                                Approve
                            </Button>
                            <Button
                                color="danger"
                                variant="flat"
                                size="sm"
                                startContent={<XCircle className="w-4 h-4" />}
                                onPress={() => setRejectingId(verification.id)}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function EditDoctorPage() {
    const router = useRouter();
    const params = useParams();
    const doctorId = params.id;

    const { data: doctor, isLoading: isLoadingDoctor } = useGetDoctorQuery(doctorId);
    const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();
    const [qualificationInput, setQualificationInput] = useState('');

    const methods = useForm({
        resolver: zodResolver(doctorSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            specializations: [],
            qualifications: [],
            bio: '',
            consultation_fee: 0,
            experience_years: 0,
            languages: [],
            is_active: true,
        },
    });

    const { reset, setValue, watch, handleSubmit, formState: { isSubmitting } } = methods;
    const qualifications = watch('qualifications') || [];

    useEffect(() => {
        if (doctor) {
            reset({
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
            });
        }
    }, [doctor, reset]);

    const handleAddQualification = () => {
        if (qualificationInput.trim()) {
            setValue('qualifications', [...qualifications, qualificationInput.trim()]);
            setQualificationInput('');
        }
    };

    const handleRemoveQualification = (index) => {
        setValue('qualifications', qualifications.filter((_, i) => i !== index));
    };

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
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-gray-600 mb-4">Doctor not found</p>
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
                        <h1 className="text-2xl font-bold text-gray-900">Edit Doctor</h1>
                        <p className="text-sm text-gray-600">Update doctor profile information</p>
                    </div>
                </div>

                {/* Form */}
                <Form methods={methods} onSubmit={onSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    name="first_name"
                                    label="First Name"
                                    placeholder="Enter first name"
                                    isRequired
                                />
                                <FormInput
                                    name="last_name"
                                    label="Last Name"
                                    placeholder="Enter last name"
                                    isRequired
                                />
                                <FormInput
                                    name="email"
                                    label="Email"
                                    type="email"
                                    placeholder="doctor@example.com"
                                    isRequired
                                    isReadOnly
                                    description="Email cannot be changed"
                                />
                                <FormInput
                                    name="phone"
                                    label="Phone"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>

                        {/* Professional Details */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Professional Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelect
                                    name="specializations"
                                    label="Specializations"
                                    placeholder="Select specializations"
                                    selectionMode="multiple"
                                >
                                    {SPECIALIZATIONS.map((spec) => (
                                        <SelectItem key={spec} value={spec}>
                                            {spec}
                                        </SelectItem>
                                    ))}
                                </FormSelect>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Qualifications</label>
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            placeholder="Add qualification (e.g., MBBS, MD)"
                                            value={qualificationInput}
                                            onValueChange={setQualificationInput}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQualification())}
                                            labelPlacement="outside"
                                            classNames={{
                                                inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
                                            }}
                                        />
                                        <Button onPress={handleAddQualification}>Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {qualifications.map((qual, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                            >
                                                {qual}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveQualification(idx)}
                                                    className="hover:text-blue-900"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <FormInput
                                    name="experience_years"
                                    label="Experience (Years)"
                                    type="number"
                                    placeholder="0"
                                />

                                <FormInput
                                    name="consultation_fee"
                                    label="Consultation Fee (₹)"
                                    type="number"
                                    placeholder="0"
                                />

                                <FormSelect
                                    name="languages"
                                    label="Languages"
                                    placeholder="Select languages"
                                    selectionMode="multiple"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {lang}
                                        </SelectItem>
                                    ))}
                                </FormSelect>
                            </div>
                        </div>

                        {/* Biography */}
                        <div>
                            <FormTextarea
                                name="bio"
                                label="Biography"
                                placeholder="Enter doctor's bio and professional background"
                                minRows={4}
                            />
                        </div>

                        {/* Status */}
                        <FormSwitchRow
                            name="is_active"
                            label="Active Status"
                            description="Doctor will be visible to patients"
                        />
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
                            isLoading={isUpdating || isSubmitting}
                            startContent={(!isUpdating && !isSubmitting) && <Save className="w-4 h-4" />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </Form>

                {/* Verification Section */}
                {doctor?.user_id && (
                    <VerificationSection doctorUserId={doctor.user_id} />
                )}
            </div>
        </div>
    );
}
