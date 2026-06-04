/**
 * Invoice detail loading — server-safe skeleton.
 */

export default function InvoiceDetailLoading() {
    return (
        <div className="p-4 md:p-6 animate-pulse max-w-6xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
                <div className="h-7 w-40 bg-gray-200 rounded" />
                <div className="flex gap-2">
                    <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                    <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm h-32" />
                    <div className="bg-white rounded-xl p-4 shadow-sm h-48" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm h-64" />
            </div>
        </div>
    );
}
