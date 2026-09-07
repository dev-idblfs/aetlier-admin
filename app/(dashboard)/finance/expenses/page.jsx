/**
 * Expenses List Page
 * Mobile-first responsive with filtering and category management
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

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
} from '@/lib/icons';
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
} from '@/lib/heroui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ListPageLayout, SearchInput, ResponsiveTable, MobileCard, ConfirmModal, LinkButton, BulkActionBar, StatusBadge } from '@/components/ui';
import {
    useGetExpensesQuery,
    useGetExpenseCategoriesQuery,
    useDeleteExpenseMutation,
    useBulkDeleteExpensesMutation,
} from '@/redux/services/api';
import { formatDate, formatCurrency } from '@/utils/dateFormatters';
import { useSelector } from 'react-redux';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import useBulkSelection from '@/hooks/useBulkSelection';
import useBulkDeleteAction from '@/hooks/useBulkDeleteAction';

const paymentStatusOptions = [
    { value: 'all', label: 'All Status' },
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

    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange, onClose: onDeleteClose } = useDisclosure();

    const authUser = useSelector((s) => s.auth.user);
    const canView = hasPermission(authUser, PERMISSIONS.EXPENSE_VIEW_ANY);
    const canCreate = hasPermission(authUser, PERMISSIONS.EXPENSE_CREATE);
    const canUpdate = hasPermission(authUser, PERMISSIONS.EXPENSE_UPDATE);
    const canDelete = hasPermission(authUser, PERMISSIONS.EXPENSE_DELETE);

    const { data, isLoading, refetch } = useGetExpensesQuery({
        page,
        page_size: 20,
        category_id: categoryFilter || undefined,
        payment_status: statusFilter || undefined,
        search: search || undefined,
    }, { skip: !canView });

    const { data: categories } = useGetExpenseCategoriesQuery();
    const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

    const expenses = data?.expenses || [];
    const totalPages = data?.total_pages || 1;
    const pageSize = 20;

    const {
        selectedIds,
        onSelectionChange,
        clearSelection,
        selectedCount,
        pageItems: pageExpenses,
    } = useBulkSelection(expenses, 1, expenses.length || pageSize);
    const {
        isBulkOpen,
        onBulkOpen,
        onBulkOpenChange,
        handleBulkConfirm,
        isBulkLoading,
    } = useBulkDeleteAction(useBulkDeleteExpensesMutation, 'expenses');

    const categoryOptions = useMemo(() => {
        return [
            { value: 'all', label: 'All Categories' },
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

    const columns = [
        {
            key: 'expense',
            label: 'Expense',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.description}</p>
                    <p className="text-sm text-gray-500">{row.vendor || 'No vendor'}</p>
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
            render: (row) => <StatusBadge status={row.payment_status} type="payment" />,
        },
    ];

    return (
        <ListPageLayout
            title="Expenses"
            breadcrumbs={[
                { label: 'Finance', href: '/finance' },
                { label: 'Expenses' },
            ]}
            actions={
                <div className="flex gap-2">
                    <LinkButton
                        href="/finance/expenses/categories"
                        variant="flat"
                        size="sm"
                        startContent={<Tag className="w-4 h-4" />}
                    >
                        Categories
                    </LinkButton>
                    {canCreate && (
                        <LinkButton
                            href="/finance/expenses/new"
                            color="primary"
                            size="sm"
                            startContent={<Plus className="w-4 h-4" />}
                        >
                            New Expense
                        </LinkButton>
                    )}
                </div>
            }
            toolbar={(
                <>
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Search expenses..."
                        className="flex-1"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <Select
                            placeholder="Category"
                            selectedKeys={categoryFilter ? [categoryFilter] : ['all']}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] || 'all';
                                setCategoryFilter(value === 'all' ? '' : value);
                            }}
                            className="w-full sm:w-40"
                            size="sm"
                            classNames={{ trigger: 'bg-white' }}
                        >
                            {categoryOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} textValue={option.label}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select
                            placeholder="Status"
                            selectedKeys={statusFilter ? [statusFilter] : ['all']}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] || 'all';
                                setStatusFilter(value === 'all' ? '' : value);
                            }}
                            className="w-full sm:w-32"
                            size="sm"
                            classNames={{ trigger: 'bg-white' }}
                        >
                            {paymentStatusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} textValue={option.label}>
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
                </>
            )}
        >
            {/* Results count */}
            <div className="text-sm text-gray-500">
                {data?.total || 0} expense{data?.total !== 1 ? 's' : ''}
            </div>

            <BulkActionBar
                count={selectedCount}
                onDelete={onBulkOpen}
                onClear={clearSelection}
                canDelete={canDelete}
            />

            {/* Table */}
            <ResponsiveTable
                columns={columns}
                data={pageExpenses}
                isLoading={isLoading}
                selectable={canDelete}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
                emptyState={{
                    icon: 'receipt',
                    title: 'No expenses found',
                    description: search || categoryFilter || statusFilter ? 'Try adjusting your filters' : 'Record your first expense',
                    action: (
                        <LinkButton
                            href="/finance/expenses/new"
                            color="primary"
                            startContent={<Plus className="w-4 h-4" />}
                        >
                            New Expense
                        </LinkButton>
                    ),
                }}
                actions={[
                    { label: 'View Details', icon: <Eye className="w-4 h-4" />, onClick: (row) => router.push(`/finance/expenses/${row.id}`) },
                    canUpdate && { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: (row) => router.push(`/finance/expenses/${row.id}/edit`) },
                    canDelete && { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: handleDeleteClick, danger: true },
                ].filter(Boolean)}
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

            <ConfirmModal
                isOpen={isBulkOpen}
                onClose={() => onBulkOpenChange(false)}
                onConfirm={() => handleBulkConfirm(selectedIds, clearSelection)}
                title={`Delete ${selectedCount} expenses?`}
                message="Selected expenses will be soft-deleted and hidden from listings."
                confirmLabel="Delete"
                type="danger"
                isLoading={isBulkLoading}
            />
        </ListPageLayout>
    );
}

// Mobile Expense Card
function ExpenseMobileCard({ expense, actions, onClick }) {
    return (
        <MobileCard onClick={onClick} actions={actions}>
            <MobileCard.Header>
                <div className="flex-1 min-w-0">
                    <MobileCard.Title>{expense.description}</MobileCard.Title>
                    <MobileCard.Subtitle>{expense.vendor || 'No vendor'}</MobileCard.Subtitle>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-red-600">-{formatCurrency(expense.amount)}</p>
                    <StatusBadge status={expense.payment_status} type="payment" />
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
