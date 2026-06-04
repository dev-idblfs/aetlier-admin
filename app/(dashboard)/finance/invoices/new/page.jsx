'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import {
    useCreateInvoiceMutation,
    useGetServicesQuery,
    useGetInvoiceSettingsQuery,
    useCreateInvoiceFromAppointmentMutation,
} from '@/redux/services/api';
import {
    useInvoiceCustomerSearch,
    formatCustomerAddressForForm,
    parseCustomerAddressForPayload,
} from '@/hooks/useInvoiceCustomerSearch';
import {
    InvoiceLayout,
    CustomerSelector,
    InvoiceCustomerBillingFields,
    LineItemsTable,
    CalculationSummary,
    InvoiceDetailsFields,
    InvoiceNotesFields,
} from '@/components/invoice';
import { InvoiceSection } from '@/components/ui';
import { calculateInvoiceTotal } from '@/utils/invoice/calculations';
import { getDefaultDueDate } from '@/utils/invoice/paymentTerms';

export default function NewInvoicePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointment_id');
    const isDraftRef = useRef(false);
    const appointmentCreateStartedRef = useRef(false);

    // API Hooks
    const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
    const [createFromAppointment, { isLoading: isCreatingFromAppointment }] = useCreateInvoiceFromAppointmentMutation();
    const { data: servicesData, isLoading: isLoadingServices } = useGetServicesQuery(undefined, {
        refetchOnMountOrArgChange: 600,
        keepUnusedDataFor: 600,
    });
    const { data: settings } = useGetInvoiceSettingsQuery();
    const {
        handleSearchCustomers,
        handleCreateCustomer,
        isCreatingCustomer,
        isSearchingCustomers,
    } = useInvoiceCustomerSearch();

    const services = servicesData || [];

    const methods = useForm({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            customer_id: '',
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
            line_items: [{
                id: crypto.randomUUID(),
                service_id: null,
                description: '',
                quantity: 1,
                unit_price: 0,
                tax_rate: 0,
            }],
        },
    });

    const { control, watch, setValue, handleSubmit, reset } = methods;

    // Local state for external components
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Watch fields for calculations and side effects
    const lineItems = watch('line_items');
    const paymentTerms = watch('payment_terms');
    const discountType = watch('discount_type');
    const discountValue = watch('discount_value');
    const coinsRedeemed = watch('coins_redeemed');
    const invoiceDate = watch('invoice_date');

    // Update settings defaults
    useEffect(() => {
        if (settings) {
            if (!methods.formState.isDirty) {
                setValue('terms_conditions', settings.default_terms || '');
                // Could update other defaults if needed, but risky if user already typed
            }
        }
    }, [settings, setValue, methods.formState.isDirty]);

    // Handle payment terms change side effect
    useEffect(() => {
        if (paymentTerms && invoiceDate) {
            const dueDate = getDefaultDueDate(paymentTerms, invoiceDate);
            setValue('due_date', dueDate.toISOString().split('T')[0]);
        }
    }, [paymentTerms, invoiceDate, setValue]);

    // Calculate totals using utility function
    const calculations = useMemo(() => {
        return calculateInvoiceTotal({
            lineItems: lineItems || [],
            discountType: discountType || 'PERCENTAGE',
            discountValue: discountValue || 0,
            coinsRedeemed: coinsRedeemed || 0,
        });
    }, [lineItems, discountType, discountValue, coinsRedeemed]);


    // Handle appointment-based creation
    useEffect(() => {
        if (!appointmentId || appointmentCreateStartedRef.current) return;
        appointmentCreateStartedRef.current = true;

        const createFromAppointmentHandler = async () => {
            try {
                const result = await createFromAppointment(appointmentId).unwrap();
                toast.success('Invoice ready for this appointment');
                router.replace(`/finance/invoices/${result.id}`);
            } catch (error) {
                toast.error(error.data?.detail || 'Failed to create invoice from appointment');
                router.replace('/finance/invoices');
            }
        };
        createFromAppointmentHandler();
    }, [appointmentId, createFromAppointment, router]);


    const onCustomerSelect = (customer) => {
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
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                customer_id: data.customer_id || undefined,
                customer_name: data.customer_name,
                customer_email: data.customer_email || undefined,
                customer_phone: data.customer_phone || undefined,
                customer_address: parseCustomerAddressForPayload(data.customer_address),
                invoice_date: data.invoice_date,
                due_date: data.due_date,
                payment_terms: data.payment_terms,
                notes: data.notes || undefined,
                terms: data.terms_conditions || undefined,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                coins_redeemed: data.coins_redeemed,
                status: 'DRAFT',
                line_items: data.line_items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                })),
            };

            const result = await createInvoice(payload).unwrap();
            toast.success(isDraftRef.current ? 'Invoice saved as draft' : 'Invoice created successfully');
            router.push(`/finance/invoices/${result.id}`);
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to create invoice');
        }
    };

    const handleSaveDraft = () => {
        isDraftRef.current = true;
        handleSubmit(onSubmit)();
    };

    const handleCreate = () => {
        isDraftRef.current = false;
        handleSubmit(onSubmit)();
    };

    if (appointmentId) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Creating invoice from appointment...</p>
                </div>
            </div>
        );
    }

    return (
        <InvoiceLayout
            title="New Invoice"
            compact
            actions={[
                {
                    label: 'Save as Draft',
                    variant: 'flat',
                    onClick: handleSaveDraft,
                    loading: isCreating,
                },
                {
                    label: 'Create Invoice',
                    color: 'primary',
                    icon: <Save className="w-4 h-4" />,
                    onClick: handleCreate,
                    loading: isCreating,
                },
            ]}
        >
            <Form methods={methods} onSubmit={onSubmit} className="contents">
                <InvoiceSection title="Customer & invoice" compact>
                    <div className="space-y-3">
                        <CustomerSelector
                            value={selectedCustomer}
                            onChange={onCustomerSelect}
                            searchCustomers={handleSearchCustomers}
                            createCustomer={handleCreateCustomer}
                            isLoadingSearch={isSearchingCustomers}
                            isLoadingCreate={isCreatingCustomer}
                            hideSelectedPreview
                            compact
                        />
                        <InvoiceCustomerBillingFields />
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
                                key="new-invoice-line-items"
                                items={field.value}
                                onChange={field.onChange}
                                services={services}
                                isLoadingServices={isLoadingServices}
                                compact
                            />
                        )}
                    />
                </InvoiceSection>

                {/* Notes and Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <InvoiceSection title="Additional Information" compact>
                        <InvoiceNotesFields compact />
                    </InvoiceSection>

                    {/* Summary */}
                    <CalculationSummary
                        lineItems={lineItems}
                        discountType={discountType}
                        discountValue={discountValue}
                        coinsRedeemed={coinsRedeemed}
                        onDiscountTypeChange={(val) => setValue('discount_type', val)}
                        onDiscountValueChange={(val) => setValue('discount_value', val)}
                        compact
                    />
                </div>
            </Form>
        </InvoiceLayout>
    );
}
