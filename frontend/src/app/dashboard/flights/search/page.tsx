'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plane,
  ArrowLeftRight,
  Calendar,
  Users,
  Search,
  MapPin,
  ArrowLeft,
  Clock,
  DollarSign,
  Briefcase,
  Luggage,
} from 'lucide-react';
import AIChatbox from '@/components/AIChatbox';
import { getApiEndpoint } from '@/lib/api-config';

// Airline names mapping
const AIRLINE_NAMES: { [key: string]: string } = {
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta Air Lines',
  'BA': 'British Airways',
  'AF': 'Air France',
  'LH': 'Lufthansa',
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'SQ': 'Singapore Airlines',
  'NH': 'All Nippon Airways',
  'TK': 'Turkish Airlines',
  'AC': 'Air Canada',
  'VS': 'Virgin Atlantic',
  'KL': 'KLM',
  'AZ': 'ITA Airways',
  'IB': 'Iberia',
  'CX': 'Cathay Pacific',
  'JL': 'Japan Airlines',
  'EY': 'Etihad Airways',
  'SA': 'South African Airways',
  'QF': 'Qantas',
  'NZ': 'Air New Zealand',
};

// Function to get airline logo URL
const getAirlineLogo = (code: string) => {
  return `https://images.kiwi.com/airlines/64/${code}.png`;
};

