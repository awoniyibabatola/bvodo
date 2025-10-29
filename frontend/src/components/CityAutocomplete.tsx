'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, X, Search } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface Location {
  iataCode: string;
  name: string;
  cityName?: string;
  countryName?: string;
  type: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'City, hotel name, neighborhood, or address...',
  className = '',
  required = false,
}: CityAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayValue, setDisplayValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for locations via API
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${getApiEndpoint('flights/locations')}?keyword=${encodeURIComponent(searchQuery)}&provider=duffel`
        );
        const data = await response.json();

        if (data.success) {
          // Filter to only show cities, not airports (hotels are in cities, not airports)
          const cities = (data.data || []).filter((loc: Location) => loc.type === 'CITY');
          setSuggestions(cities);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setDisplayValue(val);
    setShowSuggestions(true);

    if (!val) {
      onChange('');
    }
  };

  const handleSelectCity = (location: Location) => {
    const display = location.type === 'CITY'
      ? `${location.name}, ${location.countryName}`
      : `${location.cityName || location.name}`;

    setDisplayValue(display);
    setSearchQuery('');
    setShowSuggestions(false);
    onChange(display);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setSearchQuery('');
    setDisplayValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectCity(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchQuery || displayValue) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 md:pl-12 pr-10 md:pr-12 py-2.5 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-300 ${className}`}
          autoComplete="off"
        />

        {displayValue && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {loading && (
          <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Show suggestions when available */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 md:mt-2 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm max-h-60 md:max-h-80 overflow-y-auto">
          {suggestions.map((location, index) => (
            <button
              key={`${location.iataCode}-${index}`}
              type="button"
              onClick={() => handleSelectCity(location)}
              className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none ${
                index === highlightedIndex ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-900 truncate normal-case">
                    {location.name}
                  </div>
                  <div className="text-[10px] text-gray-600 truncate normal-case">
                    {location.cityName && location.cityName !== location.name && (
                      <span>{location.cityName}, </span>
                    )}
                    {location.countryName}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-block px-1.5 py-0.5 md:px-2 md:py-0.5 bg-gray-100 text-gray-700 text-[10px] font-mono rounded normal-case">
                    {location.iataCode}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Show message when no suggestions but user is typing */}
      {showSuggestions && !loading && searchQuery.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 md:mt-2 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm p-4 text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No locations found</p>
          <p className="text-xs text-gray-400 mt-1">Try searching for a city or address</p>
        </div>
      )}
    </div>
  );
}
