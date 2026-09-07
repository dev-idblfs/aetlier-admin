/**
 * InvoiceEmptyState — thin wrapper over EmptyState with multi-action support.
 */
'use client';

import Link from 'next/link';
import { Button } from '@/lib/heroui';
import EmptyState from './EmptyState';

export default function InvoiceEmptyState({
  icon,
  title,
  message,
  actions = [],
  className = '',
  minHeight = 'min-h-[60vh]',
}) {
  if (!actions.length) {
    return (
      <EmptyState
        icon={icon || 'file'}
        title={title}
        description={message}
        className={`${minHeight} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${minHeight} gap-4 px-4 text-center ${className}`}
    >
      {icon && <div className="text-gray-400">{icon}</div>}
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="text-gray-600 text-center max-w-md">{message}</p>
      <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
        {actions.map((action, index) => (
          <Button
            key={index}
            as={action.href ? Link : undefined}
            href={action.href}
            onPress={action.onPress}
            color={action.color || 'primary'}
            variant={action.variant || 'solid'}
            className="min-h-11 w-full sm:w-auto"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
