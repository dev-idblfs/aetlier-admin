/**
 * RelatedLinks — compact related-record strip. Callers pass items; no fetching.
 */

'use client';

import EntityLink from './EntityLink';
import { cn } from '@/utils/cn';

/**
 * @param {{ title?: string, items?: Array<{ href?: string, label: string, meta?: string }>, className?: string, emptyLabel?: string }} props
 */
export default function RelatedLinks({
  title = 'Related',
  items = [],
  className = '',
  emptyLabel = 'No related records',
}) {
  const list = (items || []).filter((item) => item && item.label);

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:px-4',
        className,
      )}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
        {title}
      </h3>
      {list.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((item, index) => (
            <li
              key={item.href || `${item.label}-${index}`}
              className="flex items-baseline justify-between gap-2 min-w-0"
            >
              <EntityLink href={item.href} className="text-sm truncate">
                {item.label}
              </EntityLink>
              {item.meta ? (
                <span className="text-xs text-gray-400 shrink-0">{item.meta}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
