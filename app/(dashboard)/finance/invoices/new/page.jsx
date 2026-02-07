'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import {
    useCreateInvoiceMutation,
    useLazySearchCustomersQuery,
    useGetServicesQuery,
    useGetInvoiceSettingsQuery,
    useCreateInvoiceFromAppointmentMutation,
    useCreateCustomerMutation,
} from '@/redux/services/api';
import {
    InvoiceLayout,
    CustomerSelector,
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
    const appointmentId = searchParams.get('appointment');
    const isDraftRef = useRef(false);

    // API Hooks
    const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
    const [createFromAppointment, { isLoading: isCreatingFromAppointment }] = useCreateInvoiceFromAppointmentMutation();
    const [searchCustomers, { data: customerResults }] = useLazySearchCustomersQuery();
    const { data: servicesData, isLoading: isLoadingServices } = useGetServicesQuery(undefined, {
        refetchOnMountOrArgChange: 600,
        keepUnusedDataFor: 600,
    });
    const { data: settings } = useGetInvoiceSettingsQuery();
    const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();

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
        if (appointmentId) {
            const createFromAppointmentHandler = async () => {
                try {
                    const result = await createFromAppointment(appointmentId).unwrap();
                    toast.success('Invoice created from appointment');
                    router.push(`/finance/invoices/${result.id}`);
                } catch (error) {
                    toast.error(error.data?.detail || 'Failed to create invoice from appointment');
                    router.push('/finance/invoices');
                }
            };
            createFromAppointmentHandler();
        }
    }, [appointmentId, createFromAppointment, router]);


    // Wrapper for searchCustomers
    const handleSearchCustomers = useCallback(async (term) => {
        try {
            if (!term || term.trim() === '') return [];
            const result = await searchCustomers({ q: term, limit: 10 });
            return result.data || [];
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }, [searchCustomers]);

    // Wrapper for createCustomer
    const handleCreateCustomer = useCallback(async (data) => {
        try {
            return await createCustomer(data).unwrap();
        } catch (error) {
            throw error;
        }
    }, [createCustomer]);

    const onCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        if (customer) {
            setValue('customer_id', customer.id);
            setValue('customer_name', customer.display_name || customer.name);
            setValue('customer_email', customer.email || '');
            setValue('customer_phone', customer.phone || '');
            setValue('customer_address', JSON.stringify(customer.billing_address) || '');
            // Note: address is stored as string in schema? 
            // Previous code passed `billing_address` directly which was object?
            // checking schema: `customer_address: z.string().optional()`
            // NewCustomerPage uses JSON string.
            // API expects? 
            // Let's check api.js or slice. 
            // Assuming API handles it, but schema enforces string.
            // Actually `billing_address` from `customer` object is usually an object.
            // If I set it as object, validation might fail if schema expects string?
            // The schema says `z.string().optional()`.
            // So I should stringify if it's an object.
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
                customer_address: data.customer_address ? JSON.parse(data.customer_address) : undefined, // Parse if it was stringified
                invoice_date: data.invoice_date,
                due_date: data.due_date,
                payment_terms: data.payment_terms,
                notes: data.notes || undefined,
                terms_conditions: data.terms_conditions || undefined,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                coins_redeemed: data.coins_redeemed,
                status: isDraftRef.current ? 'DRAFT' : 'SENT',
                line_items: data.line_items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                })),
            };

            // Handle address parsing safety
            try {
                if (data.customer_address && typeof data.customer_address === 'string') {
                    // Try parsing, if fails (e.g. simple string), use as is? 
                    // Or schema only allows valid json if we used NewCustomerPage logic.
                    // But here we set via setValue.
                    // Let's assume the API expects an object for address.
                    // If I pass simple string, it might fail if backend expects JSON/Dict.
                    // Check `finance/customers/new/page.jsx`: `billing_address` was parsed.
                    // Check `finance/invoices/new/page.jsx` original: `customer_address: selectedCustomer?.billing_address` (object)
                    // So payload expects object.
                    // But schema expects string? 
                    // Wait, `customer_address` in `invoiceSchema` is `z.string().optional()`.
                    // If I pass object to `z.string()`, it fails.
                    // So I MUST stringify it in `setValue` (which I did).
                    // And Parse it in `payload` (which I did).
                    // However, if the address is just a plain string (not JSON), `JSON.parse` throws.
                    // I should handle that.
                    try {
                        payload.customer_address = JSON.parse(data.customer_address);
                    } catch (e) {
                        // Keep as string if parsing fails
                        payload.customer_address = data.customer_address;
                    }
                }
            } catch (e) { }

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
                {/* Customer Section */}
                <InvoiceSection title="Customer Information">
                    <CustomerSelector
                        value={selectedCustomer}
                        onChange={onCustomerSelect}
                        searchCustomers={handleSearchCustomers}
                        createCustomer={handleCreateCustomer}
                        isLoadingCreate={isCreatingCustomer}
                    />
                    {/* Hidden fields for validation */}
                    <input type="hidden" {...methods.register('customer_name')} />
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
                                key="new-invoice-line-items"
                                items={field.value}
                                onChange={field.onChange}
                                services={services}
                                isLoadingServices={isLoadingServices}
                            />
                        )}
                    />
                </InvoiceSection>

                {/* Notes and Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Notes Section */}
                    <InvoiceSection title="Additional Information">
                        <InvoiceNotesFields />
                    </InvoiceSection>

                    {/* Summary */}
                    <CalculationSummary
                        lineItems={lineItems}
                        discountType={discountType}
                        discountValue={discountValue}
                        coinsRedeemed={coinsRedeemed}
                        onDiscountTypeChange={(val) => setValue('discount_type', val)}
                        onDiscountValueChange={(val) => setValue('discount_value', val)}
                    />
                </div>
            </Form>
        </InvoiceLayout>
    );
}
