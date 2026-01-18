/**
 * InvoiceNotesFields Component
 * Reusable notes and terms fields
 */
'use client';

import { Textarea } from '@heroui/react';

export default function InvoiceNotesFields({
    notes = '',
    terms = '',
    onNotesChange,
    onTermsChange,
    readonly = false,
    notesLabel = 'Notes',
    termsLabel = 'Terms & Conditions',
    notesPlaceholder = 'Any additional notes for the customer...',
    termsPlaceholder = 'Invoice terms and conditions...',
}) {
    return (
        <div className="space-y-4">
            <Textarea
                label={notesLabel}
                labelPlacement="outside"
                placeholder={notesPlaceholder}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                minRows={3}
                isReadOnly={readonly}
            />
            <Textarea
                label={termsLabel}
                labelPlacement="outside"
                placeholder={termsPlaceholder}
                value={terms}
                onChange={(e) => onTermsChange(e.target.value)}
                minRows={3}
                isReadOnly={readonly}
            />
        </div>
    );
}
