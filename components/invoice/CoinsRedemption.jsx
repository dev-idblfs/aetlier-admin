/**
 * Coins Redemption Component
 * Handles coin redemption with wallet integration and 50% policy
 */
'use client';

import { useState, useEffect } from 'react';
import { Input, Button, Card, CardBody, Spinner } from '@heroui/react';
import { Coins, Zap, Info, AlertCircle } from 'lucide-react';
import { calculateMaxRedeemable, validateCoinRedemption, formatCoins } from '@/utils/invoice/coinCalculations';
import { toast } from 'react-hot-toast';

export default function CoinsRedemption({
    value = 0,
    onChange,
    walletBalance = 0,
    subtotal = 0,
    discount = 0,
    isLoadingWallet = false,
    disabled = false,
    showWalletInfo = true,
}) {
    const [localValue, setLocalValue] = useState(value);
    const [error, setError] = useState('');

    // Calculate max redeemable based on 50% policy
    const maxRedeemable = calculateMaxRedeemable(walletBalance, subtotal, discount);
    const afterDiscount = Math.max(0, subtotal - discount);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (newValue) => {
        const coins = parseFloat(newValue) || 0;
        setLocalValue(coins);

        // Validate
        const validation = validateCoinRedemption(coins, maxRedeemable, walletBalance);
        if (!validation.valid) {
            setError(validation.error);
        } else {
            setError('');
            onChange(coins);
        }
    };

    const handleApplyMax = () => {
        if (maxRedeemable <= 0) {
            toast.error('No coins available to redeem');
            return;
        }

        setLocalValue(maxRedeemable);
        setError('');
        onChange(maxRedeemable);
        toast.success(`Applied ${maxRedeemable} coins (50% max policy)`);
    };

    const handleClear = () => {
        setLocalValue(0);
        setError('');
        onChange(0);
    };

    const redemptionPercentage = afterDiscount > 0 ? (localValue / afterDiscount * 100).toFixed(1) : 0;

    return (
        <Card className="bg-linear-to-br from-warning-50 to-warning-100 border border-warning-200">
            <CardBody className="gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-warning-600" />
                        <h3 className="font-semibold text-warning-900">Coin Redemption</h3>
                    </div>
                    {isLoadingWallet && <Spinner size="sm" color="warning" />}
                </div>

                {/* Wallet Info */}
                {showWalletInfo && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-warning-200">
                        <div>
                            <p className="text-xs text-gray-600">Available Coins</p>
                            <p className="text-lg font-bold text-warning-700">
                                {walletBalance.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Max Redeemable (50%)</p>
                            <p className="text-lg font-bold text-success-700">
                                {maxRedeemable.toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}

                {/* Policy Info Banner */}
                <div className="flex items-start gap-2 p-3 bg-warning-100 rounded-lg border border-warning-300">
                    <Info className="w-4 h-4 text-warning-700 mt-0.5 shrink-0" />
                    <div className="text-xs text-warning-800">
                        <p className="font-medium">50% Redemption Policy</p>
                        <p className="mt-1">
                            Maximum {maxRedeemable} coins can be redeemed (50% of ₹{afterDiscount.toFixed(2)})
                        </p>
                    </div>
                </div>

                {/* Coins Input */}
                <div className="space-y-2">
                    <Input
                        type="number"
                        label="Coins to Redeem"
                        labelPlacement="outside"
                        value={localValue}
                        onChange={(e) => handleChange(e.target.value)}
                        min="0"
                        max={maxRedeemable}
                        disabled={disabled || walletBalance === 0}
                        startContent={<Coins className="w-4 h-4 text-warning-500" />}
                        endContent={
                            localValue > 0 && (
                                <Button
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={handleClear}
                                    isIconOnly
                                >
                                    ×
                                </Button>
                            )
                        }
                        description={
                            localValue > 0
                                ? `${redemptionPercentage}% of subtotal after discount`
                                : 'Enter coins to redeem'
                        }
                        isInvalid={!!error}
                        errorMessage={error}
                        classNames={{
                            input: 'text-lg font-semibold',
                        }}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            color="warning"
                            variant="flat"
                            startContent={<Zap className="w-4 h-4" />}
                            onPress={handleApplyMax}
                            isDisabled={disabled || maxRedeemable === 0}
                            className="flex-1"
                        >
                            Apply Max (50%)
                        </Button>
                    </div>
                </div>

                {/* Warnings */}
                {walletBalance === 0 && (
                    <div className="flex items-start gap-2 p-3 bg-gray-100 rounded-lg border border-gray-300">
                        <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5" />
                        <p className="text-xs text-gray-700">
                            Customer has no coins available
                        </p>
                    </div>
                )}

                {afterDiscount === 0 && (
                    <div className="flex items-start gap-2 p-3 bg-gray-100 rounded-lg border border-gray-300">
                        <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5" />
                        <p className="text-xs text-gray-700">
                            No amount eligible for coin redemption
                        </p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
