/**
 * Edit Invoice Page
 * Edit existing invoice with pre-filled data
 */

'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Button, Input, Textarea, Spinner } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
    useGetInvoiceQuery,
    useUpdateInvoiceMutation,
    useGetServicesQuery,
    useGetUserWalletQuery,
} from '@/redux/services/api';
import {
    InvoiceLayout,
    LineItemsTable,
    CalculationSummary,
    CoinsRedemption,
    InvoiceDetailsFields,
    InvoiceNotesFields,
} from '@/components/invoice';
import { InvoiceSection, InvoiceAlert, InvoiceEmptyState } from '@/components/ui';
import { calculateInvoiceTotal } from '@/utils/invoice/calculations';
import { formatCurrency } from '@/utils/dateFormatters';
import { getDefaultDueDate } from '@/utils/invoice/paymentTerms';

export default function EditInvoicePage({ params }) {
    const unwrappedParams = use(params);
    const router = useRouter();

    // API Hooks
    const { data: invoice, isLoading, error } = useGetInvoiceQuery(unwrappedParams.id);
    const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();
    const { data: servicesData } = useGetServicesQuery();
    const services = servicesData || [];

    // Fetch wallet data if invoice has a user
    const { data: walletData, isLoading: isLoadingWallet } = useGetUserWalletQuery(
        invoice?.user_id,
        { skip: !invoice?.user_id }
    );

    // Form State
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        payment_terms: 'DUE_ON_RECEIPT',
        notes: '',
        terms_conditions: '',
        discount_type: 'PERCENTAGE',
        discount_value: 0,
        coins_redeemed: 0,
    });

    const [lineItems, setLineItems] = useState([
        { id: 1, service_id: null, description: '', quantity: 1, unit_price: 0, tax_rate: 18 }
    ]);

    // Initialize form with invoice data
    useEffect(() => {
        if (invoice) {
            setFormData({
                customer_name: invoice.customer_name || '',
                customer_email: invoice.customer_email || '',
                customer_phone: invoice.customer_phone || '',
                customer_address: invoice.customer_address || '',
                invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
                due_date: invoice.due_date || new Date().toISOString().split('T')[0],
                payment_terms: invoice.payment_terms || 'DUE_ON_RECEIPT',
                notes: invoice.customer_notes || '',
                terms_conditions: invoice.terms_conditions || '',
                discount_type: invoice.discount_type || 'PERCENTAGE',
                discount_value: invoice.discount_value || 0,
                coins_redeemed: invoice.coins_redeemed || 0,
            });

            if (invoice.line_items && invoice.line_items.length > 0) {
                setLineItems(
                    invoice.line_items.map((item, index) => ({
                        ...item,
                    }))
                );
            }
        }
    }, [invoice]);

    // Calculate totals using utility function
    const calculations = useMemo(() => {
        return calculateInvoiceTotal({
            lineItems,
            discountType: formData.discount_type,
            discountValue: formData.discount_value,
            coinsRedeemed: formData.coins_redeemed,
        });
    }, [lineItems, formData.discount_type, formData.discount_value, formData.coins_redeemed]);

    // Handle payment terms change
    const handlePaymentTermsChange = (term) => {
        const dueDate = getDefaultDueDate(term, formData.invoice_date);
        setFormData({
            ...formData,
            payment_terms: term,
            due_date: dueDate.toISOString().split('T')[0],
        });
    };

    // Submit handler
    const handleSubmit = async (asDraft = false) => {
        // Validation
        if (!formData.customer_name) {
            toast.error('Customer name is required');
            return;
        }

        if (lineItems.some(item => !item.description || item.quantity <= 0)) {
            toast.error('All line items must have a description and quantity');
            return;
        }

        // Check if invoice can be edited
        if (invoice && invoice.status === 'PAID') {
            toast.error('Cannot edit a paid invoice');
            return;
        }

        if (invoice && invoice.amount_paid > 0) {
            toast.warning('This invoice has payments recorded. Some changes may be restricted.');
        }

        try {
            const payload = {
                customer_name: formData.customer_name,
                customer_email: formData.customer_email || undefined,
                customer_phone: formData.customer_phone || undefined,
                customer_address: formData.customer_address || undefined,
                invoice_date: formData.invoice_date,
                due_date: formData.due_date,
                payment_terms: formData.payment_terms,
                notes: formData.notes || undefined,
                terms_conditions: formData.terms_conditions || undefined,
                discount_type: formData.discount_type,
                discount_value: formData.discount_value,
                coins_redeemed: formData.coins_redeemed || 0,
                status: asDraft ? 'DRAFT' : invoice?.status || 'PENDING',
                line_items: lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                })),
            };

            await updateInvoice({ id: unwrappedParams.id, ...payload }).unwrap();
            toast.success('Invoice updated successfully');
            router.push(`/finance/invoices/${unwrappedParams.id}`);
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update invoice');
        }
    };

    if (isLoading) {
        return (
            <InvoiceEmptyState
                icon={<Spinner size="lg" />}
                title="Loading Invoice"
                message="Please wait while we fetch the invoice details..."
                minHeight="min-h-[60vh]"
            />
        );
    }

    if (error || !invoice) {
        return (
            <InvoiceEmptyState
                icon={<AlertCircle className="w-16 h-16 text-danger" />}
                title="Invoice Not Found"
                message="The invoice you're trying to edit doesn't exist."
                actions={[
                    {
                        label: 'Back to Invoices',
                        href: '/finance/invoices',
                        variant: 'flat',
                    },
                ]}
            />
        );
    }

    // Prevent editing paid invoices
    if (invoice.status === 'PAID') {
        return (
            <InvoiceEmptyState
                icon={<AlertCircle className="w-16 h-16 text-warning" />}
                title="Cannot Edit Paid Invoice"
                message="This invoice has been paid and cannot be edited."
                actions={[
                    {
                        label: 'View Invoice',
                        href: `/finance/invoices/${invoice.id}`,
                        variant: 'flat',
                    },
                    {
                        label: 'Back to Invoices',
                        href: '/finance/invoices',
                        variant: 'flat',
                    },
                ]}
            />
        );
    }

    // Build actions array
    const actions = [];
    if (invoice.status === 'DRAFT') {
        actions.push({
            label: 'Save as Draft',
            variant: 'flat',
            icon: <Save className="w-4 h-4" />,
            onClick: () => handleSubmit(true),
            loading: isUpdating,
        });
    }
    actions.push({
        label: 'Update Invoice',
        color: 'primary',
        icon: <Save className="w-4 h-4" />,
        onClick: () => handleSubmit(false),
        loading: isUpdating,
    });

    return (
        <InvoiceLayout
            title={`Edit Invoice ${invoice.invoice_number}`}
            onBack={() => router.push(`/finance/invoices/${invoice.id}`)}
            status={invoice.status}
            actions={actions}
        >
            {/* Warning for invoices with payments */}
            {invoice.amount_paid > 0 && (
                <InvoiceAlert
                    variant="warning"
                    icon={<AlertCircle className="w-5 h-5" />}
                    title="Payment Recorded"
                    message={`This invoice has ${formatCurrency(invoice.amount_paid)} in payments recorded. Changes to line items will affect the balance due.`}
                />
            )}

            {/* Customer Information */}
            <InvoiceSection title="Customer Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Customer Name"
                        labelPlacement="outside"
                        placeholder="Enter customer name"
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                        isRequired
                        isDisabled={invoice.amount_paid > 0}
                    />
                    <Input
                        label="Email"
                        labelPlacement="outside"
                        type="email"
                        placeholder="customer@example.com"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    />
                    <Input
                        label="Phone"
                        labelPlacement="outside"
                        placeholder="+91 98765 43210"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                    <div className="md:col-span-2">
                        <Textarea
                            label="Address"
                            labelPlacement="outside"
                            placeholder="Enter customer address"
                            value={formData.customer_address}
                            onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                            rows={2}
                        />
                    </div>
                </div>
            </InvoiceSection>

            {/* Invoice Details */}
            <InvoiceSection title="Invoice Details">
                <InvoiceDetailsFields
                    value={formData}
                    onChange={setFormData}
                    onPaymentTermsChange={handlePaymentTermsChange}
                />
            </InvoiceSection>

            {/* Line Items */}
            <InvoiceSection title="Line Items">
                <LineItemsTable
                    items={lineItems}
                    onChange={setLineItems}
                    services={services}
                />
            </InvoiceSection>

            {/* Calculation & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notes Section */}
                <InvoiceSection title="Additional Information">
                    <InvoiceNotesFields
                        notes={formData.notes}
                        terms={formData.terms_conditions}
                        onNotesChange={(value) => setFormData({ ...formData, notes: value })}
                        onTermsChange={(value) => setFormData({ ...formData, terms_conditions: value })}
                        notesLabel="Customer Notes"
                        notesPlaceholder="Add notes for the customer"
                        termsPlaceholder="Add terms and conditions"
                    />
                </InvoiceSection>

                {/* Summary with Coins */}
                <div className="space-y-4">
                    {invoice?.user_id && (
                        <CoinsRedemption
                            walletBalance={walletData?.balance || 0}
                            coinsRedeemed={formData.coins_redeemed}
                            afterDiscount={calculations.subtotal - calculations.discount}
                            onCoinsChange={(value) => setFormData({ ...formData, coins_redeemed: value })}
                            isLoadingWallet={isLoadingWallet}
                        />
                    )}
                    <CalculationSummary
                        lineItems={lineItems}
                        discountType={formData.discount_type}
                        discountValue={formData.discount_value}
                        coinsRedeemed={formData.coins_redeemed}
                        onDiscountTypeChange={(type) => setFormData({ ...formData, discount_type: type })}
                        onDiscountValueChange={(value) => setFormData({ ...formData, discount_value: value })}
                    />
                </div>
            </div>
        </InvoiceLayout>
    );
}
