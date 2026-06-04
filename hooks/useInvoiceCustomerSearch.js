'use client';

import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
    useLazySearchCustomersQuery,
    useCreateCustomerMutation,
} from '@/redux/services/api';

/** Format customer billing address for invoice form (JSON string). */
export function formatCustomerAddressForForm(address) {
    if (address == null || address === '') return '';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
        try {
            return JSON.stringify(address);
        } catch {
            return String(address);
        }
    }
    return String(address);
}

/** Parse invoice form address field for API payload. */
export function parseCustomerAddressForPayload(addressField) {
    if (!addressField) return undefined;
    if (typeof addressField === 'object') return addressField;
    try {
        return JSON.parse(addressField);
    } catch {
        return addressField;
    }
}

/** Normalize API customer row for CustomerSelector. */
export function mapCustomerSearchRow(row) {
    if (!row || typeof row !== 'object') return null;
    const id = row.id ?? row.user_id;
    if (!id) return null;
    return {
        id,
        display_name: row.display_name || row.name || '',
        email: row.email || '',
        phone: row.phone || '',
        company_name: row.company_name ?? null,
        customer_type: row.customer_type,
        payment_terms: row.payment_terms,
        billing_address: row.billing_address ?? null,
    };
}

/**
 * Shared customer search + create for invoice new/edit pages.
 */
export function useInvoiceCustomerSearch() {
    const [searchCustomers, { isFetching: isSearchingCustomers }] =
        useLazySearchCustomersQuery();
    const [createCustomer, { isLoading: isCreatingCustomer }] =
        useCreateCustomerMutation();

    const handleSearchCustomers = useCallback(
        async (term) => {
            const q = (term || '').trim();
            if (q.length < 2) return [];

            try {
                const rows = await searchCustomers({ q, limit: 20 }).unwrap();
                const list = Array.isArray(rows) ? rows : [];
                return list
                    .map(mapCustomerSearchRow)
                    .filter(Boolean);
            } catch (error) {
                const status = error?.status ?? error?.originalStatus;
                const detail =
                    error?.data?.detail ||
                    error?.message ||
                    'Failed to search customers';
                if (status === 403) {
                    toast.error('You do not have permission to search customers');
                } else if (status !== 401) {
                    toast.error(
                        typeof detail === 'string' ? detail : 'Failed to search customers'
                    );
                }
                return [];
            }
        },
        [searchCustomers]
    );

    const handleCreateCustomer = useCallback(
        async (data) => {
            const created = await createCustomer(data).unwrap();
            return mapCustomerSearchRow(created) || created;
        },
        [createCustomer]
    );

    return {
        handleSearchCustomers,
        handleCreateCustomer,
        isCreatingCustomer,
        isSearchingCustomers,
    };
}
