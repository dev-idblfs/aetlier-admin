/**
 * Doctors Management Page
 * Mobile-first responsive with card/table view
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Mail,
    Phone,
    X,
    ShieldCheck,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import VerificationStatusBadge from '@/components/verification/VerificationStatusBadge';
import { getDoctorDisplayStatus } from '@/utils/doctorStatus';
import {
    Button,
    useDisclosure,
    Avatar,
    Pagination,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import {
    ListPageLayout,
    StatusBadge,
    ResponsiveTable,
    MobileCard,
    ConfirmModal,
    DetailModal,
    DetailRow,
    SearchInput,
} from '@/components/ui';
import {
    useGetDoctorsQuery,
    useDeleteDoctorMutation,
} from '@/redux/services/api';
import { normalizeApiList } from '@/utils/normalizeApiList';

export default function DoctorsPage() {
    const router = useRouter();
    const authUser = useSelector((s) => s.auth.user);
    const canCreate = hasPermission(authUser, PERMISSIONS.DOCTOR_CREATE);
    const canUpdate = hasPermission(authUser, PERMISSIONS.DOCTOR_UPDATE);
    const canDelete = hasPermission(authUser, PERMISSIONS.DOCTOR_DELETE);
    const canReviewVerification = hasPermission(authUser, PERMISSIONS.VERIFICATION_VERIFY_ANY);
    const [search, setSearch] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

    const handleSearchChange = (value) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const { data, isLoading, isError, error, refetch } = useGetDoctorsQuery({});
    const [deleteDoctor, { isLoading: isDeleting }] = useDeleteDoctorMutation();

    // Client-side filtering since backend doesn't support search
    const filteredDoctors = useMemo(() => {
        const allDoctors = normalizeApiList(data);
        if (!search) return allDoctors;
        const searchLower = search.toLowerCase();
        return allDoctors.filter(doctor => {
            const fullName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
            return fullName.toLowerCase().includes(searchLower) ||
                doctor.specializations?.some(s => s.toLowerCase().includes(searchLower)) ||
                doctor.email?.toLowerCase().includes(searchLower);
        });
    }, [data, search]);

    // Pagination
    const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const doctors = filteredDoctors.slice(startIndex, startIndex + itemsPerPage);

    const columns = [
        {
            key: 'doctor',
            label: 'Doctor',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={row?.profile_image}
                        name={`${row?.first_name || ''} ${row?.last_name || ''}`.trim()}
                        size="sm"
                    />
                    <div>
                        <p className="font-medium text-gray-900">{row?.first_name} {row?.last_name}</p>
                        <p className="text-sm text-gray-500">{row?.specializations?.join(', ')}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Contact',
            render: (row) => (
                <div>
                    <p className="text-gray-900">{row?.email}</p>
                    <p className="text-sm text-gray-500">{row?.phone}</p>
                </div>
            ),
        },
        {
            key: 'verification',
            label: 'Verification',
            render: (row) =>
                row?.verification_status ? (
                    <VerificationStatusBadge status={row.verification_status} />
                ) : (
                    <span className="text-xs text-gray-400">—</span>
                ),
        },
        {
            key: 'status',
            label: 'Profile',
            render: (row) => <StatusBadge status={getDoctorDisplayStatus(row)} />,
        },
    ];

    const handleViewDetails = (doctor) => {
        setSelectedDoctor(doctor);
        onDetailOpen();
    };

    const handleAdd = () => {
        router.push('/doctors/new');
    };

    const handleEdit = (doctor) => {
        router.push(`/doctors/${doctor.id}/edit`);
    };

    const handleFormSubmit = async () => {
        try {
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} doctor`);
        }
    };

    const handleDeleteClick = (doctor) => {
        setSelectedDoctor(doctor);
        onDeleteOpen();
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDoctor?.id) return;
        try {
            await deleteDoctor(selectedDoctor.id).unwrap();
            toast.success('Doctor deleted successfully');
            setSelectedDoctor(null);
            onDeleteOpenChange(false);
            refetch();
        } catch (error) {
            const detail = error?.data?.detail;
            const message =
                typeof detail === 'string'
                    ? detail
                    : Array.isArray(detail)
                      ? detail.map((d) => d.msg || d).join(', ')
                      : 'Failed to delete doctor';
            toast.error(message);
        }
    };

    return (
        <ListPageLayout
            title="Doctors"
            breadcrumbs={[{ label: 'Doctors' }]}
            actions={
                canCreate ? (
                    <Button
                        color="primary"
                        size="sm"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={handleAdd}
                    >
                        <span className="hidden sm:inline">Add Doctor</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                ) : null
            }
            toolbar={(
                <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search doctors..."
                    className="flex-1 max-w-md"
                />
            )}
        >
            {isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Failed to load doctors
                    {error?.data?.detail ? `: ${error.data.detail}` : '. Check that the API is running and NEXT_PUBLIC_API_URL is correct.'}
                </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                    Showing {filteredDoctors.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDoctors.length)} of {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Responsive Table/Cards */}
            <ResponsiveTable
                columns={columns}
                data={doctors}
                isLoading={isLoading}
                emptyState={{
                    icon: 'file',
                    title: 'No doctors found',
                    description: search ? 'Try adjusting your search' : 'Add your first doctor to get started',
                    actionLabel: 'Add Doctor',
                    onAction: handleAdd,
                }}
                actions={[
                    {
                        label: 'View Details',
                        icon: <Eye className="w-4 h-4" />,
                        onClick: handleViewDetails,
                    },
                    ...(canReviewVerification
                        ? [{
                            label: 'Review verification',
                            icon: <ShieldCheck className="w-4 h-4" />,
                            onClick: (row) => {
                                if (row.verification_id) {
                                    router.push(`/verification/${row.verification_id}`);
                                } else {
                                    router.push(`/doctors/${row.id}/edit`);
                                }
                            },
                        }]
                        : []),
                    ...(canUpdate
                        ? [{
                            label: 'Edit',
                            icon: <Edit className="w-4 h-4" />,
                            onClick: handleEdit,
                        }]
                        : []),
                    ...(canDelete
                        ? [{
                            label: 'Delete',
                            icon: <Trash2 className="w-4 h-4" />,
                            color: 'danger',
                            onClick: handleDeleteClick,
                        }]
                        : []),
                ]}
                renderMobileCard={(doctor, { onClick, actions }) => (
                    <DoctorMobileCard
                        doctor={doctor}
                        onClick={() => handleViewDetails(doctor)}
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
                title="Doctor Details"
                onEdit={canUpdate ? () => handleEdit(selectedDoctor) : undefined}
            >
                {selectedDoctor && (
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <Avatar
                                src={selectedDoctor.profile_image}
                                name={`${selectedDoctor.first_name || ''} ${selectedDoctor.last_name || ''}`.trim()}
                                className="w-16 h-16 md:w-20 md:h-20"
                            />
                            <div>
                                <h3 className="text-base md:text-lg font-semibold">{selectedDoctor.first_name} {selectedDoctor.last_name}</h3>
                                <p className="text-sm md:text-base text-primary-600">{selectedDoctor.specializations?.join(', ')}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedDoctor.verification_status && (
                                        <VerificationStatusBadge status={selectedDoctor.verification_status} />
                                    )}
                                    <StatusBadge status={getDoctorDisplayStatus(selectedDoctor)} />
                                </div>
                            </div>
                        </div>

                        {canReviewVerification && selectedDoctor.verification_id && (
                            <Button
                                color="primary"
                                variant="flat"
                                size="sm"
                                startContent={<ShieldCheck className="w-4 h-4" />}
                                onPress={() => {
                                    onDetailOpenChange(false);
                                    router.push(`/verification/${selectedDoctor.verification_id}`);
                                }}
                            >
                                Open verification review
                            </Button>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedDoctor.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedDoctor.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {selectedDoctor.qualifications?.length > 0 && (
                            <DetailRow
                                label="Qualifications"
                                value={selectedDoctor.qualifications.join(', ')}
                            />
                        )}
                        {selectedDoctor.languages?.length > 0 && (
                            <DetailRow
                                label="Languages"
                                value={selectedDoctor.languages.join(', ')}
                            />
                        )}
                        {selectedDoctor.experience_years != null && (
                            <DetailRow
                                label="Experience"
                                value={`${selectedDoctor.experience_years} years`}
                            />
                        )}
                        {selectedDoctor.consultation_fee != null && (
                            <DetailRow
                                label="Consultation fee"
                                value={`₹${selectedDoctor.consultation_fee}`}
                            />
                        )}
                        {selectedDoctor.bio && (
                            <DetailRow label="Bio" value={selectedDoctor.bio} />
                        )}
                    </div>
                )}
            </DetailModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                onConfirm={handleDeleteConfirm}
                title="Delete Doctor"
                message={`Are you sure you want to delete Dr. ${selectedDoctor?.first_name} ${selectedDoctor?.last_name}? This action cannot be undone.`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
            />
        </ListPageLayout>
    );
}

// Doctor Mobile Card Component
function DoctorMobileCard({ doctor, onClick, actions }) {
    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <Avatar
                    src={doctor.profile_image}
                    name={`${doctor.first_name || ''} ${doctor.last_name || ''}`.trim()}
                    size="sm"
                    className="w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{doctor.first_name} {doctor.last_name}</MobileCard.Title>
                    <MobileCard.Subtitle>{doctor.specializations?.join(', ')}</MobileCard.Subtitle>
                </div>
                <StatusBadge status={getDoctorDisplayStatus(doctor)} />
            </MobileCard.Header>
            <MobileCard.Meta>
                {doctor.email && (
                    <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-36">{doctor.email}</span>
                    </span>
                )}
                {doctor.phone && (
                    <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {doctor.phone}
                    </span>
                )}
            </MobileCard.Meta>
        </MobileCard>
    );
}
