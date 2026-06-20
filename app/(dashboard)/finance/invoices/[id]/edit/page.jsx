'use client';

import { use, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '@/lib/validation';
import { Form, FormErrorSummary } from '@/components/ui/Form';
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
    CustomerSelector,
    InvoiceCustomerBillingFields,
} from '@/components/invoice';
import { InvoiceSection, InvoiceAlert, InvoiceEmptyState } from '@/components/ui';
import { calculateInvoiceTotal } from '@/utils/invoice/calculations';
import { formatCurrency } from '@/utils/dateFormatters';
import { getDefaultDueDate } from '@/utils/invoice/paymentTerms';
import {
    useInvoiceCustomerSearch,
    formatCustomerAddressForForm,
    parseCustomerAddressForPayload,
} from '@/hooks/useInvoiceCustomerSearch';

export default function EditInvoicePage({ params }) {
    const unwrappedParams = use(params);
    const router = useRouter();

    // API Hooks
    const { data: invoice, isLoading, error } = useGetInvoiceQuery(unwrappedParams.id);
    const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();
    const { data: servicesData } = useGetServicesQuery();
    const services = servicesData || [];
    const {
        handleSearchCustomers,
        handleCreateCustomer,
        isCreatingCustomer,
        isSearchingCustomers,
    } = useInvoiceCustomerSearch();

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const invoiceFormSyncedId = useRef(null);
    const customerLocked = (invoice?.amount_paid ?? 0) > 0;

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

    const { control, watch, setValue, handleSubmit, reset, setError, clearErrors } = methods;

    const onInvalid = () => {
        // Field errors render inline via RHF + FormFields
    };

    const lineItems = watch('line_items');
    const paymentTerms = watch('payment_terms');
    const invoiceDate = watch('invoice_date');
    const discountType = watch('discount_type');
    const discountValue = watch('discount_value');
    const coinsRedeemed = watch('coins_redeemed');

    const onCustomerSelect = useCallback(
        (customer) => {
            setSelectedCustomer(customer);
            if (customer) {
                setValue('customer_id', customer.id ? String(customer.id) : '');
                setValue('customer_name', customer.display_name || customer.name || '');
                setValue('customer_email', customer.email || '');
                setValue('customer_phone', customer.phone || '');
                setValue(
                    'customer_address',
                    formatCustomerAddressForForm(customer.billing_address)
                );
            } else {
                setValue('customer_id', '');
                setValue('customer_name', '');
                setValue('customer_email', '');
                setValue('customer_phone', '');
                setValue('customer_address', '');
            }
        },
        [setValue]
    );

    // Initialize form once per invoice load (do not reset after user picks another customer)
    useEffect(() => {
        if (!invoice?.id) return;
        if (invoiceFormSyncedId.current === invoice.id) return;
        invoiceFormSyncedId.current = invoice.id;

        const linkedId = invoice.customer_id || invoice.user_id;
        reset({
                customer_id: linkedId ? String(linkedId) : '',
                customer_name: invoice.customer_name || '',
                customer_email: invoice.customer_email || '',
                customer_phone: invoice.customer_phone || '',
                customer_address: formatCustomerAddressForForm(invoice.customer_address),
                invoice_date: invoice.invoice_date
                    ? String(invoice.invoice_date).slice(0, 10)
                    : new Date().toISOString().split('T')[0],
                due_date: invoice.due_date
                    ? String(invoice.due_date).slice(0, 10)
                    : new Date().toISOString().split('T')[0],
                payment_terms: invoice.payment_terms || 'DUE_ON_RECEIPT',
                notes: invoice.notes || '',
                terms_conditions: invoice.terms || '',
                discount_type: (invoice.discount_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE'),
                discount_value: invoice.discount_value || 0,
                coins_redeemed: invoice.coins_redeemed || 0,
                line_items: invoice.line_items
                    ? invoice.line_items.map((item) => ({
                        id: item.id != null ? String(item.id) : undefined,
                        service_id: item.service_id != null ? String(item.service_id) : null,
                        service_name: item.service_name || null,
                        description: item.description || '',
                        quantity: Number(item.quantity) || 1,
                        unit_price: Number(item.unit_price) || 0,
                        tax_rate: Number(item.tax_rate) || 0,
                    }))
                    : [],
            });
        if (linkedId || invoice.customer_name) {
            setSelectedCustomer({
                id: linkedId,
                display_name: invoice.customer_name || '',
                email: invoice.customer_email || '',
                phone: invoice.customer_phone || '',
            });
        }
    }, [invoice?.id, invoice, reset]);

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
        clearErrors('root');

        if (invoice && invoice.status === 'PAID') {
            setError('root', {
                type: 'manual',
                message: 'Cannot edit a paid invoice',
            });
            return;
        }

        try {
            const payload = {
                customer_id: data.customer_id || undefined,
                customer_name: data.customer_name,
                customer_email: data.customer_email || undefined,
                customer_phone: data.customer_phone || undefined,
                customer_address: parseCustomerAddressForPayload(
                    data.customer_address
                ),
                invoice_date: data.invoice_date,
                due_date: data.due_date,
                payment_terms: data.payment_terms,
                notes: data.notes || undefined,
                terms: data.terms_conditions || undefined,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                coins_redeemed: data.coins_redeemed || 0,
                status: asDraft ? 'DRAFT' : invoice?.status || 'DRAFT',
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

    const handleSaveDraft = handleSubmit(
        (data) => onSubmit(data, true),
        onInvalid
    );

    const handleUpdateInvoice = handleSubmit(
        (data) => onSubmit(data, false),
        onInvalid
    );

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
            onPress: handleSaveDraft,
            loading: isUpdating,
        });
    }
    actions.push({
        label: 'Update Invoice',
        color: 'primary',
        icon: <Save className="w-4 h-4" />,
        onPress: handleUpdateInvoice,
        loading: isUpdating,
    });

    return (
        <InvoiceLayout
            title={`Edit Invoice ${invoice.invoice_number}`}
            status={invoice.status}
            compact
            breadcrumbs={[
                { label: 'Invoices', href: '/finance/invoices' },
                { label: invoice.invoice_number, href: `/finance/invoices/${invoice.id}` },
                { label: 'Edit' },
            ]}
            actions={actions}
        >
            <Form methods={methods} onSubmit={(data) => onSubmit(data, false)} className="contents">
                <FormErrorSummary error={methods.formState.errors.root?.message} className="mb-3" />

                {/* Warning for invoices with payments */}
                {invoice.amount_paid > 0 && (
                    <InvoiceAlert
                        variant="warning"
                        icon={<AlertCircle className="w-4 h-4" />}
                        title="Payment recorded"
                        message={`${formatCurrency(invoice.amount_paid)} paid — line item edits change balance due.`}
                        compact
                    />
                )}

                <InvoiceSection title="Customer & invoice" compact>
                    <div className="space-y-3">
                        <CustomerSelector
                            value={selectedCustomer}
                            onChange={onCustomerSelect}
                            searchCustomers={handleSearchCustomers}
                            createCustomer={handleCreateCustomer}
                            isLoadingSearch={isSearchingCustomers}
                            isLoadingCreate={isCreatingCustomer}
                            readonly={customerLocked}
                            showCreateButton={!customerLocked}
                            hideSelectedPreview
                            compact
                        />
                        <InvoiceCustomerBillingFields
                            nameDisabled={customerLocked}
                            fieldsDisabled={customerLocked}
                        />
                        <div className="border-t border-gray-100 pt-3">
                            <InvoiceDetailsFields compact />
                        </div>
                    </div>
                </InvoiceSection>

                <InvoiceSection title="Line Items" compact>
                    <Controller
                        name="line_items"
                        control={control}
                        render={({ field }) => (
                            <LineItemsTable
                                items={field.value}
                                onChange={field.onChange}
                                services={services}
                                compact
                            />
                        )}
                    />
                </InvoiceSection>

                {/* Calculation & Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InvoiceSection title="Additional Information" compact>
                        <InvoiceNotesFields
                            compact
                            notesLabel="Customer Notes"
                            notesPlaceholder="Add notes for the customer"
                            termsPlaceholder="Add terms and conditions"
                        />
                    </InvoiceSection>

                    {/* Summary with Coins */}
                    <div className="space-y-4">
                        {invoice?.user_id && (
                            <CoinsRedemption
                                value={coinsRedeemed}
                                onChange={(value) => setValue('coins_redeemed', value)}
                                walletBalance={walletData?.balance ?? walletData?.coin_balance ?? 0}
                                subtotal={calculations.subtotal}
                                discount={calculations.discount}
                                isLoadingWallet={isLoadingWallet}
                                compact
                            />
                        )}
                        <CalculationSummary
                            lineItems={lineItems}
                            discountType={discountType}
                            discountValue={discountValue}
                            coinsRedeemed={coinsRedeemed}
                            onDiscountTypeChange={(type) => setValue('discount_type', type)}
                            onDiscountValueChange={(value) => setValue('discount_value', value)}
                            compact
                        />
                    </div>
                </div>
            </Form>
        </InvoiceLayout>
    );
}
