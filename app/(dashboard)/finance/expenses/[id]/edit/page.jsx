/**
 * Edit Expense Page
 * Update existing expense with pre-filled data
 */

'use client';
// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';
import { use, useState, useEffect, useRef } from 'react';
import {
    ArrowLeft,
    Save,
    Upload,
    X,
    Receipt,
    AlertCircle,
    Trash2,
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    SelectItem,
    Spinner,
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
    useGetExpenseQuery,
    useUpdateExpenseMutation,
    useGetExpenseCategoriesQuery,
    useUploadExpenseReceiptMutation,
} from '@/redux/services/api';
import Image from 'next/image';

const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
];

export default function EditExpensePage({ params }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const fileInputRef = useRef(null);

    const { data: expense, isLoading, error } = useGetExpenseQuery(unwrappedParams.id);
    const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
    const [uploadReceipt, { isLoading: isUploading }] = useUploadExpenseReceiptMutation();
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

    const { reset } = methods;

    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [existingReceipt, setExistingReceipt] = useState(null);

    // Initialize form with expense data
    useEffect(() => {
        if (expense) {
            reset({
                category_id: expense.category_id || '',
                vendor: expense.vendor || '',
                description: expense.description || '',
                amount: expense.amount?.toString() || '',
                tax_amount: expense.tax_amount?.toString() || '',
                expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
                payment_method: expense.payment_method || 'CASH',
                payment_status: expense.payment_status || 'PAID',
                reference_number: expense.payment_reference || '',
                notes: expense.notes || '',
                is_recurring: expense.is_recurring || false,
            });

            if (expense.receipt_url) {
                setExistingReceipt(expense.receipt_url);
            }
        }
    }, [expense, reset]);

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

    const removeExistingReceipt = () => {
        setExistingReceipt(null);
        toast.info('Existing receipt will be removed on save');
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

            await updateExpense({ id: unwrappedParams.id, ...payload }).unwrap();

            // Upload new receipt if selected
            if (receiptFile) {
                const formDataFile = new FormData();
                formDataFile.append('file', receiptFile);
                try {
                    await uploadReceipt({ id: unwrappedParams.id, formData: formDataFile }).unwrap();
                } catch (err) {
                    console.error('Receipt upload failed:', err);
                    toast.warning('Expense updated but receipt upload failed');
                }
            }

            toast.success('Expense updated successfully');
            router.push(`/finance/expenses/${unwrappedParams.id}`);
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update expense');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !expense) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-16 h-16 text-danger" />
                <h2 className="text-xl font-semibold">Expense Not Found</h2>
                <p className="text-gray-600">The expense you're trying to edit doesn't exist.</p>
                <Button as={Link} href="/finance/expenses" variant="flat">
                    Back to Expenses
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <PageHeader
                title="Edit Expense"
                description="Update expense details and receipt"
                actions={
                    <Link href={`/finance/expenses/${expense.id}`}>
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
                                    <SelectItem key={cat.id} value={cat.id}>
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
                                    minRows={3}
                                />
                            </div>

                            <FormInput
                                name="amount"
                                label="Amount"
                                type="number"
                                placeholder="0.00"
                                startContent={<span className="text-default-400">₹</span>}
                                isRequired
                            />

                            <FormInput
                                name="tax_amount"
                                label="Tax Amount (Optional)"
                                type="number"
                                placeholder="0.00"
                                startContent={<span className="text-default-400">₹</span>}
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
                                label="Reference Number (Optional)"
                                placeholder="Receipt/Transaction #"
                            />
                        </div>

                        <div className="pt-2">
                            <FormSwitchRow
                                name="is_recurring"
                                label="Recurring Expense"
                                description="This is a recurring expense"
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Receipt Upload */}
                <Card className="mt-6">
                    <CardHeader>
                        <h3 className="font-semibold flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Receipt
                        </h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        {/* Existing Receipt */}
                        {existingReceipt && !receiptFile && (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">Current Receipt:</p>
                                {existingReceipt.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <div className="relative">
                                        <Image
                                            src={existingReceipt}
                                            alt="Current Receipt"
                                            width={400}
                                            height={300}
                                            className="rounded-lg border"
                                            style={{ maxHeight: '200px', objectFit: 'contain' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-4 border-2 border-dashed rounded-lg">
                                        <p className="text-sm text-gray-600">Receipt file attached</p>
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    startContent={<Trash2 className="w-4 h-4" />}
                                    onPress={removeExistingReceipt}
                                >
                                    Remove Receipt
                                </Button>
                            </div>
                        )}

                        {/* New Receipt Upload */}
                        {!receiptFile && !existingReceipt && (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button
                                    color="primary"
                                    variant="flat"
                                    startContent={<Upload className="w-4 h-4" />}
                                    onPress={() => fileInputRef.current?.click()}
                                >
                                    Upload Receipt
                                </Button>
                                <p className="text-xs text-gray-500 mt-2">
                                    Accepted formats: JPG, PNG, PDF (Max 5MB)
                                </p>
                            </div>
                        )}

                        {/* New Receipt Preview */}
                        {receiptFile && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">New Receipt:</p>
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="flat"
                                        isIconOnly
                                        onPress={removeReceipt}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                {receiptPreview ? (
                                    <Image
                                        src={receiptPreview}
                                        alt="Receipt preview"
                                        width={400}
                                        height={300}
                                        className="rounded-lg border"
                                        style={{ maxHeight: '200px', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50">
                                        <p className="text-sm text-gray-600">{receiptFile.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {(receiptFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {existingReceipt && !receiptFile && (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button
                                    color="primary"
                                    variant="flat"
                                    size="sm"
                                    startContent={<Upload className="w-4 h-4" />}
                                    onPress={() => fileInputRef.current?.click()}
                                >
                                    Replace Receipt
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Notes */}
                <Card className="mt-6">
                    <CardHeader>
                        <h3 className="font-semibold">Additional Notes</h3>
                    </CardHeader>
                    <CardBody>
                        <FormTextarea
                            name="notes"
                            placeholder="Add any additional notes about this expense..."
                            minRows={4}
                        />
                    </CardBody>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pb-8">
                    <Button
                        variant="flat"
                        onPress={() => router.push(`/finance/expenses/${expense.id}`)}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        startContent={<Save className="w-4 h-4" />}
                        type="submit"
                        isLoading={isUpdating || isUploading}
                    >
                        Update Expense
                    </Button>
                </div>
            </Form>
        </div>
    );
}

