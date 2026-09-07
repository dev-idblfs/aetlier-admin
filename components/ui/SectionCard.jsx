/**
 * SectionCard — titled content section (merges FormSectionCard + InvoiceSection).
 */

'use client';

import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { cn } from '@/utils/cn';

export default function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  headerAction = null,
  embedded = false,
  compact = true,
  className = '',
  contentClassName = '',
}) {
  if (embedded) {
    return (
      <section className={cn('space-y-3', className)}>
        {(title || description || headerAction) && (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title && <h4 className="text-sm font-semibold text-gray-900">{title}</h4>}
              {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
            {headerAction}
          </div>
        )}
        <div className={contentClassName}>{children}</div>
      </section>
    );
  }

  const useCompact = compact;
  const showIcon = Icon && !useCompact;

  return (
    <Card padding="none" className={cn('overflow-hidden mb-3 md:mb-4', className)}>
      {(title || description || headerAction) && (
        <CardHeader
          className={cn(
            'border-none mb-0',
            useCompact ? 'px-3 pt-3 pb-0 sm:px-4 sm:pt-4' : 'px-4 pt-4 pb-0 sm:px-6 sm:pt-6',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {showIcon && (
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <CardTitle className={useCompact ? 'text-sm' : 'text-base'}>
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="mt-0.5">{description}</CardDescription>
                )}
              </div>
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent
        className={cn(
          useCompact ? 'px-3 pb-3 pt-3 sm:px-4 sm:pb-4' : 'px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5',
          contentClassName,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
