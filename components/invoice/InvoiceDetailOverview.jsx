'use client';

import { formatDate } from '@/utils/dateFormatters';
import { InvoiceSection, EntityLink } from '@/components/ui';

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

  const customerHref = invoice.customer_id
    ? `/finance/customers?highlight=${invoice.customer_id}`
    : invoice.user_id
      ? `/users/${invoice.user_id}/edit`
      : null;

  const appointmentHref = invoice.appointment_id
    ? `/appointments/${invoice.appointment_id}`
    : null;

  return (
    <InvoiceSection title="Overview" compact>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
          <EntityLink href={customerHref} className="font-semibold truncate block">
            {invoice.customer_name || 'N/A'}
          </EntityLink>
          {(invoice.customer_email || invoice.customer_phone) && (
            <p className="text-xs text-gray-600 truncate">
              {[invoice.customer_email, invoice.customer_phone].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        {appointmentHref && (
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Appointment</p>
            <EntityLink href={appointmentHref} mono>
              {invoice.appointment_id}
            </EntityLink>
          </div>
        )}
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
        {invoice.email_attempt_count > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Email attempts</p>
            <p className="font-medium">{invoice.email_attempt_count}</p>
          </div>
        )}
        {address && (
          <div className="sm:col-span-2 lg:col-span-4 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
            <p className="text-sm text-gray-700 truncate">{address}</p>
          </div>
        )}
      </div>
    </InvoiceSection>
  );
}
