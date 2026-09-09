'use client';

import { useRef, useState } from 'react';
import { Save } from '@/lib/icons';
import { Button, SelectItem } from '@/lib/heroui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';

import { doctorSchema } from '@/lib/validation';
import { Form, DEFAULT_FORM_OPTIONS } from '@/components/ui/Form';
import {
    FormInput,
    FormTextarea,
    FormSelect,
    FormSwitchRow,
    FormRow,
    FormTagInput,
    FormDivider,
} from '@/components/ui/FormFields';
import { FormActions, FormSectionCard, FormCompactCard, FormSpecializationSelect } from '@/components/ui';
import { useUploadDoctorRxAssetMutation } from '@/redux/services/api';

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];


export default function DoctorForm({
    defaultValues,
    onSubmit,
    isLoading = false,
    submitLabel = 'Save Doctor',
    emailReadOnly = false,
    doctorId = null,
}) {
    const methods = useForm({
        ...DEFAULT_FORM_OPTIONS,
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
            accepts_online_consultation: false,
            can_prescribe: false,
            registration_number: '',
            registration_council: '',
            rx_practice_address: '',
            ...defaultValues,
        },
    });

    const { formState: { isSubmitting }, watch } = methods;
    const wantsOnline = watch('accepts_online_consultation');
    const wantsPrescribe = watch('can_prescribe');
    const needsRegistration = wantsOnline || wantsPrescribe;
    const [uploadRxAsset, { isLoading: isUploading }] = useUploadDoctorRxAssetMutation();
    const stampInputRef = useRef(null);
    const signatureInputRef = useRef(null);
    const [stampPreview, setStampPreview] = useState(defaultValues?.rx_stamp_url || null);
    const [signaturePreview, setSignaturePreview] = useState(
        defaultValues?.rx_signature_url || null
    );

    const handleUpload = async (kind, file) => {
        if (!doctorId || !file) {
            toast.error('Save the doctor profile first, then upload Rx assets');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('kind', kind);
            formData.append('file', file);
            const updated = await uploadRxAsset({ doctorId, formData }).unwrap();
            if (kind === 'stamp') {
                setStampPreview(updated.rx_stamp_url || null);
            } else {
                setSignaturePreview(updated.rx_signature_url || null);
            }
            toast.success(`${kind === 'stamp' ? 'Stamp' : 'Signature'} uploaded`);
        } catch (err) {
            toast.error(err?.data?.detail || `Failed to upload ${kind}`);
        }
    };

    return (
        <Form methods={methods} onSubmit={onSubmit}>
            <FormCompactCard
                footer={(
                    <FormActions inline>
                        <Button
                            color="primary"
                            type="submit"
                            isLoading={isLoading || isSubmitting}
                            startContent={(!isLoading && !isSubmitting) && <Save className="w-4 h-4" />}
                            className="w-full sm:w-auto"
                        >
                            {submitLabel}
                        </Button>
                    </FormActions>
                )}
            >
                <FormSectionCard embedded title="Basic Information">
                    <FormRow columns={2}>
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
                            isReadOnly={emailReadOnly}
                            description={emailReadOnly ? 'Email cannot be changed' : undefined}
                        />
                        <FormInput
                            name="phone"
                            label="Phone"
                            type="tel"
                            placeholder="+91 9876543210"
                        />
                    </FormRow>
                </FormSectionCard>

                <FormDivider />

                <FormSectionCard embedded title="Professional Details">
                    <FormRow columns={2}>
                        <FormSpecializationSelect
                            name="specializations"
                            label="Specializations"
                            placeholder="Search & select specializations..."
                            isRequired
                        />

                        <FormTagInput
                            name="qualifications"
                            label="Qualifications"
                            placeholder="Add qualification (e.g., MBBS, MD)"
                        />


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

                        <FormInput
                            name="registration_number"
                            label="Registration number"
                            placeholder="NMC / State Medical Council number"
                            isRequired={needsRegistration}
                            description={
                                needsRegistration
                                    ? 'Required for online consultations and e-prescriptions'
                                    : 'Medical council registration (required for teleconsult / e-Rx)'
                            }
                        />
                        <FormInput
                            name="registration_council"
                            label="Registration council"
                            placeholder="e.g. Karnataka Medical Council"
                        />
                    </FormRow>
                </FormSectionCard>

                <FormDivider />

                <FormSectionCard embedded title="Biography">
                    <FormTextarea
                        name="bio"
                        label="Biography"
                        placeholder="Enter doctor's bio and professional background"
                        minRows={2}
                    />
                </FormSectionCard>

                <FormDivider />

                <FormSectionCard
                    embedded
                    title="E-Prescription pad"
                    description="Practice address plus stamp or signature are required before enabling e-prescriptions"
                >
                    <FormTextarea
                        name="rx_practice_address"
                        label="Practice address (Rx header)"
                        placeholder="Clinic name, street, city — shown on the prescription pad"
                        minRows={2}
                        isRequired={wantsPrescribe}
                    />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Stamp image</p>
                            {stampPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={stampPreview}
                                    alt="Doctor stamp preview"
                                    className="h-20 w-auto rounded border border-gray-200 bg-white object-contain p-1"
                                />
                            ) : (
                                <p className="text-xs text-gray-500">No stamp uploaded</p>
                            )}
                            <input
                                ref={stampInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    handleUpload('stamp', file);
                                    e.target.value = '';
                                }}
                            />
                            <Button
                                size="sm"
                                variant="flat"
                                isLoading={isUploading}
                                isDisabled={!doctorId}
                                onPress={() => stampInputRef.current?.click()}
                            >
                                Upload stamp
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Signature image</p>
                            {signaturePreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={signaturePreview}
                                    alt="Doctor signature preview"
                                    className="h-20 w-auto rounded border border-gray-200 bg-white object-contain p-1"
                                />
                            ) : (
                                <p className="text-xs text-gray-500">No signature uploaded</p>
                            )}
                            <input
                                ref={signatureInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    handleUpload('signature', file);
                                    e.target.value = '';
                                }}
                            />
                            <Button
                                size="sm"
                                variant="flat"
                                isLoading={isUploading}
                                isDisabled={!doctorId}
                                onPress={() => signatureInputRef.current?.click()}
                            >
                                Upload signature
                            </Button>
                        </div>
                    </div>
                </FormSectionCard>

                <FormDivider />

                <FormSectionCard embedded title="Visibility">
                    <FormSwitchRow
                        name="is_active"
                        label="Active Status"
                        description="Doctor profile is active in admin (public listing still requires publish/verification)"
                    />
                    <FormSwitchRow
                        name="accepts_online_consultation"
                        label="Online consultations"
                        description="Requires registration number — patients can book video/audio teleconsult"
                    />
                    <FormSwitchRow
                        name="can_prescribe"
                        label="E-prescriptions"
                        description="Requires registration number, practice address, and stamp or signature"
                    />
                </FormSectionCard>
            </FormCompactCard>
        </Form>
    );
}
