/**
 * Dashboard Loading State
 * Shown during page transitions for better UX
 */

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 animate-pulse">
            {/* Page Header Skeleton */}
            <div className="mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="w-16 h-5 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-8 w-20 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Content Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="w-16 h-6 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
