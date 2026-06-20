/**
 * Services Management Feature Component
 * Mobile-first responsive with card/table view
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    Clock,
    X,
    Briefcase,
} from 'lucide-react';
import {
    Button,
    Select,
    SelectItem,
    useDisclosure,
    Pagination,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { ListPageLayout, StatusBadge, SearchInput, ResponsiveTable, MobileCard, ConfirmModal, DetailModal, LinkButton, ServiceThumbnail } from '@/components/ui';
import {
    useGetServicesQuery,
    useGetServiceQuery,
    useDeleteServiceMutation,
    useGetCategoriesQuery,
} from '@/redux/services/api';
import { formatCurrency } from '@/utils/dateFormatters';

export default function ServiceList() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedService, setSelectedService] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

    const { data, isLoading, refetch } = useGetServicesQuery();
    const { data: categories } = useGetCategoriesQuery({ type: 'SERVICE' });
    const { data: detailService, isLoading: isDetailLoading } = useGetServiceQuery(
        selectedService?.id,
        { skip: !selectedService?.id || !isDetailOpen }
    );

    const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

    const categoryOptions = [
        { value: '', label: 'All Categories' },
        ...(categories || []).map(cat => ({ value: cat.name, label: cat.name }))
    ];

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

    const getDisplayPrice = (service) =>
        service?.selling_price ?? service?.price;

    const columns = [
        {
            key: 'name',
            label: 'Service',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <ServiceThumbnail src={row.image_url} alt={row.name} size="sm" />
                    <div>
                        <p className="font-medium text-gray-900">{row.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{row.description}</p>
                    </div>
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
                <span className="text-gray-900">
                    {getDisplayPrice(row)
                        ? formatCurrency(getDisplayPrice(row))
                        : 'N/A'}
                </span>
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
        <ListPageLayout
            title="Services"
            breadcrumbs={[{ label: 'Services' }]}
            actions={
                <div className="flex gap-2">
                    <LinkButton
                        href="/services/categories"
                        variant="flat"
                        size="sm"
                        startContent={<Briefcase className="w-4 h-4" />}
                        className="hidden sm:flex"
                    >
                        Categories
                    </LinkButton>
                    <Button
                        color="primary"
                        size="sm"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={handleAdd}
                        className="w-full sm:w-auto"
                    >
                        <span className="hidden sm:inline">Add Service</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                </div>
            }
            toolbar={(
                <>
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
                            {categoryOptions.map((option) => (
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
                </>
            )}
        >
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
            {
                totalPages > 1 && (
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
                )
            }

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
                        {isDetailLoading ? (
                            <p className="text-sm text-gray-500">Loading details...</p>
                        ) : (
                            <>
                                <div className="flex items-start gap-3">
                                    <ServiceThumbnail
                                        src={detailService?.image_url || selectedService.image_url}
                                        alt={selectedService.name}
                                        size="md"
                                    />
                                    <div>
                                        <h3 className="text-base md:text-lg font-semibold">{selectedService.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{selectedService.category || 'Uncategorized'}</p>
                                    </div>
                                    <StatusBadge
                                        status={selectedService.is_active !== false ? 'active' : 'inactive'}
                                        className="ml-auto"
                                    />
                                </div>

                                {(detailService?.description || selectedService.description) && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <span className="block text-xs text-gray-500 mb-1">Description</span>
                                        <p className="text-sm text-gray-900">
                                            {detailService?.description || selectedService.description}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Selling price</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {getDisplayPrice(detailService || selectedService)
                                                ? formatCurrency(getDisplayPrice(detailService || selectedService))
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Duration</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedService.duration ? `${selectedService.duration} min` : 'N/A'}
                                        </p>
                                    </div>
                                    {detailService?.base_price != null && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Base price</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatCurrency(detailService.base_price)}
                                            </p>
                                        </div>
                                    )}
                                    {detailService?.total_amount != null && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Total amount</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatCurrency(detailService.total_amount)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {detailService?.fees?.length > 0 && (
                                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                                        <span className="block text-xs text-gray-500">Additional charges</span>
                                        {detailService.fees.map((fee, index) => (
                                            <div key={`${fee.name}-${index}`} className="flex justify-between text-sm">
                                                <span className="text-gray-700">{fee.name}</span>
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(fee.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {detailService?.content_blocks?.length > 0 && (
                                    <div className="space-y-3">
                                        {[...detailService.content_blocks]
                                            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                                            .map((block, index) => (
                                                <div key={`${block.title}-${index}`} className="p-3 bg-gray-50 rounded-lg">
                                                    <span className="block text-xs text-gray-500 mb-1">{block.title}</span>
                                                    {block.type === 'list' ? (
                                                        <ul className="list-disc list-inside text-sm text-gray-900 space-y-1">
                                                            {(block.items || []).map((item, itemIndex) => (
                                                                <li key={`${item}-${itemIndex}`}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                                            {block.body}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </>
                        )}
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
        </ListPageLayout>
    );
}

// Service Mobile Card Component
function ServiceMobileCard({ service, onClick, actions }) {
    const displayPrice = service.selling_price ?? service.price;

    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <ServiceThumbnail src={service.image_url} alt={service.name} size="sm" />
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{service.name}</MobileCard.Title>
                    <MobileCard.Subtitle className="capitalize">{service.category || 'Uncategorized'}</MobileCard.Subtitle>
                </div>
                <StatusBadge
                    status={service.is_active !== false ? 'active' : 'inactive'}
                />
            </MobileCard.Header>
            <MobileCard.Meta>
                <span>
                    {displayPrice ? formatCurrency(displayPrice) : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {service.duration ? `${service.duration} min` : 'N/A'}
                </span>
            </MobileCard.Meta>
        </MobileCard>
    );
}
