'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, X, Search } from 'lucide-react';
import { searchCities } from '@/utils/cityMapping';

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; code: string }>>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length >= 1) {
      const results = searchCities(inputValue);
      setSuggestions(results);
      // Show dropdown even if no suggestions (to show helpful message)
      setShowSuggestions(true);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (cityName: string) => {
    onChange(cityName);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
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
          handleSelectCity(suggestions[highlightedIndex].name);
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
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 1) {
              const results = searchCities(value);
              setSuggestions(results);
              // Show dropdown even if no suggestions
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 md:pl-12 pr-10 md:pr-12 py-2.5 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-300 ${className}`}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Show suggestions when available */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 md:mt-2 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm max-h-60 md:max-h-80 overflow-y-auto">
          {suggestions.map((city, index) => (
            <button
              key={`${city.code}-${index}`}
              type="button"
              onClick={() => handleSelectCity(city.name)}
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
                    {city.name}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-block px-1.5 py-0.5 md:px-2 md:py-0.5 bg-gray-100 text-gray-700 text-[10px] font-mono rounded normal-case">
                    {city.code}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Show message when no suggestions but user is typing */}
      {showSuggestions && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 md:mt-2 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm p-4 text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-900 font-medium mb-1">City not in the list?</p>
          <p className="text-xs text-gray-500">That's okay! You can search using any address, neighborhood, or landmark.</p>
          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-700">
              <strong>"{value}"</strong> will be geocoded to find nearby hotels
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
