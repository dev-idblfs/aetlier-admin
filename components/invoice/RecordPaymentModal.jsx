'use client';

import { useEffect, useMemo } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
} from '@heroui/react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency } from '@/utils/dateFormatters';
import { cn } from '@/utils/cn';

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'PAYTM', label: 'Paytm' },
    { value: 'OTHER', label: 'Other' },
];

const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value);

function buildPaymentSchema(maxAmount) {
    return z.object({
        amount: z.coerce
            .number()
            .min(0.01, 'Enter an amount greater than 0')
            .max(
                maxAmount,
                `Amount cannot exceed ${formatCurrency(maxAmount)}`
            ),
        payment_method: z.enum(PAYMENT_METHOD_VALUES, {
            errorMap: () => ({ message: 'Select a payment method' }),
        }),
        notes: z.string().optional(),
    });
}

/**
 * Record payment against an invoice — self-contained modal with consistent layout.
 */
export default function RecordPaymentModal({
    isOpen,
    onClose,
    invoiceNumber,
    balanceDue = 0,
    onSubmit,
    isLoading = false,
}) {
    const maxAmount = Math.max(0, Number(balanceDue) || 0);
    const schema = useMemo(() => buildPaymentSchema(maxAmount), [maxAmount]);

    const methods = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            amount: maxAmount,
            payment_method: 'CASH',
            notes: '',
        },
    });

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = methods;

    useEffect(() => {
        if (isOpen && maxAmount > 0) {
            reset({
                amount: maxAmount,
                payment_method: 'CASH',
                notes: '',
            });
        }
    }, [isOpen, maxAmount, reset]);

    const handleClose = () => {
        reset();
        onClose?.();
    };

    const onFormSubmit = handleSubmit(async (data) => {
        await onSubmit({
            amount: Number(data.amount),
            payment_method: data.payment_method,
            notes: data.notes?.trim() || undefined,
        });
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="md"
            placement="center"
            scrollBehavior="inside"
            classNames={{
                backdrop: 'bg-black/50 backdrop-blur-sm',
                base: 'border border-gray-200 bg-white shadow-xl',
                header: 'border-b border-gray-100',
                body: 'py-6',
                footer: 'border-t border-gray-100',
            }}
        >
            <ModalContent>
                <FormProvider {...methods}>
                    <form onSubmit={onFormSubmit}>
                        <ModalHeader className="flex flex-col gap-1">
                            <span>Record Payment</span>
                            {invoiceNumber && (
                                <span className="text-sm font-normal text-gray-500">
                                    {invoiceNumber}
                                </span>
                            )}
                        </ModalHeader>

                        <ModalBody className="flex flex-col gap-6">
                            {/* Balance due — matches invoice summary total styling */}
                            <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                                <p className="text-sm text-gray-600 mb-1">Balance due</p>
                                <p className="text-3xl font-bold text-primary-600 tabular-nums">
                                    {formatCurrency(maxAmount)}
                                </p>
                            </div>

                            {/* Payment amount — full width */}
                            <div className="space-y-2">
                                <Controller
                                    name="amount"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            value={field.value === 0 ? '' : String(field.value ?? '')}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            type="number"
                                            label="Payment amount"
                                            labelPlacement="outside"
                                            placeholder="0.00"
                                            min={0.01}
                                            max={maxAmount}
                                            step="0.01"
                                            isRequired
                                            isInvalid={!!errors.amount}
                                            errorMessage={errors.amount?.message}
                                            startContent={
                                                <span className="text-gray-500 text-sm font-medium">
                                                    ₹
                                                </span>
                                            }
                                            description={`Maximum ${formatCurrency(maxAmount)}`}
                                            classNames={{
                                                inputWrapper:
                                                    'bg-white border border-gray-200',
                                            }}
                                        />
                                    )}
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="flat"
                                    className="text-primary"
                                    onPress={() => setValue('amount', maxAmount, { shouldValidate: true })}
                                >
                                    Pay full balance
                                </Button>
                            </div>

                            {/* Payment method — chip grid (no broken Select) */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">
                                    Payment method{' '}
                                    <span className="text-danger">*</span>
                                </p>
                                <Controller
                                    name="payment_method"
                                    control={control}
                                    render={({ field }) => (
                                        <>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {PAYMENT_METHODS.map((method) => {
                                                    const selected = field.value === method.value;
                                                    return (
                                                        <button
                                                            key={method.value}
                                                            type="button"
                                                            className={cn(
                                                                'px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left',
                                                                selected
                                                                    ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                                            )}
                                                            onClick={() =>
                                                                field.onChange(method.value)
                                                            }
                                                        >
                                                            {method.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {errors.payment_method && (
                                                <p className="text-xs text-danger mt-1">
                                                    {errors.payment_method.message}
                                                </p>
                                            )}
                                        </>
                                    )}
                                />
                            </div>

                            {/* Notes — full width */}
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        label="Notes (optional)"
                                        labelPlacement="outside"
                                        placeholder="Reference number, cheque details, etc."
                                        minRows={3}
                                        classNames={{
                                            inputWrapper:
                                                'bg-white border border-gray-200',
                                        }}
                                    />
                                )}
                            />
                        </ModalBody>

                        <ModalFooter className="gap-2">
                            <Button
                                type="button"
                                variant="flat"
                                onPress={handleClose}
                                isDisabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                isLoading={isLoading}
                                isDisabled={maxAmount <= 0}
                            >
                                Record payment
                            </Button>
                        </ModalFooter>
                    </form>
                </FormProvider>
            </ModalContent>
        </Modal>
    );
}
