// Utility functions and helpers
// Examples: formatters, validators, constants, etc.

/**
 * Format currency amount in human-friendly format
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'PKR')
 * @returns {string} Formatted amount (e.g., "1.2k", "1.54M")
 */
export const formatCurrencyShort = (amount, currency = 'PKR') => {
  if (!amount || isNaN(amount)) return '0'
  
  const num = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  
  if (num >= 1000000) {
    return `${sign}${(num / 1000000).toFixed(2).replace(/\.?0+$/, '')}M`
  } else if (num >= 1000) {
    return `${sign}${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`
  } else {
    return `${sign}${num.toLocaleString()}`
  }
}

/**
 * Format currency amount with full precision
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'PKR')
 * @returns {string} Formatted amount with currency symbol
 */
export const formatCurrency = (amount, currency = 'PKR') => {
  if (!amount || isNaN(amount)) return '0'
  
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
} 