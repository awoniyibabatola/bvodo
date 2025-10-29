'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, X } from 'lucide-react';

interface HotelNameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  hotels: any[]; // Array of hotels to search from
  placeholder?: string;
  className?: string;
}

export default function HotelNameAutocomplete({
  value,
  onChange,
  hotels,
  placeholder = 'Search hotel name...',
  className = '',
}: HotelNameAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; rating?: number }>>([]);
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

  const searchHotels = (query: string) => {
    if (!query || query.length < 1) return [];

    const searchTerm = query.toLowerCase().trim();
    const uniqueHotels = new Map();

    // Filter hotels by name
    hotels.forEach(hotel => {
      const hotelName = hotel.hotel?.name || '';
      if (hotelName.toLowerCase().includes(searchTerm)) {
        // Use hotel name as key to avoid duplicates
        if (!uniqueHotels.has(hotelName)) {
          uniqueHotels.set(hotelName, {
            name: hotelName,
            rating: hotel.hotel?.rating,
          });
        }
      }
    });

    // Convert to array and limit to 8 suggestions
    return Array.from(uniqueHotels.values()).slice(0, 8);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length >= 1) {
      const results = searchHotels(inputValue);
      setSuggestions(results);
      setShowSuggestions(true);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectHotel = (hotelName: string) => {
    onChange(hotelName);
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
          handleSelectHotel(suggestions[highlightedIndex].name);
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
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 1) {
              const results = searchHotels(value);
              setSuggestions(results);
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-100 outline-none text-sm ${className}`}
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
          {suggestions.map((hotel, index) => (
            <button
              key={`${hotel.name}-${index}`}
              type="button"
              onClick={() => handleSelectHotel(hotel.name)}
              className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                index === highlightedIndex ? 'bg-gray-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">{hotel.name}</span>
              </div>
              {hotel.rating && hotel.rating > 0 && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2 flex-shrink-0">
                  ⭐ {hotel.rating}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Show message when no suggestions but user is typing */}
      {showSuggestions && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">No hotels found</p>
              <p className="text-xs text-gray-600">
                No hotels matching "{value}" in the current search results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
