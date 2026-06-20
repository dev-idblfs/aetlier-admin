'use client';

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { cn } from '@/utils/cn';

const DEFAULT_MAX_MB = 5;

export default function FormFileUpload({
    accept = 'image/*',
    maxSizeMb = DEFAULT_MAX_MB,
    value,
    onChange,
    onFileSelect,
    label,
    description,
    className = '',
    disabled = false,
    compact = false,
}) {
    const inputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const maxBytes = maxSizeMb * 1024 * 1024;
        if (file.size > maxBytes) {
            toast.error(`File size must be less than ${maxSizeMb}MB`);
            event.target.value = '';
            return;
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }

        onFileSelect?.(file);
        event.target.value = '';
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onChange?.('');
        onFileSelect?.(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const displayUrl = previewUrl || value;

    if (compact) {
        return (
            <div className={cn('flex items-start gap-3', className)}>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    disabled={disabled}
                    onChange={handleSelect}
                />

                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        'relative shrink-0 rounded-lg border border-dashed border-gray-300',
                        'bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden',
                        'flex items-center justify-center w-20 h-20'
                    )}
                >
                    {displayUrl ? (
                        <img
                            src={displayUrl}
                            alt="Service"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                <div className="min-w-0 pt-0.5">
                    {label && (
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<Upload className="w-3.5 h-3.5" />}
                            onPress={() => inputRef.current?.click()}
                            isDisabled={disabled}
                        >
                            {displayUrl ? 'Change' : 'Upload'}
                        </Button>
                        {displayUrl && !disabled && (
                            <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={handleRemove}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    {description && (
                        <p className="text-xs text-gray-500 mt-1">{description}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {description && (
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                disabled={disabled}
                onChange={handleSelect}
            />

            {displayUrl ? (
                <div className="relative inline-block">
                    <img
                        src={displayUrl}
                        alt="Upload preview"
                        className="w-32 h-32 rounded-lg object-cover border border-gray-200 bg-gray-50"
                    />
                    {!disabled && (
                        <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="flat"
                            className="absolute -top-2 -right-2"
                            onPress={handleRemove}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            ) : (
                <Button
                    variant="flat"
                    startContent={<Upload className="w-4 h-4" />}
                    onPress={() => inputRef.current?.click()}
                    isDisabled={disabled}
                >
                    Choose file
                </Button>
            )}
        </div>
    );
}
