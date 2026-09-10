'use client';

import { SelectItem } from '@/lib/heroui';
import { FormSelect } from '@/components/ui/FormFields';

const normalizeDoctors = (data) =>
    Array.isArray(data) ? data : data?.doctors || data?.items || [];

const doctorId = (doctor) => doctor?.user_id || doctor?.id;

const doctorLabel = (doctor) => {
    const name = [doctor?.first_name, doctor?.last_name].filter(Boolean).join(' ').trim();
    const specialties = Array.isArray(doctor?.specializations)
        ? doctor.specializations.filter(Boolean).join(', ')
        : '';
    return [name || 'Doctor', specialties].filter(Boolean).join(' · ');
};

/** Attending-doctor picker for standalone invoices. Appointment invoices derive this server-side. */
export default function InvoiceDoctorSelect({ doctorsData, isLoading = false, disabled = false }) {
    const doctors = normalizeDoctors(doctorsData).filter((doctor) => doctorId(doctor));

    return (
        <FormSelect
            name="doctor_user_id"
            label="Attending Doctor"
            placeholder={isLoading ? 'Loading doctors…' : 'Select doctor'}
            size="sm"
            isDisabled={disabled || isLoading}
            description="Shown on the invoice and PDF"
        >
            {doctors.map((doctor) => {
                const id = String(doctorId(doctor));
                return (
                    <SelectItem key={id} value={id} textValue={doctorLabel(doctor)}>
                        {doctorLabel(doctor)}
                    </SelectItem>
                );
            })}
        </FormSelect>
    );
}