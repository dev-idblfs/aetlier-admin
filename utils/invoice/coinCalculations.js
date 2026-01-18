/**
 * Coin Redemption Calculation Utilities
 */

/**
 * Calculate maximum redeemable coins based on 50% policy
 * @param {number} walletBalance - Available coins in wallet
 * @param {number} subtotal - Invoice subtotal
 * @param {number} discount - Discount amount
 * @returns {number} Maximum coins that can be redeemed
 */
export const calculateMaxRedeemable = (
  walletBalance = 0,
  subtotal = 0,
  discount = 0
) => {
  const afterDiscount = Math.max(0, subtotal - discount);
  const fiftyPercent = Math.floor(afterDiscount * 0.5);
  return Math.min(walletBalance, fiftyPercent);
};

/**
 * Validate coin redemption amount
 * @param {number} coins - Coins to redeem
 * @param {number} maxAllowed - Maximum allowed redemption
 * @param {number} walletBalance - Available balance
 * @returns {Object} Validation result with valid flag and error message
 */
export const validateCoinRedemption = (coins, maxAllowed, walletBalance) => {
  if (coins < 0) {
    return { valid: false, error: "Coins cannot be negative" };
  }

  if (coins > walletBalance) {
    return {
      valid: false,
      error: `Insufficient balance. Available: ${walletBalance} coins`,
    };
  }

  if (coins > maxAllowed) {
    return {
      valid: false,
      error: `Maximum ${maxAllowed} coins allowed (50% policy)`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Calculate coin value in currency
 * @param {number} coins - Number of coins
 * @param {number} conversionRate - Coins to currency rate (default 1:1)
 * @returns {number} Currency value
 */
export const coinsToCurrency = (coins, conversionRate = 1) => {
  return coins * conversionRate;
};

/**
 * Format coins display with icon
 * @param {number} coins - Number of coins
 * @returns {string} Formatted string
 */
export const formatCoins = (coins) => {
  return `${coins.toLocaleString()} coins`;
};

/**
 * Get coin redemption percentage
 * @param {number} coins - Coins redeemed
 * @param {number} total - Total amount after discount
 * @returns {number} Percentage (0-100)
 */
export const getCoinRedemptionPercentage = (coins, total) => {
  if (total <= 0) return 0;
  return Math.min(100, (coins / total) * 100);
};
