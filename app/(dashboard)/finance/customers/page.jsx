/**
 * Customers List Page
 * Mobile-first responsive with CRUD operations
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import {
    Contact,
    Search,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Plus,
    Building,
    User,
    Mail,
    Phone,
} from 'lucide-react';
import {
    Button,
    Select,
    SelectItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    useDisclosure,
    Chip,
    Input,
    Textarea,
    RadioGroup,
    Radio,
    Pagination,
    Avatar,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PageHeader, SearchInput, ResponsiveTable, MobileCard, ConfirmModal, FormModal, DetailModal } from '@/components/ui';
import {
    useGetCustomersQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
} from '@/redux/services/api';
import { formatDate } from '@/utils/dateFormatters';

const customerTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'business', label: 'Business' },
    { value: 'individual', label: 'Individual' },
];

export default function CustomersPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'

    const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormOpenChange, onClose: onFormClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

    const [formData, setFormData] = useState({
        customer_type: 'individual',
        salutation: '',
        first_name: '',
        last_name: '',
        company_name: '',
        display_name: '',
        email: '',
        phone: '',
        mobile: '',
        gst_number: '',
        pan_number: '',
        billing_address: '',
        shipping_address: '',
        payment_terms: 'DUE_ON_RECEIPT',
        currency: 'INR',
        notes: '',
    });

    const { data, isLoading, refetch } = useGetCustomersQuery({
        page,
        page_size: 20,
        search: search || undefined,
        customer_type: typeFilter || undefined,
    });

    const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
    const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

    const customers = data?.items || [];
    const totalPages = data?.total_pages || 1;

    const resetForm = () => {
        setFormData({
            customer_type: 'individual',
            salutation: '',
            first_name: '',
            last_name: '',
            company_name: '',
            display_name: '',
            email: '',
            phone: '',
            mobile: '',
            gst_number: '',
            pan_number: '',
            billing_address: '',
            shipping_address: '',
            payment_terms: 'DUE_ON_RECEIPT',
            currency: 'INR',
            notes: '',
        });
    };

    const handleAddCustomer = () => {
        setFormMode('create');
        resetForm();
        onFormOpen();
    };

    const handleEditCustomer = (customer) => {
        setFormMode('edit');
        setSelectedCustomer(customer);
        setFormData({
            customer_type: customer.customer_type || 'individual',
            salutation: customer.salutation || '',
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            company_name: customer.company_name || '',
            display_name: customer.display_name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            mobile: customer.mobile || '',
            gst_number: customer.gst_number || '',
            pan_number: customer.pan_number || '',
            billing_address: customer.billing_address || '',
            shipping_address: customer.shipping_address || '',
            payment_terms: customer.payment_terms || 'DUE_ON_RECEIPT',
            currency: customer.currency || 'INR',
            notes: customer.notes || '',
        });
        onFormOpen();
    };

    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        onDetailOpen();
    };

    const handleDeleteClick = (customer) => {
        setSelectedCustomer(customer);
        onDeleteOpen();
    };

    const handleFormSubmit = async () => {
        if (!formData.display_name?.trim()) {
            toast.error('Display name is required');
            return;
        }

        try {
            const payload = {
                ...formData,
                display_name: formData.display_name.trim(),
            };

            if (formMode === 'create') {
                await createCustomer(payload).unwrap();
                toast.success('Customer created successfully');
            } else {
                await updateCustomer({ id: selectedCustomer.id, ...payload }).unwrap();
                toast.success('Customer updated successfully');
            }
            onFormClose();
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || `Failed to ${formMode} customer`);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCustomer) return;
        try {
            await deleteCustomer(selectedCustomer.id).unwrap();
            toast.success('Customer deleted successfully');
            onDeleteClose();
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to delete customer');
        }
    };

    const columns = [
        {
            key: 'customer',
            label: 'Customer',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        name={row.display_name}
                        size="sm"
                        icon={row.customer_type === 'business' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    />
                    <div>
                        <p className="font-medium text-gray-900">{row.display_name}</p>
                        {row.company_name && <p className="text-sm text-gray-500">{row.company_name}</p>}
                    </div>
                </div>
            ),
        },
        {
            key: 'contact',
            label: 'Contact',
            render: (row) => (
                <div className="text-sm">
                    {row.email && <p className="text-gray-600">{row.email}</p>}
                    {row.phone && <p className="text-gray-500">{row.phone}</p>}
                </div>
            ),
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => (
                <Chip
                    size="sm"
                    variant="flat"
                    startContent={row.customer_type === 'business' ? <Building className="w-3 h-3" /> : <User className="w-3 h-3" />}
                >
                    {row.customer_type === 'business' ? 'Business' : 'Individual'}
                </Chip>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <Dropdown>
                    <DropdownTrigger>
                        <Button variant="light" isIconOnly size="sm">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Customer actions">
                        <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />} onPress={() => handleViewCustomer(row)}>
                            View Details
                        </DropdownItem>
                        <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => handleEditCustomer(row)}>
                            Edit Customer
                        </DropdownItem>
                        <DropdownItem key="delete" startContent={<Trash2 className="w-4 h-4" />} className="text-danger" color="danger" onPress={() => handleDeleteClick(row)}>
                            Delete Customer
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            ),
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Customers"
                description="Manage your customers and contacts"
                actions={
                    <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={handleAddCustomer}>
                        New Customer
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search customers..."
                    className="flex-1"
                />
                <div className="flex gap-2">
                    <Select
                        placeholder="Type"
                        selectedKeys={typeFilter ? [typeFilter] : []}
                        onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0] || '')}
                        className="w-full sm:w-36"
                        size="sm"
                        classNames={{ trigger: 'bg-white' }}
                    >
                        {customerTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </Select>
                    {(search || typeFilter) && (
                        <Button variant="flat" size="sm" onPress={() => { setSearch(''); setTypeFilter(''); }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500">
                {data?.total || 0} customer{data?.total !== 1 ? 's' : ''}
            </div>

            {/* Table */}
            <ResponsiveTable
                columns={columns}
                data={customers}
                isLoading={isLoading}
                emptyState={{
                    icon: 'users',
                    title: 'No customers found',
                    description: search || typeFilter ? 'Try adjusting your filters' : 'Add your first customer',
                    action: (
                        <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={handleAddCustomer}>
                            New Customer
                        </Button>
                    ),
                }}
                actions={[
                    { label: 'View Details', icon: <Eye className="w-4 h-4" />, onClick: handleViewCustomer },
                    { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: handleEditCustomer },
                    { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: handleDeleteClick, danger: true },
                ]}
                renderMobileCard={(customer, { actions }) => (
                    <CustomerMobileCard customer={customer} actions={actions} onClick={() => handleViewCustomer(customer)} />
                )}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        total={totalPages}
                        page={page}
                        onChange={setPage}
                        showControls
                        size="sm"
                    />
                </div>
            )}

            {/* Create/Edit Form Modal */}
            <FormModal
                isOpen={isFormOpen}
                onOpenChange={onFormOpenChange}
                onClose={onFormClose}
                onSubmit={handleFormSubmit}
                title={formMode === 'create' ? 'New Customer' : 'Edit Customer'}
                submitLabel={formMode === 'create' ? 'Create Customer' : 'Save Changes'}
                isLoading={isCreating || isUpdating}
                size="2xl"
            >
                <div className="space-y-6">
                    {/* Customer Type */}
                    <RadioGroup
                        label="Customer Type"
                        orientation="horizontal"
                        value={formData.customer_type}
                        onValueChange={(val) => setFormData({ ...formData, customer_type: val })}
                    >
                        <Radio value="business" description="Company or organization">
                            <Building className="w-4 h-4 inline mr-1" /> Business
                        </Radio>
                        <Radio value="individual" description="Individual person">
                            <User className="w-4 h-4 inline mr-1" /> Individual
                        </Radio>
                    </RadioGroup>

                    {/* Name fields */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Select
                            label="Salutation"
                            labelPlacement="outside"
                            selectedKeys={formData.salutation ? [formData.salutation] : []}
                            onSelectionChange={(keys) => setFormData({ ...formData, salutation: Array.from(keys)[0] || '' })}
                        >
                            <SelectItem key="Mr.">Mr.</SelectItem>
                            <SelectItem key="Mrs.">Mrs.</SelectItem>
                            <SelectItem key="Ms.">Ms.</SelectItem>
                            <SelectItem key="Dr.">Dr.</SelectItem>
                        </Select>
                        <Input
                            label="First Name"
                            labelPlacement="outside"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="col-span-1 sm:col-span-2"
                        />
                        <Input
                            label="Last Name"
                            labelPlacement="outside"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        />
                    </div>

                    {formData.customer_type === 'business' && (
                        <Input
                            label="Company Name"
                            labelPlacement="outside"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        />
                    )}

                    <Input
                        label="Display Name"
                        labelPlacement="outside"
                        placeholder="Name to display on invoices"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        isRequired
                        description="This name will appear on invoices and documents"
                    />

                    {/* Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                            label="Email"
                            labelPlacement="outside"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            startContent={<Mail className="w-4 h-4 text-gray-400" />}
                        />
                        <Input
                            label="Phone"
                            labelPlacement="outside"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            startContent={<Phone className="w-4 h-4 text-gray-400" />}
                        />
                    </div>

                    {/* Tax Info */}
                    {formData.customer_type === 'business' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                                label="GST Number"
                                labelPlacement="outside"
                                value={formData.gst_number}
                                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                            />
                            <Input
                                label="PAN Number"
                                labelPlacement="outside"
                                value={formData.pan_number}
                                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Address */}
                    <Textarea
                        label="Billing Address"
                        labelPlacement="outside"
                        value={formData.billing_address}
                        onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                        minRows={2}
                    />

                    <Textarea
                        label="Notes"
                        labelPlacement="outside"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        minRows={2}
                    />
                </div>
            </FormModal>

            {/* Detail Modal */}
            <DetailModal
                isOpen={isDetailOpen}
                onOpenChange={onDetailOpenChange}
                title="Customer Details"
                actions={
                    <Button
                        color="primary"
                        startContent={<Edit className="w-4 h-4" />}
                        onPress={() => { onDetailOpenChange(false); handleEditCustomer(selectedCustomer); }}
                        className="w-full sm:w-auto"
                    >
                        Edit Customer
                    </Button>
                }
            >
                {selectedCustomer && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar
                                name={selectedCustomer.display_name}
                                size="lg"
                                icon={selectedCustomer.customer_type === 'business' ? <Building className="w-6 h-6" /> : <User className="w-6 h-6" />}
                            />
                            <div>
                                <h3 className="text-lg font-semibold">{selectedCustomer.display_name}</h3>
                                {selectedCustomer.company_name && (
                                    <p className="text-gray-500">{selectedCustomer.company_name}</p>
                                )}
                                <Chip size="sm" variant="flat" className="mt-1">
                                    {selectedCustomer.customer_type === 'business' ? 'Business' : 'Individual'}
                                </Chip>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DetailRow label="Email" value={selectedCustomer.email} />
                            <DetailRow label="Phone" value={selectedCustomer.phone} />
                            <DetailRow label="GST Number" value={selectedCustomer.gst_number} />
                            <DetailRow label="PAN Number" value={selectedCustomer.pan_number} />
                        </div>

                        <DetailRow label="Billing Address" value={selectedCustomer.billing_address} />
                        <DetailRow label="Notes" value={selectedCustomer.notes} />
                    </div>
                )}
            </DetailModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                onConfirm={handleDeleteConfirm}
                title="Delete Customer"
                message={`Are you sure you want to delete "${selectedCustomer?.display_name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}

// Detail Row
function DetailRow({ label, value }) {
    return (
        <div>
            <span className="block text-sm text-gray-500 mb-1">{label}</span>
            <span className="text-gray-900">{value || 'N/A'}</span>
        </div>
    );
}

// Mobile Customer Card
function CustomerMobileCard({ customer, actions, onClick }) {
    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <Avatar
                    name={customer.display_name}
                    size="sm"
                    icon={customer.customer_type === 'business' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                />
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{customer.display_name}</MobileCard.Title>
                    <MobileCard.Subtitle>{customer.company_name || customer.email || 'No contact'}</MobileCard.Subtitle>
                </div>
                <Chip size="sm" variant="flat">
                    {customer.customer_type === 'business' ? 'Business' : 'Individual'}
                </Chip>
            </MobileCard.Header>
            <MobileCard.Meta>
                {customer.phone && <span className="text-gray-500">{customer.phone}</span>}
            </MobileCard.Meta>
        </MobileCard>
    );
}
