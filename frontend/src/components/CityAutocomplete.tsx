'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
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
  placeholder = 'City, neighborhood, or address...',
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
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
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
          className={`w-full pl-10 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${className}`}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Show suggestions when available */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((city, index) => (
            <button
              key={`${city.code}-${index}`}
              type="button"
              onClick={() => handleSelectCity(city.name)}
              className={`w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''}`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{city.name}</span>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {city.code}
              </span>
            </button>
          ))}

          {/* Helpful hint */}
          <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 rounded-b-lg">
            <p className="text-xs text-blue-700 flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">💡</span>
              <span>
                <strong>Tip:</strong> Not in the list? Type any address or neighborhood (e.g., "Seton Calgary", "123 Main St")
                and we'll find hotels nearby using geocoding.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Show message when no suggestions but user is typing */}
      {showSuggestions && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">No matching cities found</p>
              <p className="text-xs text-gray-600 mb-2">
                That's okay! You can search using any address, neighborhood, or landmark.
              </p>
              <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                <p className="text-xs text-green-800">
                  <strong>"{value}"</strong> will be geocoded to find nearby hotels. Just press search!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
