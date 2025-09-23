/**
 * Currency formatting utilities for Moroccan Dirhams (MAD)
 */

export const CURRENCY_SYMBOL = 'DH';
export const CURRENCY_CODE = 'MAD';

/**
 * Format a number as Moroccan Dirhams
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the DH symbol (default: true)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatPrice(amount: number, showSymbol: boolean = true, decimals: number = 2): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showSymbol ? `0.00 ${CURRENCY_SYMBOL}` : '0.00';
  }

  const formatted = amount.toFixed(decimals);
  return showSymbol ? `${formatted} ${CURRENCY_SYMBOL}` : formatted;
}

/**
 * Format a number as Moroccan Dirhams with locale formatting
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the DH symbol (default: true)
 * @returns Formatted currency string with locale formatting
 */
export function formatPriceLocale(amount: number, showSymbol: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showSymbol ? `0,00 ${CURRENCY_SYMBOL}` : '0,00';
  }

  // Use French locale formatting for Morocco
  const formatted = amount.toLocaleString('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return showSymbol ? `${formatted} ${CURRENCY_SYMBOL}` : formatted;
}

/**
 * Parse a price string and return the numeric value
 * @param priceString - The price string to parse
 * @returns Numeric value or 0 if invalid
 */
export function parsePrice(priceString: string): number {
  if (!priceString) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = priceString.replace(/[DH$€,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert from other currencies to MAD (placeholder - would need real exchange rates)
 * @param amount - Amount in source currency
 * @param fromCurrency - Source currency code
 * @returns Amount in MAD
 */
export function convertToMAD(amount: number, fromCurrency: string): number {
  // Placeholder conversion rates - in production, use real exchange rate API
  const exchangeRates: Record<string, number> = {
    'USD': 10.0,  // 1 USD = 10 MAD (approximate)
    'EUR': 11.0,  // 1 EUR = 11 MAD (approximate)
    'MAD': 1.0,   // 1 MAD = 1 MAD
    'DH': 1.0     // Same as MAD
  };
  
  const rate = exchangeRates[fromCurrency.toUpperCase()] || 1.0;
  return amount * rate;
}

/**
 * Format a price range
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @returns Formatted price range string
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }
  
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}