import i18n from '../i18n'

/**
 * Format currency based on the current language
 * @param amount - The amount to format
 * @param language - Optional language override (defaults to current i18n language)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, language?: string): string => {
  const currentLanguage = language || i18n.language
  const symbol = getCurrencySymbol(currentLanguage)
  
  if (currentLanguage === 'he') {
    // Hebrew: symbol before number (₪12.34)
    return `${symbol}${amount.toFixed(2)}`
  } else {
    // English: symbol before number ($12.34)
    return `${symbol}${amount.toFixed(2)}`
  }
}

/**
 * Get the currency symbol for the current language
 * @param language - Optional language override (defaults to current i18n language)
 * @returns Currency symbol
 */
export const getCurrencySymbol = (language?: string): string => {
  const currentLanguage = language || i18n.language
  
  if (currentLanguage === 'he') {
    return '₪'
  } else {
    return '$'
  }
}

/**
 * Get the currency code for the current language
 * @param language - Optional language override (defaults to current i18n language)
 * @returns Currency code (ISO 4217)
 */
export const getCurrencyCode = (language?: string): string => {
  const currentLanguage = language || i18n.language
  
  if (currentLanguage === 'he') {
    return 'ILS'
  } else {
    return 'USD'
  }
}