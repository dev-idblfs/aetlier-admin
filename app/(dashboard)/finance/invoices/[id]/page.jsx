/**
 * Invoice Detail View Page
 * Display complete invoice with customer info, line items, payments
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormFields';
import { FormModal } from '@/components/ui/FormModal';

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

    // Fetch invoice
    const { data: invoice, isLoading, error, refetch } = useGetInvoiceQuery(unwrappedParams.id);

    // Payment Form
    const paymentMethodsForm = useForm({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: '',
            payment_method: 'CASH',
            payment_date: new Date().toISOString().split('T')[0],
            notes: '',
        },
    });

    const { reset: resetPaymentForm, handleSubmit: handlePaymentSubmit } = paymentMethodsForm;

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

    const onPaymentSubmit = async (data) => {
        try {
            await recordPayment({
                id: invoice.id,
                amount: parseFloat(data.amount),
                payment_method: data.payment_method,
                payment_date: data.payment_date,
                notes: data.notes,
            }).unwrap();
            toast.success('Payment recorded successfully');
            onPaymentModalClose();
            resetPaymentForm();
            refetch();
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to record payment');
        }
    };

    const handleRecordPaymentSubmit = () => {
        handlePaymentSubmit(onPaymentSubmit)();
    };

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
                <p className="text-gray-600">The invoice you&apos;re looking for doesn&apos;t exist.</p>
                <Button as={Link} href="/finance/invoices" variant="flat">
                    Back to Invoices
                </Button>
            </div>
        );
    }

    const isOverdue = invoice.status === 'OVERDUE';
    const canEdit = ['DRAFT', 'PENDING'].includes(invoice.status);
    const canCancel = !['PAID', 'CANCELLED'].includes(invoice.status);
    const canRecordPayment = ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);

    const remainingBalance = invoice.grand_total - (invoice.amount_paid || 0);

    // Format line items for the component
    const lineItems = invoice.line_items?.map((item, index) => ({
        id: index,
        ...item,
    })) || [];

    // Build actions array
    const actions = [];
    if (canEdit) {
        actions.push({
            label: 'Edit',
            color: 'primary',
            variant: 'flat',
            icon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/finance/invoices/${invoice.id}/edit`),
        });
    }
    actions.push(
        {
            label: 'PDF',
            variant: 'flat',
            icon: <Download className="w-4 h-4" />,
            onClick: handleDownloadPdf,
            loading: isDownloading,
        },
        {
            label: 'Send',
            variant: 'flat',
            icon: <Send className="w-4 h-4" />,
            onClick: handleSendEmail,
            loading: isSending,
        }
    );
    if (canRecordPayment) {
        actions.push({
            label: 'Record Payment',
            color: 'success',
            variant: 'flat',
            icon: <DollarSign className="w-4 h-4" />,
            onClick: onPaymentModalOpen,
        });
    }
    if (canCancel) {
        actions.push({
            label: 'Cancel',
            color: 'danger',
            variant: 'flat',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: onCancelModalOpen,
        });
    }

    return (
        <InvoiceLayout
            title={invoice.invoice_number}
            invoiceNumber={null}
            onBack={() => router.push('/finance/invoices')}
            status={invoice.status}
            actions={actions}
        >
            {/* Overdue Warning */}
            {isOverdue && (
                <Card className="mb-6 bg-danger-50 border-danger">
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

            {/* Customer & Invoice Info */}
            <Card className="mb-6">
                <CardBody>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Customer</p>
                            <p className="font-semibold">{invoice.customer_name || 'N/A'}</p>
                            {invoice.customer_email && (
                                <p className="text-xs text-gray-600">{invoice.customer_email}</p>
                            )}
                            {invoice.customer_phone && (
                                <p className="text-xs text-gray-600">{invoice.customer_phone}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Invoice Date</p>
                            <p className="font-semibold">{formatDate(invoice.invoice_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Due Date</p>
                            <p className={`font-semibold ${isOverdue ? 'text-danger' : ''}`}>
                                {formatDate(invoice.due_date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Payment Terms</p>
                            <p className="font-semibold">{invoice.payment_terms || 'N/A'}</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Line Items */}
            <Card className="mb-6">
                <CardBody>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3>
                    <LineItemsTable
                        items={lineItems}
                        onChange={() => { }} // Read-only
                        services={[]}
                        readonly
                    />
                </CardBody>
            </Card>

            {/* Notes and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notes */}
                {(invoice.customer_notes || invoice.terms_conditions) && (
                    <Card>
                        <CardBody className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                            {invoice.customer_notes && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Customer Notes</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">
                                        {invoice.customer_notes}
                                    </p>
                                </div>
                            )}
                            {invoice.terms_conditions && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">
                                        {invoice.terms_conditions}
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}

                {/* Summary & Payments */}
                <div className="space-y-4">
                    <CalculationSummary
                        lineItems={lineItems}
                        discountType={invoice.discount_type || 'FIXED'}
                        discountValue={invoice.discount_amount || 0}
                        coinsRedeemed={0}
                        readonly
                    />

                    {/* Payment Summary */}
                    {invoice.amount_paid > 0 && (
                        <Card className="bg-gray-50 shadow-md">
                            <CardBody className="space-y-2">
                                <div className="flex justify-between text-sm text-success-600">
                                    <span>Amount Paid</span>
                                    <span className="font-semibold">{formatCurrency(invoice.amount_paid)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-primary">
                                    <span>Balance Due</span>
                                    <span>{formatCurrency(remainingBalance)}</span>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <Card className="shadow-md">
                            <CardBody>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Payment History</h4>
                                <div className="space-y-3">
                                    {invoice.payments.map((payment, index) => (
                                        <div key={index} className="border-b last:border-b-0 pb-3 last:pb-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                                    <p className="text-xs text-gray-600">{formatDate(payment.payment_date)}</p>
                                                    <p className="text-xs text-gray-500">{payment.payment_method}</p>
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
                </div>
            </div>

            {/* Record Payment Modal */}
            <FormModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    onPaymentModalClose();
                    resetPaymentForm();
                }}
                title="Record Payment"
                onSubmit={handleRecordPaymentSubmit}
                isLoading={isRecordingPayment}
                submitLabel="Record Payment"
                submitColor="success"
            >
                <Form methods={paymentMethodsForm} onSubmit={onPaymentSubmit} id="payment-form">
                    <div className="space-y-4">
                        <div className="p-3 bg-primary-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                Balance Due: <span className="font-bold text-primary text-lg">
                                    {formatCurrency(remainingBalance)}
                                </span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                name="amount"
                                label="Payment Amount"
                                type="number"
                                placeholder="0.00"
                                startContent={<DollarSign className="w-4 h-4 text-gray-400" />}
                                isRequired
                                description={`Max: ${formatCurrency(remainingBalance)}`}
                            />
                            <FormSelect
                                name="payment_method"
                                label="Payment Method"
                                isRequired
                            >
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </FormSelect>
                            <FormInput
                                name="payment_date"
                                label="Payment Date"
                                type="date"
                                isRequired
                                className="md:col-span-2"
                            />
                            <FormTextarea
                                name="notes"
                                label="Notes (Optional)"
                                placeholder="Add any notes about this payment"
                                className="md:col-span-2"
                            />
                        </div>
                    </div>
                </Form>
            </FormModal>

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
        </InvoiceLayout>
    );
}
