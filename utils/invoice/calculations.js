/**
 * Invoice Calculation Utilities
 */

/**
 * Calculate line item total
 * @param {Object} item - Line item with quantity and unit_price
 * @returns {number} Item total
 */
export const calculateLineItemTotal = (item) => {
  return (item.quantity || 0) * (item.unit_price || 0);
};

/**
 * Calculate tax for a line item
 * @param {Object} item - Line item with quantity, unit_price, and tax_rate
 * @returns {number} Tax amount
 */
export const calculateLineItemTax = (item) => {
  const itemTotal = calculateLineItemTotal(item);
  return itemTotal * ((item.tax_rate || 0) / 100);
};

/**
 * Calculate invoice subtotal from line items
 * @param {Array} lineItems - Array of line items
 * @returns {number} Subtotal
 */
export const calculateSubtotal = (lineItems = []) => {
  return lineItems.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
};

/**
 * Calculate total tax from line items
 * @param {Array} lineItems - Array of line items
 * @returns {number} Total tax
 */
export const calculateTotalTax = (lineItems = []) => {
  return lineItems.reduce((sum, item) => sum + calculateLineItemTax(item), 0);
};

/**
 * Calculate discount amount
 * @param {number} subtotal - Invoice subtotal
 * @param {string} discountType - 'PERCENTAGE' or 'FIXED'
 * @param {number} discountValue - Discount value
 * @returns {number} Discount amount
 */
export const calculateDiscount = (
  subtotal,
  discountType,
  discountValue = 0
) => {
  if (discountType === "PERCENTAGE") {
    return subtotal * (discountValue / 100);
  }
  return discountValue || 0;
};

/**
 * Calculate invoice total
 * @param {Object} params - Calculation parameters
 * @returns {Object} Complete calculations
 */
export const calculateInvoiceTotal = ({
  lineItems = [],
  discountType = "PERCENTAGE",
  discountValue = 0,
  coinsRedeemed = 0,
}) => {
  const subtotal = calculateSubtotal(lineItems);
  const totalTax = calculateTotalTax(lineItems);
  const discount = calculateDiscount(subtotal, discountType, discountValue);
  const total = Math.max(0, subtotal + totalTax - discount - coinsRedeemed);

  return {
    subtotal,
    totalTax,
    discount,
    coinsRedeemed,
    total,
    beforeTax: subtotal - discount - coinsRedeemed,
    afterDiscount: subtotal - discount,
  };
};

/**
 * Calculate balance due
 * @param {number} total - Invoice total
 * @param {number} amountPaid - Amount already paid
 * @returns {number} Balance due
 */
export const calculateBalanceDue = (total, amountPaid = 0) => {
  return Math.max(0, total - amountPaid);
};

/**
 * Get payment status
 * @param {number} total - Invoice total
 * @param {number} amountPaid - Amount paid
 * @returns {string} Payment status
 */
export const getPaymentStatus = (total, amountPaid = 0) => {
  if (amountPaid === 0) return "UNPAID";
  if (amountPaid >= total) return "PAID";
  return "PARTIALLY_PAID";
};
