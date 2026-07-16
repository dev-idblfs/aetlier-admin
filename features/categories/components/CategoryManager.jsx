'use client';

import { useState, useMemo } from 'react';
import {
    Edit,
    Trash2,
    Plus,
    Folder,
    MoreVertical,
    Check,
    X
} from 'lucide-react';
import {
    Button,
    useDisclosure,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    SelectItem,
    Spinner,
    Checkbox,
} from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useBulkDeleteCategoriesMutation,
} from '@/redux/services/api';
import { ConfirmModal, FormModal, BulkActionBar } from '@/components/ui';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import useBulkSelection from '@/hooks/useBulkSelection';
import useBulkDeleteAction from '@/hooks/useBulkDeleteAction';
import { Form } from '@/components/ui/Form';
import { FormInput, FormSelect, FormSwitchRow } from '@/components/ui/FormFields';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema } from '@/lib/validation';

export default function CategoryManager({ type, title = 'Manage Categories' }) {
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const {
        isOpen: isFormOpen,
        onOpen: onFormOpen,
        onClose: onFormClose
    } = useDisclosure();

    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onOpenChange: onDeleteOpenChange,
        onClose: onDeleteClose
    } = useDisclosure();

    // API Hooks
    const { data: categories = [], isLoading, refetch } = useGetCategoriesQuery({
        type,
        active_only: false // Fetch all to manage them
    });

    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

    const authUser = useSelector((s) => s.auth.user);
    const canDelete = hasPermission(authUser, PERMISSIONS.CATEGORY_DELETE);

    const itemsPerPage = categories.length || 1;
    const {
        selectedIds,
        onSelectionChange,
        clearSelection,
        selectedCount,
        pageItems: pageCategories,
    } = useBulkSelection(categories, 1, itemsPerPage);
    const {
        isBulkOpen,
        onBulkOpen,
        onBulkOpenChange,
        handleBulkConfirm,
        isBulkLoading,
    } = useBulkDeleteAction(useBulkDeleteCategoriesMutation, 'categories');

    const handleSelectAll = () => {
        if (selectedIds.length === pageCategories.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(pageCategories.map((c) => c.id));
        }
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((i) => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    // Form
    const methods = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            description: '',
            parent_id: '',
            icon: '',
            color: '#000000',
            is_active: true,
        }
    });

    const { reset, handleSubmit } = methods;

    // Derived state
    const parentOptions = useMemo(() => {
        // Prevent selecting self as parent or circular deps (simple check: valid existing categories)
        // Also handling basic hierarchy display in options would be nice
        return categories
            .filter(c => c.id !== editingCategory?.id)
            .map(c => ({ value: c.id, label: c.name }));
    }, [categories, editingCategory]);

    // Handlers
    const handleAddClick = () => {
        setEditingCategory(null);
        reset({
            name: '',
            description: '',
            parent_id: '',
            icon: '',
            color: '#000000',
            is_active: true,
        });
        onFormOpen();
    };

    const handleEditClick = (category) => {
        setEditingCategory(category);
        reset({
            name: category.name,
            description: category.description || '',
            parent_id: category.parent_id || '',
            icon: category.icon || '',
            color: category.color || '#000000',
            is_active: category.is_active,
        });
        onFormOpen();
    };

    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        onDeleteOpen();
    };

    const onSubmit = async (formData) => {
        const payload = {
            ...formData,
            type, // Ensure type is set
            parent_id: formData.parent_id || null, // Handle empty string as null
        };

        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, ...payload }).unwrap();
                toast.success('Category updated successfully');
            } else {
                await createCategory(payload).unwrap();
                toast.success('Category created successfully');
            }
            onFormClose();
            refetch();
        } catch (error) {
            console.error('Category operation error:', error);
            if (error?.status === 422 && error?.data?.detail) {
                const details = Array.isArray(error.data.detail) ? error.data.detail : [error.data.detail];
                details.forEach((err) => {
                    const fieldName = err.loc?.[1];
                    if (fieldName && methods.getValues(fieldName) !== undefined) {
                        methods.setError(fieldName, {
                            type: 'server',
                            message: err.msg || 'Invalid value'
                        });
                    } else {
                        toast.error(err.msg || 'Validation error');
                    }
                });
            } else {
                toast.error(error.data?.detail || `Failed to ${editingCategory ? 'update' : 'create'} category`);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;
        try {
            await deleteCategory(categoryToDelete.id).unwrap();
            toast.success('Category deleted successfully');
            onDeleteClose();
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to delete category');
        }
    };

    // Simple list rendering for now
    // TODO: Implement tree view for hierarchy
    const renderCategoryItem = (category) => (
        <div key={category.id} className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors group ${selectedIds.includes(category.id) ? 'border-primary-200 bg-primary-50' : ''}`}>
            <div className="flex items-center gap-3">
                {canDelete && (
                    <Checkbox
                        isSelected={selectedIds.includes(category.id)}
                        onValueChange={() => handleSelectRow(category.id)}
                        aria-label={`Select ${category.name}`}
                    />
                )}
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: category.color || '#666' }}
                >
                    {category.icon || <Folder className="w-4 h-4" />}
                </div>
                <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        {category.name}
                        {!category.is_active && (
                            <Chip size="sm" variant="flat" color="danger" className="h-5 text-xs">Inactive</Chip>
                        )}
                    </h4>
                    {category.description && (
                        <p className="text-sm text-gray-500">{category.description}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button isIconOnly size="sm" variant="light" onPress={() => handleEditClick(category)}>
                    <Edit className="w-4 h-4 text-gray-600" />
                </Button>
                <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteClick(category)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{title}</h2>
                <Button
                    color="primary"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleAddClick}
                    size="sm"
                >
                    New Category
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Spinner label="Loading categories..." />
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No categories found</p>
                    <Button variant="flat" onPress={handleAddClick}>
                        Create your first category
                    </Button>
                </div>
            ) : (
                <div className="grid gap-2">
                    {canDelete && pageCategories.length > 0 && (
                        <div className="flex items-center gap-2 px-1">
                            <Checkbox
                                isSelected={pageCategories.length > 0 && selectedIds.length === pageCategories.length}
                                isIndeterminate={selectedIds.length > 0 && selectedIds.length < pageCategories.length}
                                onValueChange={handleSelectAll}
                                aria-label="Select all categories"
                            />
                            <span className="text-sm text-gray-500">Select all</span>
                        </div>
                    )}
                    <BulkActionBar
                        count={selectedCount}
                        onDelete={onBulkOpen}
                        onClear={clearSelection}
                        canDelete={canDelete}
                    />
                    {pageCategories.map(renderCategoryItem)}
                </div>
            )}

            {/* Form Modal */}
            <FormModal
                isOpen={isFormOpen}
                onClose={onFormClose}
                title={editingCategory ? 'Edit Category' : 'New Category'}
                onSubmit={handleSubmit(onSubmit)}
                submitLabel={editingCategory ? 'Update' : 'Create'}
                isLoading={isCreating || isUpdating}
            >
                <Form methods={methods} onSubmit={onSubmit} className="space-y-3">
                    <FormInput
                        name="name"
                        label="Name"
                        placeholder="e.g., Consultation"
                        isRequired
                    />

                    <FormInput
                        name="description"
                        label="Description"
                        placeholder="Optional description"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <FormInput
                            name="icon"
                            label="Icon (Emoji)"
                            placeholder="e.g., 👨‍⚕️"
                        />
                        <FormInput
                            name="color"
                            label="Color (Hex)"
                            placeholder="#000000"
                            type="color"
                        />
                    </div>

                    <FormSelect
                        name="parent_id"
                        label="Parent Category"
                        placeholder="None (Top Level)"
                    >
                        {parentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </FormSelect>

                    <FormSwitchRow
                        name="is_active"
                        label="Active"
                        description="Enable or disable this category"
                    />
                </Form>
            </FormModal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                onConfirm={handleDeleteConfirm}
                title="Delete Category"
                message={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
            />

            <ConfirmModal
                isOpen={isBulkOpen}
                onClose={() => onBulkOpenChange(false)}
                onConfirm={() => handleBulkConfirm(selectedIds, clearSelection)}
                title={`Delete ${selectedCount} categories?`}
                message="Selected categories will be soft-deleted and hidden from listings."
                confirmLabel="Delete"
                type="danger"
                isLoading={isBulkLoading}
            />
        </div>
    );
}
