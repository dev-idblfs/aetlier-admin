'use client';

import { FormInput } from '@/components/ui/FormFields';

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
        </div>
    );
}
