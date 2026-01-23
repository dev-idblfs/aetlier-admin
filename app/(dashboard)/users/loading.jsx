/**
 * Users Loading State
 * Shown during page transitions for better UX
 */

export default function UsersLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 animate-pulse">
            {/* Page Header Skeleton */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                </div>
                <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Filters Skeleton */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-5 gap-4 p-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="grid grid-cols-5 gap-4 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="h-4 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
