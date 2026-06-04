'use client';

import { FormTextarea } from '@/components/ui/FormFields';

export default function InvoiceNotesFields({
    notesName = 'notes',
    termsName = 'terms_conditions',
    readonly = false,
    notesLabel = 'Notes',
    termsLabel = 'Terms & Conditions',
    notesPlaceholder = 'Any additional notes for the customer...',
    termsPlaceholder = 'Invoice terms and conditions...',
    compact = false,
}) {
    const rows = compact ? 2 : 3;
    const gap = compact ? 'space-y-3' : 'space-y-4';

    return (
        <div className={gap}>
            <FormTextarea
                name={notesName}
                label={notesLabel}
                placeholder={notesPlaceholder}
                minRows={rows}
                size={compact ? 'sm' : 'md'}
                isReadOnly={readonly}
            />
            <FormTextarea
                name={termsName}
                label={termsLabel}
                placeholder={termsPlaceholder}
                minRows={rows}
                size={compact ? 'sm' : 'md'}
                isReadOnly={readonly}
            />
        </div>
    );
}
