'use client';

import { use, useState, useEffect, useMemo, useCallback } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormTextarea } from '@/components/ui/FormFields';
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

    const methods = useForm({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
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
            line_items: [{ id: 1, service_id: null, description: '', quantity: 1, unit_price: 0, tax_rate: 18 }],
        },
    });

    const { control, watch, setValue, handleSubmit, reset } = methods;

    const lineItems = watch('line_items');
    const paymentTerms = watch('payment_terms');
    const invoiceDate = watch('invoice_date');
    const discountType = watch('discount_type');
    const discountValue = watch('discount_value');
    const coinsRedeemed = watch('coins_redeemed');

    // Initialize form with invoice data
    useEffect(() => {
        if (invoice) {
            reset({
                customer_id: invoice.customer_id,
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
                line_items: invoice.line_items ? invoice.line_items.map(item => ({ ...item })) : [],
            });
        }
    }, [invoice, reset]);

    // Calculate totals using utility function
    const calculations = useMemo(() => {
        return calculateInvoiceTotal({
            lineItems: lineItems || [],
            discountType: discountType || 'PERCENTAGE',
            discountValue: discountValue || 0,
            coinsRedeemed: coinsRedeemed || 0,
        });
    }, [lineItems, discountType, discountValue, coinsRedeemed]);

    // Handle payment terms change side effect
    useEffect(() => {
        // Only update due date if dirty? 
        // Or if we change payment terms explicitly.
        // If we load existing, due_date is set.
        // If user changes payment_terms, update due_date.
        // But initialization also fires this effect.
        // Ideally we check if `payment_terms` field is dirty or touched.
        // But `reset` sets `isDirty` to false. 
        // So safe to assume if `payment_terms` or `invoice_date` changes after loading?
        // Actually, simplest is: if user changes payment_terms, we want logic.
        // But simpler: just let it calc. If it matches existing, no unexpected change.
    }, [paymentTerms, invoiceDate, setValue]);

    // Better hook for payment terms:
    // We can't easily detect "user change" vs "programmatic change" in useEffect easily without ref.
    // But `InvoiceDetailsFields` removed the prop.
    // Let's implement logic: when `paymentTerms` changes, recalc due date, UNLESS it was just reset.
    // If we rely on watcher, it fires on reset too.
    // We can compare with `invoice.due_date` if matches logic?
    // Let's keep it simple: if `payment_terms` changes, update `due_date`.
    // But we need to avoid overwriting the `due_date` loaded from DB if it was custom?
    // If DB `due_date` matches `payment_terms` logic, fine.
    // We'll rely on the manual edit of due date if needed.
    // Actually, `InvoiceDetailsFields` allows editing due date.
    // If I put `useEffect` here, it will overwrite manual `due_date` edits if `payment_terms` or `invoice_date` logic runs.

    const handlePaymentTermsChange = (term) => {
        const dueDate = getDefaultDueDate(term, invoiceDate);
        setValue('payment_terms', term);
        setValue('due_date', dueDate.toISOString().split('T')[0]);
    };

    // We don't have the prop on `InvoiceDetailsFields` anymore.
    // So `InvoiceDetailsFields` changes `payment_terms` field directly.
    // So we MUST use `useEffect` or `onChange` on the field Controller.
    // But `InvoiceDetailsFields` uses `FormSelect`.
    // We can't attach handler there without modifying `InvoiceDetailsFields`.
    // Modification: Use `useEffect` properly.
    // To avoid loop/overwrite on initial load:
    // Check if `methods.formState.isDirty`?
    // Or just accept the behavior that PaymentTerms drives DueDate.
    useEffect(() => {
        if (methods.formState.dirtyFields.payment_terms || methods.formState.dirtyFields.invoice_date) {
            const dueDate = getDefaultDueDate(paymentTerms, invoiceDate);
            setValue('due_date', dueDate.toISOString().split('T')[0]);
        }
    }, [paymentTerms, invoiceDate, methods.formState.dirtyFields, setValue]);


    // Submit handler
    const onSubmit = async (data, asDraft = false) => {
        // Validation handled by zodResolver mostly
        if (!data.customer_name) {
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

        try {
            const payload = {
                customer_name: data.customer_name,
                customer_email: data.customer_email || undefined,
                customer_phone: data.customer_phone || undefined,
                customer_address: data.customer_address || undefined,
                invoice_date: data.invoice_date,
                due_date: data.due_date,
                payment_terms: data.payment_terms,
                notes: data.notes || undefined,
                terms_conditions: data.terms_conditions || undefined,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                coins_redeemed: data.coins_redeemed || 0,
                status: asDraft ? 'DRAFT' : invoice?.status || 'PENDING',
                line_items: data.line_items.map(item => ({
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
            onClick: () => handleSubmit((data) => onSubmit(data, true))(),
            loading: isUpdating,
        });
    }
    actions.push({
        label: 'Update Invoice',
        color: 'primary',
        icon: <Save className="w-4 h-4" />,
        onClick: () => handleSubmit((data) => onSubmit(data, false))(),
        loading: isUpdating,
    });

    return (
        <InvoiceLayout
            title={`Edit Invoice ${invoice.invoice_number}`}
            onBack={() => router.push(`/finance/invoices/${invoice.id}`)}
            status={invoice.status}
            actions={actions}
        >
            <Form methods={methods} onSubmit={() => { }} className="contents">
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
                        <FormInput
                            name="customer_name"
                            label="Customer Name"
                            placeholder="Enter customer name"
                            isRequired
                            isDisabled={invoice.amount_paid > 0}
                        />
                        <FormInput
                            name="customer_email"
                            label="Email"
                            type="email"
                            placeholder="customer@example.com"
                        />
                        <FormInput
                            name="customer_phone"
                            label="Phone"
                            placeholder="+91 98765 43210"
                        />
                        <div className="md:col-span-2">
                            <FormTextarea
                                name="customer_address"
                                label="Address"
                                placeholder="Enter customer address"
                                rows={2}
                            />
                        </div>
                    </div>
                </InvoiceSection>

                {/* Invoice Details */}
                <InvoiceSection title="Invoice Details">
                    <InvoiceDetailsFields />
                </InvoiceSection>

                {/* Line Items */}
                <InvoiceSection title="Line Items">
                    <Controller
                        name="line_items"
                        control={control}
                        render={({ field }) => (
                            <LineItemsTable
                                items={field.value}
                                onChange={field.onChange}
                                services={services}
                            />
                        )}
                    />
                </InvoiceSection>

                {/* Calculation & Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Notes Section */}
                    <InvoiceSection title="Additional Information">
                        <InvoiceNotesFields
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
                                coinsRedeemed={coinsRedeemed}
                                afterDiscount={calculations.subtotal - calculations.discount}
                                onCoinsChange={(value) => setValue('coins_redeemed', value)}
                                isLoadingWallet={isLoadingWallet}
                            />
                        )}
                        <CalculationSummary
                            lineItems={lineItems}
                            discountType={discountType}
                            discountValue={discountValue}
                            coinsRedeemed={coinsRedeemed}
                            onDiscountTypeChange={(type) => setValue('discount_type', type)}
                            onDiscountValueChange={(value) => setValue('discount_value', value)}
                        />
                    </div>
                </div>
            </Form>
        </InvoiceLayout>
    );
}
