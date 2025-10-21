import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Exchange Rate Service using exchangerate-api.io (free tier)
 * Alternative: openexchangerates.org, fixer.io, currencyapi.com
 */

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
}

// In-memory cache for exchange rates (refresh every 24 hours)
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get exchange rates from USD base
 * Uses free exchangerate-api.io API
 */
export const getExchangeRates = async (): Promise<Record<string, number>> => {
  // Return cached rates if still valid
  const now = Date.now();
  if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
    logger.info('Using cached exchange rates');
    return cachedRates;
  }

  try {
    // Using free tier of exchangerate-api.io (no API key required)
    // Rate limit: 1,500 requests per month
    const response = await axios.get<ExchangeRateResponse>(
      'https://api.exchangerate-api.com/v4/latest/USD',
      {
        timeout: 5000,
      }
    );

    if (response.data && response.data.rates) {
      cachedRates = response.data.rates;
      cacheTimestamp = now;
      logger.info('Exchange rates updated successfully');
      return cachedRates;
    }

    throw new Error('Invalid response from exchange rate API');
  } catch (error: any) {
    logger.error('Failed to fetch exchange rates:', error.message);

    // Return cached rates even if expired as fallback
    if (cachedRates) {
      logger.warn('Using expired cached exchange rates as fallback');
      return cachedRates;
    }

    // If no cache available, return default rates (1:1 for same currency)
    logger.error('No exchange rates available, using defaults');
    return getDefaultRates();
  }
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ convertedAmount: number; exchangeRate: number }> => {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, exchangeRate: 1 };
  }

  try {
    const rates = await getExchangeRates();

    // All rates are from USD base, so we need to convert accordingly
    let exchangeRate: number;

    if (fromCurrency === 'USD') {
      // Converting from USD to another currency
      exchangeRate = rates[toCurrency] || 1;
    } else if (toCurrency === 'USD') {
      // Converting from another currency to USD
      exchangeRate = 1 / (rates[fromCurrency] || 1);
    } else {
      // Converting between two non-USD currencies
      // First convert to USD, then to target currency
      const toUsdRate = 1 / (rates[fromCurrency] || 1);
      const fromUsdRate = rates[toCurrency] || 1;
      exchangeRate = toUsdRate * fromUsdRate;
    }

    const convertedAmount = parseFloat((amount * exchangeRate).toFixed(2));

    logger.info(
      `Currency conversion: ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency} (rate: ${exchangeRate})`
    );

    return { convertedAmount, exchangeRate };
  } catch (error: any) {
    logger.error('Currency conversion error:', error.message);
    // Return original amount if conversion fails
    return { convertedAmount: amount, exchangeRate: 1 };
  }
};

/**
 * Get exchange rate between two currencies
 */
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  const { exchangeRate } = await convertCurrency(1, fromCurrency, toCurrency);
  return exchangeRate;
};

/**
 * Default exchange rates fallback (approximate rates)
 */
const getDefaultRates = (): Record<string, number> => {
  return {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    NGN: 1580,
    JPY: 149.5,
    CNY: 7.24,
    INR: 83.12,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.88,
    ZAR: 18.65,
    AED: 3.67,
    SAR: 3.75,
  };
};

/**
 * Check if exchange rates are cached and valid
 */
export const areRatesCached = (): boolean => {
  const now = Date.now();
  return cachedRates !== null && (now - cacheTimestamp) < CACHE_DURATION;
};

/**
 * Clear exchange rate cache (useful for testing)
 */
export const clearRateCache = (): void => {
  cachedRates = null;
  cacheTimestamp = 0;
  logger.info('Exchange rate cache cleared');
};
