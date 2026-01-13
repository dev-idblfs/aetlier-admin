/**
 * Reusable Card Component
 */

'use client';

import { forwardRef } from 'react';

const Card = forwardRef(({
    children,
    className = '',
    padding = 'md',
    hover = false,
    ...props
}, ref) => {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            ref={ref}
            className={`
        bg-white rounded-2xl border border-gray-100 shadow-sm
        ${paddingStyles[padding]}
        ${hover ? 'hover:shadow-md hover:border-gray-200 transition-all cursor-pointer' : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

// Card Header
export const CardHeader = ({ children, className = '' }) => (
    <div className={`border-b border-gray-100 pb-4 mb-4 ${className}`}>
        {children}
    </div>
);

// Card Title
export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
        {children}
    </h3>
);

// Card Description
export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-gray-500 mt-1 ${className}`}>
        {children}
    </p>
);

// Card Content
export const CardContent = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

// Card Footer
export const CardFooter = ({ children, className = '' }) => (
    <div className={`border-t border-gray-100 pt-4 mt-4 ${className}`}>
        {children}
    </div>
);

export default Card;
