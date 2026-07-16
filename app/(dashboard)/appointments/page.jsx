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
    BadgeCheck,
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
    Video,
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
    Checkbox,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ListPageLayout, DataTable, StatusBadge, Card, FormModal, DetailModal, DetailRow, DetailGrid, ConfirmModal, BulkActionBar } from '@/components/ui';
import {
    useGetAppointmentsQuery,
    useCreateAppointmentMutation,
    useUpdateAppointmentMutation,
    useDeleteAppointmentMutation,
    useGetServicesQuery,
    useGetDoctorsQuery,
    useCompleteAppointmentMutation,
    useGetConsultationQuery,
    useBulkCancelAppointmentsMutation,
} from '@/redux/services/api';
import { formatDate, formatTime } from '@/utils/dateFormatters';
import {
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    PERMISSIONS,
    canReadAppointments,
    getAppointmentListScope,
} from '@/utils/permissions';
import ConsultationJoinCard from '@/components/consultation/ConsultationJoinCard';
import ConsultationJoinButton from '@/components/consultation/ConsultationJoinButton';
import { isOnlineConsultation, isToday } from '@/utils/consultationJoinWindow';
import { withUserPermissions } from '@/utils/navAccess';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema, appointmentUpdateSchema } from '@/lib/validation';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormFields';
import useBulkSelection from '@/hooks/useBulkSelection';
import useBulkDeleteAction from '@/hooks/useBulkDeleteAction';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'invoiced', label: 'Invoiced' },
];

const STATUS_COLORS = {
    pending: 'warning',
    confirmed: 'primary',
    completed: 'success',
    cancelled: 'danger',
    rescheduled: 'warning',
    invoiced: 'secondary',
};

