/**
 * Form Field Components
 * Reusable form fields with consistent styling
 */

'use client';

import { Input, Textarea, Select, SelectItem, Switch } from '@heroui/react';

/**
 * Form Section
 * Groups related fields with a title
 */
export function FormSection({ title, description, children, className = '' }) {
    return (
        <div className={`space-y-4 ${className}`}>
            {(title || description) && (
                <div className="mb-2">
                    {title && <h4 className="font-medium text-gray-900">{title}</h4>}
                    {description && <p className="text-sm text-gray-500">{description}</p>}
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
export function FormRow({ children, columns = 2, className = '' }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-${columns} gap-4 ${className}`}>
            {children}
        </div>
    );
}

/**
 * Form Input
 * Styled input with outside label
 */
export function FormInput({
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
    label,
    value,
    onChange,
    placeholder,
    isRequired = false,
    isDisabled = false,
    minRows = 3,
    description,
    className = '',
    ...props
}) {
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
    label,
    selectedKeys,
    onSelectionChange,
    placeholder,
    isRequired = false,
    isDisabled = false,
    description,
    children,
    className = '',
    ...props
}) {
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
    label,
    description,
    isSelected,
    onValueChange,
    isDisabled = false,
    className = '',
}) {
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
    return <div className={`border-t border-gray-200 my-4 ${className}`} />;
}
