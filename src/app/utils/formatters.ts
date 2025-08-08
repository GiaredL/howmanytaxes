/**
 * Formats a number as US currency with commas and 2 decimal places
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Formats a number as US currency with dollar sign
 */
export const formatCurrencyWithSymbol = (amount: number): string => {
  return `$${formatCurrency(amount)}`
}

/**
 * Formats a number with commas for thousands separators
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US')
}

/**
 * Formats a percentage with specified decimal places
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`
}
