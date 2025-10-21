'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency, SUPPORTED_CURRENCIES } from '@/contexts/CurrencyContext';
import { DollarSign, Check, ChevronDown } from 'lucide-react';

export default function CurrencySwitcher() {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 bg-white"
        title="Change currency"
      >
        <DollarSign className="w-4 h-4" />
        <span className="font-semibold text-sm">{selectedCurrency}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Display Currency
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => {
                  setSelectedCurrency(currency.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  selectedCurrency === currency.code ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currency.symbol}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{currency.code}</p>
                    <p className="text-xs text-gray-500">{currency.name}</p>
                  </div>
                </div>
                {selectedCurrency === currency.code && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 mt-2">
            <p className="text-xs text-gray-500">
              All prices will be converted from USD at current exchange rates
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
