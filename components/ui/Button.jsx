/**
 * Reusable Button Component
 */

'use client';

import { Button as HeroButton } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
};

const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    isDisabled = false,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}, ref) => {
    return (
        <HeroButton
            ref={ref}
            isDisabled={isDisabled || isLoading}
            className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-colors duration-200 focus:outline-none focus:ring-2 
        focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50
        disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : leftIcon ? (
                leftIcon
            ) : null}
            {children}
            {!isLoading && rightIcon}
        </HeroButton>
    );
});

Button.displayName = 'Button';

export default Button;
