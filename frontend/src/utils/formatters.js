/**
 * Formatting Utilities
 */

/**
 * Format large numbers with K/M/B suffixes
 * @param {number} value - Number to format
 * @returns {string} Formatted string
 */
export function formatNumber(value) {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

/**
 * Format GP (gold pieces) with appropriate suffix
 * @param {number} value - GP amount
 * @returns {string} Formatted GP string
 */
export function formatGP(value) {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B GP';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(0) + 'M GP';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'K GP';
  }
  return value.toString() + ' GP';
}

/**
 * Format time with leading zeros
 * @param {number} num - Number to pad
 * @returns {string} Zero-padded string
 */
export function padTime(num) {
  return String(num).padStart(2, '0');
}

/**
 * Format duration from milliseconds
 * @param {number} ms - Milliseconds
 * @returns {Object} Duration object with days, hours, minutes, seconds
 */
export function formatDuration(ms) {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, expired: false };
}

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Sanitize text input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export default { formatNumber, formatGP, padTime, formatDuration, formatDate, sanitizeInput };
