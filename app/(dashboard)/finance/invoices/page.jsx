/**
 * Invoices List Page
 * Mobile-first responsive with filtering and quick actions
 */

'use client';

import { useState, useMemo } from 'react';
import {
    FileText,
    Search,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Send,
    Download,
    Plus,
    Filter,
    Calendar,
    DollarSign,
    X,
} from 'lucide-react';
import {
    Button,
    Select,
    SelectItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    useDisclosure,
    Chip,
    Input,
    Pagination,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PageHeader, SearchInput, ResponsiveTable, MobileCard, ConfirmModal, FormModal, LinkButton } from '@/components/ui';
import {
    useGetInvoicesQuery,
    useCancelInvoiceMutation,
    useSendInvoiceMutation,
    useLazyGetInvoicePdfUrlQuery,
} from '@/redux/services/api';
import { formatDate, formatCurrency } from '@/utils/dateFormatters';

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

export default function InvoicesPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isSendOpen, onOpen: onSendOpen, onOpenChange: onSendOpenChange, onClose: onSendClose } = useDisclosure();

    const { data, isLoading, refetch } = useGetInvoicesQuery({
        page,
        page_size: 20,
        status: statusFilter || undefined,
        search: search || undefined,
    });

    const [cancelInvoice, { isLoading: isCancelling }] = useCancelInvoiceMutation();
    const [sendInvoice, { isLoading: isSending }] = useSendInvoiceMutation();
    const [getInvoicePdf] = useLazyGetInvoicePdfUrlQuery();

    const invoices = data?.invoices || [];
    const totalPages = data?.total_pages || 1;

    const handleDeleteClick = (invoice) => {
        setSelectedInvoice(invoice);
        onDeleteOpen();
    };

    const handleDeleteConfirm = async () => {
        if (!selectedInvoice) return;
        try {
            await cancelInvoice(selectedInvoice.id).unwrap();
            toast.success('Invoice cancelled successfully');
            onDeleteClose();
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to cancel invoice');
        }
    };

    const handleSendClick = (invoice) => {
        setSelectedInvoice(invoice);
        onSendOpen();
    };

    const handleSendConfirm = async () => {
        if (!selectedInvoice) return;
        try {
            await sendInvoice({
                id: selectedInvoice.id,
                send_via: 'email',
                recipient_email: selectedInvoice.customer_email
            }).unwrap();
            toast.success('Invoice sent successfully');
            onSendClose();
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to send invoice');
        }
    };

    const handleDownloadPdf = async (invoice) => {
        try {
            const result = await getInvoicePdf(invoice.id).unwrap();
            const link = document.createElement('a');
            link.href = result;
            link.download = `${invoice.invoice_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error('Failed to download PDF');
        }
    };

    const columns = [
        {
            key: 'invoice',
            label: 'Invoice',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.invoice_number}</p>
                    <p className="text-sm text-gray-500">{formatDate(row.invoice_date)}</p>
                </div>
            ),
        },
        {
            key: 'customer',
            label: 'Customer',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.customer_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{row.customer_email}</p>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => (
                <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(row.grand_total)}</p>
                    {row.amount_paid > 0 && row.amount_paid < row.grand_total && (
                        <p className="text-sm text-green-600">Paid: {formatCurrency(row.amount_paid)}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <InvoiceStatusBadge status={row.status} />,
        },
        {
            key: 'dueDate',
            label: 'Due Date',
            render: (row) => (
                <span className={`text-sm ${isOverdue(row) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {row.due_date ? formatDate(row.due_date) : 'N/A'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <Dropdown>
                    <DropdownTrigger>
                        <Button variant="light" isIconOnly size="sm">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Invoice actions">
                        <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />} onPress={() => router.push(`/finance/invoices/${row.id}`)}>
                            View Details
                        </DropdownItem>
                        <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => router.push(`/finance/invoices/${row.id}/edit`)}>
                            Edit Invoice
                        </DropdownItem>
                        <DropdownItem key="download" startContent={<Download className="w-4 h-4" />} onPress={() => handleDownloadPdf(row)}>
                            Download PDF
                        </DropdownItem>
                        <DropdownItem key="send" startContent={<Send className="w-4 h-4" />} onPress={() => handleSendClick(row)}>
                            Send to Customer
                        </DropdownItem>
                        <DropdownItem key="delete" startContent={<Trash2 className="w-4 h-4" />} className="text-danger" color="danger" onPress={() => handleDeleteClick(row)}>
                            Cancel Invoice
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            ),
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Invoices"
                description="Manage customer invoices and payments"
                actions={
                    <LinkButton
                        href="/finance/invoices/new"
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        className="w-full sm:w-auto"
                    >
                        New Invoice
                    </LinkButton>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search invoices..."
                    className="flex-1"
                />
                <div className="flex gap-2">
                    <Select
                        placeholder="Status"
                        selectedKeys={statusFilter ? [statusFilter] : []}
                        onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] || '')}
                        className="w-full sm:w-40"
                        size="sm"
                        classNames={{ trigger: 'bg-white' }}
                    >
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </Select>
                    {(search || statusFilter) && (
                        <Button variant="flat" size="sm" onPress={() => { setSearch(''); setStatusFilter(''); }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500">
                {data?.total || 0} invoice{data?.total !== 1 ? 's' : ''}
            </div>

            {/* Table */}
            <ResponsiveTable
                columns={columns}
                data={invoices}
                isLoading={isLoading}
                emptyState={{
                    icon: 'file',
                    title: 'No invoices found',
                    description: search || statusFilter ? 'Try adjusting your filters' : 'Create your first invoice',
                    action: (
                        <LinkButton
                            href="/finance/invoices/new"
                            color="primary"
                            startContent={<Plus className="w-4 h-4" />}
                        >
                            New Invoice
                        </LinkButton>
                    ),
                }}
                actions={[
                    { label: 'View Details', icon: <Eye className="w-4 h-4" />, onClick: (row) => router.push(`/finance/invoices/${row.id}`) },
                    { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: (row) => router.push(`/finance/invoices/${row.id}/edit`) },
                    { label: 'Download PDF', icon: <Download className="w-4 h-4" />, onClick: handleDownloadPdf },
                    { label: 'Send', icon: <Send className="w-4 h-4" />, onClick: handleSendClick },
                    { label: 'Cancel', icon: <Trash2 className="w-4 h-4" />, onClick: handleDeleteClick, danger: true },
                ]}
                renderMobileCard={(invoice, { actions }) => (
                    <InvoiceMobileCard invoice={invoice} actions={actions} onClick={() => router.push(`/finance/invoices/${invoice.id}`)} />
                )}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        total={totalPages}
                        page={page}
                        onChange={setPage}
                        showControls
                        size="sm"
                    />
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                onConfirm={handleDeleteConfirm}
                title="Cancel Invoice"
                message={`Are you sure you want to cancel invoice "${selectedInvoice?.invoice_number}"? This action cannot be undone.`}
                confirmLabel="Cancel Invoice"
                type="danger"
                isLoading={isCancelling}
            />

            {/* Send Confirmation Modal */}
            <FormModal
                isOpen={isSendOpen}
                onOpenChange={onSendOpenChange}
                onSubmit={handleSendConfirm}
                title="Send Invoice"
                submitLabel="Send Email"
                isLoading={isSending}
                isDisabled={!selectedInvoice?.customer_email}
                size="md"
            >
                <div>
                    <p>Send invoice <strong>{selectedInvoice?.invoice_number}</strong> to:</p>
                    <p className="text-gray-600 mt-2">{selectedInvoice?.customer_email || 'No email address'}</p>
                </div>
            </FormModal>
        </div>
    );
}

// Invoice Status Badge
function InvoiceStatusBadge({ status }) {
    const statusConfig = {
        PAID: { color: 'success', label: 'Paid' },
        PARTIALLY_PAID: { color: 'warning', label: 'Partial' },
        PENDING: { color: 'default', label: 'Pending' },
        OVERDUE: { color: 'danger', label: 'Overdue' },
        CANCELLED: { color: 'default', label: 'Cancelled' },
        DRAFT: { color: 'secondary', label: 'Draft' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
        <Chip size="sm" color={config.color} variant="flat">
            {config.label}
        </Chip>
    );
}

// Check if invoice is overdue
function isOverdue(invoice) {
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') return false;
    if (!invoice.due_date) return false;
    return new Date(invoice.due_date) < new Date();
}

// Mobile Invoice Card
function InvoiceMobileCard({ invoice, actions, onClick }) {
    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{invoice.invoice_number}</MobileCard.Title>
                    <MobileCard.Subtitle>{invoice.customer_name || 'No customer'}</MobileCard.Subtitle>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                    <InvoiceStatusBadge status={invoice.status} />
                </div>
            </MobileCard.Header>
            <MobileCard.Meta>
                <span className="text-gray-500">Date: {formatDate(invoice.invoice_date)}</span>
                {invoice.due_date && (
                    <span className={isOverdue(invoice) ? 'text-red-600' : 'text-gray-500'}>
                        Due: {formatDate(invoice.due_date)}
                    </span>
                )}
            </MobileCard.Meta>
        </MobileCard>
    );
}
