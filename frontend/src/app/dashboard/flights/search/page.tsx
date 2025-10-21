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

      const response = await fetch(`http://localhost:5000/api/v1/flights/search?${params}`);
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

      const response = await fetch(`http://localhost:5000/api/v1/flights/search?${params}`);
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
          <div className="flex items-center gap-4 h-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Search Flights
          </h1>
          <p className="text-gray-600">Find the best flight deals for your next trip</p>
        </div>

        {/* Search Form */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
          <form onSubmit={handleSearch} className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
            {/* Trip Type */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setTripType('roundtrip')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
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
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  tripType === 'oneway'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                One-way
              </button>
            </div>

            {/* Location and Date Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
              {/* From */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value.toUpperCase())}
                    placeholder="JFK"
                    maxLength={3}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300 uppercase"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="lg:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={swapLocations}
                  className="w-full lg:w-auto p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all group"
                >
                  <ArrowLeftRight className="w-5 h-5 text-gray-600 group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>

              {/* To */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={to}
                    onChange={(e) => setTo(e.target.value.toUpperCase())}
                    placeholder="LAX"
                    maxLength={3}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300 uppercase"
                  />
                </div>
              </div>

              {/* Departure Date */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Departure</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Return Date */}
              {tripType === 'roundtrip' && (
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Return</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={departureDate || new Date().toISOString().split('T')[0]}
                      required={tripType === 'roundtrip'}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                    />
                  </div>
                </div>
              )}

              {/* Passengers */}
              <div className={tripType === 'roundtrip' ? 'lg:col-span-1' : 'lg:col-span-3'}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Passengers</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={getTotalPassengers()}
                    readOnly
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-pointer"
                    onClick={() => {
                      // TODO: Add passenger selector dropdown
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Travel Class */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Class</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    className={`p-4 rounded-xl font-medium transition-all border-2 ${
                      travelClass === cls.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <cls.icon className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm">{cls.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search Flights
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {flights.length > 0 && (
          <div className="space-y-6">
            {/* Results Header with Filter */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Available Flights ({flights.filter(f => {
                  if (selectedAirline === 'all') return true;
                  const airlines = [...new Set(f.itineraries[0].segments.map((seg: any) => seg.carrierCode))];
                  return airlines.includes(selectedAirline);
                }).length})
              </h2>

              {/* Airline Filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Filter by Airline:</label>
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-gray-900"
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
                  className="group bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
                >
                  <div className="p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row gap-6 items-center">
                      {/* Airline Info with Logo */}
                      <div className="flex-shrink-0 text-center">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg mb-2 border-2 border-gray-200 overflow-hidden">
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
                          <Plane className="w-10 h-10 text-blue-600 hidden" />
                        </div>
                        <div className="text-sm font-bold text-gray-900">{firstSegment.carrierCode}</div>
                        <div className="text-xs text-gray-500">{firstSegment.number}</div>
                      </div>

                      {/* Flight Details */}
                      <div className="flex-1 w-full">
                        {/* Airline Name Badge */}
                        <div className="mb-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                            <Plane className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">
                              {airlines.map(code => AIRLINE_NAMES[code] || code).join(', ')}
                            </span>
                            {airlines.length > 1 && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                Multiple
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-center flex-1">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {departureTime}
                            </div>
                            <div className="text-sm font-semibold text-gray-600">
                              {firstSegment.departure.iataCode}
                            </div>
                          </div>

                          <div className="flex-1 px-6">
                            <div className="relative">
                              <div className="border-t-2 border-dashed border-gray-300"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3">
                                <Plane className="w-5 h-5 text-blue-600 rotate-90" />
                              </div>
                            </div>
                            <div className="text-center mt-2">
                              <div className="text-xs font-medium text-gray-600">{duration}</div>
                              <div className="text-xs text-gray-500">
                                {stops === 0 ? 'Direct' : `${stops} ${stops === 1 ? 'stop' : 'stops'}`}
                              </div>
                            </div>
                          </div>

                          <div className="text-center flex-1">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {arrivalTime}
                            </div>
                            <div className="text-sm font-semibold text-gray-600">
                              {lastSegment.arrival.iataCode}
                            </div>
                          </div>
                        </div>

                        {/* Layover Information - Enhanced */}
                        {stops > 0 && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                              <div className="p-1.5 bg-amber-500 rounded-lg flex-shrink-0">
                                <Clock className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">
                                  Layover{stops > 1 ? 's' : ''}: {stops} Stop{stops > 1 ? 's' : ''}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {outbound.segments.slice(0, -1).map((segment: any, segIndex: number) => {
                                    const nextSegment = outbound.segments[segIndex + 1];
                                    const layoverStart = new Date(segment.arrival.at);
                                    const layoverEnd = new Date(nextSegment.departure.at);
                                    const layoverMinutes = Math.floor((layoverEnd.getTime() - layoverStart.getTime()) / 60000);
                                    const layoverHours = Math.floor(layoverMinutes / 60);
                                    const layoverMins = layoverMinutes % 60;

                                    return (
                                      <div key={segIndex} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-lg">
                                        <MapPin className="w-3 h-3 text-amber-600" />
                                        <span className="text-xs font-semibold text-gray-900">
                                          {segment.arrival.iataCode}
                                        </span>
                                        <span className="text-xs text-amber-700 font-medium">
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
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                          <Briefcase className="w-4 h-4" />
                          <span className="font-medium">{flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'Economy'}</span>
                        </div>
                      </div>

                      {/* Price & CTA */}
                      <div className="flex-shrink-0 lg:w-56 w-full">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                          <div className="text-xs text-gray-500 mb-2">
                            Total Price
                          </div>
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {flight.price.currency}{' '}
                            {parseFloat(flight.price.total).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-xs text-gray-500 mb-4">
                            for {getTotalPassengers()} {getTotalPassengers() === 1 ? 'passenger' : 'passengers'}
                          </div>

                          <Link
                            href={`/dashboard/flights/${flight.id || index}?flightData=${encodeURIComponent(JSON.stringify(flight))}`}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.01] transition-all duration-200 inline-flex items-center justify-center gap-2"
                          >
                            View Details
                            <Plane className="w-4 h-4" />
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
