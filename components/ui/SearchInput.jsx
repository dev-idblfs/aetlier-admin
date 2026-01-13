/**
 * Reusable Search Input Component
 * Mobile-first responsive search with clear button
 */

'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@heroui/react';

export default function SearchInput({
    value = '',
    onChange,
    placeholder = 'Search...',
    className = '',
    size = 'sm',
    fullWidth = false,
}) {
    const handleClear = () => {
        onChange?.('');
    };

    return (
        <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            startContent={<Search className="w-4 h-4 text-gray-400 shrink-0" />}
            endContent={
                value && (
                    <button
                        onClick={handleClear}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        type="button"
                    >
                        <X className="w-3 h-3 text-gray-400" />
                    </button>
                )
            }
            classNames={{
                inputWrapper: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
                input: 'text-sm',
            }}
            size={size}
            className={`${fullWidth ? 'w-full' : 'w-full sm:w-64'} ${className}`}
        />
    );
}
