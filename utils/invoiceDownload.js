import config from "@/config";
import { getAccessTokenCookie } from "@/lib/authCookies";

function invoiceApiUrl(invoiceId, suffix) {
  const rawApiUrl = config.apiUrl || "http://localhost:8000/api";
  const base = rawApiUrl.replace(/\/+$/, "").replace(/\/api$/, "");
  return `${base}/api/invoices/${invoiceId}/${suffix}`;
}

async function fetchAuthorizedInvoiceResource(invoiceId, suffix) {
  const token = getAccessTokenCookie();
  const response = await fetch(invoiceApiUrl(invoiceId, suffix), {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Client-App": "admin",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(
      errorJson.detail || `Unable to open invoice (HTTP ${response.status})`,
    );
  }
  return response;
}

/**
 * Fetch an authenticated HTML preview and open it as an isolated browser document.
 */
export async function openInvoiceHtmlPreview(invoiceId) {
  const previewWindow = window.open("", "_blank");
  try {
    const response = await fetchAuthorizedInvoiceResource(invoiceId, "preview");
    const html = await response.text();
    const blobUrl = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );

    if (previewWindow) {
      previewWindow.location.replace(blobUrl);
    } else {
      window.open(blobUrl, "_blank");
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return true;
  } catch (error) {
    previewWindow?.close();
    throw error;
  }
}

/**
 * Download Invoice PDF with authorization headers, error extraction, and console diagnostics.
 */
export async function downloadInvoicePdfDirect(invoiceId, invoiceNumber) {
  console.log(`[Invoice PDF] Initiating download for invoice ID: ${invoiceId}`);
  try {
    const response = await fetchAuthorizedInvoiceResource(invoiceId, "pdf");
    const blob = await response.blob();
    console.log(`[Invoice PDF] Received blob of size ${blob.size} bytes`);

    if (!blob || blob.size === 0) {
      throw new Error("Received empty PDF file from server");
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${invoiceNumber || "invoice"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    console.log("[Invoice PDF] Download triggered successfully.");
    return true;
  } catch (err) {
    console.error("[Invoice PDF Exception]:", err);
    throw err;
  }
}
