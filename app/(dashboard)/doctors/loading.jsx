/**
 * Doctors Loading State
 * Shown during page transitions for better UX
 */

export default function DoctorsLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 animate-pulse">
            {/* Page Header Skeleton */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-56 bg-gray-200 rounded"></div>
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

            {/* Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 w-28 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="mt-6 flex items-center justify-center">
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
