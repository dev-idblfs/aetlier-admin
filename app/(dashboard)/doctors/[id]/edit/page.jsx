'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Textarea, Switch, Select, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useGetDoctorQuery, useUpdateDoctorMutation } from '@/redux/services/api';

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

export default function EditDoctorPage() {
    const router = useRouter();
    const params = useParams();
    const doctorId = params.id;

    const { data: doctor, isLoading: isLoadingDoctor } = useGetDoctorQuery(doctorId);
    const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specializations: [],
        qualifications: [],
        bio: '',
        consultation_fee: '',
        experience_years: '',
        languages: [],
        is_active: true,
    });

    const [qualification, setQualification] = useState('');

    useEffect(() => {
        if (doctor) {
            setFormData({
                first_name: doctor.first_name || '',
                last_name: doctor.last_name || '',
                email: doctor.email || '',
                phone: doctor.phone || '',
                specializations: doctor.specializations || [],
                qualifications: doctor.qualifications || [],
                bio: doctor.bio || '',
                consultation_fee: doctor.consultation_fee?.toString() || '',
                experience_years: doctor.experience_years?.toString() || '',
                languages: doctor.languages || [],
                is_active: doctor.is_active ?? true,
            });
        }
    }, [doctor]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddQualification = () => {
        if (qualification.trim()) {
            setFormData(prev => ({
                ...prev,
                qualifications: [...prev.qualifications, qualification.trim()]
            }));
            setQualification('');
        }
    };

    const handleRemoveQualification = (index) => {
        setFormData(prev => ({
            ...prev,
            qualifications: prev.qualifications.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.first_name || !formData.last_name || !formData.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await updateDoctor({
                id: doctorId,
                ...formData,
                consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
                experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0,
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
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    placeholder="Enter first name"
                                    value={formData.first_name}
                                    onValueChange={(value) => handleChange('first_name', value)}
                                    isRequired
                                />
                                <Input
                                    label="Last Name"
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onValueChange={(value) => handleChange('last_name', value)}
                                    isRequired
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="doctor@example.com"
                                    value={formData.email}
                                    onValueChange={(value) => handleChange('email', value)}
                                    isRequired
                                    isReadOnly
                                    description="Email cannot be changed"
                                />
                                <Input
                                    label="Phone"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    value={formData.phone}
                                    onValueChange={(value) => handleChange('phone', value)}
                                />
                            </div>
                        </div>

                        {/* Professional Details */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Professional Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Specializations"
                                    placeholder="Select specializations"
                                    selectionMode="multiple"
                                    selectedKeys={formData.specializations}
                                    onSelectionChange={(keys) => handleChange('specializations', Array.from(keys))}
                                >
                                    {SPECIALIZATIONS.map((spec) => (
                                        <SelectItem key={spec} value={spec}>
                                            {spec}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Qualifications</label>
                                    <div className="flex gap-2 mb-2">
                                        <Input
                                            placeholder="Add qualification (e.g., MBBS, MD)"
                                            value={qualification}
                                            onValueChange={setQualification}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQualification())}
                                        />
                                        <Button onPress={handleAddQualification}>Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.qualifications.map((qual, idx) => (
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

                                <Input
                                    label="Experience (Years)"
                                    type="number"
                                    placeholder="0"
                                    value={formData.experience_years}
                                    onValueChange={(value) => handleChange('experience_years', value)}
                                />

                                <Input
                                    label="Consultation Fee (₹)"
                                    type="number"
                                    placeholder="0"
                                    value={formData.consultation_fee}
                                    onValueChange={(value) => handleChange('consultation_fee', value)}
                                />

                                <Select
                                    label="Languages"
                                    placeholder="Select languages"
                                    selectionMode="multiple"
                                    selectedKeys={formData.languages}
                                    onSelectionChange={(keys) => handleChange('languages', Array.from(keys))}
                                >
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {lang}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Biography */}
                        <div>
                            <Textarea
                                label="Biography"
                                placeholder="Enter doctor's bio and professional background"
                                value={formData.bio}
                                onValueChange={(value) => handleChange('bio', value)}
                                minRows={4}
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Active Status</p>
                                <p className="text-sm text-gray-600">Doctor will be visible to patients</p>
                            </div>
                            <Switch
                                isSelected={formData.is_active}
                                onValueChange={(value) => handleChange('is_active', value)}
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
