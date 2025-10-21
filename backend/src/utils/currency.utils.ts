/**
 * Currency utilities for formatting and conversion
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  ZAR: 'R',
  AED: 'د.إ',
  SAR: 'ر.س',
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  NGN: 'Nigerian Naira',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  ZAR: 'South African Rand',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
};

/**
 * Format currency with proper symbol and decimal places
 */
export const formatCurrency = (
  amount: number,
  currency: string,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
  } = {}
): string => {
  const { showSymbol = true, showCode = false, decimals = 2 } = options;

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (showSymbol && CURRENCY_SYMBOLS[currency]) {
    const symbol = CURRENCY_SYMBOLS[currency];
    if (showCode) {
      return `${symbol}${formattedAmount} ${currency}`;
    }
    return `${symbol}${formattedAmount}`;
  }

  return `${currency} ${formattedAmount}`;
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Get currency name
 */
export const getCurrencyName = (currency: string): string => {
  return CURRENCY_NAMES[currency] || currency;
};

/**
 * Parse currency string to number
 */
export const parseCurrencyAmount = (currencyString: string): number => {
  // Remove currency symbols, commas, and spaces
  const cleaned = currencyString.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};
