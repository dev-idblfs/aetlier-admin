/**
 * New Invoice Page
 * Create invoice with customer selection and line items
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
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
    const appointmentId = searchParams.get('appointment_id');

    // API Hooks
    const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
    const [createFromAppointment, { isLoading: isCreatingFromAppointment }] = useCreateInvoiceFromAppointmentMutation();
    const [searchCustomers, { data: customerResults }] = useLazySearchCustomersQuery();
    const { data: servicesData } = useGetServicesQuery();
    const { data: settings } = useGetInvoiceSettingsQuery();
    const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();

    const services = servicesData || [];
    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        payment_terms: 'DUE_ON_RECEIPT',
        notes: '',
        terms_conditions: settings?.default_terms || '',
        discount_type: 'PERCENTAGE',
        discount_value: 0,
        coins_redeemed: 0,
    });

    const [lineItems, setLineItems] = useState([{
        id: Date.now(),
        service_id: null,
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
    }]);

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
        const dueDate = getDefaultDueDate(term);
        setFormData({
            ...formData,
            payment_terms: term,
            due_date: dueDate.toISOString().split('T')[0],
        });
    };

    // Wrapper for searchCustomers to return data directly
    const handleSearchCustomers = async (term) => {
        try {
            if (!term || term.trim() === '') {
                return [];
            }
            const result = await searchCustomers({ q: term, limit: 10 });
            return result.data || [];
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    };

    // Wrapper for createCustomer
    const handleCreateCustomer = async (data) => {
        try {
            const result = await createCustomer(data).unwrap();
            return result;
        } catch (error) {
            throw error;
        }
    };

    // Submit handler
    const handleSubmit = async (asDraft = false) => {
        // Validation
        if (!selectedCustomer && !selectedCustomer?.display_name) {
            toast.error('Customer is required');
            return;
        }

        if (lineItems.some(item => !item.description || item.quantity <= 0)) {
            toast.error('All line items must have a description and quantity');
            return;
        }

        try {
            const payload = {
                customer_id: selectedCustomer?.id || undefined,
                customer_name: selectedCustomer?.display_name || selectedCustomer?.name,
                customer_email: selectedCustomer?.email || undefined,
                customer_phone: selectedCustomer?.phone || undefined,
                customer_address: selectedCustomer?.billing_address || undefined,
                invoice_date: formData.invoice_date,
                due_date: formData.due_date,
                payment_terms: formData.payment_terms,
                notes: formData.notes || undefined,
                terms_conditions: formData.terms_conditions || undefined,
                discount_type: formData.discount_type,
                discount_value: formData.discount_value,
                coins_redeemed: formData.coins_redeemed,
                status: asDraft ? 'DRAFT' : 'SENT',
                line_items: lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                })),
            };

            const result = await createInvoice(payload).unwrap();
            toast.success(asDraft ? 'Invoice saved as draft' : 'Invoice created successfully');
            router.push(`/finance/invoices/${result.id}`);
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to create invoice');
        }
    };

    if (appointmentId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
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
            onBack={() => router.push('/finance/invoices')}
            actions={[
                {
                    label: 'Save as Draft',
                    variant: 'flat',
                    onClick: () => handleSubmit(true),
                    loading: isCreating,
                },
                {
                    label: 'Create Invoice',
                    color: 'primary',
                    icon: <Save className="w-4 h-4" />,
                    onClick: () => handleSubmit(false),
                    loading: isCreating,
                },
            ]}
        >
            {/* Customer Section */}
            <InvoiceSection title="Customer Information">
                <CustomerSelector
                    value={selectedCustomer}
                    onChange={setSelectedCustomer}
                    searchCustomers={handleSearchCustomers}
                    createCustomer={handleCreateCustomer}
                    isLoadingCreate={isCreatingCustomer}
                />
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

            {/* Notes and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notes Section */}
                <InvoiceSection title="Additional Information">
                    <InvoiceNotesFields
                        notes={formData.notes}
                        terms={formData.terms_conditions}
                        onNotesChange={(value) => setFormData({ ...formData, notes: value })}
                        onTermsChange={(value) => setFormData({ ...formData, terms_conditions: value })}
                    />
                </InvoiceSection>

                {/* Summary */}
                <CalculationSummary
                    lineItems={lineItems}
                    discountType={formData.discount_type}
                    discountValue={formData.discount_value}
                    coinsRedeemed={formData.coins_redeemed}
                    onDiscountTypeChange={(type) => setFormData({ ...formData, discount_type: type })}
                    onDiscountValueChange={(value) => setFormData({ ...formData, discount_value: value })}
                />
            </div>
        </InvoiceLayout>
    );
}
