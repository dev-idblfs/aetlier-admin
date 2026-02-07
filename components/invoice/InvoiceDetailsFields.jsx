'use client';

import { SelectItem } from '@heroui/react';
import { FormInput, FormSelect } from '@/components/ui/FormFields';

const PAYMENT_TERMS = [
    { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
    { value: 'NET_7', label: 'Net 7 Days' },
    { value: 'NET_15', label: 'Net 15 Days' },
    { value: 'NET_30', label: 'Net 30 Days' },
    { value: 'NET_45', label: 'Net 45 Days' },
    { value: 'NET_60', label: 'Net 60 Days' },
];

export default function InvoiceDetailsFields({ disabled = false }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
                name="invoice_date"
                label="Invoice Date"
                type="date"
                isRequired
                isDisabled={disabled}
            />
            <FormSelect
                name="payment_terms"
                label="Payment Terms"
                placeholder="Select payment terms"
                isRequired
                isDisabled={disabled}
            >
                {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                        {term.label}
                    </SelectItem>
                ))}
            </FormSelect>
            <FormInput
                name="due_date"
                label="Due Date"
                type="date"
                isRequired
                isDisabled={disabled}
            />
        </div>
    );
}
