'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useGetSpecializationsQuery } from '@/redux/services/api';
import { Search, X, Check, ChevronDown, Sparkles } from '@/lib/icons';
import { Chip, Spinner } from '@/lib/heroui';
import { cn } from '@/utils/cn';

/**
 * Specialization Search & Multi-Select Dropdown
 * Connects to master specializations table with searchable filter, category groups, and tag chips.
 */
export function SpecializationSelectBase({
    value = [],
    onChange,
    label = 'Specializations',
    placeholder = 'Search & select specializations...',
    isRequired = false,
    isDisabled = false,
    description,
    errorMessage,
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const { data: specializations = [], isLoading, isError } = useGetSpecializationsQuery({
        is_active: true,
    });

    const selectedList = useMemo(() => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Unique categories
    const categories = useMemo(() => {
        const set = new Set();
        specializations.forEach((s) => {
            if (s.category) set.add(s.category);
        });
        return ['ALL', ...Array.from(set).sort()];
    }, [specializations]);

    // Filtered options based on search and category
    const filteredOptions = useMemo(() => {
        return specializations.filter((item) => {
            const matchesCategory =
                activeCategory === 'ALL' || item.category === activeCategory;
            const term = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !term ||
                item.name.toLowerCase().includes(term) ||
                (item.category && item.category.toLowerCase().includes(term)) ||
                (item.description && item.description.toLowerCase().includes(term));
            return matchesCategory && matchesSearch;
        });
    }, [specializations, searchTerm, activeCategory]);

    const handleToggle = (specName) => {
        if (isDisabled) return;
        const next = selectedList.includes(specName)
            ? selectedList.filter((s) => s !== specName)
            : [...selectedList, specName];
        onChange?.(next);
    };

    const handleRemove = (specName, e) => {
        e?.stopPropagation();
        if (isDisabled) return;
        onChange?.(selectedList.filter((s) => s !== specName));
    };

    const handleClearAll = (e) => {
        e?.stopPropagation();
        if (isDisabled) return;
        onChange?.([]);
    };

    return (
        <div ref={containerRef} className={cn('relative w-full space-y-1.5', className)}>
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">
                        {label} {isRequired && <span className="text-danger-500">*</span>}
                    </label>
                    {selectedList.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="text-[11px] font-medium text-gray-500 hover:text-danger-600 transition-colors"
                        >
                            Clear all ({selectedList.length})
                        </button>
                    )}
                </div>
            )}

            {/* Trigger Button / Input Box */}
            <div
                onClick={() => !isDisabled && setIsOpen((prev) => !prev)}
                className={cn(
                    'min-h-11 w-full px-3 py-2 rounded-xl bg-white border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs',
                    isOpen
                        ? 'border-primary-500 ring-2 ring-primary-100'
                        : 'border-gray-200 hover:border-gray-300',
                    errorMessage && 'border-danger-400 focus:border-danger-500 ring-danger-100',
                    isDisabled && 'opacity-60 bg-gray-50 cursor-not-allowed'
                )}
            >

                <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
                    {selectedList.length > 0 ? (
                        selectedList.map((spec) => (
                            <span
                                key={spec}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-900 border border-primary-200/60 transition-colors"
                            >
                                <span>{spec}</span>
                                {!isDisabled && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemove(spec, e)}
                                        className="text-primary-700 hover:text-danger-600 p-0.5 rounded-full hover:bg-primary-100"
                                        aria-label={`Remove ${spec}`}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-gray-400 select-none">
                            {placeholder}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                    {isLoading ? (
                        <Spinner size="sm" color="current" />
                    ) : (
                        <ChevronDown
                            className={cn(
                                'w-4 h-4 transition-transform duration-200',
                                isOpen && 'rotate-180 text-primary-600'
                            )}
                        />
                    )}
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Search bar inside dropdown */}
                    <div className="p-2.5 border-b border-gray-100 bg-gray-50/70 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by specialty name or category..."
                                className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Category filter pills */}
                        {categories.length > 2 && (
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            'text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap transition-colors',
                                            activeCategory === cat
                                                ? 'bg-primary-900 text-white font-semibold'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                        )}
                                    >
                                        {cat === 'ALL' ? 'All Categories' : cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 p-1">
                        {isLoading ? (
                            <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                <Spinner size="sm" />
                                <span>Loading specializations...</span>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-xs text-gray-400">
                                {searchTerm ? `No specializations matching "${searchTerm}"` : 'No specializations available'}
                            </div>
                        ) : (
                            filteredOptions.map((item) => {
                                const isSelected = selectedList.includes(item.name);
                                return (
                                    <div
                                        key={item.id || item.name}
                                        onClick={() => handleToggle(item.name)}
                                        className={cn(
                                            'group flex items-start justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-left',
                                            isSelected
                                                ? 'bg-primary-50/70 hover:bg-primary-100/60'
                                                : 'hover:bg-gray-50'
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'text-xs font-medium',
                                                        isSelected ? 'text-primary-950 font-semibold' : 'text-gray-900'
                                                    )}
                                                >
                                                    {item.name}
                                                </span>
                                                {item.category && (
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-500">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        <div
                                            className={cn(
                                                'w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                                                isSelected
                                                    ? 'bg-primary-600 border-primary-600 text-white'
                                                    : 'border-gray-300 group-hover:border-gray-400 bg-white'
                                            )}
                                        >
                                            {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Helper or Error message */}
            {errorMessage ? (
                <p className="text-[11px] text-danger-600">{errorMessage}</p>
            ) : description ? (
                <p className="text-[11px] text-gray-500">{description}</p>
            ) : null}
        </div>
    );
}

/**
 * FormSpecializationSelect with React Hook Form Controller integration
 */
export function FormSpecializationSelect({
    name = 'specializations',
    control,
    label = 'Specializations',
    placeholder = 'Search & select specializations...',
    isRequired = false,
    isDisabled = false,
    description,
    errorMessage,
    className = '',
    ...props
}) {
    const formContext = useFormContext();
    const activeControl = control || formContext?.control;

    if (name && activeControl) {
        return (
            <Controller
                name={name}
                control={activeControl}
                render={({ field, fieldState: { error } }) => (
                    <SpecializationSelectBase
                        value={field.value || []}
                        onChange={field.onChange}
                        label={label}
                        placeholder={placeholder}
                        isRequired={isRequired}
                        isDisabled={isDisabled}
                        description={description}
                        errorMessage={error?.message || errorMessage}
                        className={className}
                        {...props}
                    />
                )}
            />
        );
    }

    return (
        <SpecializationSelectBase
            label={label}
            placeholder={placeholder}
            isRequired={isRequired}
            isDisabled={isDisabled}
            description={description}
            errorMessage={errorMessage}
            className={className}
            {...props}
        />
    );
}

export default FormSpecializationSelect;
