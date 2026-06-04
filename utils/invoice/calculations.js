/**
 * Invoice Calculation Utilities
 */

/**
 * Calculate line item total
 * @param {Object} item - Line item with quantity and unit_price
 * @returns {number} Item total
 */
export const calculateLineItemTotal = (item) => {
  const qty = Number(item?.quantity) || 0;
  const price = Number(item?.unit_price) || 0;
  return qty * price;
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
  if (!Array.isArray(lineItems)) return 0;
  return lineItems.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
};

/**
 * Calculate total tax from line items
 * @param {Array} lineItems - Array of line items
 * @returns {number} Total tax
 */
export const calculateTotalTax = (lineItems = []) => {
  if (!Array.isArray(lineItems)) return 0;
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
 * Round to nearest whole rupee; returns { total, roundOff, beforeRound }.
 */
export const applyRoundOff = (amount) => {
  const beforeRound = Math.max(0, Number(amount) || 0);
  if (beforeRound === 0) {
    return { total: 0, roundOff: 0, beforeRound: 0 };
  }
  const total = Math.round(beforeRound);
  const roundOff = Math.round((total - beforeRound) * 100) / 100;
  return { total, roundOff, beforeRound };
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
  const beforeRound = Math.max(
    0,
    subtotal + totalTax - discount - coinsRedeemed
  );
  const { total, roundOff } = applyRoundOff(beforeRound);

  return {
    subtotal,
    totalTax,
    discount,
    coinsRedeemed,
    beforeRound,
    roundOff,
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

/**
 * Resolve grand total and balance due — prefer API values (incl. round-off), fallback to line-item math.
 */
export const resolveInvoiceBalance = (invoice, lineItems = []) => {
  const amountPaid = Number(invoice?.amount_paid) || 0;
  const computed = calculateInvoiceTotal({
    lineItems,
    discountType: invoice?.discount_type || "FIXED",
    discountValue:
      Number(invoice?.discount_value ?? invoice?.discount_amount) || 0,
    coinsRedeemed: Number(invoice?.coins_redeemed) || 0,
  });

  const apiGrand = Number(invoice?.grand_total) || 0;
  const grandTotal =
    apiGrand > 0 && Math.abs(apiGrand - computed.total) <= 0.01
      ? apiGrand
      : computed.total;

  const balanceFromGrand = calculateBalanceDue(grandTotal, amountPaid);
  const apiBalance =
    invoice?.balance_due != null ? Number(invoice.balance_due) : null;
  const balanceDue =
    apiBalance != null &&
    !Number.isNaN(apiBalance) &&
    Math.abs(apiBalance - balanceFromGrand) <= 0.01
      ? Math.max(0, apiBalance)
      : balanceFromGrand;

  return {
    grandTotal,
    balanceDue,
    amountPaid,
    computed,
  };
};
