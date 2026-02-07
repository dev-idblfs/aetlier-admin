'use client';

import { FormProvider } from 'react-hook-form';

export function Form({ methods, onSubmit, children, className = '' }) {
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
                {children}
            </form>
        </FormProvider>
    );
}
