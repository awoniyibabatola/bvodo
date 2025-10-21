'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  selectedCurrency: string;
  exchangeRates: ExchangeRates;
  setSelectedCurrency: (currency: string) => void;
  convertAmount: (amount: number, fromCurrency: string) => number;
  formatAmount: (amount: number, fromCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

const CURRENCY_SYMBOLS: { [key: string]: string } = {
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

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
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
  });

  // Load preferred currency from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved) {
      setSelectedCurrencyState(saved);
    }
  }, []);

  // Fetch live exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates) {
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Keep using default rates
      }
    };

    fetchRates();
    // Refresh rates every 24 hours
    const interval = setInterval(fetchRates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setSelectedCurrency = (currency: string) => {
    setSelectedCurrencyState(currency);
    localStorage.setItem('preferredCurrency', currency);
  };

  /**
   * Convert amount from USD (system currency) to selected currency
   */
  const convertAmount = (amountInUSD: number, fromCurrency: string = 'USD'): number => {
    if (fromCurrency === selectedCurrency) {
      return amountInUSD;
    }

    // All our amounts are stored in their original currency
    // We need to convert from original currency to selected currency via USD
    let amountInSelectedCurrency: number;

    if (fromCurrency === 'USD') {
      // Converting from USD to selected currency
      amountInSelectedCurrency = amountInUSD * exchangeRates[selectedCurrency];
    } else if (selectedCurrency === 'USD') {
      // Converting from any currency to USD
      amountInSelectedCurrency = amountInUSD / exchangeRates[fromCurrency];
    } else {
      // Converting between two non-USD currencies
      // First convert to USD, then to selected currency
      const amountInUsd = amountInUSD / exchangeRates[fromCurrency];
      amountInSelectedCurrency = amountInUsd * exchangeRates[selectedCurrency];
    }

    return parseFloat(amountInSelectedCurrency.toFixed(2));
  };

  /**
   * Format amount with selected currency symbol
   */
  const formatAmount = (amount: number, fromCurrency: string = 'USD'): string => {
    const convertedAmount = convertAmount(amount, fromCurrency);
    const symbol = CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency;

    return `${symbol}${convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        exchangeRates,
        setSelectedCurrency,
        convertAmount,
        formatAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export { SUPPORTED_CURRENCIES };
