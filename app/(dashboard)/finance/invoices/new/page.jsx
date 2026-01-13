/**
 * New Invoice Page
 * Create invoice with customer selection and line items
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Send,
    Calculator,
    Search,
} from 'lucide-react';
import {
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Autocomplete,
    AutocompleteItem,
    DatePicker,
    Switch,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PageHeader } from '@/components/ui';
import {
    useCreateInvoiceMutation,
    useLazySearchCustomersQuery,
    useGetServicesQuery,
    useGetInvoiceSettingsQuery,
    useCreateInvoiceFromAppointmentMutation,
    useCreateCustomerMutation,
} from '@/redux/services/api';
import { formatCurrency } from '@/utils/dateFormatters';
import { parseDate } from '@internationalized/date';

const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
];

const paymentTerms = [
    { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
    { value: 'NET_7', label: 'Net 7 Days' },
    { value: 'NET_15', label: 'Net 15 Days' },
    { value: 'NET_30', label: 'Net 30 Days' },
    { value: 'NET_45', label: 'Net 45 Days' },
    { value: 'NET_60', label: 'Net 60 Days' },
];

function getDefaultDueDate(term) {
    const today = new Date();
    switch (term) {
        case 'DUE_ON_RECEIPT': return today;
        case 'NET_7': return new Date(today.setDate(today.getDate() + 7));
        case 'NET_15': return new Date(today.setDate(today.getDate() + 15));
        case 'NET_30': return new Date(today.setDate(today.getDate() + 30));
        case 'NET_45': return new Date(today.setDate(today.getDate() + 45));
        case 'NET_60': return new Date(today.setDate(today.getDate() + 60));
        default: return today;
    }
}

export default function NewInvoicePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointment_id');

    // Modal for adding customer
    const { isOpen: isCustomerModalOpen, onOpen: onCustomerModalOpen, onClose: onCustomerModalClose } = useDisclosure();

    // API Hooks
    const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
    const [createFromAppointment, { isLoading: isCreatingFromAppointment }] = useCreateInvoiceFromAppointmentMutation();
    const [searchCustomers, { data: customerResults }] = useLazySearchCustomersQuery();
    const { data: servicesData } = useGetServicesQuery();
    const { data: settings } = useGetInvoiceSettingsQuery();
    const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();

    const services = servicesData || [];

    // Form State
    const [formData, setFormData] = useState({
        customer_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        payment_terms: 'DUE_ON_RECEIPT',
        notes: '',
        terms_conditions: settings?.default_terms || '',
        discount_type: 'PERCENTAGE', // PERCENTAGE or FIXED
        discount_value: 0,
        coins_redeemed: 0,
    });

    // New customer form state
    const [newCustomer, setNewCustomer] = useState({
        display_name: '',
        email: '',
        phone: '',
        billing_address: '',
        customer_type: 'individual',
    });

    const [lineItems, setLineItems] = useState([
        { id: 1, description: '', quantity: 1, unit_price: 0, tax_rate: 18 }
    ]);

    const [customerSearch, setCustomerSearch] = useState('');

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

    // Customer search
    useEffect(() => {
        if (customerSearch.length >= 2) {
            searchCustomers({ q: customerSearch, limit: 10 });
        }
    }, [customerSearch, searchCustomers]);

    // Calculate totals
    const calculations = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;

        lineItems.forEach(item => {
            const itemTotal = item.quantity * item.unit_price;
            const itemTax = itemTotal * (item.tax_rate / 100);
            subtotal += itemTotal;
            totalTax += itemTax;
        });

        let discount = 0;
        if (formData.discount_type === 'PERCENTAGE') {
            discount = subtotal * (formData.discount_value / 100);
        } else {
            discount = formData.discount_value || 0;
        }

        const coinsDiscount = formData.coins_redeemed || 0;
        const total = subtotal + totalTax - discount - coinsDiscount;

        return {
            subtotal,
            totalTax,
            discount,
            coinsDiscount,
            total: Math.max(0, total),
        };
    }, [lineItems, formData.discount_type, formData.discount_value, formData.coins_redeemed]);

    // Handle customer selection
    const handleCustomerSelect = (customer) => {
        setFormData({
            ...formData,
            customer_id: customer.id,
            customer_name: customer.display_name || customer.name,
            customer_email: customer.email || '',
            customer_phone: customer.phone || '',
            customer_address: customer.billing_address || '',
        });
        setCustomerSearch(customer.display_name || customer.name);
    };

    // Handle creating a new customer
    const handleCreateCustomer = async () => {
        if (!newCustomer.display_name) {
            toast.error('Customer name is required');
            return;
        }

        try {
            const result = await createCustomer({
                display_name: newCustomer.display_name,
                email: newCustomer.email || undefined,
                phone: newCustomer.phone || undefined,
                billing_address: newCustomer.billing_address || undefined,
                customer_type: newCustomer.customer_type,
            }).unwrap();

            toast.success('Customer created successfully');

            // Select the newly created customer
            handleCustomerSelect(result);

            // Reset form and close modal
            setNewCustomer({
                display_name: '',
                email: '',
                phone: '',
                billing_address: '',
                customer_type: 'individual',
            });
            onCustomerModalClose();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to create customer');
        }
    };

    // Open add customer modal with search text pre-filled
    const handleAddCustomerClick = () => {
        setNewCustomer({
            ...newCustomer,
            display_name: customerSearch,
        });
        onCustomerModalOpen();
    };

    // Line item handlers
    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: Date.now(), description: '', quantity: 1, unit_price: 0, tax_rate: 18 }
        ]);
    };

    const removeLineItem = (id) => {
        if (lineItems.length === 1) {
            toast.error('At least one line item is required');
            return;
        }
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    const updateLineItem = (id, field, value) => {
        setLineItems(lineItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Handle service selection for line item
    const handleServiceSelect = (itemId, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            updateLineItem(itemId, 'description', service.name);
            updateLineItem(itemId, 'unit_price', service.price || 0);
        }
    };

    // Handle payment terms change
    const handlePaymentTermsChange = (term) => {
        const dueDate = getDefaultDueDate(term);
        setFormData({
            ...formData,
            payment_terms: term,
            due_date: dueDate.toISOString().split('T')[0],
        });
    };

    // Submit handler
    const handleSubmit = async (asDraft = false) => {
        // Validation
        if (!formData.customer_name) {
            toast.error('Customer name is required');
            return;
        }

        if (lineItems.some(item => !item.description || item.quantity <= 0)) {
            toast.error('All line items must have a description and quantity');
            return;
        }

        try {
            const payload = {
                customer_id: formData.customer_id || undefined,
                customer_name: formData.customer_name,
                customer_email: formData.customer_email || undefined,
                customer_phone: formData.customer_phone || undefined,
                customer_address: formData.customer_address || undefined,
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="New Invoice"
                description="Create a new invoice for your customer"
                actions={
                    <div className="flex gap-2">
                        <Link href="/finance/invoices">
                            <Button variant="flat" startContent={<ArrowLeft className="w-4 h-4" />}>
                                Cancel
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Customer Section */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold">Customer Information</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Autocomplete
                                        label="Customer"
                                        labelPlacement="outside"
                                        placeholder="Start typing to select a customer"
                                        inputValue={customerSearch}
                                        onInputChange={setCustomerSearch}
                                        onSelectionChange={(key) => {
                                            if (key === '__add_new__') {
                                                handleAddCustomerClick();
                                            } else {
                                                const customer = customerResults?.find(c => c.id === key);
                                                if (customer) handleCustomerSelect(customer);
                                            }
                                        }}
                                        allowsCustomValue
                                        onBlur={() => {
                                            if (customerSearch && !formData.customer_id) {
                                                setFormData({ ...formData, customer_name: customerSearch });
                                            }
                                        }}
                                        startContent={<Search className="w-4 h-4 text-gray-400" />}
                                    >
                                        {[
                                            // Add Customer option - always show at top when there's search text
                                            ...(customerSearch.length >= 1 ? [{
                                                id: '__add_new__',
                                                display_name: `+ Add "${customerSearch}" as new customer`,
                                                isAddNew: true,
                                            }] : []),
                                            // Customer results
                                            ...(customerResults || []),
                                        ].map((item) => (
                                            <AutocompleteItem
                                                key={item.id}
                                                value={item.id}
                                                className={item.isAddNew ? 'text-primary-600 font-medium' : ''}
                                                textValue={item.isAddNew ? `Add ${customerSearch}` : (item.display_name || item.name)}
                                            >
                                                {item.isAddNew ? (
                                                    <div className="flex items-center gap-2 text-primary-600">
                                                        <Plus className="w-4 h-4" />
                                                        <span>Add "{customerSearch}" as new customer</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div>{item.display_name || item.name}</div>
                                                        {item.email && <div className="text-xs text-gray-500">{item.email}</div>}
                                                    </div>
                                                )}
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>
                                <Button
                                    isIconOnly
                                    variant="flat"
                                    onPress={onCustomerModalOpen}
                                    className="mb-0.5"
                                    title="Add new customer"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <Input
                            label="Email"
                            labelPlacement="outside"
                            placeholder="customer@email.com"
                            type="email"
                            value={formData.customer_email}
                            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                        />
                        <Input
                            label="Phone"
                            labelPlacement="outside"
                            placeholder="+91 1234567890"
                            value={formData.customer_phone}
                            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        />
                        <div className="md:col-span-2">
                            <Textarea
                                label="Billing Address"
                                labelPlacement="outside"
                                placeholder="Enter billing address"
                                value={formData.customer_address}
                                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                                minRows={2}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Invoice Details */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold">Invoice Details</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <Input
                            label="Invoice Date"
                            labelPlacement="outside"
                            type="date"
                            value={formData.invoice_date}
                            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                        />
                        <Select
                            label="Payment Terms"
                            labelPlacement="outside"
                            selectedKeys={[formData.payment_terms]}
                            onSelectionChange={(keys) => handlePaymentTermsChange(Array.from(keys)[0])}
                        >
                            {paymentTerms.map((term) => (
                                <SelectItem key={term.value} value={term.value}>
                                    {term.label}
                                </SelectItem>
                            ))}
                        </Select>
                        <Input
                            label="Due Date"
                            labelPlacement="outside"
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Line Items */}
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h3 className="font-semibold">Line Items</h3>
                    <Button size="sm" variant="flat" startContent={<Plus className="w-4 h-4" />} onPress={addLineItem}>
                        Add Item
                    </Button>
                </CardHeader>
                <CardBody>
                    <div className="space-y-4">
                        {/* Header (desktop) */}
                        <div className="hidden md:grid md:grid-cols-12 gap-3 text-sm font-medium text-gray-600 px-2">
                            <div className="col-span-5">Description</div>
                            <div className="col-span-2">Quantity</div>
                            <div className="col-span-2">Rate</div>
                            <div className="col-span-1">Tax %</div>
                            <div className="col-span-1 text-right">Amount</div>
                            <div className="col-span-1"></div>
                        </div>

                        {lineItems.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg">
                                {/* Description with service selector */}
                                <div className="md:col-span-5 space-y-2">
                                    <label className="text-sm text-gray-600 md:hidden">Description</label>
                                    <Select
                                        placeholder="Select service..."
                                        size="sm"
                                        aria-label="Select service"
                                        onSelectionChange={(keys) => {
                                            const selectedKey = Array.from(keys)[0];
                                            if (selectedKey) {
                                                handleServiceSelect(item.id, selectedKey);
                                            }
                                        }}
                                        className="mb-2"
                                    >
                                        {(services || []).map((service) => (
                                            <SelectItem key={service.id} textValue={service.name}>
                                                {service.name}{service.price ? ` - ${formatCurrency(service.price)}` : ''}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <Input
                                        placeholder="Item description"
                                        size="sm"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm text-gray-600 md:hidden">Quantity</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        size="sm"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm text-gray-600 md:hidden">Rate (₹)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        size="sm"
                                        startContent="₹"
                                        value={item.unit_price}
                                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-sm text-gray-600 md:hidden">Tax %</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        size="sm"
                                        endContent="%"
                                        value={item.tax_rate}
                                        onChange={(e) => updateLineItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="md:col-span-1 flex items-center justify-end">
                                    <span className="font-medium">
                                        {formatCurrency(item.quantity * item.unit_price * (1 + item.tax_rate / 100))}
                                    </span>
                                </div>
                                <div className="md:col-span-1 flex items-center justify-end">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => removeLineItem(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Discount & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Discount & Notes */}
                <Card>
                    <CardHeader>
                        <h3 className="font-semibold">Discount & Notes</h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label="Discount Type"
                                labelPlacement="outside"
                                selectedKeys={[formData.discount_type]}
                                onSelectionChange={(keys) => setFormData({ ...formData, discount_type: Array.from(keys)[0] })}
                            >
                                <SelectItem key="PERCENTAGE" value="PERCENTAGE">Percentage (%)</SelectItem>
                                <SelectItem key="FIXED" value="FIXED">Fixed Amount (₹)</SelectItem>
                            </Select>
                            <Input
                                label="Discount Value"
                                labelPlacement="outside"
                                type="number"
                                min="0"
                                startContent={formData.discount_type === 'FIXED' ? '₹' : null}
                                endContent={formData.discount_type === 'PERCENTAGE' ? '%' : null}
                                value={formData.discount_value}
                                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <Input
                            label="Coins Redeemed"
                            labelPlacement="outside"
                            type="number"
                            min="0"
                            startContent="₹"
                            value={formData.coins_redeemed}
                            onChange={(e) => setFormData({ ...formData, coins_redeemed: parseFloat(e.target.value) || 0 })}
                            description="Value of coins redeemed by customer"
                        />
                        <Textarea
                            label="Notes"
                            labelPlacement="outside"
                            placeholder="Any additional notes for the customer..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            minRows={2}
                        />
                        <Textarea
                            label="Terms & Conditions"
                            labelPlacement="outside"
                            placeholder="Invoice terms and conditions..."
                            value={formData.terms_conditions}
                            onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                            minRows={2}
                        />
                    </CardBody>
                </Card>

                {/* Summary */}
                <Card className="bg-gray-50">
                    <CardHeader>
                        <h3 className="font-semibold flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Invoice Summary
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(calculations.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (GST)</span>
                                <span>{formatCurrency(calculations.totalTax)}</span>
                            </div>
                            {calculations.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(calculations.discount)}</span>
                                </div>
                            )}
                            {calculations.coinsDiscount > 0 && (
                                <div className="flex justify-between text-blue-600">
                                    <span>Coins Redeemed</span>
                                    <span>-{formatCurrency(calculations.coinsDiscount)}</span>
                                </div>
                            )}
                            <Divider />
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(calculations.total)}</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pb-8">
                <Button
                    variant="flat"
                    onPress={() => handleSubmit(true)}
                    isLoading={isCreating}
                >
                    Save as Draft
                </Button>
                <Button
                    color="primary"
                    startContent={<Save className="w-4 h-4" />}
                    onPress={() => handleSubmit(false)}
                    isLoading={isCreating}
                >
                    Create Invoice
                </Button>
            </div>

            {/* Add Customer Modal */}
            <Modal isOpen={isCustomerModalOpen} onClose={onCustomerModalClose} size="lg">
                <ModalContent>
                    <ModalHeader>Add New Customer</ModalHeader>
                    <ModalBody className="space-y-4">
                        <Input
                            label="Display Name"
                            labelPlacement="outside"
                            placeholder="Enter customer name"
                            value={newCustomer.display_name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, display_name: e.target.value })}
                            isRequired
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Email"
                                labelPlacement="outside"
                                placeholder="customer@email.com"
                                type="email"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            />
                            <Input
                                label="Phone"
                                labelPlacement="outside"
                                placeholder="+91 1234567890"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            />
                        </div>
                        <Select
                            label="Customer Type"
                            labelPlacement="outside"
                            selectedKeys={[newCustomer.customer_type]}
                            onSelectionChange={(keys) => setNewCustomer({ ...newCustomer, customer_type: Array.from(keys)[0] })}
                        >
                            <SelectItem key="individual">Individual</SelectItem>
                            <SelectItem key="business">Business</SelectItem>
                        </Select>
                        <Textarea
                            label="Billing Address"
                            labelPlacement="outside"
                            placeholder="Enter billing address"
                            value={newCustomer.billing_address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, billing_address: e.target.value })}
                            minRows={2}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onCustomerModalClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleCreateCustomer}
                            isLoading={isCreatingCustomer}
                        >
                            Add Customer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
