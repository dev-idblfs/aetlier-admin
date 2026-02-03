/**
 * Line Items Table Component
 * Handles add/edit/remove line items with service dropdown
 */
'use client';

import { useMemo, useCallback, memo } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Input,
    Button,
    Select,
    SelectItem,
    Tooltip,
} from '@heroui/react';
import { Plus, Trash2, Search } from 'lucide-react';
import { calculateLineItemTotal, calculateLineItemTax } from '@/utils/invoice/calculations';
import { toast } from 'react-hot-toast';

function LineItemsTable({
    items = [],
    onChange,
    services = [],
    isLoadingServices = false,
    readonly = false,
    showTax = true,
}) {
    const handleAddItem = useCallback(() => {
        const newItem = {
            id: Date.now(),
            service_id: null,
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: 0,
        };
        onChange([...items, newItem]);
    }, [items, onChange]);

    const handleRemoveItem = useCallback((index) => {
        if (items.length === 1) {
            toast.error('At least one line item is required');
            return;
        }
        onChange(items.filter((_, i) => i !== index));
    }, [items, onChange]);

    const handleItemChange = useCallback((index, field, value) => {
        onChange(prevItems => {
            const updated = [...prevItems];

            // Service IDs are UUIDs (strings), not numbers - no conversion needed
            updated[index] = { ...updated[index], [field]: value };

            // Auto-fill from service if selected
            if (field === 'service_id' && value) {
                const service = services.find((s) => s.id === value);

                if (service) {
                    updated[index] = {
                        ...updated[index],
                        description: service.name,
                        unit_price: parseFloat(service.price) || 0,
                    };
                }
            }

            return updated;
        });
    }, [services, onChange]);

    const columns = useMemo(() => {
        const cols = [
            { key: 'service', label: 'Service', width: '25%' },
            { key: 'description', label: 'Description', width: '25%' },
            { key: 'quantity', label: 'Qty', width: '10%' },
            { key: 'unit_price', label: 'Price', width: '15%' },
            { key: 'total', label: 'Total', width: '15%' },
        ];

        if (showTax === true) {
            cols.splice(4, 0, { key: 'tax_rate', label: 'Tax %', width: '10%' });
        }

        if (readonly === false) {
            cols.push({ key: 'actions', label: '', width: '5%' });
        }

        return cols.filter(col => col && col.key && col.label !== undefined);
    }, [showTax, readonly]);

    return (
        <div className="space-y-4">
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
                {items.map((item, index) => (
                    <div
                        key={item.id || index}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm relative"
                    >
                        {!readonly && (
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="absolute right-2 top-2 p-2 rounded-full hover:bg-gray-100 text-gray-500"
                                disabled={items.length === 1}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Service</span>
                                {!readonly ? (
                                    <Select
                                        size="sm"
                                        placeholder="Select service"
                                        selectedKeys={item.service_id ? [String(item.service_id)] : []}
                                        onSelectionChange={(keys) => {
                                            const selectedKey = Array.from(keys)[0];
                                            if (selectedKey) {
                                                handleItemChange(index, 'service_id', selectedKey);
                                            }
                                        }}
                                        isDisabled={isLoadingServices}
                                        startContent={<Search className="w-3 h-3" />}
                                    >
                                        {services.map((service) => (
                                            <SelectItem key={String(service.id)} value={String(service.id)}>
                                                {service.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                ) : (
                                    <span className="text-sm text-gray-700">
                                        {item.service_name || services.find((s) => s.id === item.service_id)?.name || '-'}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600">Description</span>
                                {!readonly ? (
                                    <Input
                                        size="sm"
                                        value={item.description}
                                        onValueChange={(value) => handleItemChange(index, 'description', value)}
                                        placeholder="Item description"
                                        isRequired
                                    />
                                ) : (
                                    <span className="text-sm text-gray-800">{item.description}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-600">Quantity</span>
                                    {!readonly ? (
                                        <Input
                                            type="number"
                                            size="sm"
                                            value={String(item.quantity)}
                                            onValueChange={(value) => handleItemChange(index, 'quantity', parseFloat(value) || 1)}
                                            min="1"
                                            step="1"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-800">{item.quantity}</span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-600">Unit Price</span>
                                    {!readonly ? (
                                        <Input
                                            type="number"
                                            size="sm"
                                            value={String(item.unit_price)}
                                            onValueChange={(value) => handleItemChange(index, 'unit_price', parseFloat(value) || 0)}
                                            min="0"
                                            step="0.01"
                                            startContent="₹"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-800">₹{item.unit_price}</span>
                                    )}
                                </div>
                            </div>

                            {showTax && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-gray-600">Tax %</span>
                                    {!readonly ? (
                                        <Input
                                            type="number"
                                            size="sm"
                                            value={String(item.tax_rate)}
                                            onValueChange={(value) => handleItemChange(index, 'tax_rate', parseFloat(value) || 0)}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            endContent="%"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-800">{item.tax_rate}%</span>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-600">Line total</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    ₹{(calculateLineItemTotal(item) + calculateLineItemTax(item)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-6 text-gray-500 border border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm">No items added yet</p>
                        <p className="text-xs mt-1">Tap &quot;Add Line Item&quot; to start adding services</p>
                    </div>
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[720px]">
                        <Table
                            aria-label="Invoice line items"
                            removeWrapper
                            classNames={{
                                th: 'bg-gray-50 text-gray-700 font-semibold border-b border-gray-200',
                                td: 'py-2',
                            }}
                        >
                            <TableHeader>
                                {columns.filter(Boolean).map((column) => (
                                    <TableColumn key={column.key} width={column.width}>
                                        {column.label}
                                    </TableColumn>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length}>
                                            <div className="text-center py-8 text-gray-500">
                                                <p className="text-sm">No items added yet</p>
                                                <p className="text-xs mt-1">Click &quot;Add Line Item&quot; to start adding services</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, rowIndex) => (
                                        <TableRow key={item.id || rowIndex}>
                                            {columns.filter(Boolean).map((column) => {
                                                // Service column
                                                if (column.key === 'service') {
                                                    return (
                                                        <TableCell key={column.key}>
                                                            {!readonly ? (
                                                                <Select
                                                                    size="sm"
                                                                    placeholder="Select service"
                                                                    selectedKeys={item.service_id ? [String(item.service_id)] : []}
                                                                    onSelectionChange={(keys) => {
                                                                        const selectedKey = Array.from(keys)[0];
                                                                        if (selectedKey) {
                                                                            handleItemChange(rowIndex, 'service_id', selectedKey);
                                                                        }
                                                                    }}
                                                                    isDisabled={isLoadingServices}
                                                                    startContent={<Search className="w-3 h-3" />}
                                                                >
                                                                    {services.map((service) => (
                                                                        <SelectItem key={String(service.id)} value={String(service.id)}>
                                                                            {service.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </Select>
                                                            ) : (
                                                                <span className="text-sm text-gray-600">
                                                                    {item.service_name || services.find((s) => s.id === item.service_id)?.name || '-'}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                }

                                                // Description column
                                                if (column.key === 'description') {
                                                    return (
                                                        <TableCell key={column.key}>
                                                            {!readonly ? (
                                                                <Input
                                                                    size="sm"
                                                                    value={item.description}
                                                                    onValueChange={(value) => handleItemChange(rowIndex, 'description', value)}
                                                                    placeholder="Item description"
                                                                    isRequired
                                                                />
                                                            ) : (
                                                                <span className="text-sm">{item.description}</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                }

                                                // Quantity column
                                                if (column.key === 'quantity') {
                                                    return (
                                                        <TableCell key={column.key}>
                                                            {!readonly ? (
                                                                <Input
                                                                    type="number"
                                                                    size="sm"
                                                                    value={String(item.quantity)}
                                                                    onValueChange={(value) => handleItemChange(rowIndex, 'quantity', parseFloat(value) || 1)}
                                                                    min="1"
                                                                    step="1"
                                                                />
                                                            ) : (
                                                                <span className="text-sm">{item.quantity}</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                }

                                                // Unit Price column
                                                if (column.key === 'unit_price') {
                                                    return (
                                                        <TableCell key={column.key}>
                                                            {!readonly ? (
                                                                <Input
                                                                    type="number"
                                                                    size="sm"
                                                                    value={String(item.unit_price)}
                                                                    onValueChange={(value) => handleItemChange(rowIndex, 'unit_price', parseFloat(value) || 0)}
                                                                    min="0"
                                                                    step="0.01"
                                                                    startContent="₹"
                                                                />
                                                            ) : (
                                                                <span className="text-sm">₹{item.unit_price}</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                }

                                                // Tax Rate column
                                                if (column.key === 'tax_rate') {
                                                    return (
                                                        <TableCell key={column.key}>
                                                            {!readonly ? (
                                                                <Input
                                                                    type="number"
                                                                    size="sm"
                                                                    value={String(item.tax_rate)}
                                                                    onValueChange={(value) => handleItemChange(rowIndex, 'tax_rate', parseFloat(value) || 0)}
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                    endContent="%"
                                                                />
                                                            ) : (
                                                                <span className="text-sm">{item.tax_rate}%</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                }

                                                // Total column
                                                if (column.key === 'total') {
                                                    return (
                                                        <TableCell key={column.key}>
                                                            <div className="text-sm font-semibold">
                                                                ₹{(calculateLineItemTotal(item) + calculateLineItemTax(item)).toFixed(2)}
                                                            </div>
                                                        </TableCell>
                                                    );
                                                }

                                                // Actions column
                                                if (column.key === 'actions') {
                                                    return (
                                                        <TableCell key={column.key}>
                                                            <Tooltip content="Remove item" color="danger">
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    variant="light"
                                                                    color="danger"
                                                                    onPress={() => handleRemoveItem(rowIndex)}
                                                                    isDisabled={items.length === 1}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </Tooltip>
                                                        </TableCell>
                                                    );
                                                }

                                                return null;
                                            })}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Add Item Button */}
            {!readonly && (
                <Button
                    color="primary"
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleAddItem}
                    fullWidth
                >
                    Add Line Item
                </Button>
            )}
        </div>
    );
}

export default memo(LineItemsTable);
