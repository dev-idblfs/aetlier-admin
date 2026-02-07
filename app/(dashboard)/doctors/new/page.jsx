'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, SelectItem, Input } from '@heroui/react'; // Input needed for qual add
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCreateDoctorMutation } from '@/redux/services/api';
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

export default function NewDoctorPage() {
    const router = useRouter();
    const [createDoctor, { isLoading }] = useCreateDoctorMutation();
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

    const { setValue, watch, handleSubmit, formState: { isSubmitting } } = methods;
    const qualifications = watch('qualifications') || [];

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
            await createDoctor(data).unwrap();
            toast.success('Doctor created successfully');
            router.push('/doctors');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create doctor');
        }
    };

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
                        <h1 className="text-2xl font-bold text-gray-900">Add New Doctor</h1>
                        <p className="text-sm text-gray-600">Create a new doctor profile</p>
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
                            isLoading={isLoading || isSubmitting}
                            startContent={(!isLoading && !isSubmitting) && <Save className="w-4 h-4" />}
                        >
                            Create Doctor
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
