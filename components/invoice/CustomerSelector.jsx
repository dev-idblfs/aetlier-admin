/**
 * Customer Selector Component
 * Autocomplete search with create modal
 */
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { invoiceCustomerQuickSchema } from '@/lib/validation';

export default function CustomerSelector({
    value = null,
    initialCustomer = null,
    onChange,
    onCustomerSelect,
    searchCustomers,
    createCustomer,
    isLoadingSearch = false,
    isLoadingCreate = false,
    readonly = false,
    showCreateButton = true,
    hideSelectedPreview = false,
    compact = false,
    placeholder = 'Search customer by name, email, or phone',
}) {
    const seedCustomer = value ?? initialCustomer;
    const [searchTerm, setSearchTerm] = useState(
        seedCustomer?.display_name || ''
    );
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(seedCustomer);
    const [selectedKey, setSelectedKey] = useState(
        seedCustomer?.id != null ? String(seedCustomer.id) : null
    );
    const didSeedFromInitial = useRef(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFieldErrors, setCreateFieldErrors] = useState({});
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

    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const searchRequestId = useRef(0);

    // Controlled: parent `value` is source of truth (never override with initialCustomer)
    useEffect(() => {
        if (value == null) return;
        const nextKey = value.id != null ? String(value.id) : null;
        setSelectedKey(nextKey);
        setSelectedCustomer(value);
        setSearchTerm(value.display_name || '');
    }, [value?.id, value?.display_name, value?.email, value?.phone]);

    // One-time seed from initialCustomer before parent value is ready (edit invoice load)
    useEffect(() => {
        if (value != null || !initialCustomer) return;
        if (didSeedFromInitial.current) return;
        didSeedFromInitial.current = true;
        const key = initialCustomer.id != null ? String(initialCustomer.id) : null;
        setSelectedKey(key);
        setSelectedCustomer(initialCustomer);
        setSearchTerm(initialCustomer.display_name || '');
    }, [initialCustomer, value]);

    const listItems = useMemo(() => {
        if (!selectedCustomer?.id) return customers;
        const sid = String(selectedCustomer.id);
        if (customers.some((c) => String(c.id) === sid)) return customers;
        return [selectedCustomer, ...customers];
    }, [customers, selectedCustomer]);

    // Search customers when debounced term changes
    useEffect(() => {
        const term = debouncedSearchTerm?.trim() || '';
        if (term.length < 2) {
            setCustomers([]);
            return undefined;
        }

        if (!searchCustomers) return undefined;

        const requestId = ++searchRequestId.current;

        const fetchCustomers = async () => {
            try {
                const results = await searchCustomers(term);
                if (searchRequestId.current !== requestId) return;
                setCustomers(Array.isArray(results) ? results : []);
            } catch (error) {
                if (searchRequestId.current !== requestId) return;
                console.error('Customer search error:', error);
            }
        };

        fetchCustomers();
        return undefined;
    }, [debouncedSearchTerm, searchCustomers]);

    const resolveSelectionKey = (key) => {
        if (key == null || key === '') return null;
        if (typeof key === 'string' || typeof key === 'number') return String(key);
        if (key instanceof Set) {
            const first = key.values().next().value;
            return first != null ? String(first) : null;
        }
        return String(key);
    };

    const handleInputChange = useCallback(
        (term) => {
            setSearchTerm(term);
            const label = (selectedCustomer?.display_name || '').trim();
            if (term.trim() !== label) {
                setSelectedKey(null);
            }
        },
        [selectedCustomer?.display_name]
    );

    const handleSelectionChange = (key) => {
        const id = resolveSelectionKey(key);
        if (!id) return;

        const customer = listItems.find((c) => String(c.id) === id);
        if (!customer) return;

        setSelectedKey(id);
        setSelectedCustomer(customer);
        setSearchTerm(customer.display_name || '');
        onChange?.(customer);
        onCustomerSelect?.(customer);
    };

    const handleCreateCustomer = async () => {
        const parsed = invoiceCustomerQuickSchema.safeParse(newCustomer);
        if (!parsed.success) {
            const errors = {};
            parsed.error.issues.forEach((issue) => {
                const key = issue.path[0];
                if (key && !errors[key]) errors[key] = issue.message;
            });
            setCreateFieldErrors(errors);
            return;
        }
        setCreateFieldErrors({});

        try {
            const data = parsed.data;
            const customerData = {
                display_name: data.display_name.trim(),
                customer_type: data.customer_type,
            };

            if (data.email?.trim()) customerData.email = data.email.trim();
            if (data.phone?.trim()) customerData.phone = data.phone.trim();
            if (data.billing_address_line1?.trim()) {
                customerData.billing_address_line1 = data.billing_address_line1.trim();
            }
            if (data.billing_address_line2?.trim()) {
                customerData.billing_address_line2 = data.billing_address_line2.trim();
            }
            if (data.billing_city?.trim()) customerData.billing_city = data.billing_city.trim();
            if (data.billing_state?.trim()) customerData.billing_state = data.billing_state.trim();
            if (data.billing_pincode?.trim()) {
                customerData.billing_pincode = data.billing_pincode.trim();
            }

            const created = await createCustomer(customerData);
            toast.success('Customer created successfully');
            const row = created?.id != null ? created : null;
            if (row) {
                setSelectedKey(String(row.id));
                setSelectedCustomer(row);
                setSearchTerm(row.display_name || '');
                setCustomers((prev) => {
                    const sid = String(row.id);
                    if (prev.some((c) => String(c.id) === sid)) return prev;
                    return [row, ...prev];
                });
            }
            onChange?.(created);
            onCustomerSelect?.(created);
            setIsCreateModalOpen(false);
            setCreateFieldErrors({});
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
            <div className={compact ? 'space-y-0' : 'space-y-2'}>
                {/* Customer Search */}
                {!readonly ? (
                    <div className="flex gap-2 items-end">
                        <Autocomplete
                            label={compact ? 'Find customer' : undefined}
                            labelPlacement="outside"
                            size={compact ? 'sm' : 'md'}
                            placeholder={placeholder}
                            startContent={<Search className="w-4 h-4 text-gray-400" />}
                            inputValue={searchTerm}
                            onInputChange={handleInputChange}
                            selectedKey={selectedKey}
                            onSelectionChange={handleSelectionChange}
                            isLoading={isLoadingSearch}
                            items={listItems}
                            isRequired
                            classNames={{
                                base: 'flex-1',
                            }}
                        >
                            {(customer) => (
                                <AutocompleteItem
                                    key={String(customer.id)}
                                    textValue={customer.display_name || ''}
                                >
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
                                size={compact ? 'sm' : 'md'}
                                startContent={<Plus className="w-4 h-4" />}
                                onPress={() => {
                                    setCreateFieldErrors({});
                                    setIsCreateModalOpen(true);
                                }}
                                className="shrink-0"
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

                {/* Selected Customer Details — hidden when billing fields show same data */}
                {selectedCustomer && !readonly && !hideSelectedPreview && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-blue-800">
                            <span className="font-semibold text-blue-900">
                                {selectedCustomer.display_name}
                            </span>
                            {selectedCustomer.email && (
                                <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {selectedCustomer.email}
                                </span>
                            )}
                            {selectedCustomer.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {selectedCustomer.phone}
                                </span>
                            )}
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
                                onChange={(e) => {
                                    setNewCustomer({ ...newCustomer, display_name: e.target.value });
                                    if (createFieldErrors.display_name) {
                                        setCreateFieldErrors((prev) => ({ ...prev, display_name: undefined }));
                                    }
                                }}
                                startContent={<User className="w-4 h-4" />}
                                isRequired
                                isInvalid={!!createFieldErrors.display_name}
                                errorMessage={createFieldErrors.display_name}
                            />

                            {/* Email */}
                            <Input
                                type="email"
                                label="Email"
                                placeholder="customer@example.com"
                                value={newCustomer.email}
                                onChange={(e) => {
                                    setNewCustomer({ ...newCustomer, email: e.target.value });
                                    if (createFieldErrors.email) {
                                        setCreateFieldErrors((prev) => ({ ...prev, email: undefined }));
                                    }
                                }}
                                startContent={<Mail className="w-4 h-4" />}
                                isInvalid={!!createFieldErrors.email}
                                errorMessage={createFieldErrors.email}
                            />

                            {/* Phone */}
                            <Input
                                type="tel"
                                label="Phone"
                                placeholder="+91 XXXXX XXXXX"
                                value={newCustomer.phone}
                                onChange={(e) => {
                                    setNewCustomer({ ...newCustomer, phone: e.target.value });
                                    if (createFieldErrors.phone) {
                                        setCreateFieldErrors((prev) => ({ ...prev, phone: undefined }));
                                    }
                                }}
                                startContent={<Phone className="w-4 h-4" />}
                                isInvalid={!!createFieldErrors.phone}
                                errorMessage={createFieldErrors.phone}
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
