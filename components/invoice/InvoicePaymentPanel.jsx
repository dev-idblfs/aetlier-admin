'use client';

import { Card, CardBody } from '@heroui/react';
import { formatCurrency, formatDate } from '@/utils/dateFormatters';

/**
 * Compact payment summary + history for invoice detail.
 */
export default function InvoicePaymentPanel({
    amountPaid = 0,
    balanceDue = 0,
    showBalanceDue = false,
    payments = [],
}) {
    const hasPayments = payments?.length > 0;
    const hasSummary = amountPaid > 0 || showBalanceDue;

    if (!hasSummary && !hasPayments) return null;

    return (
        <div className="space-y-3">
            {hasSummary && (
                <Card className="bg-gray-50 shadow-none border border-gray-200">
                    <CardBody className="py-3 gap-2">
                        {amountPaid > 0 && (
                            <div className="flex justify-between text-sm text-success-600">
                                <span>Amount paid</span>
                                <span className="font-semibold">
                                    {formatCurrency(amountPaid)}
                                </span>
                            </div>
                        )}
                        {showBalanceDue && (
                            <div className="flex justify-between text-base font-bold text-primary">
                                <span>Balance due</span>
                                <span>{formatCurrency(balanceDue)}</span>
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {hasPayments && (
                <Card className="shadow-none border border-gray-200">
                    <CardBody className="py-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Payment history
                        </h4>
                        <div className="space-y-2">
                            {payments.map((payment, index) => (
                                <div
                                    key={payment.id || index}
                                    className="flex justify-between items-start text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium">
                                            {formatCurrency(payment.amount)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(payment.payment_date)} ·{' '}
                                            {payment.payment_method}
                                        </p>
                                        {payment.notes && (
                                            <p className="text-xs text-gray-600 mt-0.5 truncate">
                                                {payment.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
