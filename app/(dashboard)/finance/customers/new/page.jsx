'use client';

import { useRouter } from 'next/navigation';
import { Save } from '@/lib/icons';
import { Button, SelectItem } from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/validation';
import { Form, DEFAULT_FORM_OPTIONS } from '@/components/ui/Form';
import { FormInput, FormSelect, FormRow, FormDivider } from '@/components/ui/FormFields';
import { IndiaStateCityFields } from '@/components/ui/IndiaStateCityFields';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import { useCreateCustomerMutation } from '@/redux/services/api';

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

    const onSubmit = async (data) => {
        try {
            await createCustomer({
                ...data,
                display_name: [data.first_name, data.last_name].filter(Boolean).join(' '),
                email: data.email || undefined,
                company_name: data.company_name || undefined,
                gstin: data.gstin || undefined,
                pan: data.pan || undefined,
                gender: data.gender || undefined,
                date_of_birth: data.date_of_birth || undefined,
                address: data.address || undefined,
                city: data.city || undefined,
                state_id: data.state_id || undefined,
                city_id: data.city_id || undefined,
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
                        <FormRow columns={2}>
                            <FormInput name="first_name" label="First Name" placeholder="Enter first name" isRequired />
                            <FormInput name="last_name" label="Last Name" placeholder="Enter last name" />
                            <FormInput name="email" label="Email" type="email" placeholder="customer@example.com" />
                            <FormInput name="phone" label="Phone" type="tel" placeholder="+91 9876543210" />
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Patient Details">
                        <FormRow columns={2}>
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
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Business & payment">
                        <FormRow columns={2}>
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
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Billing Address">
                        <FormRow columns={2}>
                            <FormInput name="billing_attention" label="Attention" placeholder="Billing contact" />
                            <FormInput name="billing_pincode" label="Pincode" placeholder="110001" />
                            <div className="sm:col-span-2">
                                <FormInput name="billing_address_line1" label="Address Line 1" placeholder="Building, street, locality" />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="billing_address_line2" label="Address Line 2" placeholder="Apartment, landmark (optional)" />
                            </div>
                            <div className="sm:col-span-2">
                                <IndiaStateCityFields
                                    stateIdField="billing_state_id"
                                    cityIdField="billing_city_id"
                                    cityNameField="billing_city"
                                    stateNameField="billing_state"
                                />
                            </div>
                        </FormRow>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Shipping Address">
                        <FormRow columns={2}>
                            <FormInput name="shipping_attention" label="Attention" placeholder="Shipping contact" />
                            <FormInput name="shipping_pincode" label="Pincode" placeholder="110001" />
                            <div className="sm:col-span-2">
                                <FormInput name="shipping_address_line1" label="Address Line 1" placeholder="Building, street, locality" />
                            </div>
                            <div className="sm:col-span-2">
                                <FormInput name="shipping_address_line2" label="Address Line 2" placeholder="Apartment, landmark (optional)" />
                            </div>
                            <div className="sm:col-span-2">
                                <IndiaStateCityFields
                                    stateIdField="shipping_state_id"
                                    cityIdField="shipping_city_id"
                                    cityNameField="shipping_city"
                                    stateNameField="shipping_state"
                                />
                            </div>
                        </FormRow>
                    </FormSectionCard>
                </FormCompactCard>
            </Form>
        </FormPageLayout>
    );
}
