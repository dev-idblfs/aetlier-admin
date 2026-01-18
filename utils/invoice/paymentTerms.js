/**
 * Payment Terms Utilities
 * Centralized payment terms logic
 */

export const PAYMENT_TERMS = [
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt" },
  { value: "NET_7", label: "Net 7 Days" },
  { value: "NET_15", label: "Net 15 Days" },
  { value: "NET_30", label: "Net 30 Days" },
  { value: "NET_45", label: "Net 45 Days" },
  { value: "NET_60", label: "Net 60 Days" },
];

/**
 * Calculate due date based on payment terms
 * @param {string} term - Payment term (e.g., 'NET_30')
 * @param {string|Date} invoiceDate - Invoice date
 * @returns {Date} Calculated due date
 */
export function getDefaultDueDate(term, invoiceDate = null) {
  const today = new Date(invoiceDate || Date.now());
  const date = new Date(today);

  switch (term) {
    case "DUE_ON_RECEIPT":
      return date;
    case "NET_7":
      date.setDate(date.getDate() + 7);
      return date;
    case "NET_15":
      date.setDate(date.getDate() + 15);
      return date;
    case "NET_30":
      date.setDate(date.getDate() + 30);
      return date;
    case "NET_45":
      date.setDate(date.getDate() + 45);
      return date;
    case "NET_60":
      date.setDate(date.getDate() + 60);
      return date;
    default:
      return date;
  }
}

/**
 * Get readable label for payment term
 * @param {string} term - Payment term value
 * @returns {string} Human-readable label
 */
export function getPaymentTermLabel(term) {
  const termObj = PAYMENT_TERMS.find((t) => t.value === term);
  return termObj ? termObj.label : term;
}

/**
 * Get number of days for payment term
 * @param {string} term - Payment term value
 * @returns {number} Number of days
 */
export function getPaymentTermDays(term) {
  switch (term) {
    case "DUE_ON_RECEIPT":
      return 0;
    case "NET_7":
      return 7;
    case "NET_15":
      return 15;
    case "NET_30":
      return 30;
    case "NET_45":
      return 45;
    case "NET_60":
      return 60;
    default:
      return 0;
  }
}
