/**
 * Customer Selector Component
 * Autocomplete search with create modal
 */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Autocomplete,
    AutocompleteItem,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Select,
    SelectItem,
    Textarea,
    Spinner,
} from '@heroui/react';
import { Search, Plus, User, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'react-hot-toast';

export default function CustomerSelector({
    value = null,
    onChange,
    onCustomerSelect,
    searchCustomers,
    createCustomer,
    isLoadingSearch = false,
    isLoadingCreate = false,
    readonly = false,
    showCreateButton = true,
    placeholder = 'Search customer by name, email, or phone',
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(value);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        display_name: '',
        email: '',
        phone: '',
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_pincode: '',
        customer_type: 'individual',
    });

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Search customers when debounced term changes
    useEffect(() => {
        let mounted = true;

        const fetchCustomers = async () => {
            if (!debouncedSearchTerm) {
                if (mounted) setCustomers([]);
                return;
            }
            console.log(debouncedSearchTerm, 'debouncedSearchTerm');

            if (searchCustomers) {
                try {
                    const results = await searchCustomers(debouncedSearchTerm);
                    if (mounted) setCustomers(results);
                } catch (error) {
                    console.error('Customer search error:', error);
                    if (mounted) toast.error('Failed to search customers');
                }
            }
        };

        fetchCustomers();

        return () => {
            mounted = false;
        };
    }, [debouncedSearchTerm, searchCustomers]);

    const handleSelectionChange = (key) => {
        if (!key) return;

        const customer = customers.find((c) => c.id?.toString() === key.toString());
        if (customer) {
            setSelectedCustomer(customer);
            setSearchTerm(customer.display_name || '');
            onChange(customer);
            if (onCustomerSelect) {
                onCustomerSelect(customer);
            }
        }
    };

    const handleCreateCustomer = async () => {
        // Validate
        if (!newCustomer.display_name.trim()) {
            toast.error('Customer name is required');
            return;
        }

        try {
            // Prepare data - remove empty strings for optional fields
            const customerData = {
                display_name: newCustomer.display_name.trim(),
                customer_type: newCustomer.customer_type,
            };

            // Only include optional fields if they have values
            if (newCustomer.email && newCustomer.email.trim()) {
                customerData.email = newCustomer.email.trim();
            }
            if (newCustomer.phone && newCustomer.phone.trim()) {
                customerData.phone = newCustomer.phone.trim();
            }
            if (newCustomer.billing_address_line1 && newCustomer.billing_address_line1.trim()) {
                customerData.billing_address_line1 = newCustomer.billing_address_line1.trim();
            }
            if (newCustomer.billing_address_line2 && newCustomer.billing_address_line2.trim()) {
                customerData.billing_address_line2 = newCustomer.billing_address_line2.trim();
            }
            if (newCustomer.billing_city && newCustomer.billing_city.trim()) {
                customerData.billing_city = newCustomer.billing_city.trim();
            }
            if (newCustomer.billing_state && newCustomer.billing_state.trim()) {
                customerData.billing_state = newCustomer.billing_state.trim();
            }
            if (newCustomer.billing_pincode && newCustomer.billing_pincode.trim()) {
                customerData.billing_pincode = newCustomer.billing_pincode.trim();
            }

            console.log('Creating customer with data:', customerData);
            const created = await createCustomer(customerData);
            toast.success('Customer created successfully');
            setSelectedCustomer(created);
            onChange(created);
            if (onCustomerSelect) {
                onCustomerSelect(created);
            }
            setIsCreateModalOpen(false);
            // Reset form
            setNewCustomer({
                display_name: '',
                email: '',
                phone: '',
                billing_address_line1: '',
                billing_address_line2: '',
                billing_city: '',
                billing_state: '',
                billing_pincode: '',
                customer_type: 'individual',
            });
        } catch (error) {
            console.error('Create customer error:', error);
            const errorMessage = error?.data?.detail || error?.message || 'Failed to create customer';
            toast.error(errorMessage);
        }
    };

    const customerTypes = [
        { key: 'individual', label: 'Individual' },
        { key: 'business', label: 'Business' },
    ];

    return (
        <>
            <div className="space-y-2">
                {/* Customer Search */}
                {!readonly ? (
                    <div className="flex gap-2">
                        <Autocomplete
                            // label="Customer"
                            placeholder={placeholder}
                            startContent={<Search className="w-4 h-4 text-gray-400" />}
                            inputValue={searchTerm}
                            onInputChange={setSearchTerm}
                            selectedKey={selectedCustomer?.id?.toString()}
                            onSelectionChange={handleSelectionChange}
                            isLoading={isLoadingSearch}
                            items={customers}
                            isRequired
                            classNames={{
                                base: 'flex-1',
                            }}
                        >
                            {(customer) => (
                                <AutocompleteItem key={customer.id} textValue={customer.display_name}>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">{customer.display_name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            {customer.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {customer.email}
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {customer.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </AutocompleteItem>
                            )}
                        </Autocomplete>

                        {showCreateButton && (
                            <Button
                                color="primary"
                                variant="flat"
                                startContent={<Plus className="w-4 h-4" />}
                                onPress={() => setIsCreateModalOpen(true)}
                            >
                                New
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-gray-600 mt-1" />
                            <div>
                                <p className="font-semibold text-gray-900">{selectedCustomer?.display_name}</p>
                                {selectedCustomer?.email && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                        <Mail className="w-3 h-3" />
                                        {selectedCustomer.email}
                                    </p>
                                )}
                                {selectedCustomer?.phone && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                        <Phone className="w-3 h-3" />
                                        {selectedCustomer.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Customer Details */}
                {selectedCustomer && !readonly && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-base font-semibold text-blue-900">{selectedCustomer.display_name}</p>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-blue-700">
                                    {selectedCustomer.email && (
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="w-4 h-4" />
                                            {selectedCustomer.email}
                                        </span>
                                    )}
                                    {selectedCustomer.phone && (
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="w-4 h-4" />
                                            {selectedCustomer.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Customer Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            <span>Create New Customer</span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            {/* Customer Type */}
                            <Select
                                label="Customer Type"
                                selectedKeys={[newCustomer.customer_type]}
                                onChange={(e) =>
                                    setNewCustomer({ ...newCustomer, customer_type: e.target.value })
                                }
                                startContent={
                                    newCustomer.customer_type === 'business' ? (
                                        <Building2 className="w-4 h-4" />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )
                                }
                            >
                                {customerTypes.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </Select>

                            {/* Name */}
                            <Input
                                label={newCustomer.customer_type === 'business' ? 'Company Name' : 'Full Name'}
                                placeholder="Enter name"
                                value={newCustomer.display_name}
                                onChange={(e) =>
                                    setNewCustomer({ ...newCustomer, display_name: e.target.value })
                                }
                                startContent={<User className="w-4 h-4" />}
                                isRequired
                            />

                            {/* Email */}
                            <Input
                                type="email"
                                label="Email"
                                placeholder="customer@example.com"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                startContent={<Mail className="w-4 h-4" />}
                            />

                            {/* Phone */}
                            <Input
                                type="tel"
                                label="Phone"
                                placeholder="+91 XXXXX XXXXX"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                startContent={<Phone className="w-4 h-4" />}
                            />

                            {/* Billing Address */}
                            <Input
                                label="Address Line 1"
                                placeholder="Street address"
                                value={newCustomer.billing_address_line1}
                                onChange={(e) =>
                                    setNewCustomer({ ...newCustomer, billing_address_line1: e.target.value })
                                }
                                startContent={<MapPin className="w-4 h-4" />}
                            />

                            <Input
                                label="Address Line 2"
                                placeholder="Apartment, suite, etc. (optional)"
                                value={newCustomer.billing_address_line2}
                                onChange={(e) =>
                                    setNewCustomer({ ...newCustomer, billing_address_line2: e.target.value })
                                }
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="City"
                                    placeholder="City"
                                    value={newCustomer.billing_city}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, billing_city: e.target.value })
                                    }
                                />
                                <Input
                                    label="State"
                                    placeholder="State"
                                    value={newCustomer.billing_state}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, billing_state: e.target.value })
                                    }
                                />
                            </div>

                            <Input
                                label="Pincode"
                                placeholder="123456"
                                value={newCustomer.billing_pincode}
                                onChange={(e) =>
                                    setNewCustomer({ ...newCustomer, billing_pincode: e.target.value })
                                }
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleCreateCustomer}
                            isLoading={isLoadingCreate}
                        >
                            Create Customer
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
