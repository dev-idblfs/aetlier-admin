'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save } from '@/lib/icons';
import { Button, SelectItem, Spinner } from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/validation';
import {
    Form,
    FormErrorSummary,
    FormInput,
    FormSelect,
    FormDivider,
    DEFAULT_FORM_OPTIONS,
} from '@/components/ui';
import { IndiaStateCityFields } from '@/components/ui/IndiaStateCityFields';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard, RelatedLinks } from '@/components/ui';
import { useGetCustomerQuery, useUpdateCustomerMutation } from '@/redux/services/api';
import { useFormSubmit } from '@/hooks/useFormSubmit';

const CUSTOMER_TYPES = [
    { key: 'individual', label: 'Individual' },
    { key: 'business', label: 'Business' },
];

const PAYMENT_TERMS = [
    { key: 'due_on_receipt', label: 'Due on Receipt' },
    { key: 'net_7', label: 'Net 7' },
    { key: 'net_15', label: 'Net 15' },
    { key: 'net_30', label: 'Net 30' },
    { key: 'net_45', label: 'Net 45' },
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
            gender: '',
            date_of_birth: '',
            address: '',
            city: '',
            state_id: '',
            city_id: '',
            billing_attention: '',
            billing_address_line1: '',
            billing_address_line2: '',
            billing_city: '',
            billing_state: '',
            billing_state_id: '',
            billing_city_id: '',
            billing_pincode: '',
            billing_country: 'India',
            shipping_attention: '',
            shipping_address_line1: '',
            shipping_address_line2: '',
            shipping_city: '',
            shipping_state: '',
            shipping_state_id: '',
            shipping_city_id: '',
            shipping_pincode: '',
            shipping_country: 'India',
            payment_terms: 'due_on_receipt',
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
                gender: customer.gender || '',
                date_of_birth: customer.date_of_birth ? String(customer.date_of_birth).slice(0, 10) : '',
                address: customer.address || '',
                city: customer.city || '',
                state_id: customer.state_id ? String(customer.state_id) : '',
                city_id: customer.city_id ? String(customer.city_id) : '',
                billing_attention: customer.billing_attention || '',
                billing_address_line1: customer.billing_address_line1 || '',
                billing_address_line2: customer.billing_address_line2 || '',
                billing_city: customer.billing_city || '',
                billing_state: customer.billing_state || '',
                billing_state_id: customer.billing_state_id ? String(customer.billing_state_id) : '',
                billing_city_id: customer.billing_city_id ? String(customer.billing_city_id) : '',
                billing_pincode: customer.billing_pincode || '',
                billing_country: customer.billing_country || 'India',
                shipping_attention: customer.shipping_attention || '',
                shipping_address_line1: customer.shipping_address_line1 || '',
                shipping_address_line2: customer.shipping_address_line2 || '',
                shipping_city: customer.shipping_city || '',
                shipping_state: customer.shipping_state || '',
                shipping_state_id: customer.shipping_state_id ? String(customer.shipping_state_id) : '',
                shipping_city_id: customer.shipping_city_id ? String(customer.shipping_city_id) : '',
                shipping_pincode: customer.shipping_pincode || '',
                shipping_country: customer.shipping_country || 'India',
                payment_terms: customer.payment_terms || 'due_on_receipt',
            });
        }
    }, [customer, methods]);

    const { handleSubmit, isSubmitting } = useFormSubmit(methods, {
        fallbackMessage: 'Failed to update customer',
        onSubmit: async (data) => {
            await updateCustomer({
                id: customerId,
                ...data,
                email: data.email || undefined,
                display_name: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
                company_name: data.company_name || undefined,
                gstin: data.gstin || undefined,
                pan: data.pan || undefined,
                gender: data.gender || null,
                date_of_birth: data.date_of_birth || null,
                address: data.address || null,
                city: data.city || null,
                state_id: data.state_id || null,
                city_id: data.city_id || null,
                billing_attention: data.billing_attention || undefined,
                billing_address_line1: data.billing_address_line1 || undefined,
                billing_address_line2: data.billing_address_line2 || undefined,
                billing_city: data.billing_city || undefined,
                billing_state: data.billing_state || undefined,
                billing_state_id: data.billing_state_id || undefined,
                billing_city_id: data.billing_city_id || undefined,
                billing_pincode: data.billing_pincode || undefined,
                shipping_attention: data.shipping_attention || undefined,
                shipping_address_line1: data.shipping_address_line1 || undefined,
                shipping_address_line2: data.shipping_address_line2 || undefined,
                shipping_city: data.shipping_city || undefined,
                shipping_state: data.shipping_state || undefined,
                shipping_state_id: data.shipping_state_id || undefined,
                shipping_city_id: data.shipping_city_id || undefined,
                shipping_pincode: data.shipping_pincode || undefined,
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
    const relatedItems = [
        {
            label: 'Invoices',
            href: `/finance/invoices?customer_id=${customerId}`,
            meta: 'List',
        },
        {
            label: 'New invoice',
            href: '/finance/invoices/new',
            meta: 'Create',
        },
    ];

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

                    <RelatedLinks title="Related" items={relatedItems} className="mt-1" />

                    <FormDivider />

                    <FormSectionCard embedded title="Basic Information">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormInput name="first_name" label="First Name" placeholder="Enter first name" isRequired />
                            <FormInput name="last_name" label="Last Name" placeholder="Enter last name" />
                            <FormInput name="email" label="Email" type="email" isDisabled description="Email cannot be changed" />
                            <FormInput name="phone" label="Phone" type="tel" placeholder="+91 9876543210" />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Patient Details">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormSelect name="gender" label="Gender" placeholder="Select gender">
                                <SelectItem key="female" value="female">Female</SelectItem>
                                <SelectItem key="male" value="male">Male</SelectItem>
                                <SelectItem key="other" value="other">Other</SelectItem>
                                <SelectItem key="prefer_not_to_say" value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </FormSelect>
                            <FormInput name="date_of_birth" label="Date of Birth" type="date" />
                            <div className="sm:col-span-2">
                                <IndiaStateCityFields
                                    stateIdField="state_id"
                                    cityIdField="city_id"
                                    cityNameField="city"
                                    stateNameField={null}
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="address" label="Residential Address" placeholder="Enter residential address" />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Business & payment">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormSelect name="customer_type" label="Customer Type" placeholder="Select type">
                                {CUSTOMER_TYPES.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                                ))}
                            </FormSelect>
                            <FormSelect name="payment_terms" label="Payment Terms" placeholder="Select payment terms">
                                {PAYMENT_TERMS.map((term) => (
                                    <SelectItem key={term.key} value={term.key}>{term.label}</SelectItem>
                                ))}
                            </FormSelect>
                            <FormInput name="company_name" label="Company Name" placeholder="Enter company name" />
                            <FormInput name="gstin" label="GSTIN" placeholder="Enter GSTIN" />
                            <FormInput name="pan" label="PAN" placeholder="Enter PAN" />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Billing Address">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <FormInput name="billing_attention" label="Attention" placeholder="Billing contact" />
                            <FormInput name="billing_pincode" label="Pincode" placeholder="110001" />
                            <div className="lg:col-span-2">
                                <FormInput name="billing_address_line1" label="Address Line 1" placeholder="Building, street, locality" />
                            </div>
                            <div className="lg:col-span-2">
                                <FormInput name="billing_address_line2" label="Address Line 2" placeholder="Apartment, landmark (optional)" />
                            </div>
                            <div className="lg:col-span-2">
                                <IndiaStateCityFields
                                    stateIdField="billing_state_id"
                                    cityIdField="billing_city_id"
                                    cityNameField="billing_city"
                                    stateNameField="billing_state"
                                />
                            </div>
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Shipping Address">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <FormInput name="shipping_attention" label="Attention" placeholder="Shipping contact" />
                            <FormInput name="shipping_pincode" label="Pincode" placeholder="110001" />
                            <div className="lg:col-span-2">
                                <FormInput name="shipping_address_line1" label="Address Line 1" placeholder="Building, street, locality" />
                            </div>
                            <div className="lg:col-span-2">
                                <FormInput name="shipping_address_line2" label="Address Line 2" placeholder="Apartment, landmark (optional)" />
                            </div>
                            <div className="lg:col-span-2">
                                <IndiaStateCityFields
                                    stateIdField="shipping_state_id"
                                    cityIdField="shipping_city_id"
                                    cityNameField="shipping_city"
                                    stateNameField="shipping_state"
                                />
                            </div>
                        </div>
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
