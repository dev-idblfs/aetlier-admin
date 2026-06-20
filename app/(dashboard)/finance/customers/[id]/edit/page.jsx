'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/validation';
import {
    Form,
    FormErrorSummary,
    FormInput,
    FormSelect,
    FormTextarea,
    FormDivider,
    DEFAULT_FORM_OPTIONS,
} from '@/components/ui';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import { useGetCustomerQuery, useUpdateCustomerMutation } from '@/redux/services/api';
import { useFormSubmit } from '@/hooks/useFormSubmit';

const CUSTOMER_TYPES = [
    { key: 'individual', label: 'Individual' },
    { key: 'business', label: 'Business' },
];

const PAYMENT_TERMS = [
    { key: 'immediate', label: 'Immediate' },
    { key: 'net_15', label: 'Net 15' },
    { key: 'net_30', label: 'Net 30' },
    { key: 'net_60', label: 'Net 60' },
];

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id;

    const { data: customer, isLoading: isLoadingCustomer } = useGetCustomerQuery(customerId);
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

    const methods = useForm({
        ...DEFAULT_FORM_OPTIONS,
        resolver: zodResolver(customerSchema),
        defaultValues: {
            email: '',
            first_name: '',
            last_name: '',
            phone: '',
            customer_type: 'individual',
            company_name: '',
            gstin: '',
            pan: '',
            billing_address: '',
            shipping_address: '',
            payment_terms: 'immediate',
        },
    });

    useEffect(() => {
        if (customer) {
            methods.reset({
                email: customer.email || '',
                first_name: customer.first_name || '',
                last_name: customer.last_name || '',
                phone: customer.phone || '',
                customer_type: customer.customer_type || 'individual',
                company_name: customer.company_name || '',
                gstin: customer.gstin || '',
                pan: customer.pan || '',
                billing_address: customer.billing_address
                    ? JSON.stringify(customer.billing_address, null, 2)
                    : '',
                shipping_address: customer.shipping_address
                    ? JSON.stringify(customer.shipping_address, null, 2)
                    : '',
                payment_terms: customer.payment_terms || 'immediate',
            });
        }
    }, [customer, methods]);

    const { handleSubmit, isSubmitting } = useFormSubmit(methods, {
        fallbackMessage: 'Failed to update customer',
        onSubmit: async (data) => {
            let billingAddr = null;
            let shippingAddr = null;

            if (data.billing_address) {
                try {
                    billingAddr = JSON.parse(data.billing_address);
                } catch {
                    methods.setError('billing_address', {
                        type: 'manual',
                        message: 'Invalid JSON format',
                    });
                    throw new Error('Invalid billing address JSON');
                }
            }

            if (data.shipping_address) {
                try {
                    shippingAddr = JSON.parse(data.shipping_address);
                } catch {
                    methods.setError('shipping_address', {
                        type: 'manual',
                        message: 'Invalid JSON format',
                    });
                    throw new Error('Invalid shipping address JSON');
                }
            }

            await updateCustomer({
                id: customerId,
                ...data,
                billing_address: billingAddr,
                shipping_address: shippingAddr,
            }).unwrap();
        },
        onSuccess: () => {
            toast.success('Customer updated successfully');
            router.push('/finance/customers');
        },
    });

    if (isLoadingCustomer) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <p className="text-gray-600 mb-4">Customer not found</p>
                <Button onPress={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const displayName =
        `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
        customer.email ||
        'Edit';

    return (
        <FormPageLayout
            title="Edit Customer"
            breadcrumbs={[
                { label: 'Customers', href: '/finance/customers' },
                { label: displayName },
            ]}
            cancelHref="/finance/customers"
        >
            <Form methods={methods} onSubmit={handleSubmit}>
                <FormCompactCard
                    footer={(
                        <FormActions inline>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={isSubmitting || isUpdating}
                                startContent={!isSubmitting && !isUpdating && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Save Changes
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormErrorSummary error={methods.formState.errors.root?.message} />

                    <FormSectionCard embedded title="Basic Information">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <FormInput name="first_name" label="First Name" placeholder="Enter first name" isRequired />
                            <FormInput name="last_name" label="Last Name" placeholder="Enter last name" />
                            <FormInput name="email" label="Email" type="email" isDisabled description="Email cannot be changed" />
                            <FormInput name="phone" label="Phone" type="tel" placeholder="+91 9876543210" />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Business Information">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <FormSelect name="customer_type" label="Customer Type" placeholder="Select type">
                                {CUSTOMER_TYPES.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                                ))}
                            </FormSelect>
                            <FormInput name="company_name" label="Company Name" placeholder="Enter company name" />
                            <FormInput name="gstin" label="GSTIN" placeholder="Enter GSTIN" />
                            <FormInput name="pan" label="PAN" placeholder="Enter PAN" />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Address Information">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <FormTextarea name="billing_address" label="Billing Address" placeholder='{"street": "123 Main St"}' minRows={2} description="Enter as JSON format" />
                            <FormTextarea name="shipping_address" label="Shipping Address" placeholder='{"street": "123 Main St"}' minRows={2} description="Enter as JSON format" />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Payment Terms">
                        <FormSelect name="payment_terms" label="Payment Terms" placeholder="Select payment terms" className="max-w-sm">
                            {PAYMENT_TERMS.map((term) => (
                                <SelectItem key={term.key} value={term.key}>{term.label}</SelectItem>
                            ))}
                        </FormSelect>
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
