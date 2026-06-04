/**
 * Invoices list loading — server-safe skeleton (no client-only UI libs).
 */

export default function InvoicesLoading() {
    return (
        <div className="p-4 md:p-6 animate-pulse">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="h-7 w-36 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-52 bg-gray-200 rounded" />
                </div>
                <div className="h-9 w-28 bg-gray-200 rounded-lg" />
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 p-3">
                    <div className="grid grid-cols-5 gap-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-3 bg-gray-200 rounded" />
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="grid grid-cols-5 gap-3 p-3">
                            {[1, 2, 3, 4, 5].map((j) => (
                                <div key={j} className="h-4 bg-gray-200 rounded" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
