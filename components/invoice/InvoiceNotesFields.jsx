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
}) {
    return (
        <div className="space-y-4">
            <FormTextarea
                name={notesName}
                label={notesLabel}
                placeholder={notesPlaceholder}
                minRows={3}
                isReadOnly={readonly}
            />
            <FormTextarea
                name={termsName}
                label={termsLabel}
                placeholder={termsPlaceholder}
                minRows={3}
                isReadOnly={readonly}
            />
        </div>
    );
}
