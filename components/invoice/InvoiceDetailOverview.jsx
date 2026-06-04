'use client';

import { formatDate } from '@/utils/dateFormatters';
import { InvoiceSection } from '@/components/ui';

/**
 * Compact customer + dates overview for invoice detail view.
 */
export default function InvoiceDetailOverview({ invoice, isOverdue = false }) {
    if (!invoice) return null;

    const address =
        typeof invoice.customer_address === 'string'
            ? invoice.customer_address
            : invoice.customer_address
              ? JSON.stringify(invoice.customer_address)
              : null;

    return (
        <InvoiceSection title="Overview" compact>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="col-span-2 lg:col-span-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
                    <p className="font-semibold text-gray-900 truncate">
                        {invoice.customer_name || 'N/A'}
                    </p>
                    {(invoice.customer_email || invoice.customer_phone) && (
                        <p className="text-xs text-gray-600 truncate">
                            {[invoice.customer_email, invoice.customer_phone]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    )}
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Invoice date</p>
                    <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Due date</p>
                    <p className={`font-medium ${isOverdue ? 'text-danger' : ''}`}>
                        {formatDate(invoice.due_date)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Terms</p>
                    <p className="font-medium">{invoice.payment_terms || 'N/A'}</p>
                </div>
                {address && (
                    <div className="col-span-2 lg:col-span-4 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                        <p className="text-sm text-gray-700 truncate">{address}</p>
                    </div>
                )}
            </div>
        </InvoiceSection>
    );
}
