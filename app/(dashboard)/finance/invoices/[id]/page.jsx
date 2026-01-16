/**
 * Invoice Detail View Page
 * Display complete invoice with customer info, line items, payments
 */

'use client';

import { use, useState } from 'react';
import {
    ArrowLeft,
    Edit,
    Download,
    Send,
    Trash2,
    DollarSign,
    Calendar,
    User,
    FileText,
    CreditCard,
    Printer,
    Mail,
    AlertCircle,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Input,
    Select,
    SelectItem,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PageHeader, ConfirmModal } from '@/components/ui';
import {
    useGetInvoiceQuery,
    useCancelInvoiceMutation,
    useSendInvoiceMutation,
    useLazyGetInvoicePdfUrlQuery,
    useRecordInvoicePaymentMutation,
} from '@/redux/services/api';
import { formatDate, formatCurrency } from '@/utils/dateFormatters';

const statusConfig = {
    DRAFT: { label: 'Draft', color: 'default', icon: FileText },
    PENDING: { label: 'Pending', color: 'warning', icon: AlertCircle },
    PAID: { label: 'Paid', color: 'success', icon: CheckCircle },
    PARTIALLY_PAID: { label: 'Partially Paid', color: 'primary', icon: DollarSign },
    OVERDUE: { label: 'Overdue', color: 'danger', icon: XCircle },
    CANCELLED: { label: 'Cancelled', color: 'default', icon: XCircle },
};

const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
];