export default function AppointmentsPage() {
    const router = useRouter();
    const { user, permissions } = useSelector((state) => state.auth);
    const authUser = withUserPermissions(user, permissions);
    const appointmentListScope = getAppointmentListScope(authUser);
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        date_from: '',
        date_to: '',
    });
    const [onlineTodayOnly, setOnlineTodayOnly] = useState(false);

    // Modal states
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
    const { isOpen: isCancelOpen, onOpen: onCancelOpen, onOpenChange: onCancelOpenChange } = useDisclosure();
    const { isOpen: isStatusOpen, onOpen: onStatusOpen, onOpenChange: onStatusOpenChange } = useDisclosure();

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [newStatus, setNewStatus] = useState('');

    const createMethods = useForm({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patient_name: '',
            patient_email: '',
            patient_phone: '',
            service_id: '',
            doctor_id: '',
            preferred_date: '',
            preferred_time: '',
            special_notes: '',
        },
    });

    const editMethods = useForm({
        resolver: zodResolver(appointmentUpdateSchema),
        defaultValues: {
            preferred_date: '',
            preferred_time: '',
            special_notes: '',
        },
    });

    const {
        reset: resetCreate,
        handleSubmit: handleCreateHookSubmit,
    } = createMethods;

    const {
        reset: resetEdit,
        handleSubmit: handleEditHookSubmit,
    } = editMethods;

    const canViewAppointments = canReadAppointments(authUser);

    // API hooks — doctors must pass scope=assigned to see booked consultations
    const { data, isLoading, refetch, isFetching } = useGetAppointmentsQuery(
        {
            page,
            page_size: 10,
            status: filters.status || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            ...(appointmentListScope ? { scope: appointmentListScope } : {}),
        },
        { skip: !canViewAppointments },
    );

    const { data: servicesData } = useGetServicesQuery();
    const { data: doctorsData } = useGetDoctorsQuery();

    const [createAppointment, { isLoading: isCreating }] = useCreateAppointmentMutation();
    const [updateAppointment, { isLoading: isUpdating }] = useUpdateAppointmentMutation();
    const [deleteAppointment, { isLoading: isDeleting }] = useDeleteAppointmentMutation();
    const [completeAppointment, { isLoading: isCompleting }] = useCompleteAppointmentMutation();

    const services = servicesData?.services || servicesData || [];
    const doctors = doctorsData?.doctors || doctorsData || [];
    const rawAppointments = data?.appointments || [];
    const pageSize = 10;

    const isDoctorUser = hasRole(authUser, ['doctor']);

    const appointments = useMemo(() => {
        let list = rawAppointments;
        if (onlineTodayOnly) {
            list = list.filter(
                (apt) =>
                    isOnlineConsultation(apt) &&
                    isToday(apt.preferred_date || apt.appointment_date)
            );
        }
        if (isDoctorUser) {
            const upcomingOnline = list.filter(
                (apt) =>
                    isOnlineConsultation(apt) &&
                    ['confirmed', 'ready', 'scheduled', 'in_progress'].includes(
                        String(apt.status).toLowerCase()
                    )
            );
            if (upcomingOnline.length > 0) {
                const pinned = upcomingOnline[0];
                list = [pinned, ...list.filter((a) => a.id !== pinned.id)];
            }
        }
        return list;
    }, [rawAppointments, onlineTodayOnly, isDoctorUser]);

    const cancellableAppointments = useMemo(
        () => appointments.filter((apt) => apt.status !== 'cancelled'),
        [appointments],
    );

    const {
        selectedIds,
        onSelectionChange,
        clearSelection,
        selectedCount,
        isSelected,
    } = useBulkSelection(cancellableAppointments, page, pageSize);
    const {
        isBulkOpen,
        onBulkOpen,
        onBulkOpenChange,
        handleBulkConfirm,
        isBulkLoading,
    } = useBulkDeleteAction(useBulkCancelAppointmentsMutation, 'appointments');

    const totalPages = data?.total_pages || 1;
    const totalCount = data?.total || 0;

    // Permission checks
    const canCreate = hasAnyPermission(authUser, [PERMISSIONS.APPOINTMENT_CREATE, PERMISSIONS.APPOINTMENT_UPDATE_ANY]);
    const canView = canViewAppointments;
    const canEdit = hasAnyPermission(authUser, [PERMISSIONS.APPOINTMENT_UPDATE_ANY, PERMISSIONS.APPOINTMENT_UPDATE_OWN]);
    const canDelete = hasAnyPermission(authUser, [PERMISSIONS.APPOINTMENT_DELETE_ANY, PERMISSIONS.APPOINTMENT_CANCEL]);
    const canChangeStatus = hasAnyPermission(authUser, [
        PERMISSIONS.APPOINTMENT_APPROVE,
        PERMISSIONS.APPOINTMENT_UPDATE_ANY,
        PERMISSIONS.APPOINTMENT_CHANGE_STATUS_ASSIGNED,
    ]);
    const canGenerateInvoice = hasAnyPermission(authUser, [PERMISSIONS.INVOICE_CREATE, PERMISSIONS.INVOICE_READ_ANY]);
    const canComplete = hasAllPermissions(authUser, [
        PERMISSIONS.APPOINTMENT_CHANGE_STATUS,
        PERMISSIONS.INVOICE_CREATE,
    ]);

    // Generate Invoice handler
    const handleGenerateInvoice = (appointment) => {
        if (appointment.invoice_id) {
            router.push(`/finance/invoices/${appointment.invoice_id}`);
            return;
        }
        router.push(`/finance/invoices/new?appointment_id=${appointment.id}`);
    };

    // View Invoice handler
    const handleViewInvoice = (appointment) => {
        if (appointment.invoice_id) {
            router.push(`/finance/invoices/${appointment.invoice_id}`);
        }
    };

    const handleComplete = async (appointment) => {
        if (appointment.invoice_id) {
            router.push(`/finance/invoices/${appointment.invoice_id}`);
            return;
        }
        try {
            const result = await completeAppointment({ id: appointment.id }).unwrap();
            toast.success('Appointment completed and draft invoice created');
            if (result?.invoice?.id) {
                router.push(`/finance/invoices/${result.invoice.id}`);
            } else {
                refetch();
            }
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to complete appointment');
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
            key: 'consultation_mode',
            label: 'Mode',
            render: (row) => {
                const mode = row.consultation_mode || 'in_person';
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={mode === 'online' ? 'secondary' : 'default'}
                        className="capitalize"
                    >
                        {mode === 'online' ? 'Online' : 'In-clinic'}
                    </Chip>
                );
            },
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
            key: 'consultation_join',
            label: 'Video',
            render: (row) =>
                isOnlineConsultation(row) ? (
                    <ConsultationJoinButton appointment={row} size="sm" />
                ) : (
                    <span className="text-gray-400 text-xs">—</span>
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
                    {canComplete && row.status === 'confirmed' && (
                        <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            isIconOnly
                            onPress={() => handleComplete(row)}
                            isLoading={isCompleting}
                            title="Complete and create invoice"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </Button>
                    )}
                    {canGenerateInvoice && row.status === 'completed' && !row.invoice_id && (
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
                            <BadgeCheck className="w-4 h-4" />
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
        resetCreate({
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

    const buildCreatePayload = (data) => {
        const nameParts = data.patient_name.trim().split(/\s+/);
        return {
            book_for_other: true,
            patient_first_name: nameParts[0],
            patient_last_name: nameParts.slice(1).join(' ') || nameParts[0],
            patient_email: data.patient_email,
            patient_phone: data.patient_phone || undefined,
            service_id: data.service_id,
            preferred_date: data.preferred_date,
            preferred_time: data.preferred_time,
            special_notes: data.special_notes || '',
            ...(data.doctor_id ? { doctor_id: data.doctor_id } : {}),
        };
    };

    const onCreateSubmit = async (data) => {
        try {
            await createAppointment(buildCreatePayload(data)).unwrap();
            toast.success('Appointment created successfully');
            onCreateOpenChange(false);
            refetch();
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to create appointment');
        }
    };

    const handleViewDetails = (appointment) => {
        setSelectedAppointment(appointment);
        onDetailOpen();
    };

    const handleEditClick = (appointment) => {
        setSelectedAppointment(appointment);
        resetEdit({
            preferred_date: appointment.preferred_date || appointment.appointment_date || '',
            preferred_time: appointment.preferred_time || appointment.appointment_time || '',
            special_notes: appointment.special_notes || '',
        });
        onEditOpen();
    };

    const onEditSubmit = async (data) => {
        if (!selectedAppointment) return;
        try {
            await updateAppointment({
                id: selectedAppointment.id,
                appointment_date: data.preferred_date,
                appointment_time: data.preferred_time,
                special_notes: data.special_notes,
            }).unwrap();
            toast.success('Appointment updated successfully');
            onEditOpenChange(false);
            refetch();
        } catch (error) {
            toast.error(error?.data?.detail || 'Failed to update appointment');
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
        setOnlineTodayOnly(false);
        setPage(1);
    };

    const activeFiltersCount =
        Object.values(filters).filter(Boolean).length + (onlineTodayOnly ? 1 : 0);

    return (
        <ListPageLayout
            title="Appointments"
            breadcrumbs={[{ label: 'Appointments' }]}
            actions={
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
            }
        >
            <div className="text-sm text-gray-500 flex flex-wrap items-center gap-3">
                <span>
                    {totalCount} total appointment{totalCount !== 1 ? 's' : ''}
                </span>
                {isDoctorUser && appointmentListScope === 'assigned' && (
                    <Chip
                        as="button"
                        type="button"
                        size="sm"
                        variant={onlineTodayOnly ? 'solid' : 'flat'}
                        color={onlineTodayOnly ? 'warning' : 'default'}
                        className="cursor-pointer"
                        startContent={<Video className="w-3.5 h-3.5" />}
                        onClick={() => {
                            const today = new Date().toISOString().slice(0, 10);
                            setOnlineTodayOnly((v) => {
                                const next = !v;
                                if (next) {
                                    setFilters((prev) => ({
                                        ...prev,
                                        date_from: today,
                                        date_to: today,
                                    }));
                                }
                                return next;
                            });
                            setPage(1);
                        }}
                    >
                        Online today
                    </Chip>
                )}
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
                    <div className="flex items-end gap-2">
                        <Button
                            variant={onlineTodayOnly ? 'solid' : 'flat'}
                            color={onlineTodayOnly ? 'warning' : 'default'}
                            size="sm"
                            className={onlineTodayOnly ? 'bg-[#db924b] text-white' : ''}
                            onPress={() => {
                                setOnlineTodayOnly((v) => !v);
                                setPage(1);
                            }}
                        >
                            Online today
                        </Button>
                        <Button
                            variant="light"
                            size="sm"
                            startContent={<X className="w-4 h-4" />}
                            onPress={clearFilters}
                            isDisabled={activeFiltersCount === 0 && !onlineTodayOnly}
                            className="w-full sm:w-auto"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Desktop — online consultation cards */}
            {appointments.some(isOnlineConsultation) && (
                <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {appointments
                        .filter(isOnlineConsultation)
                        .map((apt) => (
                            <ConsultationJoinCard
                                key={`online-${apt.id}`}
                                appointment={apt}
                                variant="compact"
                            />
                        ))}
                </div>
            )}

            <BulkActionBar
                count={selectedCount}
                onDelete={onBulkOpen}
                onClear={clearSelection}
                canDelete={canDelete}
                deleteLabel="Cancel"
            />

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
                        selectable={canDelete}
                        selectedIds={selectedIds}
                        onSelectionChange={onSelectionChange}
                        isRowSelectable={(row) => row.status !== 'cancelled'}
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
                                onComplete={() => handleComplete(apt)}
                                onViewInvoice={() => handleViewInvoice(apt)}
                                canView={canView}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                canChangeStatus={canChangeStatus}
                                canGenerateInvoice={canGenerateInvoice}
                                canComplete={canComplete}
                                selectable={canDelete}
                                isSelected={isSelected(apt.id)}
                                onSelect={() => {
                                    if (apt.status === 'cancelled') return;
                                    const sid = String(apt.id);
                                    onSelectionChange(
                                        isSelected(apt.id)
                                            ? selectedIds.filter((id) => String(id) !== sid)
                                            : [...selectedIds, apt.id],
                                    );
                                }}
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
                onSubmit={handleCreateHookSubmit(onCreateSubmit)}
                title="Add Appointment"
                submitLabel="Create Appointment"
                isLoading={isCreating}
            >
                <FormProvider {...createMethods}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput
                                name="patient_name"
                                label="Patient Name"
                                labelPlacement="outside"
                                placeholder="Enter patient name"
                                isRequired
                            />
                            <FormInput
                                name="patient_email"
                                label="Patient Email"
                                labelPlacement="outside"
                                type="email"
                                placeholder="Enter email"
                                isRequired
                            />
                        </div>
                        <FormInput
                            name="patient_phone"
                            label="Phone Number"
                            labelPlacement="outside"
                            placeholder="Enter phone number"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormSelect
                                name="service_id"
                                label="Service"
                                labelPlacement="outside"
                                placeholder="Select service"
                            >
                                {services.map((service) => (
                                    <SelectItem key={service.id} value={service.id}>
                                        {service.name}
                                    </SelectItem>
                                ))}
                            </FormSelect>
                            <FormSelect
                                name="doctor_id"
                                label="Doctor"
                                labelPlacement="outside"
                                placeholder="Select doctor"
                            >
                                {doctors.map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                        {doctor.name}
                                    </SelectItem>
                                ))}
                            </FormSelect>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput
                                name="preferred_date"
                                type="date"
                                label="Preferred Date"
                                labelPlacement="outside"
                                isRequired
                            />
                            <FormInput
                                name="preferred_time"
                                type="time"
                                label="Preferred Time"
                                labelPlacement="outside"
                                isRequired
                            />
                        </div>
                        <FormTextarea
                            name="special_notes"
                            label="Special Notes"
                            labelPlacement="outside"
                            placeholder="Any special instructions..."
                        />
                    </div>
                </FormProvider>
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
                                <DetailRow
                                    label="Consultation mode"
                                    value={
                                        selectedAppointment.consultation_mode === 'online'
                                            ? 'Online'
                                            : 'In-clinic'
                                    }
                                />
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

                        {isOnlineConsultation(selectedAppointment) && (
                            <>
                                <Divider />
                                <ConsultationJoinCardSection appointment={selectedAppointment} />
                            </>
                        )}
                    </div>
                )}
            </DetailModal>

            {/* Edit Modal */}
            <FormModal
                isOpen={isEditOpen}
                onOpenChange={onEditOpenChange}
                onSubmit={handleEditHookSubmit(onEditSubmit)}
                title="Edit Appointment"
                submitLabel="Save Changes"
                isLoading={isUpdating}
            >
                <FormProvider {...editMethods}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput
                                name="preferred_date"
                                type="date"
                                label="Preferred Date"
                                labelPlacement="outside"
                            />
                            <FormInput
                                name="preferred_time"
                                type="time"
                                label="Preferred Time"
                                labelPlacement="outside"
                            />
                        </div>
                        <FormTextarea
                            name="special_notes"
                            label="Special Notes"
                            labelPlacement="outside"
                            placeholder="Any special instructions..."
                        />
                    </div>
                </FormProvider>
            </FormModal>

            {/* Cancel Modal */}
            < FormModal
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
            </FormModal >

            <ConfirmModal
                isOpen={isBulkOpen}
                onClose={() => onBulkOpenChange(false)}
                onConfirm={() => handleBulkConfirm(selectedIds, () => {
                    clearSelection();
                    refetch();
                })}
                title={`Cancel ${selectedCount} appointments?`}
                message="Selected appointments will be cancelled. Already cancelled appointments are not selectable."
                confirmLabel="Cancel Appointments"
                type="danger"
                isLoading={isBulkLoading}
            />

            {/* Status Change Modal */}
            < FormModal
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
                    <SelectItem key="rescheduled" value="rescheduled">Rescheduled</SelectItem>
                    <SelectItem key="invoiced" value="invoiced">Invoiced</SelectItem>
                </Select>
            </FormModal>
        </ListPageLayout>
    );
}

function ConsultationJoinCardSection({ appointment }) {
    const { data: consultation } = useGetConsultationQuery(appointment.id, {
        skip: !appointment?.id,
    });

    return (
        <ConsultationJoinCard
            appointment={appointment}
            consultation={consultation}
            variant="detail"
        />
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
    onComplete,
    onViewInvoice,
    canView,
    canEdit,
    canDelete,
    canChangeStatus,
    canGenerateInvoice,
    canComplete,
    selectable = false,
    isSelected = false,
    onSelect,
}) {
    const apt = appointment;
    const canSelect = selectable && apt.status !== 'cancelled';

    return (
        <HeroCard className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
            <CardBody className="p-4">
                <div className="flex items-start justify-between gap-3">
                    {canSelect ? (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                isSelected={isSelected}
                                onValueChange={onSelect}
                                aria-label={`Select appointment ${apt.id}`}
                            />
                        </div>
                    ) : null}
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
                            {(apt.consultation_mode === 'online') && (
                                <Chip size="sm" color="secondary" variant="flat">
                                    Online
                                </Chip>
                            )}
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
                                <DropdownItem key="view-invoice" startContent={<FileText className="w-4 h-4" />} color="primary" onPress={onViewInvoice}>
                                    View Invoice
                                </DropdownItem>
                            )}
                            {canComplete && apt.status === 'confirmed' && (
                                <DropdownItem key="complete" startContent={<CheckCircle className="w-4 h-4" />} color="success" onPress={onComplete}>
                                    Complete and invoice
                                </DropdownItem>
                            )}
                            {canGenerateInvoice && apt.status === 'completed' && !apt.invoice_id && (
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
                                <DropdownItem key="confirm" startContent={<BadgeCheck className="w-4 h-4" />} color="success" onPress={onQuickConfirm}>
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

                {isOnlineConsultation(apt) && (
                    <div className="mb-3">
                        <ConsultationJoinCard appointment={apt} variant="compact" />
                    </div>
                )}

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
