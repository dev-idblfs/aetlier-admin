'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { cn } from '@/utils/cn';

const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
};

export default function ServiceThumbnail({
    src,
    alt = 'Service',
    size = 'sm',
    className = '',
}) {
    const [failed, setFailed] = useState(false);
    const dimension = sizes[size] || sizes.sm;

    if (!src || failed) {
        return (
            <div
                className={cn(
                    dimension,
                    'rounded-lg bg-primary-100 flex items-center justify-center shrink-0 border border-gray-200',
                    className
                )}
            >
                <Briefcase className={size === 'md' ? 'w-6 h-6 text-primary-600' : 'w-5 h-5 text-primary-600'} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={cn(
                dimension,
                'rounded-lg object-cover shrink-0 border border-gray-200 bg-gray-50',
                className
            )}
            onError={() => setFailed(true)}
        />
    );
}
