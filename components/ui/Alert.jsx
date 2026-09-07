/**
 * Alert — generic banner (replaces InvoiceAlert as the canonical primitive).
 */

'use client';

import { Button } from '@/lib/heroui';
import { X } from '@/lib/icons';
import { cn } from '@/utils/cn';

const VARIANT_STYLES = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700',
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    iconColor: 'text-warning-600',
    titleColor: 'text-warning-800',
    messageColor: 'text-warning-700',
  },
  danger: {
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    iconColor: 'text-danger-600',
    titleColor: 'text-danger-900',
    messageColor: 'text-danger-700',
  },
  success: {
    bg: 'bg-success-50',
    border: 'border-success-200',
    iconColor: 'text-success-600',
    titleColor: 'text-success-900',
    messageColor: 'text-success-700',
  },
};

export default function Alert({
  variant = 'info',
  title,
  message,
  children,
  icon = null,
  className = '',
  compact = false,
  onDismiss = null,
  dismissible = false,
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.info;

  return (
    <div
      role="status"
      className={cn(
        'rounded-xl border',
        styles.bg,
        styles.border,
        compact ? 'p-3' : 'p-3 md:p-4',
        className,
      )}
    >
      <div className={cn('flex items-start', compact ? 'gap-2' : 'gap-3')}>
        {icon && <div className={cn('shrink-0', styles.iconColor)}>{icon}</div>}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('font-semibold mb-0.5', styles.titleColor)}>{title}</h4>
          )}
          {message && <p className={cn('text-sm', styles.messageColor)}>{message}</p>}
          {children}
        </div>
        {dismissible && onDismiss && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onDismiss}
            aria-label="Dismiss alert"
            className={cn('min-w-10 min-h-10', styles.iconColor)}
          >
            <X size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
