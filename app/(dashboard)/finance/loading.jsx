/**
 * Finance Dashboard Loading State
 * Shown during page transitions for better UX
 */

export default function FinanceLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 animate-pulse">
            {/* Page Header Skeleton */}
            <div className="mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>

            {/* Date Range Selector Skeleton */}
            <div className="flex justify-end mb-6">
                <div className="w-48 h-10 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Financial Metrics Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="h-8 w-28 bg-gray-200 rounded mb-1"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Invoices & Expenses Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                    <div className="flex-1">
                                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-6 bg-gray-200 rounded"></div>
                                        <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
