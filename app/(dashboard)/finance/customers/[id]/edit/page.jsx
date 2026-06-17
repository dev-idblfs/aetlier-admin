'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button, Input, Textarea, Select, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useGetCustomerQuery, useUpdateCustomerMutation } from '@/redux/services/api';
import { FormPageLayout, FormSectionCard, FormActions, FormCompactCard } from '@/components/ui';
import { FormDivider } from '@/components/ui/FormFields';

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

const fieldClassNames = {
    inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
};

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id;

    const { data: customer, isLoading: isLoadingCustomer } = useGetCustomerQuery(customerId);
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

    const [formData, setFormData] = useState({
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
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                email: customer.email || '',
                first_name: customer.first_name || '',
                last_name: customer.last_name || '',
                phone: customer.phone || '',
                customer_type: customer.customer_type || 'individual',
                company_name: customer.company_name || '',
                gstin: customer.gstin || '',
                pan: customer.pan || '',
                billing_address: customer.billing_address ? JSON.stringify(customer.billing_address, null, 2) : '',
                shipping_address: customer.shipping_address ? JSON.stringify(customer.shipping_address, null, 2) : '',
                payment_terms: customer.payment_terms || 'immediate',
            });
        }
    }, [customer]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.first_name) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await updateCustomer({
                id: customerId,
                ...formData,
                billing_address: formData.billing_address ? JSON.parse(formData.billing_address) : null,
                shipping_address: formData.shipping_address ? JSON.parse(formData.shipping_address) : null,
            }).unwrap();

            toast.success('Customer updated successfully');
            router.push('/finance/customers');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update customer');
        }
    };

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

    const displayName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || 'Edit';

    return (
        <FormPageLayout
            title="Edit Customer"
            breadcrumbs={[
                { label: 'Customers', href: '/finance/customers' },
                { label: displayName },
            ]}
            cancelHref="/finance/customers"
        >
            <form onSubmit={handleSubmit}>
                <FormCompactCard
                    footer={(
                        <FormActions inline>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={isUpdating}
                                startContent={!isUpdating && <Save className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                Save Changes
                            </Button>
                        </FormActions>
                    )}
                >
                    <FormSectionCard embedded title="Basic Information">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Input label="First Name" labelPlacement="outside" placeholder="Enter first name" value={formData.first_name} onValueChange={(v) => handleChange('first_name', v)} isRequired classNames={fieldClassNames} />
                            <Input label="Last Name" labelPlacement="outside" placeholder="Enter last name" value={formData.last_name} onValueChange={(v) => handleChange('last_name', v)} classNames={fieldClassNames} />
                            <Input label="Email" labelPlacement="outside" type="email" placeholder="customer@example.com" value={formData.email} onValueChange={(v) => handleChange('email', v)} isRequired isReadOnly description="Email cannot be changed" classNames={fieldClassNames} />
                            <Input label="Phone" labelPlacement="outside" type="tel" placeholder="+91 9876543210" value={formData.phone} onValueChange={(v) => handleChange('phone', v)} classNames={fieldClassNames} />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Business Information">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Select label="Customer Type" labelPlacement="outside" placeholder="Select type" selectedKeys={[formData.customer_type]} onSelectionChange={(keys) => handleChange('customer_type', Array.from(keys)[0])} classNames={{ trigger: fieldClassNames.inputWrapper }}>
                                {CUSTOMER_TYPES.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                                ))}
                            </Select>
                            <Input label="Company Name" labelPlacement="outside" placeholder="Enter company name" value={formData.company_name} onValueChange={(v) => handleChange('company_name', v)} classNames={fieldClassNames} />
                            <Input label="GSTIN" labelPlacement="outside" placeholder="Enter GSTIN" value={formData.gstin} onValueChange={(v) => handleChange('gstin', v)} classNames={fieldClassNames} />
                            <Input label="PAN" labelPlacement="outside" placeholder="Enter PAN" value={formData.pan} onValueChange={(v) => handleChange('pan', v)} classNames={fieldClassNames} />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Address Information">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <Textarea label="Billing Address" labelPlacement="outside" placeholder='{"street": "123 Main St"}' value={formData.billing_address} onValueChange={(v) => handleChange('billing_address', v)} minRows={2} description="Enter as JSON format" classNames={fieldClassNames} />
                            <Textarea label="Shipping Address" labelPlacement="outside" placeholder='{"street": "123 Main St"}' value={formData.shipping_address} onValueChange={(v) => handleChange('shipping_address', v)} minRows={2} description="Enter as JSON format" classNames={fieldClassNames} />
                        </div>
                    </FormSectionCard>

                    <FormDivider />

                    <FormSectionCard embedded title="Payment Terms">
                        <Select label="Payment Terms" labelPlacement="outside" placeholder="Select payment terms" selectedKeys={[formData.payment_terms]} onSelectionChange={(keys) => handleChange('payment_terms', Array.from(keys)[0])} className="max-w-sm" classNames={{ trigger: fieldClassNames.inputWrapper }}>
                            {PAYMENT_TERMS.map((term) => (
                                <SelectItem key={term.key} value={term.key}>{term.label}</SelectItem>
                            ))}
                        </Select>
                    </FormSectionCard>
                </FormCompactCard>
            </form>
        </FormPageLayout>
    );
}
