'use client';

import { SelectItem } from '@/lib/heroui';
import { FormInput, FormSelect } from '@/components/ui/FormFields';

/**
 * Compact billing snapshot fields (used below customer search on invoice forms).
 */
export default function InvoiceCustomerBillingFields({
    nameDisabled = false,
    fieldsDisabled = false,
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormInput
                name="customer_name"
                label="Name"
                placeholder="Customer name"
                isRequired
                size="sm"
                isDisabled={nameDisabled || fieldsDisabled}
            />
            <FormInput
                name="customer_email"
                label="Email"
                type="email"
                placeholder="Email"
                size="sm"
                isDisabled={fieldsDisabled}
            />
            <FormInput
                name="customer_phone"
                label="Phone"
                placeholder="Phone"
                size="sm"
                isDisabled={fieldsDisabled}
            />
            <div className="sm:col-span-2 lg:col-span-3">
                <FormInput
                    name="customer_address"
                    label="Address"
                    placeholder="Billing address"
                    size="sm"
                    isDisabled={fieldsDisabled}
                />
            </div>
            <FormInput
                name="customer_date_of_birth"
                label="Date of birth"
                type="date"
                size="sm"
                isDisabled={fieldsDisabled}
            />
            <FormSelect
                name="customer_gender"
                label="Gender"
                placeholder="Select gender"
                size="sm"
                isDisabled={fieldsDisabled}
            >
                <SelectItem key="female" value="female">Female</SelectItem>
                <SelectItem key="male" value="male">Male</SelectItem>
                <SelectItem key="other" value="other">Other</SelectItem>
                <SelectItem key="prefer_not_to_say" value="prefer_not_to_say">
                    Prefer not to say
                </SelectItem>
            </FormSelect>
            <FormInput
                name="customer_city"
                label="City"
                placeholder="City"
                size="sm"
                isDisabled={fieldsDisabled}
            />
        </div>
    );
}
