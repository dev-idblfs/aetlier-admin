'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import {
    ArrowLeft,
    Save,
    Upload,
    X,
    Receipt,
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    SelectItem,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormTextarea, FormSelect, FormSwitchRow } from '@/components/ui/FormFields';
import { PageHeader } from '@/components/ui';
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
        <div className="space-y-6 max-w-3xl mx-auto">
            <PageHeader
                title="New Expense"
                description="Record a new business expense"
                actions={
                    <Link href="/finance/expenses">
                        <Button variant="flat" startContent={<ArrowLeft className="w-4 h-4" />}>
                            Cancel
                        </Button>
                    </Link>
                }
            />

            <Form methods={methods} onSubmit={onSubmit}>
                <Card>
                    <CardHeader>
                        <h3 className="font-semibold">Expense Details</h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect
                                name="category_id"
                                label="Category"
                                placeholder="Select category"
                                isRequired
                            >
                                {(categories || []).map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id} startContent={cat.icon}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </FormSelect>

                            <FormInput
                                name="vendor"
                                label="Vendor/Payee"
                                placeholder="Who was paid?"
                            />

                            <div className="md:col-span-2">
                                <FormTextarea
                                    name="description"
                                    label="Description"
                                    placeholder="What was the expense for?"
                                    isRequired
                                    minRows={2}
                                />
                            </div>

                            <FormInput
                                name="amount"
                                label="Amount"
                                placeholder="0.00"
                                type="number"
                                startContent="₹"
                                isRequired
                            />

                            <FormInput
                                name="tax_amount"
                                label="Tax Amount (if any)"
                                placeholder="0.00"
                                type="number"
                                startContent="₹"
                            />

                            <FormInput
                                name="expense_date"
                                label="Expense Date"
                                type="date"
                                isRequired
                            />

                            <FormSelect
                                name="payment_method"
                                label="Payment Method"
                            >
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </FormSelect>

                            <FormSelect
                                name="payment_status"
                                label="Payment Status"
                            >
                                <SelectItem key="PAID" value="PAID">Paid</SelectItem>
                                <SelectItem key="PENDING" value="PENDING">Pending</SelectItem>
                            </FormSelect>

                            <FormInput
                                name="reference_number"
                                label="Reference Number"
                                placeholder="Transaction ID, Invoice #, etc."
                            />

                            <div className="md:col-span-2">
                                <FormTextarea
                                    name="notes"
                                    label="Notes"
                                    placeholder="Additional notes..."
                                    minRows={2}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <FormSwitchRow
                                    name="is_recurring"
                                    label="Recurring Expense"
                                    description="Mark if this is a regular monthly expense"
                                />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Receipt Upload */}
                <Card className="mt-6">
                    <CardHeader>
                        <h3 className="font-semibold">Receipt Attachment</h3>
                    </CardHeader>
                    <CardBody>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {!receiptFile ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                            >
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">Click to upload receipt</p>
                                <p className="text-sm text-gray-400 mt-1">PNG, JPG, or PDF up to 5MB</p>
                            </div>
                        ) : (
                            <div className="relative border rounded-lg p-4">
                                <button
                                    onClick={removeReceipt}
                                    type="button"
                                    className="absolute top-2 right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>

                                {receiptPreview ? (
                                    <img
                                        src={receiptPreview}
                                        alt="Receipt preview"
                                        className="max-h-48 mx-auto rounded"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-4">
                                        <Receipt className="w-8 h-8 text-gray-400" />
                                        <div>
                                            <p className="font-medium">{receiptFile.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {(receiptFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pb-8">
                    <Link href="/finance/expenses">
                        <Button variant="flat">Cancel</Button>
                    </Link>
                    <Button
                        color="primary"
                        startContent={<Save className="w-4 h-4" />}
                        type="submit"
                        isLoading={isCreating}
                    >
                        Save Expense
                    </Button>
                </div>
            </Form>
        </div>
    );
}
