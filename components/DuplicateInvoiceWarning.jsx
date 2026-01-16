/**
 * DuplicateInvoiceWarning - Component to display potential duplicate invoices
 */
'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Card, CardBody } from '@heroui/react';
import { AlertTriangle, FileText, Calendar, DollarSign } from 'lucide-react';

export default function DuplicateInvoiceWarning({
    isOpen,
    onClose,
    onConfirm,
    duplicates = [],
    isLoading = false
}) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <span>Potential Duplicate Invoices Detected</span>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <p className="text-foreground/80">
                            We found {duplicates.length} invoice{duplicates.length > 1 ? 's' : ''} that might be duplicate{duplicates.length > 1 ? 's' : ''}.
                            Please review before proceeding.
                        </p>

                        <div className="space-y-3">
                            {duplicates.map((invoice) => (
                                <Card key={invoice.id} className="border border-warning/30 bg-warning/5">
                                    <CardBody className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-foreground/60" />
                                                    <span className="font-semibold">
                                                        {invoice.invoice_number}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${invoice.status === 'PAID'
                                                            ? 'bg-success-100 text-success-700'
                                                            : invoice.status === 'PARTIALLY_PAID'
                                                                ? 'bg-warning-100 text-warning-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {invoice.status}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-foreground/70">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(invoice.invoice_date)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-3.5 h-3.5" />
                                                        {formatCurrency(invoice.grand_total)}
                                                    </div>
                                                </div>

                                                {invoice.customer_name && (
                                                    <p className="text-sm text-foreground/60">
                                                        Customer: {invoice.customer_name}
                                                    </p>
                                                )}

                                                {invoice.appointment_id && (
                                                    <p className="text-xs text-foreground/50">
                                                        Appointment ID: {invoice.appointment_id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                            <p className="text-sm text-foreground/80">
                                <strong>Note:</strong> Creating this invoice may result in duplicate charges.
                                Please verify that this is a new transaction before proceeding.
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="default"
                        variant="flat"
                        onPress={onClose}
                        isDisabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="warning"
                        onPress={onConfirm}
                        isLoading={isLoading}
                    >
                        Create Anyway
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
