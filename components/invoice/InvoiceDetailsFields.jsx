/**
 * InvoiceDetailsFields Component
 * Reusable invoice date/terms fields group
 */
'use client';

import { Input, Select, SelectItem } from '@heroui/react';

const PAYMENT_TERMS = [
    { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
    { value: 'NET_7', label: 'Net 7 Days' },
    { value: 'NET_15', label: 'Net 15 Days' },
    { value: 'NET_30', label: 'Net 30 Days' },
    { value: 'NET_45', label: 'Net 45 Days' },
    { value: 'NET_60', label: 'Net 60 Days' },
];

export default function InvoiceDetailsFields({
    value,
    onChange,
    onPaymentTermsChange,
    disabled = false,
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
                label="Invoice Date"
                labelPlacement="outside"
                type="date"
                value={value.invoice_date}
                onChange={(e) => onChange({ ...value, invoice_date: e.target.value })}
                isRequired
                isDisabled={disabled}
            />
            <Select
                label="Payment Terms"
                labelPlacement="outside"
                placeholder="Select payment terms"
                selectedKeys={value.payment_terms ? [value.payment_terms] : []}
                onSelectionChange={(keys) => {
                    const selectedTerm = Array.from(keys)[0];
                    onPaymentTermsChange(selectedTerm);
                }}
                isRequired
                isDisabled={disabled}
            >
                {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                        {term.label}
                    </SelectItem>
                ))}
            </Select>
            <Input
                label="Due Date"
                labelPlacement="outside"
                type="date"
                value={value.due_date}
                onChange={(e) => onChange({ ...value, due_date: e.target.value })}
                isRequired
                isDisabled={disabled}
            />
        </div>
    );
}
