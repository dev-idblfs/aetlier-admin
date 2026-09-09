import config from '@/config';
import { getAccessTokenCookie } from '@/lib/authCookies';

/**
 * Download Invoice PDF with authorization headers, error extraction, and console diagnostics.
 */
export async function downloadInvoicePdfDirect(invoiceId, invoiceNumber) {
    console.log(`[Invoice PDF] Initiating download for invoice ID: ${invoiceId}`);
    try {
        const token = getAccessTokenCookie();
        const baseUrl = config.apiUrl || 'http://localhost:8000';
        const url = `${baseUrl}/api/invoices/${invoiceId}/pdf`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                'X-Client-App': 'admin',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            const msg = errorJson.detail || `Failed to generate PDF (HTTP ${response.status})`;
            console.error('[Invoice PDF Error]:', msg, errorJson);
            throw new Error(msg);
        }

        const blob = await response.blob();
        console.log(`[Invoice PDF] Received blob of size ${blob.size} bytes`);

        if (!blob || blob.size === 0) {
            throw new Error('Received empty PDF file from server');
        }

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${invoiceNumber || 'invoice'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        console.log('[Invoice PDF] Download triggered successfully.');
        return true;
    } catch (err) {
        console.error('[Invoice PDF Exception]:', err);
        throw err;
    }
}
