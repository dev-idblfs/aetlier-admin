/**
 * Finance Reports Page
 * Dashboard-style reports with charts and export options
 */

'use client';

import { useState, useMemo } from 'react';
import {
    BarChart3,
    Download,
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Receipt,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import {
    Button,
    Select,
    SelectItem,
    Card,
    CardBody,
    CardHeader,
    Tabs,
    Tab,
    Spinner,
    Divider,
    Progress,
} from '@heroui/react';
import { PageHeader } from '@/components/ui';
import {
    useGetFinancialDashboardQuery,
    useGetRevenueReportQuery,
    useGetExpenseReportQuery,
    useGetProfitLossReportQuery,
    useGetTaxSummaryReportQuery,
} from '@/redux/services/api';
import { formatCurrency, formatDate } from '@/utils/dateFormatters';

const dateRanges = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
];

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState('this_month');
    const [activeTab, setActiveTab] = useState('overview');

    // Calculate date range
    const dateParams = useMemo(() => {
        const now = new Date();
        let start_date, end_date;

        switch (dateRange) {
            case 'this_month':
                start_date = new Date(now.getFullYear(), now.getMonth(), 1);
                end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                start_date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end_date = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this_quarter':
                const q1 = Math.floor(now.getMonth() / 3) * 3;
                start_date = new Date(now.getFullYear(), q1, 1);
                end_date = new Date(now.getFullYear(), q1 + 3, 0);
                break;
            case 'last_quarter':
                const q2 = Math.floor(now.getMonth() / 3) * 3 - 3;
                start_date = new Date(now.getFullYear(), q2, 1);
                end_date = new Date(now.getFullYear(), q2 + 3, 0);
                break;
            case 'this_year':
                start_date = new Date(now.getFullYear(), 0, 1);
                end_date = new Date(now.getFullYear(), 11, 31);
                break;
            case 'last_year':
                start_date = new Date(now.getFullYear() - 1, 0, 1);
                end_date = new Date(now.getFullYear() - 1, 11, 31);
                break;
            default:
                start_date = new Date(now.getFullYear(), now.getMonth(), 1);
                end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        return {
            start_date: start_date.toISOString().split('T')[0],
            end_date: end_date.toISOString().split('T')[0],
        };
    }, [dateRange]);

    const { data: dashboard, isLoading: dashboardLoading } = useGetFinancialDashboardQuery(dateParams);
    const { data: revenue, isLoading: revenueLoading } = useGetRevenueReportQuery(dateParams);
    const { data: expenses, isLoading: expensesLoading } = useGetExpenseReportQuery(dateParams);
    const { data: profitLoss, isLoading: plLoading } = useGetProfitLossReportQuery(dateParams);
    const { data: taxSummary, isLoading: taxLoading } = useGetTaxSummaryReportQuery(dateParams);

    const isLoading = dashboardLoading || revenueLoading || expensesLoading || plLoading || taxLoading;

    const handleExport = (type) => {
        // This would be implemented with actual export logic
        console.log(`Exporting ${activeTab} as ${type}`);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Financial Reports"
                description="View and analyze your financial data"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="flat"
                            startContent={<Download className="w-4 h-4" />}
                            onPress={() => handleExport('pdf')}
                        >
                            Export PDF
                        </Button>
                        <Button
                            variant="flat"
                            startContent={<Download className="w-4 h-4" />}
                            onPress={() => handleExport('excel')}
                        >
                            Export Excel
                        </Button>
                    </div>
                }
            />

            {/* Date Range Selector */}
            <Card>
                <CardBody className="p-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Date Range</span>
                        </div>
                        <Select
                            selectedKeys={[dateRange]}
                            onSelectionChange={(keys) => setDateRange(Array.from(keys)[0])}
                            className="w-full sm:w-48"
                            size="sm"
                            classNames={{ trigger: 'bg-white' }}
                        >
                            {dateRanges.map((range) => (
                                <SelectItem key={range.value} value={range.value}>
                                    {range.label}
                                </SelectItem>
                            ))}
                        </Select>
                        <div className="text-sm text-gray-500 ml-auto">
                            {dateParams.start_date} to {dateParams.end_date}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Report Tabs */}
            <Tabs
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
                aria-label="Report types"
                classNames={{
                    tabList: 'bg-white p-1 rounded-lg shadow-sm overflow-x-auto',
                    tab: 'px-4 py-2',
                }}
            >
                <Tab key="overview" title={<TabLabel icon={<BarChart3 />} label="Overview" />}>
                    <OverviewTab dashboard={dashboard} isLoading={dashboardLoading} />
                </Tab>
                <Tab key="revenue" title={<TabLabel icon={<TrendingUp />} label="Revenue" />}>
                    <RevenueTab data={revenue} isLoading={revenueLoading} />
                </Tab>
                <Tab key="expenses" title={<TabLabel icon={<Receipt />} label="Expenses" />}>
                    <ExpensesTab data={expenses} isLoading={expensesLoading} />
                </Tab>
                <Tab key="profit-loss" title={<TabLabel icon={<DollarSign />} label="P&L" />}>
                    <ProfitLossTab data={profitLoss} isLoading={plLoading} />
                </Tab>
                <Tab key="tax" title={<TabLabel icon={<FileText />} label="Tax Summary" />}>
                    <TaxSummaryTab data={taxSummary} isLoading={taxLoading} />
                </Tab>
            </Tabs>
        </div>
    );
}

