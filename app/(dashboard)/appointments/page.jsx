/**
 * Appointments Management Page
 * Mobile-first responsive design with full CRUD and RBAC
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import {
    Calendar,
    Download,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Filter,
    X,
    ChevronDown,
    Phone,
    Mail,
    User,
    MoreVertical,
    FileText,
    Plus,
} from 'lucide-react';
import {
    Button,
    Input,
    Select,
    SelectItem,
    useDisclosure,
    Textarea,
    Chip,
    Card as HeroCard,
    CardBody,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Spinner,
    Pagination,
    Divider,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { PageHeader, DataTable, StatusBadge, Card, FormModal, DetailModal, DetailRow, DetailGrid, ConfirmModal } from '@/components/ui';
import {
    useGetAppointmentsQuery,
    useCreateAppointmentMutation,
    useUpdateAppointmentMutation,
    useDeleteAppointmentMutation,
    useGetServicesQuery,
    useGetDoctorsQuery,
} from '@/redux/services/api';
import { formatDate, formatTime } from '@/utils/dateFormatters';
import { hasPermission, hasAnyPermission, PERMISSIONS } from '@/utils/permissions';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' },
];

const STATUS_COLORS = {
    pending: 'warning',
    confirmed: 'primary',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'default',
};

export default function AppointmentsPage() {
    const router = useRouter();
    const { user } = useSelector((state) => state.auth);
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        date_from: '',
        date_to: '',
    });

    // Modal states
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
    const { isOpen: isCancelOpen, onOpen: onCancelOpen, onOpenChange: onCancelOpenChange } = useDisclosure();
    const { isOpen: isStatusOpen, onOpen: onStatusOpen, onOpenChange: onStatusOpenChange } = useDisclosure();

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [cancelReason, setCancelReason] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [createForm, setCreateForm] = useState({
        patient_name: '',
        patient_email: '',
        patient_phone: '',
        service_id: '',
        doctor_id: '',
        preferred_date: '',
        preferred_time: '',
        special_notes: '',
    });

    // API hooks
    const { data, isLoading, refetch, isFetching } = useGetAppointmentsQuery({
        page,
        size: 10,
        status: filters.status || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
    });

    const { data: servicesData } = useGetServicesQuery();
    const { data: doctorsData } = useGetDoctorsQuery();

    const [createAppointment, { isLoading: isCreating }] = useCreateAppointmentMutation();
    const [updateAppointment, { isLoading: isUpdating }] = useUpdateAppointmentMutation();
    const [deleteAppointment, { isLoading: isDeleting }] = useDeleteAppointmentMutation();

    const services = servicesData?.services || servicesData || [];
    const doctors = doctorsData?.doctors || doctorsData || [];
    const appointments = data?.appointments || [];
    const totalPages = data?.total_pages || 1;
    const totalCount = data?.total || 0;

    // Permission checks
    const canCreate = hasAnyPermission(user, [PERMISSIONS.APPOINTMENT_CREATE, PERMISSIONS.APPOINTMENT_UPDATE_ANY]);
    const canView = hasAnyPermission(user, [PERMISSIONS.APPOINTMENT_READ_ANY, PERMISSIONS.APPOINTMENT_READ_OWN]);
    const canEdit = hasAnyPermission(user, [PERMISSIONS.APPOINTMENT_UPDATE_ANY, PERMISSIONS.APPOINTMENT_UPDATE_OWN]);
    const canDelete = hasAnyPermission(user, [PERMISSIONS.APPOINTMENT_DELETE_ANY, PERMISSIONS.APPOINTMENT_CANCEL]);
    const canChangeStatus = hasAnyPermission(user, [PERMISSIONS.APPOINTMENT_APPROVE, PERMISSIONS.APPOINTMENT_UPDATE_ANY]);
    const canGenerateInvoice = hasAnyPermission(user, [PERMISSIONS.INVOICE_CREATE, PERMISSIONS.INVOICE_READ_ANY]);

    // Generate Invoice handler
    const handleGenerateInvoice = (appointment) => {
        router.push(`/finance/invoices/new?appointment_id=${appointment.id}`);
    };

    // View Invoice handler
    const handleViewInvoice = (appointment) => {
        if (appointment.invoice_id) {
            router.push(`/finance/invoices/${appointment.invoice_id}`);
        }
    };

    // Row click handler for table
    const handleRowClick = (row) => {
        if (row.status === 'invoiced' && row.invoice_id) {
            handleViewInvoice(row);
        }
    };

    // Table columns with permission-based actions
    const columns = [
        {
            key: 'patient',
            label: 'Patient',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">
                        {row.patient_info?.full_name || row.user?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {row.patient_info?.email || row.user?.email}
                    </p>
                </div>
            ),
        },
        {
            key: 'service',
            label: 'Service',
            render: (row) => (
                <span className="text-gray-900">
                    {row.service_name || row.service?.name || 'N/A'}
                </span>
            ),
        },
        {
            key: 'date',
            label: 'Date & Time',
            sortable: true,
            render: (row) => (
                <div>
                    <p className="text-gray-900">{formatDate(row.appointment_date || row.preferred_date)}</p>
                    <p className="text-sm text-gray-500">{formatTime(row.appointment_time || row.preferred_time)}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <Chip
                    size="sm"
                    color={STATUS_COLORS[row.status] || 'default'}
                    variant="flat"
                    className={`capitalize ${(canChangeStatus || (row.status === 'invoiced' && row.invoice_id)) ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                        if (row.status === 'invoiced' && row.invoice_id) {
                            handleViewInvoice(row);
                        } else if (canChangeStatus) {
                            handleStatusClick(row);
                        }
                    }}
                >
                    {row.status?.replace('_', ' ')}
                </Chip>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <div className="flex items-center gap-1">
                    {canView && (
                        <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => handleViewDetails(row)}
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                    )}
                    {canEdit && (
                        <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => handleEditClick(row)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
                    {canGenerateInvoice && row.status === 'completed' && (
                        <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            isIconOnly
                            onPress={() => handleGenerateInvoice(row)}
                            title="Generate Invoice"
                        >
                            <FileText className="w-4 h-4" />
                        </Button>
                    )}
                    {canChangeStatus && row.status === 'pending' && (
                        <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            isIconOnly
                            onPress={() => handleQuickStatus(row.id, 'confirmed')}
                            isLoading={isUpdating}
                        >
                            <CheckCircle className="w-4 h-4" />
                        </Button>
                    )}
                    {canDelete && row.status !== 'cancelled' && (
                        <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            isIconOnly
                            onPress={() => handleCancelClick(row)}
                        >
                            <XCircle className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    // Handlers
    const handleCreateClick = () => {
        setCreateForm({
            patient_name: '',
            patient_email: '',
            patient_phone: '',
            service_id: '',
            doctor_id: '',
            preferred_date: '',
            preferred_time: '',
            special_notes: '',
        });
        onCreateOpen();
    };

    const handleCreateSubmit = async () => {
        if (!createForm.patient_name || !createForm.patient_email || !createForm.preferred_date || !createForm.preferred_time) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await createAppointment({
                patient_info: {
                    full_name: createForm.patient_name,
                    email: createForm.patient_email,
                    phone: createForm.patient_phone,
                },
                service_id: createForm.service_id || undefined,
                doctor_id: createForm.doctor_id || undefined,
                preferred_date: createForm.preferred_date,
                preferred_time: createForm.preferred_time,
                special_notes: createForm.special_notes,
            }).unwrap();
            toast.success('Appointment created successfully');
            onCreateOpenChange(false);
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to create appointment');
        }
    };

    const handleViewDetails = (appointment) => {
        setSelectedAppointment(appointment);
        onDetailOpen();
    };

    const handleEditClick = (appointment) => {
        setSelectedAppointment(appointment);
        setEditForm({
            preferred_date: appointment.preferred_date || appointment.appointment_date || '',
            preferred_time: appointment.preferred_time || appointment.appointment_time || '',
            special_notes: appointment.special_notes || '',
        });
        onEditOpen();
    };

    const handleEditSubmit = async () => {
        if (!selectedAppointment) return;
        try {
            await updateAppointment({
                id: selectedAppointment.id,
                ...editForm,
            }).unwrap();
            toast.success('Appointment updated successfully');
            onEditOpenChange(false);
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to update appointment');
        }
    };

    const handleQuickStatus = async (id, status) => {
        try {
            await updateAppointment({ id, status }).unwrap();
            toast.success(`Appointment ${status}`);
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to update status');
        }
    };

    const handleStatusClick = (appointment) => {
        setSelectedAppointment(appointment);
        setNewStatus(appointment.status);
        onStatusOpen();
    };

    const handleStatusChange = async () => {
        if (!selectedAppointment || !newStatus) return;
        try {
            await updateAppointment({
                id: selectedAppointment.id,
                status: newStatus,
            }).unwrap();
            toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
            onStatusOpenChange(false);
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to update status');
        }
    };

    const handleCancelClick = (appointment) => {
        setSelectedAppointment(appointment);
        setCancelReason('');
        onCancelOpen();
    };

    const handleCancelConfirm = async () => {
        if (!selectedAppointment) return;

        try {
            await deleteAppointment({
                id: selectedAppointment.id,
                reason: cancelReason
            }).unwrap();
            toast.success('Appointment cancelled');
            onCancelOpenChange(false);
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to cancel appointment');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({ status: '', date_from: '', date_to: '' });
        setPage(1);
    };

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalCount} total appointments
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {canCreate && (
                        <Button
                            color="primary"
                            size="sm"
                            startContent={<Plus className="w-4 h-4" />}
                            onPress={handleCreateClick}
                        >
                            <span className="hidden sm:inline">Add Appointment</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    )}
                    <Button
                        variant="flat"
                        size="sm"
                        startContent={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
                        onPress={() => refetch()}
                        isDisabled={isFetching}
                    >
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button
                        variant="flat"
                        size="sm"
                        startContent={<Download className="w-4 h-4" />}
                    >
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="sm:hidden">
                <Button
                    variant="flat"
                    fullWidth
                    startContent={<Filter className="w-4 h-4" />}
                    endContent={
                        activeFiltersCount > 0 && (
                            <Chip size="sm" color="primary">{activeFiltersCount}</Chip>
                        )
                    }
                    onPress={() => setShowFilters(!showFilters)}
                >
                    Filters
                </Button>
            </div>

            {/* Filters */}
            <Card padding="md" className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select
                        label="Status"
                        labelPlacement="outside"
                        placeholder="All Statuses"
                        selectedKeys={filters.status ? [filters.status] : []}
                        onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                        size="sm"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </Select>
                    <Input
                        type="date"
                        label="From Date"
                        labelPlacement="outside"
                        placeholder=" "
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        size="sm"
                    />
                    <Input
                        type="date"
                        label="To Date"
                        labelPlacement="outside"
                        placeholder=" "
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        size="sm"
                    />
                    <div className="flex items-end">
                        <Button
                            variant="light"
                            size="sm"
                            startContent={<X className="w-4 h-4" />}
                            onPress={clearFilters}
                            isDisabled={activeFiltersCount === 0}
                            className="w-full sm:w-auto"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
                <Card padding="none">
                    <DataTable
                        columns={columns}
                        data={appointments}
                        isLoading={isLoading}
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        emptyMessage="No appointments found"
                        onRowClick={handleRowClick}
                        rowClassName={(row) => row.status === 'invoiced' && row.invoice_id ? 'cursor-pointer hover:bg-gray-50' : ''}
                    />
                </Card>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size="lg" color="primary" />
                    </div>
                ) : appointments.length === 0 ? (
                    <Card padding="md">
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No appointments found</p>
                        </div>
                    </Card>
                ) : (
                    <>
                        {appointments.map((apt) => (
                            <AppointmentCard
                                key={apt.id}
                                appointment={apt}
                                onView={() => handleViewDetails(apt)}
                                onEdit={() => handleEditClick(apt)}
                                onCancel={() => handleCancelClick(apt)}
                                onStatusChange={() => handleStatusClick(apt)}
                                onQuickConfirm={() => handleQuickStatus(apt.id, 'confirmed')}
                                onGenerateInvoice={() => handleGenerateInvoice(apt)}
                                canView={canView}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                canChangeStatus={canChangeStatus}
                                canGenerateInvoice={canGenerateInvoice}
                            />
                        ))}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-4">
                                <Pagination
                                    total={totalPages}
                                    page={page}
                                    onChange={setPage}
                                    color="primary"
                                    showControls
                                    size="sm"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Appointment Modal */}
            <FormModal
                isOpen={isCreateOpen}
                onOpenChange={onCreateOpenChange}
                onSubmit={handleCreateSubmit}
                title="Add Appointment"
                submitLabel="Create Appointment"
                isLoading={isCreating}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Patient Name"
                            labelPlacement="outside"
                            placeholder="Enter patient name"
                            value={createForm.patient_name}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, patient_name: e.target.value }))}
                            isRequired
                        />
                        <Input
                            label="Patient Email"
                            labelPlacement="outside"
                            type="email"
                            placeholder="Enter email"
                            value={createForm.patient_email}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, patient_email: e.target.value }))}
                            isRequired
                        />
                    </div>
                    <Input
                        label="Phone Number"
                        labelPlacement="outside"
                        placeholder="Enter phone number"
                        value={createForm.patient_phone}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, patient_phone: e.target.value }))}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="Service"
                            labelPlacement="outside"
                            placeholder="Select service"
                            selectedKeys={createForm.service_id ? [createForm.service_id] : []}
                            onSelectionChange={(keys) => setCreateForm((prev) => ({ ...prev, service_id: Array.from(keys)[0] || '' }))}
                        >
                            {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                    {service.name}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="Doctor"
                            labelPlacement="outside"
                            placeholder="Select doctor"
                            selectedKeys={createForm.doctor_id ? [createForm.doctor_id] : []}
                            onSelectionChange={(keys) => setCreateForm((prev) => ({ ...prev, doctor_id: Array.from(keys)[0] || '' }))}
                        >
                            {doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                    {doctor.name}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Preferred Date"
                            labelPlacement="outside"
                            value={createForm.preferred_date}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, preferred_date: e.target.value }))}
                            isRequired
                        />
                        <Input
                            type="time"
                            label="Preferred Time"
                            labelPlacement="outside"
                            value={createForm.preferred_time}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, preferred_time: e.target.value }))}
                            isRequired
                        />
                    </div>
                    <Textarea
                        label="Special Notes"
                        labelPlacement="outside"
                        placeholder="Any special instructions..."
                        value={createForm.special_notes}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, special_notes: e.target.value }))}
                    />
                </div>
            </FormModal>

            {/* Detail Modal */}
            <DetailModal
                isOpen={isDetailOpen}
                onOpenChange={onDetailOpenChange}
                title={
                    <div className="flex items-center gap-3">
                        <span>Appointment Details</span>
                        {selectedAppointment && (
                            <Chip
                                size="sm"
                                color={STATUS_COLORS[selectedAppointment.status] || 'default'}
                                variant="flat"
                                className="capitalize"
                            >
                                {selectedAppointment.status?.replace('_', ' ')}
                            </Chip>
                        )}
                    </div>
                }
            >
                {selectedAppointment && (
                    <div className="space-y-6">
                        {/* Patient Info */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Patient Information
                            </h4>
                            <div className="space-y-3">
                                <DetailRow
                                    icon={<User className="w-4 h-4" />}
                                    label="Name"
                                    value={selectedAppointment.patient_info?.full_name || selectedAppointment.user?.name}
                                />
                                <DetailRow
                                    icon={<Mail className="w-4 h-4" />}
                                    label="Email"
                                    value={selectedAppointment.patient_info?.email || selectedAppointment.user?.email}
                                />
                                {selectedAppointment.patient_info?.phone && (
                                    <DetailRow
                                        icon={<Phone className="w-4 h-4" />}
                                        label="Phone"
                                        value={selectedAppointment.patient_info.phone}
                                    />
                                )}
                            </div>
                        </div>

                        <Divider />

                        {/* Appointment Info */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Appointment Details
                            </h4>
                            <div className="space-y-3">
                                <DetailRow
                                    icon={<Calendar className="w-4 h-4" />}
                                    label="Date"
                                    value={formatDate(selectedAppointment.appointment_date || selectedAppointment.preferred_date)}
                                />
                                <DetailRow
                                    icon={<Clock className="w-4 h-4" />}
                                    label="Time"
                                    value={formatTime(selectedAppointment.appointment_time || selectedAppointment.preferred_time)}
                                />
                                <DetailRow
                                    label="Service"
                                    value={selectedAppointment.service_name || selectedAppointment.service?.name}
                                />
                                {selectedAppointment.doctor?.name && (
                                    <DetailRow label="Doctor" value={selectedAppointment.doctor.name} />
                                )}
                            </div>
                        </div>

                        {selectedAppointment.special_notes && (
                            <>
                                <Divider />
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Special Notes
                                    </h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        {selectedAppointment.special_notes}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </DetailModal>

            {/* Edit Modal */}
            <FormModal
                isOpen={isEditOpen}
                onOpenChange={onEditOpenChange}
                onSubmit={handleEditSubmit}
                title="Edit Appointment"
                submitLabel="Save Changes"
                isLoading={isUpdating}
            >
                <div className="space-y-4">
                    <Input
                        type="date"
                        label="Preferred Date"
                        labelPlacement="outside"
                        value={editForm.preferred_date}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, preferred_date: e.target.value }))}
                    />
                    <Input
                        type="time"
                        label="Preferred Time"
                        labelPlacement="outside"
                        value={editForm.preferred_time}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, preferred_time: e.target.value }))}
                    />
                    <Textarea
                        label="Special Notes"
                        labelPlacement="outside"
                        placeholder="Any special instructions..."
                        value={editForm.special_notes}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, special_notes: e.target.value }))}
                    />
                </div>
            </FormModal>

            {/* Cancel Modal */}
            <FormModal
                isOpen={isCancelOpen}
                onOpenChange={onCancelOpenChange}
                onSubmit={handleCancelConfirm}
                title="Cancel Appointment"
                submitLabel="Confirm Cancellation"
                submitColor="danger"
                isLoading={isDeleting}
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to cancel this appointment for{' '}
                        <strong>{selectedAppointment?.patient_info?.full_name || selectedAppointment?.user?.name}</strong>?
                    </p>
                    <Textarea
                        label="Cancellation Reason"
                        labelPlacement="outside"
                        placeholder="Enter reason for cancellation..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                </div>
            </FormModal>

            {/* Status Change Modal */}
            <FormModal
                isOpen={isStatusOpen}
                onOpenChange={onStatusOpenChange}
                onSubmit={handleStatusChange}
                title="Change Status"
                submitLabel="Update Status"
                isLoading={isUpdating}
                size="md"
            >
                <Select
                    label="New Status"
                    labelPlacement="outside"
                    selectedKeys={newStatus ? [newStatus] : []}
                    onSelectionChange={(keys) => setNewStatus(Array.from(keys)[0])}
                >
                    <SelectItem key="pending" value="pending">Pending</SelectItem>
                    <SelectItem key="confirmed" value="confirmed">Confirmed</SelectItem>
                    <SelectItem key="completed" value="completed">Completed</SelectItem>
                    <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
                    <SelectItem key="no_show" value="no_show">No Show</SelectItem>
                </Select>
            </FormModal>
        </div>
    );
}

