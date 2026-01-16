/**
 * Edit Invoice Page
 * Edit existing invoice with pre-filled data
 */

'use client';

import { use, useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Calculator,
    AlertCircle,
    Coins,
    Zap,
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
    DatePicker,
    Spinner,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PageHeader } from '@/components/ui';
import {
    useGetInvoiceQuery,
    useUpdateInvoiceMutation,
    useGetServicesQuery,
    useGetUserWalletQuery,
} from '@/redux/services/api';
import { formatCurrency } from '@/utils/dateFormatters';
import { parseDate } from '@internationalized/date';

const paymentTerms = [
    { value: 'DUE_ON_RECEIPT', label: 'Due on Receipt' },
    { value: 'NET_7', label: 'Net 7 Days' },
    { value: 'NET_15', label: 'Net 15 Days' },
    { value: 'NET_30', label: 'Net 30 Days' },
    { value: 'NET_45', label: 'Net 45 Days' },
    { value: 'NET_60', label: 'Net 60 Days' },
];

function getDefaultDueDate(term, invoiceDate) {
    const today = new Date(invoiceDate || Date.now());
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

export default function EditInvoicePage({ params }) {
    const unwrappedParams = use(params);
    const router = useRouter();

    // API Hooks
    const { data: invoice, isLoading, error } = useGetInvoiceQuery(unwrappedParams.id);
    const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();
    const { data: servicesData } = useGetServicesQuery();
    const services = servicesData || [];

    // Fetch wallet data if invoice has a user
    const { data: walletData, isLoading: isLoadingWallet } = useGetUserWalletQuery(
        invoice?.user_id,
        { skip: !invoice?.user_id }
    );

    // Form State
    const [formData, setFormData] = useState({
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
    });

    const [lineItems, setLineItems] = useState([
        { id: 1, service_id: null, description: '', quantity: 1, unit_price: 0, tax_rate: 18 }
    ]);

    // Initialize form with invoice data
    useEffect(() => {
        if (invoice) {
            setFormData({
                customer_name: invoice.customer_name || '',
                customer_email: invoice.customer_email || '',
                customer_phone: invoice.customer_phone || '',
                customer_address: invoice.customer_address || '',
                invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
                due_date: invoice.due_date || new Date().toISOString().split('T')[0],
                payment_terms: invoice.payment_terms || 'DUE_ON_RECEIPT',
                notes: invoice.customer_notes || '',
                terms_conditions: invoice.terms_conditions || '',
                discount_type: invoice.discount_type || 'PERCENTAGE',
                discount_value: invoice.discount_value || 0,
                coins_redeemed: invoice.coins_redeemed || 0,
            });

            if (invoice.line_items && invoice.line_items.length > 0) {
                setLineItems(
                    invoice.line_items.map((item, index) => ({
                        id: Date.now() + index,
                        service_id: item.service_id || null,
                        description: item.description || item.item_name || '',
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        tax_rate: item.tax_rate || 18,
                    }))
                );
            }
        }
    }, [invoice]);

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

        const coinsRedeemed = formData.coins_redeemed || 0;
        const total = subtotal + totalTax - discount - coinsRedeemed;

        return {
            subtotal,
            totalTax,
            discount,
            coinsRedeemed,
            total: Math.max(0, total),
        };
    }, [lineItems, formData.discount_type, formData.discount_value, formData.coins_redeemed]);

    // Line item handlers
    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: Date.now(), service_id: null, description: '', quantity: 1, unit_price: 0, tax_rate: 18 }
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
            setLineItems(lineItems.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        service_id: serviceId,
                        description: service.name,
                        unit_price: service.price || 0
                    }
                    : item
            ));
        }
    };

    // Handle payment terms change
    const handlePaymentTermsChange = (term) => {
        const dueDate = getDefaultDueDate(term, formData.invoice_date);
        setFormData({
            ...formData,
            payment_terms: term,
            due_date: dueDate.toISOString().split('T')[0],
        });
    };

    // Auto-apply coins with 50% policy
    const handleApplyCoins = () => {
        if (!walletData?.balance) {
            toast.error('No coins available');
            return;
        }

        const availableCoins = walletData.balance;
        const afterDiscount = calculations.subtotal - calculations.discount;
        const maxRedeemable = Math.min(availableCoins, Math.floor(afterDiscount * 0.5));

        if (maxRedeemable <= 0) {
            toast.error('Cannot apply coins. Check subtotal and discount.');
            return;
        }

        setFormData({ ...formData, coins_redeemed: maxRedeemable });
        toast.success(`Applied ${maxRedeemable} coins (50% max policy)`);
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

        // Check if invoice can be edited
        if (invoice && invoice.status === 'PAID') {
            toast.error('Cannot edit a paid invoice');
            return;
        }

        if (invoice && invoice.amount_paid > 0) {
            toast.warning('This invoice has payments recorded. Some changes may be restricted.');
        }

        try {
            const payload = {
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
                coins_redeemed: formData.coins_redeemed || 0,
                status: asDraft ? 'DRAFT' : invoice?.status || 'PENDING',
                line_items: lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                })),
            };

            await updateInvoice({ id: unwrappedParams.id, ...payload }).unwrap();
            toast.success('Invoice updated successfully');
            router.push(`/finance/invoices/${unwrappedParams.id}`);
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update invoice');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-16 h-16 text-danger" />
                <h2 className="text-xl font-semibold">Invoice Not Found</h2>
                <p className="text-gray-600">The invoice you're trying to edit doesn't exist.</p>
                <Button as={Link} href="/finance/invoices" variant="flat">
                    Back to Invoices
                </Button>
            </div>
        );
    }

    // Prevent editing paid invoices
    if (invoice.status === 'PAID') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-16 h-16 text-warning" />
                <h2 className="text-xl font-semibold">Cannot Edit Paid Invoice</h2>
                <p className="text-gray-600">This invoice has been paid and cannot be edited.</p>
                <div className="flex gap-2">
                    <Button as={Link} href={`/finance/invoices/${invoice.id}`} variant="flat">
                        View Invoice
                    </Button>
                    <Button as={Link} href="/finance/invoices" variant="flat">
                        Back to Invoices
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title={`Edit Invoice ${invoice.invoice_number}`}
                description="Update invoice details and line items"
                actions={
                    <div className="flex gap-2">
                        <Link href={`/finance/invoices/${invoice.id}`}>
                            <Button variant="flat" startContent={<ArrowLeft className="w-4 h-4" />}>
                                Cancel
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Warning for invoices with payments */}
            {invoice.amount_paid > 0 && (
                <Card className="bg-warning-50 border-warning">
                    <CardBody>
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-warning-800">Payment Recorded</p>
                                <p className="text-sm text-warning-700">
                                    This invoice has {formatCurrency(invoice.amount_paid)} in payments recorded.
                                    Changes to line items will affect the balance due.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Customer Section */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold">Customer Information</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Customer Name"
                            labelPlacement="outside"
                            placeholder="Enter customer name"
                            value={formData.customer_name}
                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                            isRequired
                            isDisabled={invoice.amount_paid > 0}
                        />
                        <Input
                            label="Email"
                            labelPlacement="outside"
                            type="email"
                            placeholder="customer@example.com"
                            value={formData.customer_email}
                            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                        />
                        <Input
                            label="Phone"
                            labelPlacement="outside"
                            placeholder="+91 98765 43210"
                            value={formData.customer_phone}
                            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        />
                        <div className="md:col-span-2">
                            <Textarea
                                label="Address"
                                labelPlacement="outside"
                                placeholder="Enter customer address"
                                value={formData.customer_address}
                                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                                rows={2}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Invoice Date"
                            labelPlacement="outside"
                            type="date"
                            value={formData.invoice_date}
                            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                            isRequired
                        />
                        <Select
                            label="Payment Terms"
                            labelPlacement="outside"
                            selectedKeys={[formData.payment_terms]}
                            onChange={(e) => handlePaymentTermsChange(e.target.value)}
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
                            isRequired
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Line Items */}
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h3 className="font-semibold">Line Items</h3>
                    <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={addLineItem}
                    >
                        Add Item
                    </Button>
                </CardHeader>
                <CardBody className="space-y-4">
                    {lineItems.map((item, index) => (
                        <div key={item.id} className="space-y-3">
                            {index > 0 && <Divider />}
                            <div className="grid grid-cols-12 gap-3 items-start">
                                <div className="col-span-12 md:col-span-5">
                                    <Select
                                        label="Service (Optional)"
                                        labelPlacement="outside"
                                        placeholder="Select a service"
                                        selectedKeys={item.service_id ? [String(item.service_id)] : []}
                                        onSelectionChange={(keys) => {
                                            const selectedKey = Array.from(keys)[0];
                                            if (selectedKey) {
                                                handleServiceSelect(item.id, selectedKey);
                                            }
                                        }}
                                        size="sm"
                                    >
                                        {services.map((service) => (
                                            <SelectItem key={service.id} value={service.id}>
                                                {service.name} - {formatCurrency(service.price || 0)}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <Input
                                        label="Description"
                                        labelPlacement="outside"
                                        placeholder="Item description"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                        isRequired
                                        className="mt-2"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Input
                                        label="Quantity"
                                        labelPlacement="outside"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                        isRequired
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Input
                                        label="Price"
                                        labelPlacement="outside"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                        isRequired
                                    />
                                </div>
                                <div className="col-span-3 md:col-span-2">
                                    <Input
                                        label="Tax %"
                                        labelPlacement="outside"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={item.tax_rate}
                                        onChange={(e) => updateLineItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-1 flex items-end justify-end pb-1">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        variant="flat"
                                        onPress={() => removeLineItem(item.id)}
                                        isDisabled={lineItems.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 text-right">
                                Item Total: {formatCurrency(item.quantity * item.unit_price * (1 + item.tax_rate / 100))}
                            </div>
                        </div>
                    ))}
                </CardBody>
            </Card>

            {/* Discount & Totals */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Discount & Totals
                    </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            label="Discount Type"
                            labelPlacement="outside"
                            selectedKeys={[formData.discount_type]}
                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                        >
                            <SelectItem key="PERCENTAGE" value="PERCENTAGE">Percentage (%)</SelectItem>
                            <SelectItem key="FIXED" value="FIXED">Fixed Amount</SelectItem>
                        </Select>
                        <Input
                            label="Discount Value"
                            labelPlacement="outside"
                            type="number"
                            min="0"
                            step={formData.discount_type === 'PERCENTAGE' ? '1' : '0.01'}
                            max={formData.discount_type === 'PERCENTAGE' ? '100' : undefined}
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                            endContent={formData.discount_type === 'PERCENTAGE' ? '%' : '₹'}
                        />
                        <div className="space-y-2">
                            <Input
                                label="Coins to Redeem"
                                labelPlacement="outside"
                                type="number"
                                min="0"
                                step="1"
                                value={formData.coins_redeemed}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    const maxAllowed = walletData?.balance ? Math.min(
                                        walletData.balance,
                                        Math.floor((calculations.subtotal - calculations.discount) * 0.5)
                                    ) : 0;
                                    if (value > maxAllowed) {
                                        toast.error(`Maximum ${maxAllowed} coins allowed (50% policy)`);
                                        return;
                                    }
                                    setFormData({ ...formData, coins_redeemed: value });
                                }}
                                endContent="coins"
                                description={walletData ? `Available: ${walletData.balance} coins` : "Enter coins manually"}
                                isDisabled={isLoadingWallet}
                            />
                            {invoice?.user_id && walletData && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Coins className="w-4 h-4 text-warning" />
                                        <span>
                                            Available: <strong>{walletData.balance} coins</strong>
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span>
                                            Max redeemable: <strong>{Math.min(walletData.balance, Math.floor((calculations.subtotal - calculations.discount) * 0.5))} coins</strong>
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        color="warning"
                                        variant="flat"
                                        startContent={<Zap className="w-4 h-4" />}
                                        onPress={handleApplyCoins}
                                        isDisabled={!walletData.balance || isLoadingWallet}
                                    >
                                        Apply Max Coins (50% Policy)
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Divider />

                    {/* Summary */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                        </div>
                        {calculations.discount > 0 && (
                            <div className="flex justify-between text-sm text-success-600">
                                <span>Discount:</span>
                                <span>-{formatCurrency(calculations.discount)}</span>
                            </div>
                        )}
                        {calculations.coinsRedeemed > 0 && (
                            <div className="flex justify-between text-sm text-warning-600">
                                <span>Coins Redeemed:</span>
                                <span>-{formatCurrency(calculations.coinsRedeemed)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax:</span>
                            <span className="font-medium">{formatCurrency(calculations.totalTax)}</span>
                        </div>
                        <Divider />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>{formatCurrency(calculations.total)}</span>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Notes */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold">Additional Information</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <Textarea
                        label="Customer Notes"
                        labelPlacement="outside"
                        placeholder="Add notes for the customer"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                    />
                    <Textarea
                        label="Terms & Conditions"
                        labelPlacement="outside"
                        placeholder="Add terms and conditions"
                        value={formData.terms_conditions}
                        onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                        rows={3}
                    />
                </CardBody>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pb-8">
                <Button
                    variant="flat"
                    onPress={() => router.push(`/finance/invoices/${invoice.id}`)}
                >
                    Cancel
                </Button>
                {invoice.status === 'DRAFT' && (
                    <Button
                        color="default"
                        variant="flat"
                        startContent={<Save className="w-4 h-4" />}
                        onPress={() => handleSubmit(true)}
                        isLoading={isUpdating}
                    >
                        Save as Draft
                    </Button>
                )}
                <Button
                    color="primary"
                    startContent={<Save className="w-4 h-4" />}
                    onPress={() => handleSubmit(false)}
                    isLoading={isUpdating}
                >
                    Update Invoice
                </Button>
            </div>
        </div>
    );
}
