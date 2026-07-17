'use client';

import { useMemo, useState } from 'react';
import { Edit, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import {
    Button,
    Chip,
    Spinner,
    useDisclosure,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useGetMobilePromotionsQuery,
    useCreateMobilePromotionMutation,
    useUpdateMobilePromotionMutation,
    useDeleteMobilePromotionMutation,
    useReorderMobilePromotionsMutation,
} from '@/redux/services/api';
import { ConfirmModal, FormModal } from '@/components/ui';
import { Form } from '@/components/ui/Form';
import { FormInput, FormSelect, FormSwitchRow } from '@/components/ui/FormFields';
import { SelectItem } from '@heroui/react';
import { hasAnyPermission, PERMISSIONS } from '@/utils/permissions';
import { mobilePromotionSchema } from '@/lib/validation';

const DEFAULTS = {
    title: '',
    subtitle: '',
    image_url: '',
    badge_text: '',
    cta_label: 'Explore',
    cta_type: 'route',
    cta_value: '/services',
    placement: 'banner',
    sort_order: 0,
    is_active: true,
};

export default function MobilePromotionManager() {
    const [placementFilter, setPlacementFilter] = useState('all');
    const [editing, setEditing] = useState(null);
    const [toDelete, setToDelete] = useState(null);

    const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onOpenChange: onDeleteOpenChange,
        onClose: onDeleteClose,
    } = useDisclosure();

    const { data: promotions = [], isLoading, refetch } = useGetMobilePromotionsQuery({
        active_only: false,
    });
    const [createPromotion, { isLoading: isCreating }] = useCreateMobilePromotionMutation();
    const [updatePromotion, { isLoading: isUpdating }] = useUpdateMobilePromotionMutation();
    const [deletePromotion, { isLoading: isDeleting }] = useDeleteMobilePromotionMutation();
    const [reorderPromotions] = useReorderMobilePromotionsMutation();

    const authUser = useSelector((s) => s.auth.user);
    const canWrite = hasAnyPermission(authUser, [
        PERMISSIONS.MOBILE_PROMOTION_UPDATE,
        PERMISSIONS.SETTINGS_UPDATE,
    ]);
    const canCreate = hasAnyPermission(authUser, [
        PERMISSIONS.MOBILE_PROMOTION_CREATE,
        PERMISSIONS.SETTINGS_UPDATE,
    ]);
    const canDelete = hasAnyPermission(authUser, [
        PERMISSIONS.MOBILE_PROMOTION_DELETE,
        PERMISSIONS.SETTINGS_UPDATE,
    ]);

    const methods = useForm({
        resolver: zodResolver(mobilePromotionSchema),
        defaultValues: DEFAULTS,
    });
    const { reset, handleSubmit } = methods;

    const filtered = useMemo(() => {
        if (placementFilter === 'all') return promotions;
        return promotions.filter((p) => p.placement === placementFilter);
    }, [promotions, placementFilter]);

    const openCreate = () => {
        setEditing(null);
        reset(DEFAULTS);
        onFormOpen();
    };

    const openEdit = (row) => {
        setEditing(row);
        reset({
            title: row.title || '',
            subtitle: row.subtitle || '',
            image_url: row.image_url || '',
            badge_text: row.badge_text || '',
            cta_label: row.cta_label || '',
            cta_type: row.cta_type || 'route',
            cta_value: row.cta_value || '',
            placement: row.placement || 'banner',
            sort_order: row.sort_order ?? 0,
            is_active: row.is_active !== false,
        });
        onFormOpen();
    };

    const onSubmit = async (values) => {
        try {
            if (editing) {
                await updatePromotion({ id: editing.id, ...values }).unwrap();
                toast.success('Promotion updated');
            } else {
                await createPromotion(values).unwrap();
                toast.success('Promotion created');
            }
            onFormClose();
            refetch();
        } catch (e) {
            toast.error(e?.data?.detail || 'Save failed');
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await deletePromotion(toDelete.id).unwrap();
            toast.success('Promotion deleted');
            onDeleteClose();
            setToDelete(null);
            refetch();
        } catch (e) {
            toast.error(e?.data?.detail || 'Delete failed');
        }
    };

    const move = async (row, direction) => {
        const list = [...filtered].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const idx = list.findIndex((p) => p.id === row.id);
        const swapIdx = idx + direction;
        if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;
        const a = list[idx];
        const b = list[swapIdx];
        try {
            await reorderPromotions([
                { id: a.id, sort_order: b.sort_order ?? swapIdx },
                { id: b.id, sort_order: a.sort_order ?? idx },
            ]).unwrap();
            refetch();
        } catch (e) {
            toast.error(e?.data?.detail || 'Reorder failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {['all', 'banner', 'offer'].map((key) => (
                        <Chip
                            key={key}
                            variant={placementFilter === key ? 'solid' : 'bordered'}
                            color={placementFilter === key ? 'primary' : 'default'}
                            className="cursor-pointer capitalize"
                            onClick={() => setPlacementFilter(key)}
                        >
                            {key === 'all' ? 'All' : key === 'banner' ? 'Banners' : 'Offers'}
                        </Chip>
                    ))}
                </div>
                {canCreate && (
                    <Button color="primary" startContent={<Plus size={16} />} onPress={openCreate}>
                        Add promotion
                    </Button>
                )}
            </div>

            <div className="divide-y divide-default-200 rounded-xl border border-default-200 bg-content1">
                {filtered.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-default-500">
                        No promotions yet. Add a banner or offer for the mobile home feed.
                    </p>
                ) : (
                    filtered.map((row) => (
                        <div
                            key={row.id}
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate font-medium">{row.title}</p>
                                    <Chip size="sm" variant="flat" className="capitalize">
                                        {row.placement}
                                    </Chip>
                                    {!row.is_active && (
                                        <Chip size="sm" color="warning" variant="flat">
                                            Inactive
                                        </Chip>
                                    )}
                                </div>
                                {row.subtitle && (
                                    <p className="mt-0.5 truncate text-sm text-default-500">
                                        {row.subtitle}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-default-400">
                                    CTA {row.cta_type}: {row.cta_value || '—'} · order {row.sort_order}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                {canWrite && (
                                    <>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            aria-label="Move up"
                                            onPress={() => move(row, -1)}
                                        >
                                            <ArrowUp size={16} />
                                        </Button>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            aria-label="Move down"
                                            onPress={() => move(row, 1)}
                                        >
                                            <ArrowDown size={16} />
                                        </Button>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            aria-label="Edit"
                                            onPress={() => openEdit(row)}
                                        >
                                            <Edit size={16} />
                                        </Button>
                                    </>
                                )}
                                {canDelete && (
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        aria-label="Delete"
                                        onPress={() => {
                                            setToDelete(row);
                                            onDeleteOpen();
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <FormModal
                isOpen={isFormOpen}
                onClose={onFormClose}
                title={editing ? 'Edit promotion' : 'New promotion'}
                onSubmit={handleSubmit(onSubmit)}
                isLoading={isCreating || isUpdating}
            >
                <Form methods={methods} onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                    <FormInput name="title" label="Title" />
                    <FormInput name="subtitle" label="Subtitle" />
                    <FormInput name="image_url" label="Image URL" />
                    <FormInput name="badge_text" label="Badge" />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <FormSelect name="placement" label="Placement">
                            <SelectItem key="banner">Banner</SelectItem>
                            <SelectItem key="offer">Offer</SelectItem>
                        </FormSelect>
                        <FormSelect name="cta_type" label="CTA type">
                            <SelectItem key="route">Route</SelectItem>
                            <SelectItem key="service">Service</SelectItem>
                            <SelectItem key="package">Package</SelectItem>
                            <SelectItem key="external">External</SelectItem>
                        </FormSelect>
                    </div>
                    <FormInput name="cta_label" label="CTA label" />
                    <FormInput name="cta_value" label="CTA value" />
                    <FormInput name="sort_order" label="Sort order" type="number" />
                    <FormSwitchRow name="is_active" label="Active" />
                </Form>
            </FormModal>

            <ConfirmModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                title="Delete promotion?"
                message={`Remove “${toDelete?.title || ''}”? This affects the mobile home feed.`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
