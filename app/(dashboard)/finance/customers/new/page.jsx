'use client';

import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/validation';
import { Form, DEFAULT_FORM_OPTIONS } from '@/components/ui/Form';
import { FormInput, FormSelect, FormTextarea, FormRow, FormDivider } from '@/components/ui/FormFields';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import { useCreateCustomerMutation } from '@/redux/services/api';

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

export default function NewCustomerPage() {
    const router = useRouter();
    const [createCustomer, { isLoading }] = useCreateCustomerMutation();

    const methods = useForm({
        ...DEFAULT_FORM_OPTIONS,
        resolver: zodResolver(customerSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
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

    const onSubmit = async (data) => {
        try {
            let billingAddr = null;
            let shippingAddr = null;

            if (data.billing_address) {
                try {
                    billingAddr = JSON.parse(data.billing_address);
                } catch (e) {
                    toast.error('Invalid JSON in Billing Address');
                    return;
                }
            }

            if (data.shipping_address) {
                try {
                    shippingAddr = JSON.parse(data.shipping_address);
                } catch (e) {
                    toast.error('Invalid JSON in Shipping Address');
                    return;
                }
            }

            await createCustomer({
                ...data,
                billing_address: billingAddr,
                shipping_address: shippingAddr,
            }).unwrap();
            toast.success('Customer created successfully');
            router.push('/finance/customers');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create customer');
        }
    };

    return (
        <FormPageLayout
            title="Add New Customer"
            breadcrumbs={[
                { label: 'Customers', href: '/finance/customers' },
                { label: 'Add New' },
            ]}
            cancelHref="/finance/customers"
        >
            <Form methods={methods} onSubmit={onSubmit}>
                <FormCompactCard
                    footer={(
                        <FormActions inline>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={isLoading}
                                startContent={!isLoading && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Create Customer
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Basic Information">
                        <FormRow columns={3}>
                            <FormInput name="first_name" label="First Name" placeholder="Enter first name" isRequired />
                            <FormInput name="last_name" label="Last Name" placeholder="Enter last name" />
                            <FormInput name="email" label="Email" type="email" placeholder="customer@example.com" isRequired />
                            <FormInput name="phone" label="Phone" type="tel" placeholder="+91 9876543210" />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Business Information">
                        <FormRow columns={3}>
                            <FormSelect name="customer_type" label="Customer Type" placeholder="Select type">
                                {CUSTOMER_TYPES.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                                ))}
                            </FormSelect>
                            <FormInput name="company_name" label="Company Name" placeholder="Enter company name" />
                            <FormInput name="gstin" label="GSTIN" placeholder="Enter GSTIN" />
                            <FormInput name="pan" label="PAN" placeholder="Enter PAN" />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Address Information">
                        <FormRow columns={2}>
                            <FormTextarea
                                name="billing_address"
                                label="Billing Address"
                                placeholder='{"street": "123 Main St", "city": "Mumbai", "state": "MH", "zip": "400001"}'
                                minRows={2}
                                description="Enter as JSON format"
                            />
                            <FormTextarea
                                name="shipping_address"
                                label="Shipping Address"
                                placeholder='{"street": "123 Main St", "city": "Mumbai", "state": "MH", "zip": "400001"}'
                                minRows={2}
                                description="Enter as JSON format"
                            />
                        </FormRow>
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
