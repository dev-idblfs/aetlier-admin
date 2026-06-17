'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button, SelectItem } from '@heroui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { doctorSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import {
    FormInput,
    FormTextarea,
    FormSelect,
    FormSwitchRow,
    FormRow,
    FormTagInput,
    FormDivider,
} from '@/components/ui/FormFields';
import { FormActions, FormSectionCard, FormCompactCard } from '@/components/ui';

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

export default function DoctorForm({
    defaultValues,
    onSubmit,
    isLoading = false,
    submitLabel = 'Save Doctor',
    emailReadOnly = false,
}) {
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
            ...defaultValues,
        },
    });

    const { setValue, watch, formState: { isSubmitting } } = methods;
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
                    <FormRow columns={3}>
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
                    <FormRow columns={3}>
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

                        <FormTagInput
                            label="Qualifications"
                            placeholder="Add qualification (e.g., MBBS, MD)"
                            value={qualificationInput}
                            onValueChange={setQualificationInput}
                            tags={qualifications}
                            onAdd={handleAddQualification}
                            onRemove={handleRemoveQualification}
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
                    </FormRow>
                </FormSectionCard>

                <FormDivider />

                <FormSectionCard embedded title="Biography">
                    <FormTextarea
                        name="bio"
                        label="Biography"
                        placeholder="Enter doctor's bio and professional background"
                        minRows={3}
                    />
                </FormSectionCard>

                <FormDivider />

                <FormSectionCard embedded title="Visibility">
                    <FormSwitchRow
                        name="is_active"
                        label="Active Status"
                        description="Doctor will be visible to patients"
                    />
                </FormSectionCard>
            </FormCompactCard>
        </Form>
    );
}
