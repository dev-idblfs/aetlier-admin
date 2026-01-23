/**
 * Expense Detail View Page
 * Display complete expense with receipt and category info
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { use } from 'react';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Receipt,
    Calendar,
    DollarSign,
    FileText,
    CreditCard,
    Tag,
    AlertCircle,
    Download,
    Image as ImageIcon,
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
    Spinner,
    useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PageHeader, ConfirmModal } from '@/components/ui';
import {
    useGetExpenseQuery,
    useDeleteExpenseMutation,
} from '@/redux/services/api';
import { formatDate, formatCurrency } from '@/utils/dateFormatters';
import Image from 'next/image';

const paymentStatusConfig = {
    PAID: { label: 'Paid', color: 'success' },
    PENDING: { label: 'Pending', color: 'warning' },
};

const paymentMethodLabels = {
    CASH: 'Cash',
    CARD: 'Card',
    UPI: 'UPI',
    BANK_TRANSFER: 'Bank Transfer',
    CHEQUE: 'Cheque',
};

export default function ExpenseDetailPage({ params }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

    const {
        isOpen: isDeleteModalOpen,
        onOpen: onDeleteModalOpen,
        onClose: onDeleteModalClose,
    } = useDisclosure();

    // Fetch expense
    const { data: expense, isLoading, error, refetch } = useGetExpenseQuery(unwrappedParams.id);

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
                <p className="text-gray-600">The expense you're looking for doesn't exist.</p>
                <Button as={Link} href="/finance/expenses" variant="flat">
                    Back to Expenses
                </Button>
            </div>
        );
    }

    const handleDelete = async () => {
        try {
            await deleteExpense(expense.id).unwrap();
            toast.success('Expense deleted successfully');
            onDeleteModalClose();
            router.push('/finance/expenses');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to delete expense');
        }
    };

    const totalAmount = (parseFloat(expense.amount) || 0) + (parseFloat(expense.tax_amount) || 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Expense Details"
                subtitle={`${expense.category_name || 'Uncategorized'} - ${expense.vendor || 'N/A'}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<ArrowLeft className="w-4 h-4" />}
                            as={Link}
                            href="/finance/expenses"
                        >
                            Back
                        </Button>
                        <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<Edit className="w-4 h-4" />}
                            as={Link}
                            href={`/finance/expenses/${expense.id}/edit`}
                        >
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            startContent={<Trash2 className="w-4 h-4" />}
                            onClick={onDeleteModalOpen}
                        >
                            Delete
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Expense Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Expense Summary */}
                    <Card>
                        <CardBody className="space-y-4">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag className="w-5 h-5 text-primary" />
                                        <Chip
                                            variant="flat"
                                            startContent={<Receipt className="w-3 h-3" />}
                                        >
                                            {expense.category_name || 'Uncategorized'}
                                        </Chip>
                                        <Chip
                                            color={paymentStatusConfig[expense.payment_status]?.color}
                                            variant="flat"
                                        >
                                            {paymentStatusConfig[expense.payment_status]?.label}
                                        </Chip>
                                    </div>
                                    <h2 className="text-2xl font-bold">{expense.vendor || 'N/A'}</h2>
                                    {expense.description && (
                                        <p className="text-gray-600 mt-2">{expense.description}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Expense Date</p>
                                    <p className="font-semibold">{formatDate(expense.expense_date)}</p>
                                    {expense.payment_reference && (
                                        <>
                                            <p className="text-sm text-gray-600 mt-2">Reference #</p>
                                            <p className="font-mono text-sm">{expense.payment_reference}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Amount Breakdown */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Amount Breakdown
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Base Amount</span>
                                    <span className="font-medium">{formatCurrency(expense.amount)}</span>
                                </div>
                                {expense.tax_amount > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tax Amount</span>
                                            <span className="font-medium">{formatCurrency(expense.tax_amount)}</span>
                                        </div>
                                        <Divider />
                                    </>
                                )}
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total Amount</span>
                                    <span className="text-primary">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Notes */}
                    {expense.notes && (
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Notes
                                </h3>
                            </CardHeader>
                            <CardBody>
                                <p className="text-sm text-gray-700 whitespace-pre-line">
                                    {expense.notes}
                                </p>
                            </CardBody>
                        </Card>
                    )}

                    {/* Receipt */}
                    {expense.receipt_url && (
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Receipt className="w-5 h-5" />
                                    Receipt
                                </h3>
                            </CardHeader>
                            <CardBody>
                                {expense.receipt_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <div className="relative w-full">
                                        <Image
                                            src={expense.receipt_url}
                                            alt="Receipt"
                                            width={800}
                                            height={600}
                                            className="rounded-lg border w-full h-auto"
                                            style={{ maxHeight: '500px', objectFit: 'contain' }}
                                        />
                                        <Button
                                            size="sm"
                                            color="primary"
                                            variant="flat"
                                            startContent={<Download className="w-4 h-4" />}
                                            as="a"
                                            href={expense.receipt_url}
                                            target="_blank"
                                            download
                                            className="mt-4"
                                        >
                                            Download Receipt
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                                        <div className="text-center">
                                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 mb-3">Receipt File Attached</p>
                                            <Button
                                                size="sm"
                                                color="primary"
                                                startContent={<Download className="w-4 h-4" />}
                                                as="a"
                                                href={expense.receipt_url}
                                                target="_blank"
                                                download
                                            >
                                                Download Receipt
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Payment Info */}
                <div className="space-y-6">
                    {/* Payment Information */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment Information
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Status</span>
                                <Chip
                                    color={paymentStatusConfig[expense.payment_status]?.color}
                                    variant="flat"
                                    size="sm"
                                >
                                    {paymentStatusConfig[expense.payment_status]?.label}
                                </Chip>
                            </div>
                            <Divider />
                            <div className="flex justify-between">
                                <span className="text-gray-600">Method</span>
                                <span className="font-medium">
                                    {paymentMethodLabels[expense.payment_method] || expense.payment_method}
                                </span>
                            </div>
                            {expense.payment_reference && (
                                <>
                                    <Divider />
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Reference</span>
                                        <span className="font-mono text-sm font-medium">
                                            {expense.payment_reference}
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>

                    {/* Category Info */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Tag className="w-5 h-5" />
                                Category
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-2">
                                <Chip
                                    color="primary"
                                    variant="flat"
                                    startContent={<Receipt className="w-3 h-3" />}
                                >
                                    {expense.category_name || 'Uncategorized'}
                                </Chip>
                                {expense.category_description && (
                                    <p className="text-xs text-gray-600 mt-2">
                                        {expense.category_description}
                                    </p>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Additional Info */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Additional Information</h3>
                        </CardHeader>
                        <CardBody className="space-y-2 text-sm">
                            {expense.is_recurring && (
                                <div className="flex items-center gap-2 text-primary">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">Recurring Expense</span>
                                </div>
                            )}
                            {expense.created_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created</span>
                                    <span className="font-medium">{formatDate(expense.created_at)}</span>
                                </div>
                            )}
                            {expense.updated_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last Updated</span>
                                    <span className="font-medium">{formatDate(expense.updated_at)}</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={onDeleteModalClose}
                onConfirm={handleDelete}
                title="Delete Expense"
                message="Are you sure you want to delete this expense? This action cannot be undone."
                confirmText="Yes, Delete Expense"
                confirmColor="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
