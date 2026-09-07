/**
 * EntityLink — navigate to a related record from detail/list overviews.
 */

'use client';

import Link from 'next/link';
import { cn } from '@/utils/cn';

export default function EntityLink({
  href,
  children,
  label,
  mono = false,
  className = '',
  muted = false,
}) {
  const text = children ?? label;
  if (!href || text == null || text === '') {
    return (
      <span className={cn(muted ? 'text-gray-500' : 'text-gray-900', mono && 'font-mono text-xs', className)}>
        {text || '—'}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'font-medium text-primary-600 hover:opacity-80 underline-offset-2 hover:underline',
        mono && 'font-mono text-xs',
        className,
      )}
    >
      {text}
    </Link>
  );
}
