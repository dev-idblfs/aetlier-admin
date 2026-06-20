/**
 * Form Field Components
 * Reusable form fields with consistent styling
 */

'use client';

import { useState } from 'react';
import { Input, Textarea, Select, SelectItem, Switch, Button, DatePicker } from '@heroui/react';
import { X } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import { parseDate } from '@internationalized/date';
import { cn } from '@/utils/cn';
import FormFileUpload from './FormFileUpload';

/**
 * Helper to get control from props or context
 */
const useFormControl = (control) => {
    const context = useFormContext();
    return control || context?.control;
};

/**
 * Form Section
 * Groups related fields with a title
 */
export function FormSection({ title, description, children, className = '' }) {
    return (
        <div className={cn('space-y-4', className)}>
            {(title || description) && (
                <div>
                    {title && <h4 className="font-medium text-gray-900">{title}</h4>}
                    {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

/**
 * Form Row
 * Responsive grid for form fields
 */
const ROW_COLUMNS = {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2 lg:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

export function FormRow({ children, columns = 2, className = '' }) {
    return (
        <div className={cn('grid grid-cols-1 gap-3', ROW_COLUMNS[columns], className)}>
            {children}
        </div>
    );
}

/**
 * Form Input
 * Styled input with outside label
 */
export function FormInput({
    name,
    control,
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    isRequired = false,
    isDisabled = false,
    description,
    errorMessage,
    startContent,
    endContent,
    className = '',
    ...props
}) {
    const activeControl = useFormControl(control);

    if (name && activeControl) {
        return (
            <Controller
                name={name}
                control={activeControl}
                render={({ field, fieldState: { error } }) => (
                    <Input
                        {...field}
                        label={label}
                        labelPlacement="outside"
                        placeholder={placeholder}
                        type={type}
                        isRequired={isRequired}
                        isDisabled={isDisabled}
                        description={description}
                        errorMessage={error?.message || errorMessage}
                        isInvalid={!!error || !!errorMessage}
                        startContent={startContent}
                        endContent={endContent}
                        classNames={{
                            inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
                        }}
                        className={className}
                        {...props}
                    />
                )}
            />
        );
    }

    return (
        <Input
            label={label}
            labelPlacement="outside"
            placeholder={placeholder}
            type={type}
            value={value}
            onChange={onChange}
            isRequired={isRequired}
            isDisabled={isDisabled}
            description={description}
            errorMessage={errorMessage}
            startContent={startContent}
            endContent={endContent}
            classNames={{
                inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
            }}
            className={className}
            {...props}
        />
    );
}

/**
 * Form Textarea
 * Styled textarea with outside label
 */
export function FormTextarea({
    name,
    control,
    label,
    value,
    onChange,
    placeholder,
    isRequired = false,
    isDisabled = false,
    minRows = 3,
    description,
    className = '',
    errorMessage,
    ...props
}) {
    const activeControl = useFormControl(control);

    if (name && activeControl) {
        return (
            <Controller
                name={name}
                control={activeControl}
                render={({ field, fieldState: { error } }) => (
                    <Textarea
                        {...field}
                        label={label}
                        labelPlacement="outside"
                        placeholder={placeholder}
                        isRequired={isRequired}
                        isDisabled={isDisabled}
                        minRows={minRows}
                        description={description}
                        errorMessage={error?.message || errorMessage}
                        isInvalid={!!error || !!errorMessage}
                        classNames={{
                            inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
                        }}
                        className={className}
                        {...props}
                    />
                )}
            />
        );
    }

    return (
        <Textarea
            label={label}
            labelPlacement="outside"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            isRequired={isRequired}
            isDisabled={isDisabled}
            minRows={minRows}
            description={description}
            errorMessage={errorMessage}
            classNames={{
                inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
            }}
            className={className}
            {...props}
        />
    );
}

/**
 * Form Select
 * Styled select with outside label
 */
export function FormSelect({
    name,
    control,
    label,
    selectedKeys,
    onSelectionChange,
    placeholder,
    isRequired = false,
    isDisabled = false,
    description,
    errorMessage,
    children,
    className = '',
    selectionMode = "single",
    ...props
}) {
    const activeControl = useFormControl(control);

    if (name && activeControl) {
        return (
            <Controller
                name={name}
                control={activeControl}
                render={({ field, fieldState: { error } }) => {
                    const keys = field.value
                        ? (Array.isArray(field.value) ? new Set(field.value) : new Set([field.value]))
                        : new Set([]);

                    return (
                        <Select
                            label={label}
                            labelPlacement="outside"
                            placeholder={placeholder}
                            selectedKeys={keys}
                            onSelectionChange={(k) => {
                                const arr = Array.from(k);
                                const value =
                                    selectionMode === 'multiple' ? arr : arr[0];
                                if (
                                    value !== undefined &&
                                    value !== null &&
                                    value !== ''
                                ) {
                                    field.onChange(value);
                                }
                            }}
                            isRequired={isRequired}
                            isDisabled={isDisabled}
                            description={description}
                            errorMessage={error?.message || errorMessage}
                            isInvalid={!!error || !!errorMessage}
                            selectionMode={selectionMode}
                            classNames={{
                                trigger: 'bg-white border border-gray-200 hover:border-gray-300',
                            }}
                            className={className}
                            {...props}
                        >
                            {children}
                        </Select>
                    );
                }}
            />
        );
    }

    return (
        <Select
            label={label}
            labelPlacement="outside"
            placeholder={placeholder}
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
            isRequired={isRequired}
            isDisabled={isDisabled}
            description={description}
            errorMessage={errorMessage}
            selectionMode={selectionMode}
            classNames={{
                trigger: 'bg-white border border-gray-200 hover:border-gray-300',
            }}
            className={className}
            {...props}
        >
            {children}
        </Select>
    );
}

/**
 * Form Switch Row
 * Switch with label and description in a row layout
 */
export function FormSwitchRow({
    name,
    control,
    label,
    description,
    isSelected,
    onValueChange,
    isDisabled = false,
    className = '',
}) {
    const activeControl = useFormControl(control);

    if (name && activeControl) {
        return (
            <Controller
                name={name}
                control={activeControl}
                render={({ field }) => (
                    <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${className}`}>
                        <div className="flex-1 min-w-0 mr-3">
                            <p className="font-medium text-gray-900 text-sm">{label}</p>
                            {description && <p className="text-xs text-gray-500">{description}</p>}
                        </div>
                        <Switch
                            isSelected={field.value}
                            onValueChange={field.onChange}
                            isDisabled={isDisabled}
                            size="sm"
                        />
                    </div>
                )}
            />
        );
    }

    return (
        <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${className}`}>
            <div className="flex-1 min-w-0 mr-3">
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
            <Switch
                isSelected={isSelected}
                onValueChange={onValueChange}
                isDisabled={isDisabled}
                size="sm"
            />
        </div>
    );
}

/**
 * Form Divider
 * Visual separator between form sections
 */
export function FormDivider({ className = '' }) {
    return <div className={cn('border-t border-gray-100 my-4', className)} />;
}

/**
 * Form DatePicker — ISO date string (YYYY-MM-DD) in form state.
 */
export function FormDatePicker({
    name,
    control,
    label,
    placeholder,
    isRequired = false,
    isDisabled = false,
    description,
    className = '',
    errorMessage,
    ...props
}) {
    const activeControl = useFormControl(control);

    if (name && activeControl) {
        return (
            <Controller
                name={name}
                control={activeControl}
                render={({ field, fieldState: { error } }) => {
                    const dateValue =
                        field.value && typeof field.value === 'string'
                            ? parseDate(field.value)
                            : null;

                    return (
                        <DatePicker
                            label={label}
                            labelPlacement="outside"
                            placeholder={placeholder}
                            value={dateValue}
                            onChange={(date) => {
                                if (!date) {
                                    field.onChange('');
                                    return;
                                }
                                const iso = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                                field.onChange(iso);
                            }}
                            isRequired={isRequired}
                            isDisabled={isDisabled}
                            description={description}
                            errorMessage={error?.message || errorMessage}
                            isInvalid={!!error || !!errorMessage}
                            classNames={{
                                inputWrapper:
                                    'bg-white border border-gray-200 hover:border-gray-300',
                            }}
                            className={className}
                            {...props}
                        />
                    );
                }}
            />
        );
    }

    return null;
}

/**
 * FormTagInput
 * Tag/chip list input wired to react-hook-form when name + control provided.
 */
export function FormTagInput({
    name,
    control,
    label,
    placeholder = 'Type and press Enter',
    value,
    onValueChange,
    tags = [],
    onAdd,
    onRemove,
    className = '',
    errorMessage,
}) {
    const activeControl = useFormControl(control);

    if (name && activeControl) {
        return (
            <Controller
                name={name}
                control={activeControl}
                render={({ field, fieldState: { error } }) => {
                    const tagList = Array.isArray(field.value) ? field.value : [];
                    const [inputValue, setInputValue] = useState('');

                    const addTag = () => {
                        const trimmed = inputValue.trim();
                        if (!trimmed) return;
                        if (tagList.includes(trimmed)) {
                            setInputValue('');
                            return;
                        }
                        field.onChange([...tagList, trimmed]);
                        setInputValue('');
                    };

                    const removeTag = (idx) => {
                        field.onChange(tagList.filter((_, i) => i !== idx));
                    };

                    const handleKeyDown = (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                        }
                    };

                    const displayError = error?.message || errorMessage;

                    return (
                        <div className={className}>
                            {label && (
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {label}
                                </label>
                            )}
                            <div className="flex gap-2 mb-3">
                                <Input
                                    placeholder={placeholder}
                                    value={inputValue}
                                    onValueChange={setInputValue}
                                    onKeyDown={handleKeyDown}
                                    labelPlacement="outside"
                                    isInvalid={!!displayError}
                                    errorMessage={displayError}
                                    classNames={{
                                        inputWrapper:
                                            'bg-white border border-gray-200 hover:border-gray-300',
                                    }}
                                />
                                <Button
                                    type="button"
                                    color="primary"
                                    variant="flat"
                                    className="shrink-0 self-end"
                                    onPress={addTag}
                                >
                                    Add
                                </Button>
                            </div>
                            {tagList.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tagList.map((tag, idx) => (
                                        <span
                                            key={`${tag}-${idx}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm border border-primary-100"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(idx)}
                                                className="hover:text-primary-900 transition-colors"
                                                aria-label={`Remove ${tag}`}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }}
            />
        );
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onAdd?.();
        }
    };

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className="flex gap-2 mb-3">
                <Input
                    placeholder={placeholder}
                    value={value}
                    onValueChange={onValueChange}
                    onKeyDown={handleKeyDown}
                    labelPlacement="outside"
                    isInvalid={!!errorMessage}
                    errorMessage={errorMessage}
                    classNames={{
                        inputWrapper: 'bg-white border border-gray-200 hover:border-gray-300',
                    }}
                />
                <Button
                    type="button"
                    color="primary"
                    variant="flat"
                    className="shrink-0 self-end"
                    onPress={onAdd}
                >
                    Add
                </Button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                        <span
                            key={`${tag}-${idx}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm border border-primary-100"
                        >
                            {tag}
                            <button
                                type="button"
                                onClick={() => onRemove?.(idx)}
                                className="hover:text-primary-900 transition-colors"
                                aria-label={`Remove ${tag}`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * RHF-aware file upload — stores selected File or null in form state.
 */
export function FormFileUploadField({
    name,
    control,
    label,
    description,
    accept = 'image/*',
    maxSizeMb = 5,
    compact = false,
    disabled = false,
    className = '',
}) {
    const activeControl = useFormControl(control);

    if (!name || !activeControl) return null;

    return (
        <Controller
            name={name}
            control={activeControl}
            render={({ field, fieldState: { error } }) => (
                <div className={className}>
                    <FormFileUpload
                        label={label}
                        description={description}
                        accept={accept}
                        maxSizeMb={maxSizeMb}
                        compact={compact}
                        disabled={disabled}
                        onFileSelect={(file) => field.onChange(file ?? null)}
                        onChange={() => field.onChange(null)}
                    />
                    {error?.message && (
                        <p className="mt-1 text-sm text-red-600">{error.message}</p>
                    )}
                </div>
            )}
        />
    );
}
