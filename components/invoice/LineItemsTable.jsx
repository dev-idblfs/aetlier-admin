/**
 * Line Items Table Component
 * Handles add/edit/remove line items with service dropdown
 */
'use client';

import { useMemo } from 'react';
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

export default function LineItemsTable({
    items = [],
    onChange,
    services = [],
    isLoadingServices = false,
    readonly = false,
    showTax = true,
}) {
    console.log('services', services);

    const handleAddItem = () => {
        const newItem = {
            id: Date.now(),
            service_id: null,
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_rate: 0,
        };
        onChange([...items, newItem]);
    };

    const handleRemoveItem = (index) => {
        if (items.length === 1) {
            toast.error('At least one line item is required');
            return;
        }
        onChange(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...items];
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

        onChange(updated);
    };

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

        // Ensure all columns are valid objects
        return cols.filter(col => col && col.key && col.label !== undefined);
    }, [showTax, readonly]);

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                    <TableBody items={items} emptyContent={
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No items added yet</p>
                            <p className="text-xs mt-1">Click &quot;Add Line Item&quot; to start adding services</p>
                        </div>
                    }>
                        {(item) => {
                            const index = items.indexOf(item);

                            return (
                                <TableRow key={item.id || index}>
                                    {columns.filter(Boolean).map((column) => {
                                        // Service column
                                        if (column.key === 'service') {
                                            return (
                                                <TableCell key={column.key}>
                                                    {!readonly ? (
                                                        <Select
                                                            size="sm"
                                                            placeholder="Select servicessss"
                                                            selectedKeys={item.service_id ? [item.service_id] : []}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'service_id', e.target.value)
                                                            }
                                                            isDisabled={isLoadingServices}
                                                            startContent={<Search className="w-3 h-3" />}
                                                        >
                                                            {services.map((service) => (
                                                                <SelectItem key={service.id} value={service.id}>
                                                                    {service.name}
                                                                </SelectItem>
                                                            ))}
                                                        </Select>
                                                    ) : (
                                                        <span className="text-sm text-gray-600">
                                                            {item.service_name || services.find((s) => s.id === item.service_id)?.service_name || '-'}
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
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'description', e.target.value)
                                                            }
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
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)
                                                            }
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
                                                            value={item.unit_price}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
                                                            }
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
                                                            value={item.tax_rate}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'tax_rate', parseFloat(e.target.value) || 0)
                                                            }
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
                                                            onPress={() => handleRemoveItem(index)}
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
                            );
                        }}
                    </TableBody>
                </Table>
            </div>

            {/* Add Item Button */}
            {
                !readonly && (
                    <Button
                        color="primary"
                        variant="flat"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={handleAddItem}
                        fullWidth
                    >
                        Add Line Item
                    </Button>
                )
            }
        </div >
    );
}
