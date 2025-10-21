/**
 * Currency utilities for formatting and display
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
  amount: number | string,
  currency: string,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
  } = {}
): string => {
  const { showSymbol = true, showCode = false, decimals = 2 } = options;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `${currency} 0.00`;
  }

  const formattedAmount = numAmount.toLocaleString('en-US', {
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
 * Format compact currency (e.g., $1.2K, $1.5M)
 */
export const formatCompactCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);

  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(amount, currency);
};
