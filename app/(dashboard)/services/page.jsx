/**
 * Services Management Page
 * Mobile-first responsive with card/table view
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    DollarSign,
    Clock,
    X,
    Briefcase,
    IndianRupee,
} from 'lucide-react';
import {
    Button,
    Input,
    Select,
    SelectItem,
    useDisclosure,
    Textarea,
    Switch,
    Pagination,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { PageHeader, StatusBadge, Card, SearchInput, ResponsiveTable, MobileCard, ConfirmModal, FormModal, DetailModal } from '@/components/ui';
import {
    useGetServicesQuery,
    useCreateServiceMutation,
    useUpdateServiceMutation,
    useDeleteServiceMutation,
} from '@/redux/services/api';
import { motion } from 'framer-motion';

const INITIAL_FORM = {
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    is_active: true,
};

const CATEGORY_OPTIONS = [
    { value: '', label: 'All Categories' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'therapy', label: 'Therapy' },
];

export default function ServicesPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedService, setSelectedService] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

    const { data, isLoading, refetch } = useGetServicesQuery();

    const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, categoryFilter]);

    // Client-side filtering since backend returns all services
    const allServices = data?.services || data || [];
    const filteredServices = allServices.filter(service => {
        const matchesSearch = !search ||
            service.name?.toLowerCase().includes(search.toLowerCase()) ||
            service.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !categoryFilter || service.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Pagination
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const services = filteredServices.slice(startIndex, startIndex + itemsPerPage);

    const columns = [
        {
            key: 'name',
            label: 'Service',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{row.description}</p>
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Category',
            render: (row) => (
                <span className="capitalize text-gray-600">{row.category || 'N/A'}</span>
            ),
        },
        {
            key: 'price',
            label: 'Price',
            render: (row) => (
                <div className="flex items-center gap-1 text-gray-900">
                    <IndianRupee className="w-4 h-4" />
                    <span>{row.price || 'N/A'}</span>
                </div>
            ),
        },
        {
            key: 'duration',
            label: 'Duration',
            render: (row) => (
                <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{row.duration ? `${row.duration} min` : 'N/A'}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <StatusBadge
                    status={row.is_active !== false ? 'active' : 'inactive'}
                />
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => handleViewDetails(row)}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => handleEdit(row)}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        color="danger"
                        onPress={() => handleDeleteClick(row)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const handleViewDetails = (service) => {
        setSelectedService(service);
        onDetailOpen();
    };

    const handleAdd = () => {
        router.push('/services/new');
    };

    const handleEdit = (service) => {
        router.push(`/services/${service.id}/edit`);
    };

    const handleFormSubmit = async () => {
        try {
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} service`);
        }
    };

    const handleDeleteClick = (service) => {
        setSelectedService(service);
        onDeleteOpen();
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteService(selectedService.id).unwrap();
            toast.success('Service deleted successfully');
            onDeleteOpenChange(false);
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to delete service');
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Services"
                description="Manage available services and pricing"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Services' },
                ]}
                actions={
                    <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={handleAdd}
                        className="w-full sm:w-auto"
                    >
                        <span className="hidden sm:inline">Add Service</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                }
            />

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search services..."
                    fullWidth
                    className="flex-1"
                />
                <div className="flex gap-2">
                    <Select
                        placeholder="Category"
                        selectedKeys={categoryFilter ? [categoryFilter] : []}
                        onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] || '')}
                        className="w-full sm:w-40"
                        size="sm"
                        classNames={{
                            trigger: 'bg-white',
                        }}
                    >
                        {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </Select>

                    {(search || categoryFilter) && (
                        <Button
                            variant="flat"
                            size="sm"
                            isIconOnly
                            className="sm:hidden"
                            onPress={() => {
                                setSearch('');
                                setCategoryFilter('');
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}

                    <Button
                        variant="flat"
                        size="sm"
                        className="hidden sm:flex"
                        onPress={() => {
                            setSearch('');
                            setCategoryFilter('');
                        }}
                        isDisabled={!search && !categoryFilter}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                    Showing {filteredServices.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredServices.length)} of {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Responsive Table/Cards */}
            <ResponsiveTable
                columns={columns}
                data={services}
                isLoading={isLoading}
                emptyState={{
                    icon: 'file',
                    title: 'No services found',
                    description: search || categoryFilter ? 'Try adjusting your filters' : 'Add your first service to get started',
                    actionLabel: 'Add Service',
                    onAction: handleAdd,
                }}
                actions={[
                    {
                        label: 'View Details',
                        icon: <Eye className="w-4 h-4" />,
                        onClick: handleViewDetails,
                    },
                    {
                        label: 'Edit',
                        icon: <Edit className="w-4 h-4" />,
                        onClick: handleEdit,
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="w-4 h-4" />,
                        color: 'danger',
                        onClick: handleDeleteClick,
                    },
                ]}
                renderMobileCard={(service, { onClick, actions }) => (
                    <ServiceMobileCard
                        service={service}
                        onClick={() => handleViewDetails(service)}
                        actions={actions}
                    />
                )}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        total={totalPages}
                        page={currentPage}
                        onChange={(page) => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        showControls
                        classNames={{
                            wrapper: "gap-2",
                            item: "w-8 h-8 text-sm",
                        }}
                    />
                </div>
            )}

            {/* Add/Edit Modal - REMOVED, using dedicated pages now */}

            {/* Detail Modal */}
            <DetailModal
                isOpen={isDetailOpen}
                onOpenChange={onDetailOpenChange}
                title="Service Details"
                actions={
                    <Button
                        color="primary"
                        startContent={<Edit className="w-4 h-4" />}
                        onPress={() => {
                            onDetailOpenChange(false);
                            handleEdit(selectedService);
                        }}
                        className="w-full sm:w-auto"
                    >
                        Edit
                    </Button>
                }
            >
                {selectedService && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                                <Briefcase className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-semibold">{selectedService.name}</h3>
                                <p className="text-sm text-gray-500 capitalize">{selectedService.category || 'Uncategorized'}</p>
                            </div>
                            <StatusBadge
                                status={selectedService.is_active !== false ? 'active' : 'inactive'}
                                className="ml-auto"
                            />
                        </div>

                        {selectedService.description && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-xs text-gray-500 mb-1">Description</span>
                                <p className="text-sm text-gray-900">{selectedService.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Price</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedService.price ? `$${selectedService.price}` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Duration</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {selectedService.duration ? `${selectedService.duration} min` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DetailModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => onDeleteOpenChange(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Service"
                message={`Are you sure you want to delete "${selectedService?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}

// Service Mobile Card Component
function ServiceMobileCard({ service, onClick, actions }) {
    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{service.name}</MobileCard.Title>
                    <MobileCard.Subtitle className="capitalize">{service.category || 'Uncategorized'}</MobileCard.Subtitle>
                </div>
                <StatusBadge
                    status={service.is_active !== false ? 'active' : 'inactive'}
                />
            </MobileCard.Header>
            <MobileCard.Meta>
                <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    {service.price ? `$${service.price}` : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {service.duration ? `${service.duration} min` : 'N/A'}
                </span>
            </MobileCard.Meta>
        </MobileCard>
    );
}
