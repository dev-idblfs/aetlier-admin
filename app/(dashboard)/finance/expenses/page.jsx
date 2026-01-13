/**
 * Expenses List Page
 * Mobile-first responsive with filtering and category management
 */

'use client';

import { useState, useMemo } from 'react';
import {
    Receipt,
    Search,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Plus,
    Filter,
    Tag,
    Upload,
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
    Pagination,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PageHeader, SearchInput, ResponsiveTable, MobileCard, ConfirmModal, DetailModal } from '@/components/ui';
import {
    useGetExpensesQuery,
    useGetExpenseCategoriesQuery,
    useDeleteExpenseMutation,
    useCreateExpenseCategoryMutation,
    useSeedExpenseCategoriesMutation,
} from '@/redux/services/api';
import { formatDate, formatCurrency } from '@/utils/dateFormatters';

const paymentStatusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PENDING', label: 'Pending' },
];

export default function ExpensesPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');

    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isCategoryOpen, onOpen: onCategoryOpen, onOpenChange: onCategoryOpenChange, onClose: onCategoryClose } = useDisclosure();

    const { data, isLoading, refetch } = useGetExpensesQuery({
        page,
        page_size: 20,
        category_id: categoryFilter || undefined,
        payment_status: statusFilter || undefined,
        search: search || undefined,
    });

    const { data: categories } = useGetExpenseCategoriesQuery();
    const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();
    const [createCategory, { isLoading: isCreatingCategory }] = useCreateExpenseCategoryMutation();
    const [seedCategories, { isLoading: isSeeding }] = useSeedExpenseCategoriesMutation();

    const expenses = data?.items || [];
    const totalPages = data?.total_pages || 1;

    const categoryOptions = useMemo(() => {
        return [
            { value: '', label: 'All Categories' },
            ...(categories || []).map(cat => ({ value: cat.id, label: cat.name }))
        ];
    }, [categories]);

    const handleDeleteClick = (expense) => {
        setSelectedExpense(expense);
        onDeleteOpen();
    };

    const handleDeleteConfirm = async () => {
        if (!selectedExpense) return;
        try {
            await deleteExpense(selectedExpense.id).unwrap();
            toast.success('Expense deleted successfully');
            onDeleteClose();
            refetch();
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to delete expense');
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Category name is required');
            return;
        }
        try {
            await createCategory({ name: newCategoryName, icon: '📁' }).unwrap();
            toast.success('Category created successfully');
            setNewCategoryName('');
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to create category');
        }
    };

    const handleSeedCategories = async () => {
        try {
            await seedCategories().unwrap();
            toast.success('Default categories seeded');
        } catch (error) {
            toast.error(error.data?.detail || 'Failed to seed categories');
        }
    };

    const columns = [
        {
            key: 'expense',
            label: 'Expense',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.description}</p>
                    <p className="text-sm text-gray-500">{row.vendor_name || 'No vendor'}</p>
                </div>
            ),
        },
        {
            key: 'category',
            label: 'Category',
            render: (row) => (
                <Chip size="sm" variant="flat">
                    {row.category_icon} {row.category_name || 'Uncategorized'}
                </Chip>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => (
                <span className="font-medium text-red-600">
                    -{formatCurrency(row.amount)}
                </span>
            ),
        },
        {
            key: 'date',
            label: 'Date',
            render: (row) => (
                <span className="text-gray-600">{formatDate(row.expense_date)}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <Chip
                    size="sm"
                    color={row.payment_status === 'PAID' ? 'success' : 'warning'}
                    variant="flat"
                >
                    {row.payment_status === 'PAID' ? 'Paid' : 'Pending'}
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
                    <DropdownMenu aria-label="Expense actions">
                        <DropdownItem key="view" startContent={<Eye className="w-4 h-4" />} onPress={() => router.push(`/finance/expenses/${row.id}`)}>
                            View Details
                        </DropdownItem>
                        <DropdownItem key="edit" startContent={<Edit className="w-4 h-4" />} onPress={() => router.push(`/finance/expenses/${row.id}/edit`)}>
                            Edit Expense
                        </DropdownItem>
                        <DropdownItem key="delete" startContent={<Trash2 className="w-4 h-4" />} className="text-danger" color="danger" onPress={() => handleDeleteClick(row)}>
                            Delete Expense
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            ),
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Expenses"
                description="Track and manage business expenses"
                actions={
                    <div className="flex gap-2">
                        <Button variant="flat" startContent={<Tag className="w-4 h-4" />} onPress={onCategoryOpen}>
                            Categories
                        </Button>
                        <Link href="/finance/expenses/new">
                            <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
                                New Expense
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search expenses..."
                    className="flex-1"
                />
                <div className="flex gap-2 flex-wrap">
                    <Select
                        placeholder="Category"
                        selectedKeys={categoryFilter ? [categoryFilter] : []}
                        onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] || '')}
                        className="w-full sm:w-40"
                        size="sm"
                        classNames={{ trigger: 'bg-white' }}
                    >
                        {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </Select>
                    <Select
                        placeholder="Status"
                        selectedKeys={statusFilter ? [statusFilter] : []}
                        onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] || '')}
                        className="w-full sm:w-32"
                        size="sm"
                        classNames={{ trigger: 'bg-white' }}
                    >
                        {paymentStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </Select>
                    {(search || categoryFilter || statusFilter) && (
                        <Button variant="flat" size="sm" onPress={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500">
                {data?.total || 0} expense{data?.total !== 1 ? 's' : ''}
            </div>

            {/* Table */}
            <ResponsiveTable
                columns={columns}
                data={expenses}
                isLoading={isLoading}
                emptyState={{
                    icon: 'receipt',
                    title: 'No expenses found',
                    description: search || categoryFilter || statusFilter ? 'Try adjusting your filters' : 'Record your first expense',
                    action: (
                        <Link href="/finance/expenses/new">
                            <Button color="primary" startContent={<Plus className="w-4 h-4" />}>
                                New Expense
                            </Button>
                        </Link>
                    ),
                }}
                actions={[
                    { label: 'View Details', icon: <Eye className="w-4 h-4" />, onClick: (row) => router.push(`/finance/expenses/${row.id}`) },
                    { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: (row) => router.push(`/finance/expenses/${row.id}/edit`) },
                    { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: handleDeleteClick, danger: true },
                ]}
                renderMobileCard={(expense, { actions }) => (
                    <ExpenseMobileCard expense={expense} actions={actions} onClick={() => router.push(`/finance/expenses/${expense.id}`)} />
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

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                onConfirm={handleDeleteConfirm}
                title="Delete Expense"
                message={`Are you sure you want to delete this expense? This action cannot be undone.`}
                confirmLabel="Delete"
                type="danger"
                isLoading={isDeleting}
            />

            {/* Category Management Modal */}
            <DetailModal
                isOpen={isCategoryOpen}
                onOpenChange={onCategoryOpenChange}
                title="Manage Categories"
            >
                <div className="space-y-4">
                    {/* Add new category */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="New category name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-1"
                        />
                        <Button color="primary" onPress={handleCreateCategory} isLoading={isCreatingCategory}>
                            Add
                        </Button>
                    </div>

                    {/* Existing categories */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Existing Categories</p>
                        {categories?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <Chip key={cat.id} variant="flat">
                                        {cat.icon} {cat.name}
                                    </Chip>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500 mb-3">No categories yet</p>
                                <Button variant="flat" onPress={handleSeedCategories} isLoading={isSeeding}>
                                    Load Default Categories
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DetailModal>
        </div>
    );
}

// Mobile Expense Card
function ExpenseMobileCard({ expense, actions, onClick }) {
    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{expense.description}</MobileCard.Title>
                    <MobileCard.Subtitle>{expense.vendor_name || 'No vendor'}</MobileCard.Subtitle>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-red-600">-{formatCurrency(expense.amount)}</p>
                    <Chip
                        size="sm"
                        color={expense.payment_status === 'PAID' ? 'success' : 'warning'}
                        variant="flat"
                    >
                        {expense.payment_status === 'PAID' ? 'Paid' : 'Pending'}
                    </Chip>
                </div>
            </MobileCard.Header>
            <MobileCard.Meta>
                <Chip size="sm" variant="flat">
                    {expense.category_icon} {expense.category_name}
                </Chip>
                <span className="text-gray-500">{formatDate(expense.expense_date)}</span>
            </MobileCard.Meta>
        </MobileCard>
    );
}