export default function InvoiceDetailPage({ params }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [cancelInvoice, { isLoading: isCancelling }] = useCancelInvoiceMutation();
    const [sendInvoice, { isLoading: isSending }] = useSendInvoiceMutation();
    const [getPdfUrl, { isLoading: isDownloading }] = useLazyGetInvoicePdfUrlQuery();
    const [recordPayment, { isLoading: isRecordingPayment }] = useRecordInvoicePaymentMutation();

    const {
        isOpen: isPaymentModalOpen,
        onOpen: onPaymentModalOpen,
        onClose: onPaymentModalClose,
    } = useDisclosure();
    const {
        isOpen: isCancelModalOpen,
        onOpen: onCancelModalOpen,
        onClose: onCancelModalClose,
    } = useDisclosure();

    // Payment form state
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentNotes, setPaymentNotes] = useState('');

    // Fetch invoice
    const { data: invoice, isLoading, error, refetch } = useGetInvoiceQuery(unwrappedParams.id);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-16 h-16 text-danger" />
                <h2 className="text-xl font-semibold">Invoice Not Found</h2>
                <p className="text-gray-600">The invoice you're looking for doesn't exist.</p>
                <Button as={Link} href="/finance/invoices" variant="flat">
                    Back to Invoices
                </Button>
            </div>
        );
    }

    const StatusIcon = statusConfig[invoice.status]?.icon || FileText;
    const isOverdue = invoice.status === 'OVERDUE';
    const canEdit = ['DRAFT', 'PENDING'].includes(invoice.status);
    const canCancel = !['PAID', 'CANCELLED'].includes(invoice.status);
    const canRecordPayment = ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);
    console.log(invoice, 'dddddd');

    const handleDownloadPdf = async () => {
        try {
            const result = await getPdfUrl(invoice.id).unwrap();
            if (result.pdf_url) {
                window.open(result.pdf_url, '_blank');
                toast.success('Opening PDF...');
            }
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to download PDF');
        }
    };

    const handleSendEmail = async () => {
        try {
            await sendInvoice({
                id: invoice.id,
                send_via: 'email',
                recipient_email: invoice.customer_email
            }).unwrap();
            toast.success('Invoice sent successfully');
            refetch();
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to send invoice');
        }
    };

    const handleCancelInvoice = async () => {
        try {
            await cancelInvoice(invoice.id).unwrap();
            toast.success('Invoice cancelled successfully');
            onCancelModalClose();
            refetch();
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to cancel invoice');
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await recordPayment({
                id: invoice.id,
                amount: parseFloat(paymentAmount),
                payment_method: paymentMethod,
                payment_date: paymentDate,
                notes: paymentNotes,
            }).unwrap();
            toast.success('Payment recorded successfully');
            onPaymentModalClose();
            setPaymentAmount('');
            setPaymentNotes('');
            refetch();
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to record payment');
        }
    };

    const remainingBalance = invoice.grand_total - (invoice.amount_paid || 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title={invoice.invoice_number}
                subtitle={`Invoice for ${invoice.customer_name || 'Unknown Customer'}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<ArrowLeft className="w-4 h-4" />}
                            as={Link}
                            href="/finance/invoices"
                        >
                            Back
                        </Button>
                        {canEdit && (
                            <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                startContent={<Edit className="w-4 h-4" />}
                                as={Link}
                                href={`/finance/invoices/${invoice.id}/edit`}
                            >
                                Edit
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<Download className="w-4 h-4" />}
                            onClick={handleDownloadPdf}
                            isLoading={isDownloading}
                        >
                            PDF
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<Send className="w-4 h-4" />}
                            onClick={handleSendEmail}
                            isLoading={isSending}
                        >
                            Send
                        </Button>
                        {canRecordPayment && (
                            <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                startContent={<DollarSign className="w-4 h-4" />}
                                onClick={onPaymentModalOpen}
                            >
                                Record Payment
                            </Button>
                        )}
                        {canCancel && (
                            <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                startContent={<Trash2 className="w-4 h-4" />}
                                onClick={onCancelModalOpen}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Status Banner */}
            {isOverdue && (
                <Card className="bg-danger-50 border-danger">
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-danger" />
                            <div>
                                <p className="font-semibold text-danger">This invoice is overdue</p>
                                <p className="text-sm text-danger-600">
                                    Due date was {formatDate(invoice.due_date)}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Header */}
                    <Card>
                        <CardBody className="space-y-4">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <StatusIcon className="w-5 h-5" />
                                        <Chip
                                            color={statusConfig[invoice.status]?.color}
                                            variant="flat"
                                        >
                                            {statusConfig[invoice.status]?.label}
                                        </Chip>
                                    </div>
                                    <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
                                    {invoice.order_number && (
                                        <p className="text-sm text-gray-600">
                                            Order: {invoice.order_number}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Invoice Date</p>
                                    <p className="font-semibold">{formatDate(invoice.invoice_date)}</p>
                                    {invoice.due_date && (
                                        <>
                                            <p className="text-sm text-gray-600 mt-2">Due Date</p>
                                            <p className={`font-semibold ${isOverdue ? 'text-danger' : ''}`}>
                                                {formatDate(invoice.due_date)}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Divider />

                            {/* Customer Info */}
                            <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Customer Information
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <p className="font-semibold">{invoice.customer_name || 'N/A'}</p>
                                    {invoice.customer_email && (
                                        <p className="text-gray-600">{invoice.customer_email}</p>
                                    )}
                                    {invoice.customer_phone && (
                                        <p className="text-gray-600">{invoice.customer_phone}</p>
                                    )}
                                    {invoice.customer_address && (
                                        <p className="text-gray-600 whitespace-pre-line">
                                            {invoice.customer_address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Line Items */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Line Items</h3>
                        </CardHeader>
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <Table
                                    removeWrapper
                                    aria-label="Invoice line items"
                                    classNames={{
                                        th: 'bg-gray-50',
                                    }}
                                >
                                    <TableHeader>
                                        <TableColumn>ITEM</TableColumn>
                                        <TableColumn align="center">QTY</TableColumn>
                                        <TableColumn align="right">RATE</TableColumn>
                                        <TableColumn align="right">AMOUNT</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.line_items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.description}</p>
                                                        {item.item_name && item.item_name !== item.description && (
                                                            <p className="text-xs text-gray-500">{item.item_name}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(item.unit_price)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(item.line_total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <Divider />

                            {/* Totals */}
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-success-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(invoice.discount_amount)}</span>
                                    </div>
                                )}
                                {invoice.tax_total > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            Tax
                                        </span>
                                        <span className="font-medium">{formatCurrency(invoice.tax_total)}</span>
                                    </div>
                                )}
                                <Divider />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>{formatCurrency(invoice.grand_total)}</span>
                                </div>
                                {invoice.amount_paid > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm text-success-600">
                                            <span>Amount Paid</span>
                                            <span className="font-semibold">
                                                {formatCurrency(invoice.amount_paid)}
                                            </span>
                                        </div>
                                        <Divider />
                                        <div className="flex justify-between text-lg font-bold text-primary">
                                            <span>Balance Due</span>
                                            <span>{formatCurrency(remainingBalance)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Notes */}
                    {(invoice.customer_notes || invoice.terms_conditions) && (
                        <Card>
                            <CardBody className="space-y-4">
                                {invoice.customer_notes && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Customer Notes</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">
                                            {invoice.customer_notes}
                                        </p>
                                    </div>
                                )}
                                {invoice.terms_conditions && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">
                                            {invoice.terms_conditions}
                                        </p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Payment History & Info */}
                <div className="space-y-6">
                    {/* Amount Summary */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Amount Summary
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Amount</span>
                                <span className="font-bold text-lg">
                                    {formatCurrency(invoice.grand_total)}
                                </span>
                            </div>
                            {invoice.amount_paid > 0 && (
                                <>
                                    <Divider />
                                    <div className="flex justify-between text-success-600">
                                        <span>Paid</span>
                                        <span className="font-semibold">
                                            {formatCurrency(invoice.amount_paid)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-primary">
                                        <span className="font-semibold">Balance Due</span>
                                        <span className="font-bold text-lg">
                                            {formatCurrency(remainingBalance)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Payment History
                                </h3>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-3">
                                    {invoice.payments.map((payment, index) => (
                                        <div key={index} className="border-b last:border-b-0 pb-3 last:pb-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">
                                                        {formatCurrency(payment.amount)}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {formatDate(payment.payment_date)}
                                                    </p>
                                                    <Chip size="sm" variant="flat" className="mt-1">
                                                        {payment.payment_method}
                                                    </Chip>
                                                </div>
                                            </div>
                                            {payment.notes && (
                                                <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Additional Info */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Additional Information</h3>
                        </CardHeader>
                        <CardBody className="space-y-2 text-sm">
                            {invoice.payment_terms && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Terms</span>
                                    <span className="font-medium">{invoice.payment_terms}</span>
                                </div>
                            )}
                            {invoice.created_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created</span>
                                    <span className="font-medium">{formatDate(invoice.created_at)}</span>
                                </div>
                            )}
                            {invoice.updated_at && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last Updated</span>
                                    <span className="font-medium">{formatDate(invoice.updated_at)}</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Record Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={onPaymentModalClose} size="md">
                <ModalContent>
                    <form onSubmit={handleRecordPayment}>
                        <ModalHeader>Record Payment</ModalHeader>
                        <ModalBody className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Balance Due: <span className="font-bold text-primary text-lg">
                                        {formatCurrency(remainingBalance)}
                                    </span>
                                </p>
                            </div>
                            <Input
                                label="Payment Amount"
                                type="number"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                startContent={<DollarSign className="w-4 h-4 text-gray-400" />}
                                isRequired
                                max={remainingBalance}
                            />
                            <Select
                                label="Payment Method"
                                selectedKeys={[paymentMethod]}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                isRequired
                            >
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Input
                                label="Payment Date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                isRequired
                            />
                            <Input
                                label="Notes (Optional)"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Add any notes about this payment"
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onPaymentModalClose}>
                                Cancel
                            </Button>
                            <Button
                                color="success"
                                type="submit"
                                isLoading={isRecordingPayment}
                            >
                                Record Payment
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Cancel Invoice Modal */}
            <ConfirmModal
                isOpen={isCancelModalOpen}
                onClose={onCancelModalClose}
                onConfirm={handleCancelInvoice}
                title="Cancel Invoice"
                message="Are you sure you want to cancel this invoice? This action cannot be undone."
                confirmText="Yes, Cancel Invoice"
                confirmColor="danger"
                isLoading={isCancelling}
            />
        </div>
    );
}
