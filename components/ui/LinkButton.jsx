/**
 * LinkButton Component
 * Combines Next.js Link navigation with HeroUI Button styling
 * Avoids invalid HTML (button inside anchor)
 */

'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

// HeroUI Button color mappings
const colorClasses = {
    default: 'bg-default-100 text-default-700 hover:bg-default-200',
    primary: 'bg-primary text-white hover:opacity-90',
    secondary: 'bg-secondary text-white hover:opacity-90',
    success: 'bg-success text-white hover:opacity-90',
    warning: 'bg-warning text-white hover:opacity-90',
    danger: 'bg-danger text-white hover:opacity-90',
};

const variantClasses = {
    solid: '',
    bordered: 'border-2 bg-transparent hover:bg-default-50',
    light: 'bg-transparent hover:bg-default-100',
    flat: 'bg-default-100 hover:bg-default-200',
    faded: 'border-2 bg-default-50 hover:bg-default-100',
    shadow: 'shadow-lg',
    ghost: 'border-2 bg-transparent hover:border-default-400',
};

const variantColorClasses = {
    bordered: {
        default: 'border-default-300 text-default-700',
        primary: 'border-primary text-primary',
        secondary: 'border-secondary text-secondary',
        success: 'border-success text-success',
        warning: 'border-warning text-warning',
        danger: 'border-danger text-danger',
    },
    light: {
        default: 'text-default-700',
        primary: 'text-primary',
        secondary: 'text-secondary',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
    },
    flat: {
        default: 'text-default-700',
        primary: 'bg-primary-50 text-primary hover:bg-primary-100',
        secondary: 'bg-secondary-50 text-secondary hover:bg-secondary-100',
        success: 'bg-success-50 text-success hover:bg-success-100',
        warning: 'bg-warning-50 text-warning hover:bg-warning-100',
        danger: 'bg-danger-50 text-danger hover:bg-danger-100',
    },
};

const sizeClasses = {
    sm: 'text-sm px-3 py-1.5 h-8 min-w-16',
    md: 'text-base px-4 py-2 h-10 min-w-20',
    lg: 'text-lg px-6 py-3 h-12 min-w-24',
};

const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-small',
    md: 'rounded-medium',
    lg: 'rounded-large',
    full: 'rounded-full',
};

/**
 * LinkButton - A Link component styled as a Button
 * 
 * @param {string} href - Navigation path
 * @param {string} color - Button color (default, primary, secondary, success, warning, danger)
 * @param {string} variant - Button variant (solid, bordered, light, flat, faded, shadow, ghost)
 * @param {string} size - Button size (sm, md, lg)
 * @param {string} radius - Border radius (none, sm, md, lg, full)
 * @param {boolean} isDisabled - Disable the link
 * @param {boolean} fullWidth - Make button full width
 * @param {ReactNode} startContent - Content before children
 * @param {ReactNode} endContent - Content after children
 * @param {string} className - Additional CSS classes
 */
const LinkButton = forwardRef(({
    href,
    children,
    color = 'default',
    variant = 'solid',
    size = 'md',
    radius = 'md',
    isDisabled = false,
    fullWidth = false,
    startContent,
    endContent,
    className = '',
    ...props
}, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 no-underline';

    // Determine color classes based on variant
    let appliedColorClasses = colorClasses[color];
    if (variant !== 'solid' && variantColorClasses[variant]?.[color]) {
        appliedColorClasses = variantColorClasses[variant][color];
    }

    const classes = cn(
        baseClasses,
        variant === 'solid' ? appliedColorClasses : variantClasses[variant],
        variant !== 'solid' && appliedColorClasses,
        sizeClasses[size],
        radiusClasses[radius],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
    );

    if (isDisabled) {
        return (
            <span className={classes} ref={ref} {...props}>
                {startContent && <span className="shrink-0">{startContent}</span>}
                {children}
                {endContent && <span className="shrink-0">{endContent}</span>}
            </span>
        );
    }

    return (
        <Link href={href} className={classes} ref={ref} {...props}>
            {startContent && <span className="shrink-0">{startContent}</span>}
            {children}
            {endContent && <span className="shrink-0">{endContent}</span>}
        </Link>
    );
});

LinkButton.displayName = 'LinkButton';

export default LinkButton;
