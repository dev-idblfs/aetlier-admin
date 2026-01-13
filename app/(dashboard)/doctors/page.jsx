/**
 * Doctors Management Page
 * Mobile-first responsive with card/table view
 */

'use client';

import { useState } from 'react';
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Phone,
    Mail,
    X,
} from 'lucide-react';
import {
    Button,
    Input,
    useDisclosure,
    Avatar,
    Textarea,
    Switch,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import {
    PageHeader,
    StatusBadge,
    Card,
    SearchInput,
    ResponsiveTable,
    MobileCard,
    ConfirmModal,
    FormModal,
    DetailModal,
    DetailRow,
    FormRow,
    FormSwitchRow,
} from '@/components/ui';
import {
    useGetDoctorsQuery,
    useCreateDoctorMutation,
    useUpdateDoctorMutation,
    useDeleteDoctorMutation,
} from '@/redux/services/api';
import { motion } from 'framer-motion';

const INITIAL_FORM = {
    name: '',
    specialty: '',
    email: '',
    phone: '',
    bio: '',
    image_url: '',
    is_active: true,
};

export default function DoctorsPage() {
    const [search, setSearch] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [isEditing, setIsEditing] = useState(false);

    const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormOpenChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();

    const { data, isLoading, refetch } = useGetDoctorsQuery({});

    const [createDoctor, { isLoading: isCreating }] = useCreateDoctorMutation();
    const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();
    const [deleteDoctor, { isLoading: isDeleting }] = useDeleteDoctorMutation();

    // Client-side filtering since backend doesn't support search
    const allDoctors = data?.doctors || data || [];
    const doctors = allDoctors.filter(doctor => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return doctor.name?.toLowerCase().includes(searchLower) ||
            doctor.specialty?.toLowerCase().includes(searchLower) ||
            doctor.email?.toLowerCase().includes(searchLower);
    });

    const columns = [
        {
            key: 'doctor',
            label: 'Doctor',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={row?.image_url || row?.photo}
                        name={row?.name}
                        size="sm"
                    />
                    <div>
                        <p className="font-medium text-gray-900">{row?.name}</p>
                        <p className="text-sm text-gray-500">{row?.specialty}</p>
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
            key: 'status',
            label: 'Status',
            render: (row) => (
                <StatusBadge
                    status={row?.is_active !== false ? 'active' : 'inactive'}
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

    const handleViewDetails = (doctor) => {
        setSelectedDoctor(doctor);
        onDetailOpen();
    };

    const handleAdd = () => {
        setIsEditing(false);
        setFormData(INITIAL_FORM);
        onFormOpen();
    };

    const handleEdit = (doctor) => {
        setIsEditing(true);
        setSelectedDoctor(doctor);
        setFormData({
            name: doctor.name || '',
            specialty: doctor.specialty || '',
            email: doctor.email || '',
            phone: doctor.phone || '',
            bio: doctor.bio || '',
            image_url: doctor.image_url || '',
            is_active: doctor.is_active !== false,
        });
        onFormOpen();
    };

    const handleFormChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleFormSubmit = async () => {
        try {
            if (isEditing) {
                await updateDoctor({ id: selectedDoctor.id, ...formData }).unwrap();
                toast.success('Doctor updated successfully');
            } else {
                await createDoctor(formData).unwrap();
                toast.success('Doctor created successfully');
            }
            onFormOpenChange(false);
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
        try {
            await deleteDoctor(selectedDoctor.id).unwrap();
            toast.success('Doctor deleted successfully');
            onDeleteOpenChange(false);
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to delete doctor');
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Doctors"
                description="Manage doctor profiles and schedules"
                breadcrumbs={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Doctors' },
                ]}
                actions={
                    <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={handleAdd}
                        className="w-full sm:w-auto"
                    >
                        <span className="hidden sm:inline">Add Doctor</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                }
            />

            {/* Search Bar */}
            <div className="flex items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search doctors..."
                    fullWidth
                    className="flex-1"
                />
                {search && (
                    <Button
                        variant="flat"
                        size="sm"
                        isIconOnly
                        onPress={() => setSearch('')}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</span>
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
                renderMobileCard={(doctor, { onClick, actions }) => (
                    <DoctorMobileCard
                        doctor={doctor}
                        onClick={() => handleViewDetails(doctor)}
                        actions={actions}
                    />
                )}
            />

            {/* Add/Edit Modal */}
            <FormModal
                isOpen={isFormOpen}
                onOpenChange={onFormOpenChange}
                title={isEditing ? 'Edit Doctor' : 'Add Doctor'}
                submitLabel={isEditing ? 'Update' : 'Create'}
                onSubmit={handleFormSubmit}
                isLoading={isCreating || isUpdating}
            >
                <div className="space-y-4">
                    <FormRow>
                        <Input
                            label="Name"
                            labelPlacement="outside"
                            placeholder="Dr. John Doe"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            isRequired
                        />
                        <Input
                            label="Specialty"
                            labelPlacement="outside"
                            placeholder="Dermatology"
                            value={formData.specialty}
                            onChange={(e) => handleFormChange('specialty', e.target.value)}
                            isRequired
                        />
                    </FormRow>
                    <FormRow>
                        <Input
                            label="Email"
                            labelPlacement="outside"
                            type="email"
                            placeholder="doctor@example.com"
                            value={formData.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            isRequired
                        />
                        <Input
                            label="Phone"
                            labelPlacement="outside"
                            placeholder="+1 234 567 890"
                            value={formData.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                        />
                    </FormRow>
                    <Input
                        label="Image URL"
                        labelPlacement="outside"
                        value={formData.image_url}
                        onChange={(e) => handleFormChange('image_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                    />
                    <Textarea
                        label="Bio"
                        labelPlacement="outside"
                        value={formData.bio}
                        onChange={(e) => handleFormChange('bio', e.target.value)}
                        placeholder="Doctor's biography..."
                        minRows={3}
                    />
                    <FormSwitchRow
                        label="Active Status"
                        description="Doctor is available for appointments"
                        isSelected={formData.is_active}
                        onValueChange={(value) => handleFormChange('is_active', value)}
                    />
                </div>
            </FormModal>

            {/* Detail Modal */}
            <DetailModal
                isOpen={isDetailOpen}
                onOpenChange={onDetailOpenChange}
                title="Doctor Details"
                onEdit={() => handleEdit(selectedDoctor)}
            >
                {selectedDoctor && (
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <Avatar
                                src={selectedDoctor.image_url || selectedDoctor.photo}
                                name={selectedDoctor.name}
                                className="w-16 h-16 md:w-20 md:h-20"
                            />
                            <div>
                                <h3 className="text-base md:text-lg font-semibold">{selectedDoctor.name}</h3>
                                <p className="text-sm md:text-base text-primary-600">{selectedDoctor.specialty}</p>
                                <StatusBadge
                                    status={selectedDoctor.is_active !== false ? 'active' : 'inactive'}
                                    className="mt-1"
                                />
                            </div>
                        </div>

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
                message={`Are you sure you want to delete ${selectedDoctor?.name}? This action cannot be undone.`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}

// Doctor Mobile Card Component
function DoctorMobileCard({ doctor, onClick, actions }) {
    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <Avatar
                    src={doctor.image_url || doctor.photo}
                    name={doctor.name}
                    size="sm"
                    className="w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{doctor.name}</MobileCard.Title>
                    <MobileCard.Subtitle>{doctor.specialty}</MobileCard.Subtitle>
                </div>
                <StatusBadge
                    status={doctor.is_active !== false ? 'active' : 'inactive'}
                />
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
