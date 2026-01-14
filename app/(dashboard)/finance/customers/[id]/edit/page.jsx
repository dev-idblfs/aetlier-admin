'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Textarea, Select, SelectItem, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useGetCustomerQuery, useUpdateCustomerMutation } from '@/redux/services/api';

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

        // Validation
        if (!formData.email || !formData.first_name) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const payload = {
                ...formData,
                billing_address: formData.billing_address ? JSON.parse(formData.billing_address) : null,
                shipping_address: formData.shipping_address ? JSON.parse(formData.shipping_address) : null,
            };

            await updateCustomer({
                id: customerId,
                ...payload,
            }).unwrap();

            toast.success('Customer updated successfully');
            router.push('/finance/customers');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update customer');
        }
    };

    if (isLoadingCustomer) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-gray-600 mb-4">Customer not found</p>
                <Button onPress={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={() => router.back()}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
                        <p className="text-sm text-gray-600">Update customer information</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    placeholder="Enter first name"
                                    value={formData.first_name}
                                    onValueChange={(value) => handleChange('first_name', value)}
                                    isRequired
                                />
                                <Input
                                    label="Last Name"
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onValueChange={(value) => handleChange('last_name', value)}
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="customer@example.com"
                                    value={formData.email}
                                    onValueChange={(value) => handleChange('email', value)}
                                    isRequired
                                    isReadOnly
                                    description="Email cannot be changed"
                                />
                                <Input
                                    label="Phone"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    value={formData.phone}
                                    onValueChange={(value) => handleChange('phone', value)}
                                />
                            </div>
                        </div>

                        {/* Business Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Business Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Customer Type"
                                    placeholder="Select type"
                                    selectedKeys={[formData.customer_type]}
                                    onSelectionChange={(keys) => handleChange('customer_type', Array.from(keys)[0])}
                                >
                                    {CUSTOMER_TYPES.map((type) => (
                                        <SelectItem key={type.key} value={type.key}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Input
                                    label="Company Name"
                                    placeholder="Enter company name"
                                    value={formData.company_name}
                                    onValueChange={(value) => handleChange('company_name', value)}
                                />
                                <Input
                                    label="GSTIN"
                                    placeholder="Enter GSTIN"
                                    value={formData.gstin}
                                    onValueChange={(value) => handleChange('gstin', value)}
                                />
                                <Input
                                    label="PAN"
                                    placeholder="Enter PAN"
                                    value={formData.pan}
                                    onValueChange={(value) => handleChange('pan', value)}
                                />
                            </div>
                        </div>

                        {/* Address Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Address Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Textarea
                                    label="Billing Address"
                                    placeholder='{"street": "123 Main St", "city": "Mumbai", "state": "MH", "zip": "400001"}'
                                    value={formData.billing_address}
                                    onValueChange={(value) => handleChange('billing_address', value)}
                                    minRows={3}
                                    description="Enter as JSON format"
                                />
                                <Textarea
                                    label="Shipping Address"
                                    placeholder='{"street": "123 Main St", "city": "Mumbai", "state": "MH", "zip": "400001"}'
                                    value={formData.shipping_address}
                                    onValueChange={(value) => handleChange('shipping_address', value)}
                                    minRows={3}
                                    description="Enter as JSON format"
                                />
                            </div>
                        </div>

                        {/* Payment Terms */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Payment Terms</h2>
                            <Select
                                label="Payment Terms"
                                placeholder="Select payment terms"
                                selectedKeys={[formData.payment_terms]}
                                onSelectionChange={(keys) => handleChange('payment_terms', Array.from(keys)[0])}
                                className="max-w-md"
                            >
                                {PAYMENT_TERMS.map((term) => (
                                    <SelectItem key={term.key} value={term.key}>
                                        {term.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            variant="flat"
                            onPress={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            type="submit"
                            isLoading={isUpdating}
                            startContent={!isUpdating && <Save className="w-4 h-4" />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
