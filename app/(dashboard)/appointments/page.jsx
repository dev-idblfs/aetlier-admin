/**
 * Appointments Management Page
 * Mobile-first responsive design with full CRUD and RBAC
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
    Download,
    Eye,
    Edit,
    CheckCircle,
    BadgeCheck,
    XCircle,
    RefreshCw,
    FileText,
    FileCheck,
    Plus,
    Video,
    AlertCircle,
    Copy,
} from '@/lib/icons';
import {
    Button,
    Input,
    Select,
    SelectItem,
    useDisclosure,
    Textarea,
    Chip,
} from '@/lib/heroui';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ListPageLayout, DataTable, StatusBadge, FilterBar, FormModal, ConfirmModal, BulkActionBar, Alert, EntityLink } from '@/components/ui';
import {
    useGetAppointmentsQuery,
    useUpdateAppointmentMutation,
    useDeleteAppointmentMutation,
    useGetServicesQuery,
    useGetDoctorsQuery,
    useCompleteAppointmentMutation,
    useBulkCancelAppointmentsMutation,
} from '@/redux/services/api';
import { formatDate, formatTime, formatLocalDateYmd } from '@/utils/dateFormatters';
import {
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    PERMISSIONS,
    canReadAppointments,
    getAppointmentListScope,
} from '@/utils/permissions';
import {
    isOnlineConsultation,
    isToday,
    canJoinConsultation,
    buildPatientConsultationJoinUrl,
} from '@/utils/consultationJoinWindow';
import { openConsultationWindow } from '@/utils/openConsultationWindow';
import { withUserPermissions } from '@/utils/navAccess';
import useBulkSelection from '@/hooks/useBulkSelection';
import useBulkDeleteAction from '@/hooks/useBulkDeleteAction';
import {
    STATUS_OPTIONS,
    MODE_OPTIONS,
} from '@/features/appointments/constants';
import {
    getDoctorName,
    getPatientName,
    getPaymentSummary,
    getClinicName,
    shortAppointmentId,
    escapeCsvValue,
} from '@/features/appointments/utils';
import AppointmentListCard from '@/features/appointments/components/AppointmentListCard';

export default function AppointmentsPage() {
    const router = useRouter();
    const { user, permissions } = useSelector((state) => state.auth);
    const authUser = withUserPermissions(user, permissions);
    const appointmentListScope = getAppointmentListScope(authUser);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        q: '',
        status: '',
        doctor_id: '',
        service_id: '',
        consultation_mode: '',
        date_from: '',
        date_to: '',
        sort: 'date_desc',
    });
    const debouncedQ = useDebounce(filters.q, 350);
    const [onlineTodayOnly, setOnlineTodayOnly] = useState(false);

    // Modal states
    const { isOpen: isCancelOpen, onOpen: onCancelOpen, onOpenChange: onCancelOpenChange } = useDisclosure();
    const { isOpen: isStatusOpen, onOpen: onStatusOpen, onOpenChange: onStatusOpenChange } = useDisclosure();

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [newStatus, setNewStatus] = useState('');

    const canViewAppointments = canReadAppointments(authUser);

    // API hooks — doctors must pass scope=assigned to see booked consultations
    const { data, isLoading, refetch, isFetching, isError, error } = useGetAppointmentsQuery(
        {
            page,
            page_size: 10,
            q: debouncedQ || undefined,
            status: filters.status || undefined,
            doctor_id: filters.doctor_id || undefined,
            service_id: filters.service_id || undefined,
            consultation_mode: filters.consultation_mode || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            sort: filters.sort || 'date_desc',
            ...(appointmentListScope ? { scope: appointmentListScope } : {}),
        },
        { skip: !canViewAppointments },
    );

    const canReadServices = hasAnyPermission(authUser, [PERMISSIONS.SERVICE_READ_ANY]);
    const canReadDoctors = hasAnyPermission(authUser, [PERMISSIONS.DOCTOR_READ_ANY]);
    const { data: servicesData } = useGetServicesQuery(undefined, { skip: !canReadServices });
    const { data: doctorsData } = useGetDoctorsQuery(undefined, { skip: !canReadDoctors });

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
        PERMISSIONS.APPOINTMENT_CHANGE_STATUS,
        PERMISSIONS.APPOINTMENT_CHANGE_STATUS_ASSIGNED,
    ]);
    const canGenerateInvoice = hasAnyPermission(authUser, [PERMISSIONS.INVOICE_CREATE, PERMISSIONS.INVOICE_READ_ANY]);
    const canComplete = hasAllPermissions(authUser, [
        PERMISSIONS.APPOINTMENT_CHANGE_STATUS,
        PERMISSIONS.INVOICE_CREATE,
    ]);
    const canPrescribe = hasAnyPermission(authUser, [
        PERMISSIONS.PRESCRIPTION_CREATE_OWN,
        PERMISSIONS.PRESCRIPTION_READ_ANY,
    ]);

    const handlePrescribe = (appointment) => {
        router.push(`/appointments/${appointment.id}/edit?prescribe=1`);
    };

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
        if (!window.confirm('Complete this appointment and create a draft invoice?')) return;
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

    // Row click → detail hub
    const handleRowClick = (row) => {
        if (canView) {
            router.push(`/appointments/${row.id}`);
        }
    };

    // Table columns — keep rows compact; join lives in overflow menu
    const columns = [
        {
            key: 'patient',
            label: 'Patient',
            priority: 'primary',
            render: (row) => {
                const patientId = row.user_id || row.user?.id;
                const patientName = row.patient_info?.full_name || row.user?.name || 'N/A';
                return (
                    <div>
                        <EntityLink href={patientId ? `/users/${patientId}/edit` : null}>
                            {patientName}
                        </EntityLink>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {shortAppointmentId(row.id)}
                        </p>
                    </div>
                );
            },
        },
        {
            key: 'service',
            label: 'Service',
            priority: 'secondary',
            render: (row) => (
                <span className="text-gray-900">
                    {row.service_name || row.service?.name || 'N/A'}
                </span>
            ),
        },
        {
            key: 'doctor',
            label: 'Doctor',
            priority: 'secondary',
            render: (row) => {
                const doctorId = row.doctor_id || row.doctor?.id || row.doctor_user_id;
                const doctorName = getDoctorName(row) || '—';
                return (
                    <EntityLink href={doctorId ? `/doctors/${doctorId}/edit` : null}>
                        {doctorName}
                    </EntityLink>
                );
            },
        },
        {
            key: 'consultation_mode',
            label: 'Mode',
            priority: 'secondary',
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
            key: 'appointment_date',
            label: 'Date & Time',
            sortable: true,
            priority: 'secondary',
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
            priority: 'secondary',
            render: (row) => (
                <button
                    type="button"
                    className={`${(canChangeStatus || (row.status === 'invoiced' && row.invoice_id)) ? 'cursor-pointer' : 'cursor-default'}`}
                    title="Appointment status"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (row.status === 'invoiced' && row.invoice_id) {
                            handleViewInvoice(row);
                        } else if (canChangeStatus) {
                            handleStatusClick(row);
                        }
                    }}
                >
                    <StatusBadge status={row.status} />
                </button>
            ),
        },
        {
            key: 'payment',
            label: 'Payment',
            priority: 'tertiary',
            hideBelow: 'lg',
            render: (row) => (
                <span className="text-sm text-gray-700">
                    {getPaymentSummary(row)}
                </span>
            ),
        },
        {
            key: 'clinic',
            label: 'Clinic',
            priority: 'tertiary',
            hideBelow: 'xl',
            render: (row) => (
                <span className="text-sm text-gray-600">
                    {getClinicName(row) || '—'}
                </span>
            ),
        },
    ];

    // Handlers
    const handleCreateClick = () => {
        router.push('/appointments/new');
    };

    const handleViewDetails = (appointment) => {
        router.push(`/appointments/${appointment.id}`);
    };

    const handleEditClick = (appointment) => {
        router.push(`/appointments/${appointment.id}/edit`);
    };

    const handleQuickStatus = async (id, status) => {
        try {
            await updateAppointment({ id, status }).unwrap();
            toast.success(`Appointment ${status}`);
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
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to cancel appointment');
        }
    };

    const handleJoinVideo = (appointment) => {
        const result = openConsultationWindow(appointment.id);
        if (result.mode === 'same-tab') {
            router.push(`/consultation/${appointment.id}`);
        }
    };

    const handleCopyPatientLink = async (appointment) => {
        try {
            await navigator.clipboard.writeText(
                buildPatientConsultationJoinUrl(appointment.id),
            );
            toast.success('Patient join link copied');
        } catch {
            toast.error('Could not copy link');
        }
    };

    const joinableOnline = useMemo(
        () => appointments.filter((apt) => canJoinConsultation(apt)),
        [appointments],
    );

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            q: '',
            status: '',
            doctor_id: '',
            service_id: '',
            consultation_mode: '',
            date_from: '',
            date_to: '',
            sort: 'date_desc',
        });
        setOnlineTodayOnly(false);
        setPage(1);
    };

    const activeFiltersCount =
        Object.entries(filters).filter(
            ([key, value]) => key !== 'q' && key !== 'sort' && Boolean(value),
        ).length
        + (onlineTodayOnly ? 1 : 0)
        + (filters.sort && filters.sort !== 'date_desc' ? 1 : 0);

    const handleExportCsv = () => {
        if (!appointments.length) {
            toast.error('No appointments to export');
            return;
        }
        const headers = [
            'ID',
            'Patient',
            'Email',
            'Phone',
            'Service',
            'Doctor',
            'Clinic',
            'Mode',
            'Date',
            'Time',
            'Status',
            'Invoice',
        ];
        const rows = appointments.map((apt) => [
            apt.id || '',
            apt.patient_info?.full_name || apt.user?.name || '',
            apt.patient_info?.email || apt.user?.email || '',
            apt.patient_info?.phone || '',
            apt.service_name || apt.service?.name || '',
            getDoctorName(apt) || '',
            getClinicName(apt) || '',
            apt.consultation_mode === 'online' ? 'Online' : 'In-clinic',
            apt.appointment_date || apt.preferred_date || '',
            apt.appointment_time || apt.preferred_time || '',
            apt.status || '',
            apt.invoice_number || '',
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map(escapeCsvValue).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appointments-page-${page}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Exported current page');
    };

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
                        onPress={handleExportCsv}
                        isDisabled={!appointments.length}
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
                            const today = formatLocalDateYmd();
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

            {isError && (
                <Alert
                    variant="danger"
                    title="Failed to load appointments"
                    message={error?.data?.detail || error?.message || 'An error occurred while loading appointments.'}
                    icon={<AlertCircle className="w-5 h-5" />}
                />
            )}

            <FilterBar
                searchValue={filters.q}
                onSearchChange={(value) => handleFilterChange('q', value)}
                searchPlaceholder="Search patient name, email, phone..."
                activeFiltersCount={activeFiltersCount}
                onClearAll={clearFilters}
                defaultExpanded={false}
            >
                <Select
                    label="Status"
                    placeholder="All Statuses"
                    selectedKeys={filters.status ? [filters.status] : ['all']}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] || '';
                        handleFilterChange('status', value === 'all' ? '' : value);
                    }}
                    size="sm"
                >
                    {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} textValue={option.label}>
                            {option.label}
                        </SelectItem>
                    ))}
                </Select>
                <Select
                    label="Doctor"
                    placeholder="All Doctors"
                    selectedKeys={filters.doctor_id ? [filters.doctor_id] : ['all-doctors']}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] || '';
                        handleFilterChange('doctor_id', value === 'all-doctors' ? '' : value);
                    }}
                    size="sm"
                >
                    <SelectItem key="all-doctors" value="all-doctors" textValue="All Doctors">
                        All Doctors
                    </SelectItem>
                    {doctors.map((doctor) => {
                        const doctorId = doctor.user_id || doctor.id;
                        const doctorName =
                            doctor.name ||
                            `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() ||
                            doctor.email ||
                            String(doctorId);
                        return (
                            <SelectItem key={doctorId} value={doctorId} textValue={doctorName}>
                                {doctorName}
                            </SelectItem>
                        );
                    })}
                </Select>
                <Select
                    label="Service"
                    placeholder="All Services"
                    selectedKeys={filters.service_id ? [filters.service_id] : ['all-services']}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] || '';
                        handleFilterChange('service_id', value === 'all-services' ? '' : value);
                    }}
                    size="sm"
                >
                    <SelectItem key="all-services" value="all-services" textValue="All Services">
                        All Services
                    </SelectItem>
                    {services.map((service) => (
                        <SelectItem key={service.id} value={service.id} textValue={service.name}>
                            {service.name}
                        </SelectItem>
                    ))}
                </Select>
                <Select
                    label="Mode"
                    placeholder="All Modes"
                    selectedKeys={filters.consultation_mode ? [filters.consultation_mode] : ['all-modes']}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] || '';
                        handleFilterChange('consultation_mode', value === 'all-modes' ? '' : value);
                    }}
                    size="sm"
                >
                    {MODE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} textValue={option.label}>
                            {option.label}
                        </SelectItem>
                    ))}
                </Select>
                <Select
                    label="Sort"
                    selectedKeys={[filters.sort || 'date_desc']}
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] || 'date_desc';
                        handleFilterChange('sort', value);
                    }}
                    size="sm"
                >
                    <SelectItem key="date_desc" value="date_desc" textValue="Date (newest)">
                        Date (newest)
                    </SelectItem>
                    <SelectItem key="date_asc" value="date_asc" textValue="Date (oldest)">
                        Date (oldest)
                    </SelectItem>
                    <SelectItem key="created_desc" value="created_desc" textValue="Recently created">
                        Recently created
                    </SelectItem>
                </Select>
                <Input
                    type="date"
                    label="From Date"
                    labelPlacement="outside"
                    placeholder=" "
                    value={filters.date_from}
                    onChange={(eOrValue) => {
                        const next =
                            typeof eOrValue === 'string'
                                ? eOrValue
                                : eOrValue?.target?.value ?? '';
                        handleFilterChange('date_from', next);
                    }}
                    size="sm"
                />
                <Input
                    type="date"
                    label="To Date"
                    labelPlacement="outside"
                    placeholder=" "
                    value={filters.date_to}
                    onChange={(eOrValue) => {
                        const next =
                            typeof eOrValue === 'string'
                                ? eOrValue
                                : eOrValue?.target?.value ?? '';
                        handleFilterChange('date_to', next);
                    }}
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
                </div>
            </FilterBar>

            {joinableOnline.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5">
                    <Video className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-sm text-amber-900 font-medium">
                        {joinableOnline.length} ready to join
                    </span>
                    {joinableOnline.slice(0, 4).map((apt) => (
                        <Button
                            key={apt.id}
                            size="sm"
                            color="warning"
                            className="bg-[#db924b] text-white"
                            onPress={() => handleJoinVideo(apt)}
                        >
                            {getPatientName(apt) || 'Join'}
                        </Button>
                    ))}
                </div>
            ) : null}

            <BulkActionBar
                count={selectedCount}
                onDelete={onBulkOpen}
                onClear={clearSelection}
                canDelete={canDelete}
                deleteLabel="Cancel"
            />

            {/* Appointments list — responsive table + cards */}
            <DataTable
                columns={columns}
                data={appointments}
                isLoading={isLoading}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyMessage="No appointments found"
                emptyState={{
                    icon: 'inbox',
                    title: 'No appointments found',
                    description: 'Try adjusting filters or create a new appointment.',
                }}
                onRowClick={handleRowClick}
                rowClassName={(row) =>
                    row.status === 'invoiced' && row.invoice_id
                        ? 'cursor-pointer hover:bg-gray-50'
                        : ''
                }
                selectable={canDelete}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
                isRowSelectable={(row) => row.status !== 'cancelled'}
                actions={(row) => [
                    ...(canView
                        ? [{ key: 'view', label: 'View Details', icon: <Eye className="w-4 h-4" />, onClick: handleViewDetails }]
                        : []),
                    ...(isOnlineConsultation(row)
                        ? [
                            {
                                key: 'join',
                                label: canJoinConsultation(row) ? 'Join video' : 'Join video (outside window)',
                                icon: <Video className="w-4 h-4" />,
                                onClick: handleJoinVideo,
                                color: 'warning',
                            },
                            {
                                key: 'copy-link',
                                label: 'Copy patient link',
                                icon: <Copy className="w-4 h-4" />,
                                onClick: handleCopyPatientLink,
                            },
                        ]
                        : []),
                    ...(canEdit
                        ? [{ key: 'edit', label: 'Reschedule', icon: <Edit className="w-4 h-4" />, onClick: handleEditClick }]
                        : []),
                    ...(row.status === 'invoiced' && row.invoice_id
                        ? [{ key: 'view-invoice', label: 'View Invoice', icon: <FileText className="w-4 h-4" />, onClick: handleViewInvoice, color: 'primary' }]
                        : []),
                    ...(canComplete && row.status === 'confirmed'
                        ? [{ key: 'complete', label: 'Complete and invoice', icon: <CheckCircle className="w-4 h-4" />, onClick: handleComplete, color: 'success' }]
                        : []),
                    ...(canGenerateInvoice && row.status === 'completed' && !row.invoice_id
                        ? [{ key: 'invoice', label: 'Generate Invoice', icon: <FileText className="w-4 h-4" />, onClick: handleGenerateInvoice }]
                        : []),
                    ...(canPrescribe && row.status === 'completed'
                        ? [{ key: 'prescribe', label: 'Write prescription', icon: <FileCheck className="w-4 h-4" />, onClick: handlePrescribe }]
                        : []),
                    ...(canChangeStatus && row.status === 'pending'
                        ? [{ key: 'confirm', label: 'Confirm', icon: <BadgeCheck className="w-4 h-4" />, onClick: (apt) => handleQuickStatus(apt.id, 'confirmed'), color: 'success' }]
                        : []),
                    ...(canChangeStatus
                        ? [{ key: 'status', label: 'Change Status', icon: <RefreshCw className="w-4 h-4" />, onClick: handleStatusClick }]
                        : []),
                    ...(canDelete && row.status !== 'cancelled'
                        ? [{ key: 'cancel', label: 'Cancel', icon: <XCircle className="w-4 h-4" />, onClick: handleCancelClick, danger: true }]
                        : []),
                ]}
                renderMobileCard={(apt, { isSelected, onSelect, actions }) => (
                    <AppointmentListCard
                        appointment={apt}
                        actions={actions}
                        selectable={canDelete}
                        isSelected={isSelected}
                        onSelect={onSelect}
                    />
                )}
            />

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
                <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                        Are you sure you want to cancel this appointment for{' '}
                        <strong>{selectedAppointment?.patient_info?.full_name || selectedAppointment?.user?.name}</strong>?
                    </p>
                    <Textarea
                        label="Cancellation Reason"
                        placeholder="Enter reason for cancellation..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                </div>
            </FormModal>

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
