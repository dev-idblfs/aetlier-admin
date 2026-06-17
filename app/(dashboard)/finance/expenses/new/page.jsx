'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import {
    Save,
    Upload,
    X,
    Receipt,
} from 'lucide-react';
import {
    Button,
    SelectItem,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormTextarea, FormSelect, FormSwitchRow, FormRow, FormDivider } from '@/components/ui/FormFields';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import {
    useCreateExpenseMutation,
    useGetExpenseCategoriesQuery,
    useUploadExpenseReceiptMutation,
} from '@/redux/services/api';

const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
];

export default function NewExpensePage() {
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
    const [uploadReceipt] = useUploadExpenseReceiptMutation();
    const { data: categories } = useGetExpenseCategoriesQuery();

    const methods = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            category_id: '',
            vendor: '',
            description: '',
            amount: '',
            tax_amount: '',
            expense_date: new Date().toISOString().split('T')[0],
            payment_method: 'CASH',
            payment_status: 'PAID',
            reference_number: '',
            notes: '',
            is_recurring: false,
        },
    });

    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setReceiptFile(file);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setReceiptPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setReceiptPreview(null);
            }
        }
    };

    const removeReceipt = () => {
        setReceiptFile(null);
        setReceiptPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                category_id: data.category_id,
                vendor: data.vendor || undefined,
                description: data.description,
                amount: parseFloat(data.amount),
                tax_amount: data.tax_amount ? parseFloat(data.tax_amount) : undefined,
                expense_date: data.expense_date,
                payment_method: data.payment_method,
                payment_status: data.payment_status,
                payment_reference: data.reference_number || undefined,
                notes: data.notes || undefined,
                is_recurring: data.is_recurring,
            };

            const result = await createExpense(payload).unwrap();

            // Upload receipt if selected
            if (receiptFile && result.id) {
                const formDataFile = new FormData();
                formDataFile.append('file', receiptFile);
                try {
                    await uploadReceipt({ id: result.id, formData: formDataFile }).unwrap();
                } catch (err) {
                    console.error('Receipt upload failed:', err);
                    toast.error('Expense created but receipt upload failed');
                }
            }

            toast.success('Expense created successfully');
            router.push('/finance/expenses');
        } catch (error) {
            console.error('Expense creation error:', error);
            if (error?.status === 422 && error?.data?.detail) {
                const details = Array.isArray(error.data.detail) ? error.data.detail : [error.data.detail];
                details.forEach((err) => {
                    const fieldName = err.loc?.[1];
                    if (fieldName && methods.getValues(fieldName) !== undefined) {
                        methods.setError(fieldName, {
                            type: 'server',
                            message: err.msg || 'Invalid value'
                        });
                    } else {
                        toast.error(err.msg || 'Validation error');
                    }
                });
            } else {
                toast.error(error?.data?.detail || 'Failed to create expense');
            }
        }
    };

    return (
        <FormPageLayout
            title="New Expense"
            breadcrumbs={[
                { label: 'Expenses', href: '/finance/expenses' },
                { label: 'New' },
            ]}
            cancelHref="/finance/expenses"
        >
            <Form methods={methods} onSubmit={onSubmit}>
                <FormCompactCard
                    footer={(
                        <FormActions inline>
                            <Button
                                color="primary"
                                startContent={<Save className="w-4 h-4" />}
                                type="submit"
                                isLoading={isCreating}
                                className="w-full sm:w-auto"
                            >
                                Save Expense
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Expense Details">
                        <FormRow columns={3}>
                            <FormSelect name="category_id" label="Category" placeholder="Select category" isRequired>
                                {(categories || []).map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id} startContent={cat.icon}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </FormSelect>
                            <FormInput name="vendor" label="Vendor/Payee" placeholder="Who was paid?" />
                            <div className="lg:col-span-3">
                                <FormTextarea name="description" label="Description" placeholder="What was the expense for?" isRequired minRows={2} />
                            </div>
                            <FormInput name="amount" label="Amount" placeholder="0.00" type="number" startContent="₹" isRequired />
                            <FormInput name="tax_amount" label="Tax Amount (if any)" placeholder="0.00" type="number" startContent="₹" />
                            <FormInput name="expense_date" label="Expense Date" type="date" isRequired />
                            <FormSelect name="payment_method" label="Payment Method">
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                                ))}
                            </FormSelect>
                            <FormSelect name="payment_status" label="Payment Status">
                                <SelectItem key="PAID" value="PAID">Paid</SelectItem>
                                <SelectItem key="PENDING" value="PENDING">Pending</SelectItem>
                            </FormSelect>
                            <FormInput name="reference_number" label="Reference Number" placeholder="Transaction ID, Invoice #, etc." />
                            <div className="lg:col-span-3">
                                <FormTextarea name="notes" label="Notes" placeholder="Additional notes..." minRows={2} />
                            </div>
                            <div className="lg:col-span-3">
                                <FormSwitchRow name="is_recurring" label="Recurring Expense" description="Mark if this is a regular monthly expense" />
                            </div>
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Receipt Attachment">
                        <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
                        {!receiptFile ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                            >
                                <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Click to upload receipt</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF up to 5MB</p>
                            </div>
                        ) : (
                            <div className="relative border rounded-lg p-3">
                                <button onClick={removeReceipt} type="button" className="absolute top-2 right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200 z-10">
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>
                                {receiptPreview ? (
                                    <img src={receiptPreview} alt="Receipt preview" className="max-h-40 mx-auto rounded" />
                                ) : (
                                    <div className="flex items-center gap-3 p-2">
                                        <Receipt className="w-7 h-7 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-sm">{receiptFile.name}</p>
                                            <p className="text-xs text-gray-500">{(receiptFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
