'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Plane, Search, X } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface Location {
  iataCode: string;
  name: string;
  cityName?: string;
  countryName?: string;
  type: string; // 'AIRPORT' or 'CITY'
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (iataCode: string, displayValue: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  initialDisplayValue?: string;
}

export default function AirportAutocomplete({
  value,
  onChange,
  placeholder = 'City or Airport',
  label,
  required = false,
  className = '',
  initialDisplayValue = '',
}: AirportAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayValue, setDisplayValue] = useState(initialDisplayValue);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Update display value when initialDisplayValue changes
  useEffect(() => {
    if (initialDisplayValue) {
      setDisplayValue(initialDisplayValue);
    }
  }, [initialDisplayValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for locations
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setLocations([]);
      return;
    }

    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${getApiEndpoint('flights/locations')}?keyword=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();

        if (data.success) {
          setLocations(data.data || []);
        } else {
          setLocations([]);
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelect = (location: Location) => {
    const display = location.type === 'CITY'
      ? `${location.name}, ${location.countryName}`
      : `${location.cityName || location.name} (${location.iataCode})`;

    setDisplayValue(display);
    setSearchQuery('');
    setIsOpen(false);
    onChange(location.iataCode, display);
  };

  const handleClear = () => {
    setSearchQuery('');
    setDisplayValue('');
    onChange('', '');
    setLocations([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setDisplayValue(val);
    setIsOpen(true);

    if (!val) {
      onChange('', '');
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 z-10" />

        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchQuery || displayValue) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 md:pl-12 pr-10 md:pr-12 py-2.5 md:py-3 text-sm border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-300"
          autoComplete="off"
        />

        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
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

      {/* Dropdown */}
      {isOpen && locations.length > 0 && (
        <div className="absolute z-50 w-full mt-1 md:mt-2 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm max-h-60 md:max-h-80 overflow-y-auto">
          {locations.map((location, index) => (
            <button
              key={`${location.iataCode}-${index}`}
              type="button"
              onClick={() => handleSelect(location)}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {location.type === 'AIRPORT' ? (
                    <Plane className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  ) : (
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                  )}
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

      {/* No results */}
      {isOpen && !loading && searchQuery.length >= 2 && locations.length === 0 && (
        <div className="absolute z-50 w-full mt-1 md:mt-2 bg-white border border-gray-200 rounded-lg md:rounded-xl shadow-sm p-4 text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No locations found</p>
          <p className="text-xs text-gray-400 mt-1">Try searching for a city or airport name</p>
        </div>
      )}
    </div>
  );
}
