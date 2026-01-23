/**
 * Finance Dashboard Page
 * Overview of financial metrics with charts and quick actions
 */

'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    FileText,
    Receipt,
    ArrowRight,
    Calendar,
    DollarSign,
    CreditCard,
    AlertCircle,
    Clock,
    CheckCircle,
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Skeleton,
    Select,
    SelectItem,
} from '@heroui/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader, StatusBadge, LinkButton } from '@/components/ui';
import { useGetFinancialDashboardQuery, useGetInvoicesQuery, useGetExpensesQuery } from '@/redux/services/api';
import { formatDate, formatCurrency } from '@/utils/dateFormatters';

// Date range options
const dateRangeOptions = [
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'this_quarter', label: 'This Quarter' },
    { key: 'this_year', label: 'This Year' },
    { key: 'last_year', label: 'Last Year' },
];

function getDateRange(rangeKey) {
    const now = new Date();
    let dateFrom, dateTo;

    switch (rangeKey) {
        case 'this_month':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
            dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'last_month':
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            dateTo = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'this_quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            dateFrom = new Date(now.getFullYear(), quarter * 3, 1);
            dateTo = new Date(now.getFullYear(), quarter * 3 + 3, 0);
            break;
        case 'this_year':
            dateFrom = new Date(now.getFullYear(), 0, 1);
            dateTo = new Date(now.getFullYear(), 11, 31);
            break;
        case 'last_year':
            dateFrom = new Date(now.getFullYear() - 1, 0, 1);
            dateTo = new Date(now.getFullYear() - 1, 11, 31);
            break;
        default:
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
            dateTo = now;
    }

    return {
        date_from: dateFrom.toISOString().split('T')[0],
        date_to: dateTo.toISOString().split('T')[0],
    };
}

