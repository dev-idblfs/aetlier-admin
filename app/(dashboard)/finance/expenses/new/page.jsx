/**
 * New Expense Page
 * Create expense with category, receipt upload
 */

'use client';

import { useState, useRef } from 'react';
import {
    ArrowLeft,
    Save,
    Upload,
    X,
    Receipt,
    Image as ImageIcon,
} from 'lucide-react';
import {
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Card,
    CardBody,
    CardHeader,
    Switch,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
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

    const [formData, setFormData] = useState({
        category_id: '',
        vendor_name: '',
        description: '',
        amount: '',
        tax_amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'CASH',
        payment_status: 'PAID',
        reference_number: '',
        notes: '',
        is_recurring: false,
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

    const handleSubmit = async () => {
        // Validation
        if (!formData.category_id) {
            toast.error('Please select a category');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Description is required');
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const payload = {
                category_id: formData.category_id,
                vendor_name: formData.vendor_name || undefined,
                description: formData.description,
                amount: parseFloat(formData.amount),
                tax_amount: formData.tax_amount ? parseFloat(formData.tax_amount) : undefined,
                expense_date: formData.expense_date,
                payment_method: formData.payment_method,
                payment_status: formData.payment_status,
                reference_number: formData.reference_number || undefined,
                notes: formData.notes || undefined,
                is_recurring: formData.is_recurring,
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
                    // Don't fail the whole operation if receipt upload fails
                }
            }

            toast.success('Expense created successfully');
            router.push('/finance/expenses');
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to create expense');
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

            {/* Main Form */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold">Expense Details</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Category"
                            labelPlacement="outside"
                            placeholder="Select category"
                            selectedKeys={formData.category_id ? [formData.category_id] : []}
                            onSelectionChange={(keys) => setFormData({ ...formData, category_id: Array.from(keys)[0] || '' })}
                            isRequired
                        >
                            {(categories || []).map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} startContent={cat.icon}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </Select>

                        <Input
                            label="Vendor/Payee"
                            labelPlacement="outside"
                            placeholder="Who was paid?"
                            value={formData.vendor_name}
                            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                        />

                        <div className="md:col-span-2">
                            <Textarea
                                label="Description"
                                labelPlacement="outside"
                                placeholder="What was the expense for?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                isRequired
                                minRows={2}
                            />
                        </div>

                        <Input
                            label="Amount"
                            labelPlacement="outside"
                            placeholder="0.00"
                            type="number"
                            min="0"
                            step="0.01"
                            startContent="₹"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            isRequired
                        />

                        <Input
                            label="Tax Amount (if any)"
                            labelPlacement="outside"
                            placeholder="0.00"
                            type="number"
                            min="0"
                            step="0.01"
                            startContent="₹"
                            value={formData.tax_amount}
                            onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                        />

                        <Input
                            label="Expense Date"
                            labelPlacement="outside"
                            type="date"
                            value={formData.expense_date}
                            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                            isRequired
                        />

                        <Select
                            label="Payment Method"
                            labelPlacement="outside"
                            selectedKeys={[formData.payment_method]}
                            onSelectionChange={(keys) => setFormData({ ...formData, payment_method: Array.from(keys)[0] })}
                        >
                            {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                    {method.label}
                                </SelectItem>
                            ))}
                        </Select>

                        <Select
                            label="Payment Status"
                            labelPlacement="outside"
                            selectedKeys={[formData.payment_status]}
                            onSelectionChange={(keys) => setFormData({ ...formData, payment_status: Array.from(keys)[0] })}
                        >
                            <SelectItem key="PAID" value="PAID">Paid</SelectItem>
                            <SelectItem key="PENDING" value="PENDING">Pending</SelectItem>
                        </Select>

                        <Input
                            label="Reference Number"
                            labelPlacement="outside"
                            placeholder="Transaction ID, Invoice #, etc."
                            value={formData.reference_number}
                            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                        />

                        <div className="md:col-span-2">
                            <Textarea
                                label="Notes"
                                labelPlacement="outside"
                                placeholder="Additional notes..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                minRows={2}
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Recurring Expense</p>
                                <p className="text-sm text-gray-500">Mark if this is a regular monthly expense</p>
                            </div>
                            <Switch
                                isSelected={formData.is_recurring}
                                onValueChange={(val) => setFormData({ ...formData, is_recurring: val })}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Receipt Upload */}
            <Card>
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
                                className="absolute top-2 right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
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
            <div className="flex justify-end gap-3 pb-8">
                <Link href="/finance/expenses">
                    <Button variant="flat">Cancel</Button>
                </Link>
                <Button
                    color="primary"
                    startContent={<Save className="w-4 h-4" />}
                    onPress={handleSubmit}
                    isLoading={isCreating}
                >
                    Save Expense
                </Button>
            </div>
        </div>
    );
}