function TabLabel({ icon, label }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-4 h-4">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
        </div>
    );
}

// Overview Tab
function OverviewTab({ dashboard, isLoading }) {
    if (isLoading) return <LoadingState />;

    const stats = [
        {
            label: 'Total Revenue',
            value: formatCurrency(dashboard?.total_revenue || 0),
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Total Expenses',
            value: formatCurrency(dashboard?.total_expenses || 0),
            icon: <TrendingDown className="w-5 h-5" />,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            label: 'Net Profit',
            value: formatCurrency(dashboard?.net_profit || 0),
            icon: <DollarSign className="w-5 h-5" />,
            color: (dashboard?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600',
            bgColor: (dashboard?.net_profit || 0) >= 0 ? 'bg-blue-50' : 'bg-red-50',
        },
        {
            label: 'Outstanding',
            value: formatCurrency(dashboard?.outstanding_amount || 0),
            icon: <FileText className="w-5 h-5" />,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
    ];

    return (
        <div className="space-y-6 mt-4">
            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-sm">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <span className={stat.color}>{stat.icon}</span>
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Invoice Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <h3 className="text-lg font-semibold">Invoice Summary</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="space-y-3">
                            <StatRow label="Total Invoices" value={dashboard?.total_invoices || 0} />
                            <StatRow label="Paid" value={dashboard?.paid_invoices || 0} color="text-green-600" />
                            <StatRow label="Pending" value={dashboard?.pending_invoices || 0} color="text-amber-600" />
                            <StatRow label="Overdue" value={dashboard?.overdue_invoices || 0} color="text-red-600" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <h3 className="text-lg font-semibold">Collection Status</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-500">Collection Rate</span>
                                    <span className="text-sm font-medium">
                                        {((dashboard?.paid_invoices || 0) / Math.max(dashboard?.total_invoices || 1, 1) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <Progress
                                    value={(dashboard?.paid_invoices || 0) / Math.max(dashboard?.total_invoices || 1, 1) * 100}
                                    color="success"
                                    className="h-2"
                                />
                            </div>
                            <Divider />
                            <StatRow
                                label="Amount Collected"
                                value={formatCurrency(dashboard?.total_revenue - (dashboard?.outstanding_amount || 0))}
                                color="text-green-600"
                            />
                            <StatRow
                                label="Amount Pending"
                                value={formatCurrency(dashboard?.outstanding_amount || 0)}
                                color="text-amber-600"
                            />
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

// Revenue Tab
function RevenueTab({ data, isLoading }) {
    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-6 mt-4">
            <Card>
                <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
                </CardHeader>
                <CardBody className="pt-0">
                    <div className="space-y-4">
                        <StatRow
                            label="Total Revenue"
                            value={formatCurrency(data?.total_revenue || 0)}
                            color="text-green-600"
                            large
                        />
                        <Divider />
                        {data?.by_service?.map((service, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <span className="text-gray-600">{service.service_name || 'Uncategorized'}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500">{service.invoice_count} invoices</span>
                                    <span className="font-medium">{formatCurrency(service.total)}</span>
                                </div>
                            </div>
                        )) || <p className="text-gray-500">No revenue data</p>}
                    </div>
                </CardBody>
            </Card>

            {data?.by_month && (
                <Card>
                    <CardHeader className="pb-2">
                        <h3 className="text-lg font-semibold">Monthly Revenue</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="space-y-3">
                            {data.by_month.map((month, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span className="text-gray-600">{month.month}</span>
                                    <span className="font-medium">{formatCurrency(month.total)}</span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

// Expenses Tab
function ExpensesTab({ data, isLoading }) {
    if (isLoading) return <LoadingState />;

    const totalExpenses = data?.total_expenses || 0;

    return (
        <div className="space-y-6 mt-4">
            <Card>
                <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Expense Breakdown by Category</h3>
                </CardHeader>
                <CardBody className="pt-0">
                    <div className="space-y-4">
                        <StatRow
                            label="Total Expenses"
                            value={formatCurrency(totalExpenses)}
                            color="text-red-600"
                            large
                        />
                        <Divider />
                        {data?.by_category?.map((cat, idx) => {
                            const percentage = totalExpenses > 0 ? (cat.total / totalExpenses * 100) : 0;
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{cat.category_name || 'Uncategorized'}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                                            <span className="font-medium">{formatCurrency(cat.total)}</span>
                                        </div>
                                    </div>
                                    <Progress value={percentage} color="danger" className="h-1" />
                                </div>
                            );
                        }) || <p className="text-gray-500">No expense data</p>}
                    </div>
                </CardBody>
            </Card>

            {data?.by_payment_method && (
                <Card>
                    <CardHeader className="pb-2">
                        <h3 className="text-lg font-semibold">By Payment Method</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="space-y-3">
                            {data.by_payment_method.map((method, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span className="text-gray-600">{method.payment_method || 'Unknown'}</span>
                                    <span className="font-medium">{formatCurrency(method.total)}</span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

// Profit & Loss Tab
function ProfitLossTab({ data, isLoading }) {
    if (isLoading) return <LoadingState />;

    const netProfit = (data?.total_revenue || 0) - (data?.total_expenses || 0);
    const isProfit = netProfit >= 0;

    return (
        <div className="space-y-6 mt-4">
            <Card>
                <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Profit & Loss Statement</h3>
                </CardHeader>
                <CardBody className="pt-0">
                    <div className="space-y-4">
                        {/* Revenue */}
                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 font-medium">Total Revenue</span>
                                </div>
                                <span className="text-xl font-bold text-green-600">
                                    {formatCurrency(data?.total_revenue || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="p-4 bg-red-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700 font-medium">Total Expenses</span>
                                </div>
                                <span className="text-xl font-bold text-red-600">
                                    {formatCurrency(data?.total_expenses || 0)}
                                </span>
                            </div>
                        </div>

                        <Divider />

                        {/* Net Profit */}
                        <div className={`p-4 rounded-lg ${isProfit ? 'bg-blue-50' : 'bg-red-50'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <DollarSign className={`w-5 h-5 ${isProfit ? 'text-blue-600' : 'text-red-600'}`} />
                                    <span className={`font-medium ${isProfit ? 'text-blue-700' : 'text-red-700'}`}>
                                        {isProfit ? 'Net Profit' : 'Net Loss'}
                                    </span>
                                </div>
                                <span className={`text-2xl font-bold ${isProfit ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatCurrency(Math.abs(netProfit))}
                                </span>
                            </div>
                        </div>

                        {/* Profit Margin */}
                        {data?.total_revenue > 0 && (
                            <div className="text-center text-sm text-gray-500">
                                Profit Margin: <span className="font-medium">{((netProfit / data.total_revenue) * 100).toFixed(1)}%</span>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

// Tax Summary Tab
function TaxSummaryTab({ data, isLoading }) {
    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-6 mt-4">
            <Card>
                <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Tax Summary</h3>
                </CardHeader>
                <CardBody className="pt-0">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600">Tax Collected (Output GST)</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {formatCurrency(data?.tax_collected || 0)}
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Tax Paid (Input GST)</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {formatCurrency(data?.tax_paid || 0)}
                                </p>
                            </div>
                        </div>

                        <Divider />

                        <div className="p-4 bg-amber-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-amber-700 font-medium">Net Tax Liability</span>
                                <span className="text-xl font-bold text-amber-600">
                                    {formatCurrency((data?.tax_collected || 0) - (data?.tax_paid || 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {data?.by_tax_rate && (
                <Card>
                    <CardHeader className="pb-2">
                        <h3 className="text-lg font-semibold">Tax by Rate</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <div className="space-y-3">
                            {data.by_tax_rate.map((rate, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <span className="text-gray-600">GST @ {rate.rate}%</span>
                                    <span className="font-medium">{formatCurrency(rate.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

// Stat Row
function StatRow({ label, value, color = 'text-gray-900', large = false }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-500">{label}</span>
            <span className={`font-${large ? 'bold' : 'medium'} ${large ? 'text-xl' : ''} ${color}`}>
                {value}
            </span>
        </div>
    );
}

// Loading State
function LoadingState() {
    return (
        <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
        </div>
    );
}