export default function FinanceDashboardPage() {
    const [dateRange, setDateRange] = useState('this_month');
    const { date_from, date_to } = getDateRange(dateRange);

    const { data: dashboard, isLoading } = useGetFinancialDashboardQuery({ date_from, date_to });
    const { data: recentInvoices } = useGetInvoicesQuery({ page: 1, page_size: 5 });
    const { data: recentExpenses } = useGetExpensesQuery({ page: 1, page_size: 5 });

    const stats = useMemo(() => {
        if (!dashboard) return null;
        return {
            totalRevenue: dashboard.total_revenue || 0,
            totalExpenses: dashboard.total_expenses || 0,
            netProfit: dashboard.net_profit || 0,
            paidInvoices: dashboard.paid_invoices || 0,
            pendingInvoices: dashboard.pending_invoices || 0,
            overdueInvoices: dashboard.overdue_invoices || 0,
            totalOutstanding: dashboard.total_outstanding || 0,
        };
    }, [dashboard]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Finance Dashboard"
                description="Overview of your financial performance"
                actions={
                    <div className="flex gap-2">
                        <Select
                            selectedKeys={[dateRange]}
                            onSelectionChange={(keys) => setDateRange(Array.from(keys)[0])}
                            className="w-40"
                            size="sm"
                            classNames={{ trigger: 'bg-white' }}
                        >
                            {dateRangeOptions.map((option) => (
                                <SelectItem key={option.key} value={option.key}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                }
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickActionCard
                    href="/finance/invoices/new"
                    icon={FileText}
                    label="New Invoice"
                    color="primary"
                />
                <QuickActionCard
                    href="/finance/expenses/new"
                    icon={Receipt}
                    label="New Expense"
                    color="warning"
                />
                <QuickActionCard
                    href="/finance/customers/new"
                    icon={DollarSign}
                    label="New Customer"
                    color="success"
                />
                <QuickActionCard
                    href="/finance/reports"
                    icon={TrendingUp}
                    label="View Reports"
                    color="secondary"
                />
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={stats?.totalRevenue}
                    icon={TrendingUp}
                    color="success"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total Expenses"
                    value={stats?.totalExpenses}
                    icon={TrendingDown}
                    color="danger"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Net Profit"
                    value={stats?.netProfit}
                    icon={Wallet}
                    color={stats?.netProfit >= 0 ? 'success' : 'danger'}
                    isLoading={isLoading}
                />
            </div>

            {/* Invoice Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStatCard
                    title="Paid"
                    value={stats?.paidInvoices}
                    icon={CheckCircle}
                    color="success"
                    isLoading={isLoading}
                    isCount
                />
                <MiniStatCard
                    title="Pending"
                    value={stats?.pendingInvoices}
                    icon={Clock}
                    color="warning"
                    isLoading={isLoading}
                    isCount
                />
                <MiniStatCard
                    title="Overdue"
                    value={stats?.overdueInvoices}
                    icon={AlertCircle}
                    color="danger"
                    isLoading={isLoading}
                    isCount
                />
                <MiniStatCard
                    title="Outstanding"
                    value={stats?.totalOutstanding}
                    icon={CreditCard}
                    color="primary"
                    isLoading={isLoading}
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
                        <LinkButton
                            href="/finance/invoices"
                            variant="light"
                            size="sm"
                            endContent={<ArrowRight className="w-4 h-4" />}
                        >
                            View All
                        </LinkButton>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="divide-y">
                            {recentInvoices?.invoices?.slice(0, 5).map((invoice) => (
                                <Link
                                    key={invoice.id}
                                    href={`/finance/invoices/${invoice.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                                        <p className="text-sm text-gray-500">{invoice.customer_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                                        <InvoiceStatusBadge status={invoice.status} />
                                    </div>
                                </Link>
                            )) || (
                                    <div className="p-8 text-center text-gray-500">
                                        No invoices yet
                                    </div>
                                )}
                        </div>
                    </CardBody>
                </Card>

                {/* Recent Expenses */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
                        <LinkButton
                            href="/finance/expenses"
                            variant="light"
                            size="sm"
                            endContent={<ArrowRight className="w-4 h-4" />}
                        >
                            View All
                        </LinkButton>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="divide-y">
                            {recentExpenses?.items?.slice(0, 5).map((expense) => (
                                <Link
                                    key={expense.id}
                                    href={`/finance/expenses/${expense.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{expense.description}</p>
                                        <p className="text-sm text-gray-500">{expense.category_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-red-600">-{formatCurrency(expense.amount)}</p>
                                        <p className="text-xs text-gray-500">{formatDate(expense.expense_date)}</p>
                                    </div>
                                </Link>
                            )) || (
                                    <div className="p-8 text-center text-gray-500">
                                        No expenses yet
                                    </div>
                                )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

// Quick Action Card
function QuickActionCard({ href, icon: Icon, label, color }) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                    p-4 rounded-xl border bg-white cursor-pointer transition-shadow hover:shadow-md
                    flex flex-col items-center gap-2 text-center
                `}
            >
                <div className={`p-3 rounded-full bg-${color}-100`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{label}</span>
            </motion.div>
        </Link>
    );
}

// Stat Card
function StatCard({ title, value, icon: Icon, color, isLoading }) {
    const colorClasses = {
        success: 'bg-green-50 text-green-600 border-green-200',
        danger: 'bg-red-50 text-red-600 border-red-200',
        warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        primary: 'bg-blue-50 text-blue-600 border-blue-200',
    };

    return (
        <Card className={`border ${colorClasses[color]}`}>
            <CardBody className="flex flex-row items-center gap-4 p-6">
                <div className={`p-3 rounded-full bg-white`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-600">{title}</p>
                    {isLoading ? (
                        <Skeleton className="h-8 w-32 mt-1" />
                    ) : (
                        <p className="text-2xl font-bold">{formatCurrency(value)}</p>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}

// Mini Stat Card
function MiniStatCard({ title, value, icon: Icon, color, isLoading, isCount = false }) {
    return (
        <Card className="border">
            <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{title}</span>
                    <Icon className={`w-4 h-4 text-${color}-500`} />
                </div>
                {isLoading ? (
                    <Skeleton className="h-6 w-20" />
                ) : (
                    <p className="text-xl font-bold text-gray-900">
                        {isCount ? value : formatCurrency(value)}
                    </p>
                )}
            </CardBody>
        </Card>
    );
}

// Invoice Status Badge
function InvoiceStatusBadge({ status }) {
    const statusConfig = {
        PAID: { color: 'success', label: 'Paid' },
        PARTIALLY_PAID: { color: 'warning', label: 'Partial' },
        PENDING: { color: 'default', label: 'Pending' },
        OVERDUE: { color: 'danger', label: 'Overdue' },
        CANCELLED: { color: 'default', label: 'Cancelled' },
        DRAFT: { color: 'default', label: 'Draft' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
        <Chip size="sm" color={config.color} variant="flat">
            {config.label}
        </Chip>
    );
}
