/**
 * Utility functions for formatting dates and times consistently across the app
 */

/**
 * Format a date string to a readable format
 * @param {string|Date} dateValue - Date value to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(dateValue, options = {}) {
  if (!dateValue) return "Date TBA";

  try {
    let date;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (
      typeof dateValue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      date = new Date(dateValue + "T00:00:00");
    } else if (
      typeof dateValue === "string" &&
      /^\d{2}-\d{2}-\d{4}$/.test(dateValue)
    ) {
      const [day, month, year] = dateValue.split("-");
      date = new Date(`${year}-${month}-${day}T00:00:00`);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const defaultOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    };

    return date.toLocaleDateString("en-US", defaultOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Format a time string to 12-hour format
 * @param {string} timeValue - Time value in HH:MM format
 * @returns {string} Formatted time string
 */
export function formatTime(timeValue) {
  if (!timeValue) return "Time TBA";

  try {
    const timeParts = timeValue.split(":");
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return "Invalid Time";
    }

    const date = new Date(2000, 0, 1, hours, minutes);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Invalid Time";
  }
}

/**
 * Format both date and time together
 * @param {string|Date} dateValue - Date value
 * @param {string} timeValue - Time value
 * @returns {string} Combined formatted date and time
 */
export function formatDateTime(dateValue, timeValue) {
  return `${formatDate(dateValue)} • ${formatTime(timeValue)}`;
}

/**
 * Parse date string and return Date object
 * @param {string} dateValue - Date string to parse
 * @returns {Date|null} Date object or null if invalid
 */
export function parseDate(dateValue) {
  if (!dateValue) return null;

  try {
    let date;
    if (
      typeof dateValue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      date = new Date(dateValue + "T00:00:00");
    } else {
      date = new Date(dateValue);
    }

    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a date is in the past
 * @param {string|Date} dateValue - Date to check
 * @returns {boolean}
 */
export function isDateInPast(dateValue) {
  const date = parseDate(dateValue);
  if (!date) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < now;
}

/**
 * Check if a date is today
 * @param {string|Date} dateValue - Date to check
 * @returns {boolean}
 */
export function isToday(dateValue) {
  const date = parseDate(dateValue);
  if (!date) return false;
  return date.toDateString() === new Date().toDateString();
}

/**
 * Get relative date text (Today, Tomorrow, etc.)
 * @param {string|Date} dateValue - Date to check
 * @returns {string|null}
 */
export function getRelativeDateText(dateValue) {
  const date = parseDate(dateValue);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((compareDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return null;
}

/**
 * Format a number as currency (INR by default)
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: INR)
 * @param {string} locale - Locale (default: en-IN)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = "INR", locale = "en-IN") {
  if (amount === null || amount === undefined) return "₹0";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `₹${amount}`;
  }
}