export default function FlightSearchPage() {
  const searchParams = useSearchParams();
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [travelClass, setTravelClass] = useState('ECONOMY');
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [selectedAirline, setSelectedAirline] = useState<string>('all');
  const [showSearchForm, setShowSearchForm] = useState(false);

  // Read URL params and trigger search on mount
  useEffect(() => {
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const depDate = searchParams.get('departureDate');
    const retDate = searchParams.get('returnDate');
    const adults = searchParams.get('adults');
    const directFlight = searchParams.get('directFlight');

    if (origin && destination && depDate) {
      // Set form values from URL params
      setFrom(origin);
      setTo(destination);
      setDepartureDate(depDate);
      if (retDate) {
        setReturnDate(retDate);
        setTripType('roundtrip');
      } else {
        setTripType('oneway');
      }
      if (adults) {
        setPassengers(prev => ({ ...prev, adults: parseInt(adults) }));
      }

      // Trigger search automatically
      performSearch(origin, destination, depDate, retDate, parseInt(adults || '1'), directFlight === 'true');
    }
  }, [searchParams]);

  const performSearch = async (origin: string, destination: string, depDate: string, retDate: string | null, adults: number, directFlight?: boolean) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        origin,
        destination,
        departureDate: depDate,
        ...(retDate && { returnDate: retDate }),
        adults: adults.toString(),
        travelClass,
        nonStop: directFlight ? 'true' : 'false',
        currencyCode: 'USD',
        max: '50',
      });

      const response = await fetch(`${getApiEndpoint('flights/search')}?${params}`);
      const data = await response.json();

      if (data.success) {
        setFlights(data.data);
      } else {
        setError(data.message || 'Failed to search flights');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching flights');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowSearchForm(false); // Close modal on mobile after search

    try {
      const params = new URLSearchParams({
        origin: from,
        destination: to,
        departureDate,
        ...(tripType === 'roundtrip' && returnDate && { returnDate }),
        adults: passengers.adults.toString(),
        ...(passengers.children > 0 && { children: passengers.children.toString() }),
        ...(passengers.infants > 0 && { infants: passengers.infants.toString() }),
        travelClass,
        nonStop: 'false',
        currencyCode: 'USD',
        max: '50',
      });

      const response = await fetch(`${getApiEndpoint('flights/search')}?${params}`);
      const data = await response.json();

      if (data.success) {
        setFlights(data.data);
      } else {
        setError(data.message || 'Failed to search flights');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching flights');
    } finally {
      setLoading(false);
    }
  };

  const swapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const getTotalPassengers = () => {
    return passengers.adults + passengers.children + passengers.infants;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 md:gap-4 h-12 md:h-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 md:gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base font-medium">Back</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-1 md:mb-2">
            Search Flights
          </h1>
          <p className="text-sm md:text-base text-gray-600">Find the best flight deals for your next trip</p>
        </div>

        {/* Mobile Search Button - Shows on mobile when no results yet */}
        {!flights.length && (
          <button
            onClick={() => setShowSearchForm(true)}
            className="md:hidden w-full mb-6 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            <Search className="w-6 h-6" />
            <span className="text-lg">Start Your Flight Search</span>
          </button>
        )}

        {/* Search Form - Desktop only, always hidden on mobile */}
        <div className="hidden md:block relative mb-6 md:mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl md:rounded-3xl blur-xl"></div>
          <form onSubmit={handleSearch} className="relative bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl border border-gray-200">
            {/* Trip Type */}
            <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
              <button
                type="button"
                onClick={() => setTripType('roundtrip')}
                className={`flex-1 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all ${
                  tripType === 'roundtrip'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Roundtrip
              </button>
              <button
                type="button"
                onClick={() => setTripType('oneway')}
                className={`flex-1 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all ${
                  tripType === 'oneway'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                One-way
              </button>
            </div>

            {/* Location and Date Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 mb-4 md:mb-6">
              {/* From */}
              <div className="lg:col-span-3">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value.toUpperCase())}
                    placeholder="JFK"
                    maxLength={3}
                    required
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300 uppercase"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="lg:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={swapLocations}
                  className="w-full lg:w-auto p-2.5 md:p-3 bg-gray-100 hover:bg-gray-200 rounded-lg md:rounded-xl transition-all group"
                >
                  <ArrowLeftRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>

              {/* To */}
              <div className="lg:col-span-3">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={to}
                    onChange={(e) => setTo(e.target.value.toUpperCase())}
                    placeholder="LAX"
                    maxLength={3}
                    required
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300 uppercase"
                  />
                </div>
              </div>

              {/* Departure Date */}
              <div className="lg:col-span-2">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Departure</label>
                <div className="relative">
                  <Calendar className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Return Date */}
              {tripType === 'roundtrip' && (
                <div className="lg:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Return</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={departureDate || new Date().toISOString().split('T')[0]}
                      required={tripType === 'roundtrip'}
                      className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                    />
                  </div>
                </div>
              )}

              {/* Passengers */}
              <div className={tripType === 'roundtrip' ? 'lg:col-span-1' : 'lg:col-span-3'}>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Passengers</label>
                <div className="relative">
                  <Users className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="number"
                    value={getTotalPassengers()}
                    readOnly
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl bg-gray-50 cursor-pointer"
                    onClick={() => {
                      // TODO: Add passenger selector dropdown
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Travel Class */}
            <div className="mb-4 md:mb-6">
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Travel Class</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {[
                  { value: 'ECONOMY', label: 'Economy', icon: Luggage },
                  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', icon: Briefcase },
                  { value: 'BUSINESS', label: 'Business', icon: Briefcase },
                  { value: 'FIRST', label: 'First Class', icon: Briefcase },
                ].map((cls) => (
                  <button
                    key={cls.value}
                    type="button"
                    onClick={() => setTravelClass(cls.value)}
                    className={`p-3 md:p-4 rounded-lg md:rounded-xl font-medium transition-all border-2 ${
                      travelClass === cls.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <cls.icon className="w-4 h-4 md:w-5 md:h-5 mx-auto mb-1 md:mb-2" />
                    <span className="text-xs md:text-sm">{cls.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 md:py-4 text-sm md:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 md:w-5 md:h-5" />
                  Search Flights
                </>
              )}
            </button>
          </form>
        </div>

        {/* Floating Action Button - Mobile Only (shows when results exist) */}
        {flights.length > 0 && (
          <button
            onClick={() => setShowSearchForm(true)}
            className="md:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 active:scale-95"
          >
            <Search className="w-5 h-5" />
            <span>Modify Search</span>
          </button>
        )}

        {/* Mobile Search Form Modal */}
        {showSearchForm && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSearchForm(false)}
            ></div>

            {/* Modal */}
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between rounded-t-3xl">
                <h2 className="text-lg font-bold text-gray-900">Modify Search</h2>
                <button
                  onClick={() => setShowSearchForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <Search className="w-5 h-5 text-gray-600 rotate-45" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSearch} className="p-4">
                {/* Trip Type */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setTripType('roundtrip')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      tripType === 'roundtrip'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Roundtrip
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('oneway')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      tripType === 'oneway'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    One-way
                  </button>
                </div>

                {/* From/To */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">From</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={from}
                        onChange={(e) => setFrom(e.target.value.toUpperCase())}
                        placeholder="JFK"
                        maxLength={3}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={swapLocations}
                    className="w-full p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-gray-600 mx-auto" />
                  </button>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">To</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={to}
                        onChange={(e) => setTo(e.target.value.toUpperCase())}
                        placeholder="LAX"
                        maxLength={3}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Departure</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {tripType === 'roundtrip' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Return</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          min={departureDate || new Date().toISOString().split('T')[0]}
                          required={tripType === 'roundtrip'}
                          className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Passengers */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Passengers</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={getTotalPassengers()}
                      readOnly
                      className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg bg-gray-50 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Travel Class */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Travel Class</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'ECONOMY', label: 'Economy', icon: Luggage },
                      { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', icon: Briefcase },
                      { value: 'BUSINESS', label: 'Business', icon: Briefcase },
                      { value: 'FIRST', label: 'First Class', icon: Briefcase },
                    ].map((cls) => (
                      <button
                        key={cls.value}
                        type="button"
                        onClick={() => setTravelClass(cls.value)}
                        className={`p-3 rounded-lg font-medium transition-all border-2 ${
                          travelClass === cls.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <cls.icon className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">{cls.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search Flights
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {flights.length > 0 && (
          <div className="space-y-3 md:space-y-6">
            {/* Results Header with Filter */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                Available Flights ({flights.filter(f => {
                  if (selectedAirline === 'all') return true;
                  const airlines = [...new Set(f.itineraries[0].segments.map((seg: any) => seg.carrierCode))];
                  return airlines.includes(selectedAirline);
                }).length})
              </h2>

              {/* Airline Filter */}
              <div className="flex items-center gap-2 md:gap-3">
                <label className="text-xs md:text-sm font-semibold text-gray-700">Filter:</label>
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-gray-900"
                >
                  <option value="all">All Airlines</option>
                  {[...new Set(flights.flatMap(f =>
                    f.itineraries[0].segments.map((seg: any) => seg.carrierCode)
                  ))].sort().map(code => (
                    <option key={code} value={code}>
                      {AIRLINE_NAMES[code] || code} ({code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {flights.filter(f => {
              if (selectedAirline === 'all') return true;
              const airlines = [...new Set(f.itineraries[0].segments.map((seg: any) => seg.carrierCode))];
              return airlines.includes(selectedAirline);
            }).map((flight, index) => {
              const outbound = flight.itineraries[0];
              const firstSegment = outbound.segments[0];
              const lastSegment = outbound.segments[outbound.segments.length - 1];
              const departureTime = new Date(firstSegment.departure.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const arrivalTime = new Date(lastSegment.arrival.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const duration = outbound.duration.replace('PT', '').toLowerCase();
              const stops = outbound.segments.length - 1;

              // Get unique airlines
              const airlines = [...new Set(outbound.segments.map((seg: any) => seg.carrierCode))] as string[];
              const airlineNames = airlines.join(', ');

              return (
                <div
                  key={index}
                  className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-md md:shadow-lg border border-gray-200 hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
                >
                  <div className="p-3 md:p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row gap-3 md:gap-6 items-center">
                      {/* Airline Info with Logo */}
                      <div className="flex-shrink-0 text-center">
                        <div className="w-12 h-12 md:w-20 md:h-20 bg-white rounded-lg md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md md:shadow-lg mb-1 md:mb-2 border border-gray-200 md:border-2 overflow-hidden">
                          <img
                            src={getAirlineLogo(firstSegment.carrierCode)}
                            alt={AIRLINE_NAMES[firstSegment.carrierCode] || firstSegment.carrierCode}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              // Fallback to plane icon if logo fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Plane className="w-6 h-6 md:w-10 md:h-10 text-blue-600 hidden" />
                        </div>
                        <div className="text-xs md:text-sm font-bold text-gray-900">{firstSegment.carrierCode}</div>
                        <div className="text-[10px] md:text-xs text-gray-500">{firstSegment.number}</div>
                      </div>

                      {/* Flight Details */}
                      <div className="flex-1 w-full">
                        {/* Airline Name Badge */}
                        <div className="mb-2 md:mb-3">
                          <div className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                            <Plane className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" />
                            <span className="text-xs md:text-sm font-semibold text-blue-700 truncate max-w-[150px] md:max-w-none">
                              {airlines.map(code => AIRLINE_NAMES[code] || code).join(', ')}
                            </span>
                            {airlines.length > 1 && (
                              <span className="text-[10px] md:text-xs text-blue-600 bg-blue-100 px-1.5 md:px-2 py-0.5 rounded-full">
                                Multiple
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                          <div className="text-center flex-1">
                            <div className="text-lg md:text-2xl font-bold text-gray-900 mb-0.5 md:mb-1">
                              {departureTime}
                            </div>
                            <div className="text-xs md:text-sm font-semibold text-gray-600">
                              {firstSegment.departure.iataCode}
                            </div>
                          </div>

                          <div className="flex-1 px-2 md:px-6">
                            <div className="relative">
                              <div className="border-t-2 border-dashed border-gray-300"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1.5 md:px-3">
                                <Plane className="w-4 h-4 md:w-5 md:h-5 text-blue-600 rotate-90" />
                              </div>
                            </div>
                            <div className="text-center mt-1 md:mt-2">
                              <div className="text-[10px] md:text-xs font-medium text-gray-600">{duration}</div>
                              <div className="text-[10px] md:text-xs text-gray-500">
                                {stops === 0 ? 'Direct' : `${stops} ${stops === 1 ? 'stop' : 'stops'}`}
                              </div>
                            </div>
                          </div>

                          <div className="text-center flex-1">
                            <div className="text-lg md:text-2xl font-bold text-gray-900 mb-0.5 md:mb-1">
                              {arrivalTime}
                            </div>
                            <div className="text-xs md:text-sm font-semibold text-gray-600">
                              {lastSegment.arrival.iataCode}
                            </div>
                          </div>
                        </div>

                        {/* Layover Information - Enhanced */}
                        {stops > 0 && (
                          <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg md:rounded-xl">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="p-1 md:p-1.5 bg-amber-500 rounded-md md:rounded-lg flex-shrink-0">
                                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-[10px] md:text-xs font-bold text-amber-900 uppercase tracking-wide mb-0.5 md:mb-1">
                                  Layover{stops > 1 ? 's' : ''}: {stops} Stop{stops > 1 ? 's' : ''}
                                </div>
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                  {outbound.segments.slice(0, -1).map((segment: any, segIndex: number) => {
                                    const nextSegment = outbound.segments[segIndex + 1];
                                    const layoverStart = new Date(segment.arrival.at);
                                    const layoverEnd = new Date(nextSegment.departure.at);
                                    const layoverMinutes = Math.floor((layoverEnd.getTime() - layoverStart.getTime()) / 60000);
                                    const layoverHours = Math.floor(layoverMinutes / 60);
                                    const layoverMins = layoverMinutes % 60;

                                    return (
                                      <div key={segIndex} className="inline-flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2.5 py-0.5 md:py-1 bg-white border border-amber-300 rounded-md md:rounded-lg">
                                        <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-600" />
                                        <span className="text-[10px] md:text-xs font-semibold text-gray-900">
                                          {segment.arrival.iataCode}
                                        </span>
                                        <span className="text-[10px] md:text-xs text-amber-700 font-medium">
                                          {layoverHours > 0 && `${layoverHours}h `}{layoverMins}m
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cabin Class */}
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 mt-2 md:mt-3">
                          <Briefcase className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="font-medium">{flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'Economy'}</span>
                        </div>
                      </div>

                      {/* Price & CTA */}
                      <div className="flex-shrink-0 lg:w-56 w-full">
                        <div className="p-3 md:p-6 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-200 text-center">
                          <div className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2">
                            Total Price
                          </div>
                          <div className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5 md:mb-1">
                            {flight.price.currency}{' '}
                            {parseFloat(flight.price.total).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4">
                            for {getTotalPassengers()} {getTotalPassengers() === 1 ? 'passenger' : 'passengers'}
                          </div>

                          <Link
                            href={`/dashboard/flights/${flight.id || index}?flightData=${encodeURIComponent(JSON.stringify(flight))}`}
                            className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:shadow-lg hover:scale-[1.01] transition-all duration-200 inline-flex items-center justify-center gap-2"
                          >
                            View Details
                            <Plane className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Chatbox */}
      <AIChatbox />
    </div>
  );
}
