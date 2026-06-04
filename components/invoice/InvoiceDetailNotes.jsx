'use client';

import { InvoiceSection } from '@/components/ui';

export default function InvoiceDetailNotes({ notes, terms }) {
    if (!notes && !terms) return null;

    return (
        <InvoiceSection title="Notes & terms" compact>
            <div className="space-y-3 text-sm">
                {notes && (
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Notes
                        </p>
                        <p className="text-gray-700 whitespace-pre-line">{notes}</p>
                    </div>
                )}
                {terms && (
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Terms
                        </p>
                        <p className="text-gray-700 whitespace-pre-line">{terms}</p>
                    </div>
                )}
            </div>
        </InvoiceSection>
    );
}
