'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, SelectItem } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/validation';
import { Form } from '@/components/ui/Form';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormFields';
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
            // Validate JSON if present
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

            const payload = {
                ...data,
                billing_address: billingAddr,
                shipping_address: shippingAddr,
            };

            await createCustomer(payload).unwrap();
            toast.success('Customer created successfully');
            router.push('/finance/customers');
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create customer');
        }
    };

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
                        <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
                        <p className="text-sm text-gray-600">Create a new customer profile</p>
                    </div>
                </div>

                {/* Form */}
                <Form methods={methods} onSubmit={onSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                name="first_name"
                                label="First Name"
                                placeholder="Enter first name"
                                isRequired
                            />
                            <FormInput
                                name="last_name"
                                label="Last Name"
                                placeholder="Enter last name"
                            />
                            <FormInput
                                name="email"
                                label="Email"
                                type="email"
                                placeholder="customer@example.com"
                                isRequired
                            />
                            <FormInput
                                name="phone"
                                label="Phone"
                                type="tel"
                                placeholder="+91 9876543210"
                            />
                        </div>
                    </div>

                    {/* Business Information */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Business Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect
                                name="customer_type"
                                label="Customer Type"
                                placeholder="Select type"
                            >
                                {CUSTOMER_TYPES.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </FormSelect>
                            <FormInput
                                name="company_name"
                                label="Company Name"
                                placeholder="Enter company name"
                            />
                            <FormInput
                                name="gstin"
                                label="GSTIN"
                                placeholder="Enter GSTIN"
                            />
                            <FormInput
                                name="pan"
                                label="PAN"
                                placeholder="Enter PAN"
                            />
                        </div>
                    </div>

                    {/* Address Information */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Address Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormTextarea
                                name="billing_address"
                                label="Billing Address"
                                placeholder='{"street": "123 Main St", "city": "Mumbai", "state": "MH", "zip": "400001"}'
                                minRows={3}
                                description="Enter as JSON format"
                            />
                            <FormTextarea
                                name="shipping_address"
                                label="Shipping Address"
                                placeholder='{"street": "123 Main St", "city": "Mumbai", "state": "MH", "zip": "400001"}'
                                minRows={3}
                                description="Enter as JSON format"
                            />
                        </div>
                    </div>

                    {/* Payment Terms */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Payment Terms</h2>
                        <FormSelect
                            name="payment_terms"
                            label="Payment Terms"
                            placeholder="Select payment terms"
                            className="max-w-md"
                        >
                            {PAYMENT_TERMS.map((term) => (
                                <SelectItem key={term.key} value={term.key}>
                                    {term.label}
                                </SelectItem>
                            ))}
                        </FormSelect>
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
                            isLoading={isLoading}
                            startContent={!isLoading && <Save className="w-4 h-4" />}
                        >
                            Create Customer
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}
