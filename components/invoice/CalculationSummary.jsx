/**
 * Calculation Summary Component
 * Displays subtotal, tax, discount, coins, and total
 */
'use client';

import { Card, CardBody, Divider, Input, Select, SelectItem } from '@heroui/react';
import { calculateInvoiceTotal } from '@/utils/invoice/calculations';
import { Percent, DollarSign, Coins, Calculator } from 'lucide-react';

export default function CalculationSummary({
    lineItems = [],
    discountType = 'PERCENTAGE',
    discountValue = 0,
    coinsRedeemed = 0,
    onDiscountTypeChange,
    onDiscountValueChange,
    readonly = false,
    showCoins = true,
    highlightTotal = true,
    className = '',
}) {
    const calculations = calculateInvoiceTotal({
        lineItems,
        discountType,
        discountValue,
        coinsRedeemed,
    });

    const discountTypes = [
        { key: 'PERCENTAGE', label: 'Percentage' },
        { key: 'FIXED', label: 'Fixed Amount' },
    ];

    return (
        <Card className={`shadow-md ${className}`}>
            <CardBody className="gap-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
                </div>

                <Divider />

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-lg font-semibold">₹{calculations.subtotal.toFixed(2)}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-lg font-semibold text-blue-600">
                        +₹{calculations.totalTax.toFixed(2)}
                    </span>
                </div>

                {/* Discount Section */}
                <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Discount</span>
                    </div>

                    {!readonly ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Select
                                size="sm"
                                label="Type"
                                selectedKeys={[discountType]}
                                onChange={(e) => onDiscountTypeChange(e.target.value)}
                            >
                                {discountTypes.map((type) => (
                                    <SelectItem key={type.key} value={type.key}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </Select>

                            <Input
                                type="number"
                                size="sm"
                                label="Value"
                                value={discountValue}
                                onChange={(e) =>
                                    onDiscountValueChange(parseFloat(e.target.value) || 0)
                                }
                                min="0"
                                step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                                max={discountType === 'PERCENTAGE' ? '100' : undefined}
                                endContent={
                                    discountType === 'PERCENTAGE' ? (
                                        <Percent className="w-3 h-3 text-gray-400" />
                                    ) : (
                                        <DollarSign className="w-3 h-3 text-gray-400" />
                                    )
                                }
                            />
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600">
                            {discountType === 'PERCENTAGE'
                                ? `${discountValue}%`
                                : `₹${parseFloat(discountValue || 0).toFixed(2)}`}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                        <span className="text-sm text-green-700">Discount Amount</span>
                        <span className="text-lg font-bold text-green-700">
                            -₹{parseFloat(calculations.discount || 0).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Coins Redeemed */}
                {showCoins && coinsRedeemed > 0 && (
                    <div className="flex justify-between items-center p-3 bg-warning-50 rounded-lg border border-warning-200">
                        <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-warning-600" />
                            <span className="text-warning-900">Coins Redeemed</span>
                        </div>
                        <span className="text-lg font-bold text-warning-700">
                            -₹{parseFloat(coinsRedeemed || 0).toFixed(2)}
                        </span>
                    </div>
                )}

                <Divider />

                {/* Total */}
                <div
                    className={`flex justify-between items-center ${highlightTotal ? 'p-4 bg-primary-50 rounded-lg border-2 border-primary-300' : ''
                        }`}
                >
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-primary-600">
                        ₹{parseFloat(calculations.total || 0).toFixed(2)}
                    </span>
                </div>

                {/* Breakdown Info (collapsed by default) */}
                {!readonly && (
                    <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 rounded">
                        <p>• Subtotal: ₹{parseFloat(calculations.subtotal || 0).toFixed(2)}</p>
                        <p>• After Tax: ₹{(parseFloat(calculations.subtotal || 0) + parseFloat(calculations.totalTax || 0)).toFixed(2)}</p>
                        <p>• After Discount: ₹{parseFloat(calculations.afterDiscount || 0).toFixed(2)}</p>
                        {showCoins && coinsRedeemed > 0 && (
                            <p>• After Coins: ₹{(parseFloat(calculations.afterDiscount || 0) - parseFloat(coinsRedeemed || 0)).toFixed(2)}</p>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
