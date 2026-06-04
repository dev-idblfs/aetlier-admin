/**
 * Invoice Detail View Page
 */

'use client';

export const dynamic = 'force-dynamic';

import { use } from 'react';
import Link from 'next/link';
import {
    Edit,
    Download,
    Send,
    Trash2,
    DollarSign,
    AlertCircle,
} from 'lucide-react';
import { Button, Spinner, useDisclosure } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { ConfirmModal, InvoiceSection, InvoiceAlert } from '@/components/ui';
import {
    InvoiceLayout,
    LineItemsTable,
    CalculationSummary,
    RecordPaymentModal,
    InvoiceDetailOverview,
    InvoiceDetailNotes,
    InvoicePaymentPanel,
} from '@/components/invoice';
import {
    useGetInvoiceQuery,
    useCancelInvoiceMutation,
    useSendInvoiceMutation,
    useLazyGetInvoicePdfUrlQuery,
    useRecordInvoicePaymentMutation,
} from '@/redux/services/api';
import { formatDate } from '@/utils/dateFormatters';
import { resolveInvoiceBalance } from '@/utils/invoice/calculations';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

export default function InvoiceDetailPage({ params }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const user = useSelector((state) => state.auth.user);
    const canView = hasPermission(user, PERMISSIONS.INVOICE_VIEW_ANY);
    const canEdit = hasPermission(user, PERMISSIONS.INVOICE_UPDATE);
    const canSend = hasPermission(user, PERMISSIONS.INVOICE_SEND);
    const canRecordPayment = hasPermission(user, PERMISSIONS.INVOICE_PAYMENT_RECORD);
    const canCancel = hasPermission(user, PERMISSIONS.INVOICE_DELETE);

    const [cancelInvoice, { isLoading: isCancelling }] = useCancelInvoiceMutation();
    const [sendInvoice, { isLoading: isSending }] = useSendInvoiceMutation();
    const [getPdfUrl, { isLoading: isDownloading }] = useLazyGetInvoicePdfUrlQuery();
    const [recordPayment, { isLoading: isRecordingPayment }] =
        useRecordInvoicePaymentMutation();

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

    const { data: invoice, isLoading, error, refetch } = useGetInvoiceQuery(
        unwrappedParams.id,
        { skip: !canView || !unwrappedParams?.id }
    );

    if (!canView) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-16 h-16 text-warning" />
                <h2 className="text-xl font-semibold">Access denied</h2>
                <p className="text-gray-600">You do not have permission to view invoices.</p>
            </div>
        );
    }

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
                <p className="text-gray-600">
                    The invoice you&apos;re looking for doesn&apos;t exist.
                </p>
                <Button as={Link} href="/finance/invoices" variant="flat">
                    Back to Invoices
                </Button>
            </div>
        );
    }

    const isOverdue = invoice.status === 'OVERDUE';
    const statusAllowsEdit = ['DRAFT', 'SENT'].includes(invoice.status);
    const statusAllowsCancel = !['PAID', 'CANCELLED'].includes(invoice.status);
    const statusAllowsPayment = ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(
        invoice.status
    );
    const showEdit = canEdit && statusAllowsEdit;
    const showCancel = canCancel && statusAllowsCancel;
    const showRecordPayment = canRecordPayment && statusAllowsPayment;
    const showSend = canSend && ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(
        invoice.status
    );

    const lineItems =
        invoice.line_items?.map((item, index) => ({
            id: item.id || index,
            service_id: item.service_id,
            service_name: item.service_name || null,
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            tax_rate: Number(item.tax_rate) || 0,
            line_total: Number(item.line_total) || 0,
        })) || [];

    const { balanceDue: remainingBalance, amountPaid } = resolveInvoiceBalance(
        invoice,
        lineItems
    );
    const showBalanceDue = remainingBalance > 0 && statusAllowsPayment;

    const handleDownloadPdf = async () => {
        try {
            const pdfUrl = await getPdfUrl(invoice.id).unwrap();
            if (pdfUrl) {
                window.open(pdfUrl, '_blank');
                toast.success('Opening PDF...');
            }
        } catch (err) {
            toast.error(err?.data?.detail || 'Failed to download PDF');
        }
    };

    const handleSendEmail = async () => {
        try {
            await sendInvoice({
                id: invoice.id,
                send_via: 'email',
                recipient_email: invoice.customer_email,
            }).unwrap();
            toast.success('Invoice sent successfully');
            refetch();
        } catch (err) {
            toast.error(err?.data?.detail || 'Failed to send invoice');
        }
    };

    const handleCancelInvoice = async () => {
        try {
            await cancelInvoice(invoice.id).unwrap();
            toast.success('Invoice cancelled successfully');
            onCancelModalClose();
            refetch();
        } catch (err) {
            toast.error(err?.data?.detail || 'Failed to cancel invoice');
        }
    };

    const handleRecordPayment = async (data) => {
        try {
            await recordPayment({
                id: invoice.id,
                amount: data.amount,
                payment_method: data.payment_method,
                notes: data.notes,
            }).unwrap();
            toast.success('Payment recorded successfully');
            onPaymentModalClose();
            refetch();
        } catch (err) {
            toast.error(err?.data?.detail || 'Failed to record payment');
        }
    };

    const actions = [];
    if (showEdit) {
        actions.push({
            label: 'Edit',
            color: 'primary',
            variant: 'flat',
            icon: <Edit className="w-4 h-4" />,
            onClick: () => router.push(`/finance/invoices/${invoice.id}/edit`),
        });
    }
    actions.push({
        label: 'PDF',
        variant: 'flat',
        icon: <Download className="w-4 h-4" />,
        onClick: handleDownloadPdf,
        loading: isDownloading,
    });
    if (showSend) {
        actions.push({
            label: 'Send',
            variant: 'flat',
            icon: <Send className="w-4 h-4" />,
            onClick: handleSendEmail,
            loading: isSending,
        });
    }
    if (showRecordPayment) {
        actions.push({
            label: 'Record Payment',
            color: 'primary',
            variant: 'flat',
            icon: <DollarSign className="w-4 h-4" />,
            onClick: onPaymentModalOpen,
        });
    }
    if (showCancel) {
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
            onBack={() => router.push('/finance/invoices')}
            status={invoice.status}
            actions={actions}
            compact
        >
            {isOverdue && (
                <InvoiceAlert
                    variant="danger"
                    icon={<AlertCircle className="w-4 h-4" />}
                    title="Overdue"
                    message={`Due date was ${formatDate(invoice.due_date)}`}
                    compact
                />
            )}

            <InvoiceDetailOverview invoice={invoice} isOverdue={isOverdue} />

            <InvoiceSection title="Line items" compact>
                <LineItemsTable
                    items={lineItems}
                    onChange={() => {}}
                    services={[]}
                    readonly
                    compact
                />
            </InvoiceSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <InvoiceDetailNotes notes={invoice.notes} terms={invoice.terms} />

                <div
                    className={`space-y-3 ${!(invoice.notes || invoice.terms) ? 'lg:col-span-2' : ''}`}
                >
                    <CalculationSummary
                        lineItems={lineItems}
                        discountType={invoice.discount_type || 'FIXED'}
                        discountValue={
                            Number(invoice.discount_value ?? invoice.discount_amount) || 0
                        }
                        coinsRedeemed={Number(invoice.coins_redeemed) || 0}
                        readonly
                        compact
                    />
                    <InvoicePaymentPanel
                        amountPaid={amountPaid}
                        balanceDue={remainingBalance}
                        showBalanceDue={showBalanceDue}
                        payments={invoice.payments}
                    />
                </div>
            </div>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={onPaymentModalClose}
                invoiceNumber={invoice.invoice_number}
                balanceDue={remainingBalance}
                onSubmit={handleRecordPayment}
                isLoading={isRecordingPayment}
            />

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