// Mobile Appointment Card Component
function AppointmentCard({
    appointment,
    onView,
    onEdit,
    onCancel,
    onStatusChange,
    onQuickConfirm,
    onGenerateInvoice,
    canView,
    canEdit,
    canDelete,
    canChangeStatus,
    canGenerateInvoice,
}) {
    const apt = appointment;

    return (
        <HeroCard className="overflow-hidden">
            <CardBody className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">
                                {apt.patient_info?.full_name || apt.user?.name || 'N/A'}
                            </h3>
                            <Chip
                                size="sm"
                                color={STATUS_COLORS[apt.status] || 'default'}
                                variant="flat"
                                className="capitalize"
                            >
                                {apt.status?.replace('_', ' ')}
                            </Chip>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                            {apt.patient_info?.email || apt.user?.email}
                        </p>
                    </div>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="light" isIconOnly size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                            {canView && (
                                <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />} onPress={onView}>
                                    View Details
                                </DropdownItem>
                            )}
                            {canEdit && (
                                <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={onEdit}>
                                    Edit
                                </DropdownItem>
                            )}
                            {apt.status === 'invoiced' && apt.invoice_id && (
                                <DropdownItem key="view-invoice" startContent={<FileText className="w-4 h-4" />} color="primary" onPress={() => handleViewInvoice(apt)}>
                                    View Invoice
                                </DropdownItem>
                            )}
                            {canGenerateInvoice && apt.status === 'completed' && (
                                <DropdownItem key="invoice" startContent={<FileText className="w-4 h-4" />} color="primary" onPress={onGenerateInvoice}>
                                    Generate Invoice
                                </DropdownItem>
                            )}
                            {canChangeStatus && (
                                <DropdownItem key="status" startContent={<RefreshCw className="w-4 h-4" />} onPress={onStatusChange}>
                                    Change Status
                                </DropdownItem>
                            )}
                            {canChangeStatus && apt.status === 'pending' && (
                                <DropdownItem key="confirm" startContent={<CheckCircle className="w-4 h-4" />} color="success" onPress={onQuickConfirm}>
                                    Confirm
                                </DropdownItem>
                            )}
                            {canDelete && apt.status !== 'cancelled' && (
                                <DropdownItem key="cancel" startContent={<XCircle className="w-4 h-4" />} color="danger" onPress={onCancel}>
                                    Cancel Appointment
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                </div>

                <Divider className="my-3" />

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-gray-500">Service</p>
                        <p className="font-medium text-gray-900 truncate">
                            {apt.service_name || apt.service?.name || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium text-gray-900">
                            {formatDate(apt.preferred_date || apt.appointment_date)}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">
                            {formatTime(apt.preferred_time || apt.appointment_time)}
                        </p>
                    </div>
                    {apt.patient_info?.phone && (
                        <div>
                            <p className="text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{apt.patient_info.phone}</p>
                        </div>
                    )}
                </div>
            </CardBody>
        </HeroCard>
    );
}
