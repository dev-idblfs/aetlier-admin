'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { Controller, useFormContext } from 'react-hook-form';
import { FormTagInput } from '@/components/ui/FormFields';
import { cn } from '@/utils/cn';

const inputClassNames = {
    inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
};

const compactInputClassNames = {
    inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300 min-h-9 h-9',
};

function TagListField({ label, value, onChange, compact = false }) {
    const [input, setInput] = useState('');
    const tags = Array.isArray(value) ? value : [];

    if (compact) {
        return (
            <div className="space-y-2">
                {label && (
                    <p className="text-xs font-medium text-gray-600">{label}</p>
                )}
                <div className="flex gap-2">
                    <Input
                        size="sm"
                        placeholder="Add item, press Enter"
                        value={input}
                        onValueChange={setInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const next = input.trim();
                                if (!next) return;
                                onChange([...tags, next]);
                                setInput('');
                            }
                        }}
                        classNames={compactInputClassNames}
                        className="flex-1"
                    />
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={() => {
                            const next = input.trim();
                            if (!next) return;
                            onChange([...tags, next]);
                            setInput('');
                        }}
                    >
                        Add
                    </Button>
                </div>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag, idx) => (
                            <span
                                key={`${tag}-${idx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md text-xs border border-primary-100"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => onChange(tags.filter((_, i) => i !== idx))}
                                    className="hover:text-primary-900"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <FormTagInput
            label={label}
            value={input}
            onValueChange={setInput}
            tags={tags}
            onAdd={() => {
                const next = input.trim();
                if (!next) return;
                onChange([...tags, next]);
                setInput('');
            }}
            onRemove={(tagIndex) => {
                onChange(tags.filter((_, index) => index !== tagIndex));
            }}
        />
    );
}

function RepeaterField({ field, item, index, onUpdate, compact = false }) {
    const value = item[field.key] ?? (field.type === 'tags' ? [] : '');

    if (field.showWhen && !field.showWhen(item)) {
        return null;
    }

    const size = compact ? 'sm' : 'md';
    const labelPlacement = compact ? 'outside' : 'outside';

    if (field.type === 'select') {
        return (
            <Select
                size={size}
                label={compact ? undefined : field.label}
                labelPlacement={labelPlacement}
                placeholder={compact ? field.label : undefined}
                selectedKeys={value ? [String(value)] : []}
                onSelectionChange={(keys) => {
                    const next = Array.from(keys)[0] || '';
                    onUpdate(index, { ...item, [field.key]: next });
                }}
                isRequired={field.required}
                classNames={compact ? compactInputClassNames : inputClassNames}
            >
                {(field.options || []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </Select>
        );
    }

    if (field.type === 'textarea') {
        return (
            <Textarea
                size={size}
                label={compact ? undefined : field.label}
                labelPlacement={labelPlacement}
                placeholder={compact ? field.label : undefined}
                value={value || ''}
                onValueChange={(next) => onUpdate(index, { ...item, [field.key]: next })}
                minRows={compact ? 2 : (field.minRows || 3)}
                classNames={inputClassNames}
            />
        );
    }

    if (field.type === 'tags') {
        return (
            <TagListField
                label={field.label}
                value={value}
                onChange={(nextTags) => {
                    onUpdate(index, { ...item, [field.key]: nextTags });
                }}
                compact={compact}
            />
        );
    }

    return (
        <Input
            size={size}
            label={compact ? undefined : field.label}
            labelPlacement={labelPlacement}
            placeholder={compact ? field.label : undefined}
            type={field.type || 'text'}
            value={value ?? ''}
            onValueChange={(next) => {
                const parsed =
                    field.type === 'number' && next !== ''
                        ? Number(next)
                        : next;
                onUpdate(index, { ...item, [field.key]: parsed });
            }}
            min={field.min}
            isRequired={field.required}
            classNames={compact ? compactInputClassNames : inputClassNames}
        />
    );
}

export default function FormRepeater({
    name,
    label,
    description,
    emptyItem,
    fields,
    addLabel = 'Add row',
    className = '',
    reorderable = false,
    compact = false,
    inline = false,
}) {
    const { control } = useFormContext();

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const items = Array.isArray(field.value) ? field.value : [];

                const updateItems = (nextItems) => {
                    field.onChange(
                        nextItems.map((item, index) => ({
                            ...item,
                            sort_order: item.sort_order ?? index,
                        }))
                    );
                };

                const updateItem = (index, nextItem) => {
                    const nextItems = [...items];
                    nextItems[index] = nextItem;
                    updateItems(nextItems);
                };

                const addItem = () => {
                    updateItems([...items, { ...emptyItem, sort_order: items.length }]);
                };

                const removeItem = (index) => {
                    updateItems(items.filter((_, i) => i !== index));
                };

                const moveItem = (index, direction) => {
                    const target = index + direction;
                    if (target < 0 || target >= items.length) return;
                    const nextItems = [...items];
                    [nextItems[index], nextItems[target]] = [
                        nextItems[target],
                        nextItems[index],
                    ];
                    updateItems(nextItems);
                };

                return (
                    <div className={cn(compact ? 'space-y-2' : 'space-y-3', className)}>
                        {(label || description) && (
                            <div>
                                {label && (
                                    <p className={cn(
                                        'font-medium text-gray-900',
                                        compact ? 'text-xs text-gray-600' : 'text-sm'
                                    )}>
                                        {label}
                                    </p>
                                )}
                                {description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                                )}
                            </div>
                        )}

                        {items.length === 0 && compact && (
                            <p className="text-xs text-gray-400">None added</p>
                        )}

                        {items.length === 0 && !compact && (
                            <p className="text-sm text-gray-500">No items added yet.</p>
                        )}

                        {items.map((item, index) => (
                            inline ? (
                                <div
                                    key={`${name}-${index}`}
                                    className="flex items-end gap-2"
                                >
                                    {fields.map((fieldConfig) => (
                                        <div
                                            key={fieldConfig.key}
                                            className={cn(
                                                'min-w-0',
                                                fieldConfig.key === 'amount' ? 'w-28 shrink-0' : 'flex-1'
                                            )}
                                        >
                                            <RepeaterField
                                                field={fieldConfig}
                                                item={item}
                                                index={index}
                                                onUpdate={updateItem}
                                                compact
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        className="shrink-0 mb-0.5"
                                        onPress={() => removeItem(index)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    key={`${name}-${index}`}
                                    className={cn(
                                        compact
                                            ? 'rounded-md border border-gray-200 bg-white p-2 space-y-2'
                                            : 'rounded-lg border border-gray-200 bg-gray-50/60 p-3 space-y-3'
                                    )}
                                >
                                    <div className={cn(
                                        'flex items-center gap-1',
                                        compact ? 'justify-end' : 'justify-between'
                                    )}>
                                        {!compact && (
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Item {index + 1}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1">
                                        {reorderable && (
                                                <>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => moveItem(index, -1)}
                                                        isDisabled={index === 0}
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => moveItem(index, 1)}
                                                        isDisabled={index === items.length - 1}
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onPress={() => removeItem(index)}
                                            >
                                                <Trash2 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        compact
                                            ? 'grid grid-cols-1 sm:grid-cols-2 gap-2'
                                            : 'grid grid-cols-1 md:grid-cols-2 gap-3'
                                    )}>
                                        {fields.map((fieldConfig) => (
                                            <div
                                                key={fieldConfig.key}
                                                className={fieldConfig.fullWidth ? 'sm:col-span-2' : ''}
                                            >
                                                <RepeaterField
                                                    field={fieldConfig}
                                                    item={item}
                                                    index={index}
                                                    onUpdate={updateItem}
                                                    compact={compact}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}

                        <Button
                            size={compact ? 'sm' : 'md'}
                            variant="flat"
                            startContent={<Plus className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
                            onPress={addItem}
                            className={compact ? 'h-8' : ''}
                        >
                            {addLabel}
                        </Button>
                    </div>
                );
            }}
        />
    );
}
