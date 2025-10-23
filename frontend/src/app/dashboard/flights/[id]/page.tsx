'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plane,
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  MapPin,
  Briefcase,
  Luggage,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AIChatbox from '@/components/AIChatbox';
import PassengerDetailsModal from '@/components/PassengerDetailsModal';
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

// Airport and City names mapping
const AIRPORT_NAMES: { [key: string]: { airport: string; city: string } } = {
  'JFK': { airport: 'John F. Kennedy International Airport', city: 'New York' },
  'LAX': { airport: 'Los Angeles International Airport', city: 'Los Angeles' },
  'LHR': { airport: 'London Heathrow Airport', city: 'London' },
  'CDG': { airport: 'Charles de Gaulle Airport', city: 'Paris' },
  'DXB': { airport: 'Dubai International Airport', city: 'Dubai' },
  'SIN': { airport: 'Singapore Changi Airport', city: 'Singapore' },
  'HND': { airport: 'Tokyo Haneda Airport', city: 'Tokyo' },
  'NRT': { airport: 'Narita International Airport', city: 'Tokyo' },
  'ORD': { airport: 'O\'Hare International Airport', city: 'Chicago' },
  'ATL': { airport: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta' },
  'DFW': { airport: 'Dallas/Fort Worth International Airport', city: 'Dallas' },
  'DEN': { airport: 'Denver International Airport', city: 'Denver' },
  'SFO': { airport: 'San Francisco International Airport', city: 'San Francisco' },
  'SEA': { airport: 'Seattle-Tacoma International Airport', city: 'Seattle' },
  'LAS': { airport: 'Harry Reid International Airport', city: 'Las Vegas' },
  'MCO': { airport: 'Orlando International Airport', city: 'Orlando' },
  'MIA': { airport: 'Miami International Airport', city: 'Miami' },
  'BOS': { airport: 'Logan International Airport', city: 'Boston' },
  'EWR': { airport: 'Newark Liberty International Airport', city: 'Newark' },
  'FRA': { airport: 'Frankfurt Airport', city: 'Frankfurt' },
  'AMS': { airport: 'Amsterdam Airport Schiphol', city: 'Amsterdam' },
  'MAD': { airport: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid' },
  'BCN': { airport: 'Barcelona-El Prat Airport', city: 'Barcelona' },
  'FCO': { airport: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome' },
  'IST': { airport: 'Istanbul Airport', city: 'Istanbul' },
  'SYD': { airport: 'Sydney Kingsford Smith Airport', city: 'Sydney' },
  'MEL': { airport: 'Melbourne Airport', city: 'Melbourne' },
  'HKG': { airport: 'Hong Kong International Airport', city: 'Hong Kong' },
  'ICN': { airport: 'Incheon International Airport', city: 'Seoul' },
  'PEK': { airport: 'Beijing Capital International Airport', city: 'Beijing' },
  'PVG': { airport: 'Shanghai Pudong International Airport', city: 'Shanghai' },
  'YYZ': { airport: 'Toronto Pearson International Airport', city: 'Toronto' },
  'YVR': { airport: 'Vancouver International Airport', city: 'Vancouver' },
};

// Function to get airline logo URL
const getAirlineLogo = (code: string) => {
  return `https://images.kiwi.com/airlines/64/${code}.png`;
};

export default function FlightDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const flightId = params.id as string;
  const flightDataParam = searchParams.get('flightData');

  const [flight, setFlight] = useState<any>(null);
  const [expandedSegments, setExpandedSegments] = useState<{ [key: number]: boolean }>({});

  // Group booking modal state
  const [showPassengerModal, setShowPassengerModal] = useState(false);

  useEffect(() => {
    if (flightDataParam) {
      try {
        const parsedFlight = JSON.parse(decodeURIComponent(flightDataParam));
        setFlight(parsedFlight);
      } catch (error) {
        console.error('Failed to parse flight data:', error);
      }
    }
  }, [flightDataParam]);

  const toggleSegment = (index: number) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const formatDuration = (duration: string) => {
    return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase();
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  const handleContinueToBook = () => {
    setShowPassengerModal(true);
  };

  const handlePassengerDetailsSubmit = async (
    passengers: any[],
    isGroupBooking: boolean,
    groupName?: string
  ) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        alert('Please log in to make a booking');
        router.push('/login');
        return;
      }

      const firstSegment = flight.itineraries[0].segments[0];
      const lastSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];
      const returnSegment = flight.itineraries[1]?.segments[0];

      const bookingData = {
        bookingType: 'flight',
        isGroupBooking,
        numberOfTravelers: passengers.length,
        groupName: isGroupBooking ? groupName : undefined,

        // Trip details
        origin: firstSegment.departure.iataCode,
        destination: lastSegment.arrival.iataCode,
        departureDate: firstSegment.departure.at,
        returnDate: returnSegment?.departure.at || null,
        passengers: passengers.length,
        passengerDetails: passengers,

        // Pricing
        basePrice: parseFloat(flight.price.base),
        taxesFees: parseFloat(flight.price.total) - parseFloat(flight.price.base),
        totalPrice: parseFloat(flight.price.total),
        currency: flight.price.currency,

        // Flight specific details
        flightDetails: {
          airline: AIRLINE_NAMES[firstSegment.carrierCode] || firstSegment.carrierCode,
          airlineCode: firstSegment.carrierCode,
          flightNumber: firstSegment.number,
          departureAirport: firstSegment.departure.iataCode,
          departureAirportCode: firstSegment.departure.iataCode,
          arrivalAirport: lastSegment.arrival.iataCode,
          arrivalAirportCode: lastSegment.arrival.iataCode,
          departureTime: firstSegment.departure.at,
          arrivalTime: lastSegment.arrival.at,
          cabinClass: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
          numberOfStops: flight.itineraries[0].segments.length - 1,
          duration: flight.itineraries[0].duration,
          baggageAllowance: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0,
          isRoundTrip: flight.itineraries.length > 1,
          returnFlightNumber: returnSegment?.number || null,
          returnDepartureTime: returnSegment?.departure.at || null,
          returnArrivalTime: returnSegment ? flight.itineraries[1].segments[flight.itineraries[1].segments.length - 1].arrival.at : null,
        },
      };

      const response = await fetch(getApiEndpoint('bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const result = await response.json();
        setShowPassengerModal(false);
        alert('Booking created successfully!');
        router.push(`/dashboard/bookings/${result.data.id}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  if (!flight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-12 h-12 text-gray-700 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading flight details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link
              href="/dashboard/flights/search"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Search</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flight Details - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Overview */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h1 className="text-base font-bold text-gray-900 mb-4">Flight Details</h1>

              {/* Itineraries */}
              {flight.itineraries.map((itinerary: any, itinIndex: number) => {
                const firstSegment = itinerary.segments[0];
                const lastSegment = itinerary.segments[itinerary.segments.length - 1];
                const departureInfo = formatDateTime(firstSegment.departure.at);
                const arrivalInfo = formatDateTime(lastSegment.arrival.at);

                return (
                  <div key={itinIndex} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Plane className="w-4 h-4 text-gray-700" />
                      <h3 className="text-sm font-bold text-gray-900">
                        {itinIndex === 0 ? 'Outbound Flight' : 'Return Flight'}
                      </h3>
                    </div>

                    {/* Flight Route Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-left flex-1">
                          <div className="text-lg font-bold text-gray-900 mb-0.5">
                            {departureInfo.time}
                          </div>
                          <div className="text-xs font-semibold text-gray-900">
                            {AIRPORT_NAMES[firstSegment.departure.iataCode]?.city || firstSegment.departure.iataCode}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            {AIRPORT_NAMES[firstSegment.departure.iataCode]?.airport || firstSegment.departure.iataCode}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{departureInfo.date}</div>
                        </div>

                        <div className="flex-shrink-0 px-4 flex flex-col items-center pt-1">
                          <div className="text-[10px] font-semibold text-gray-700 mb-2">
                            {formatDuration(itinerary.duration)}
                          </div>
                          <div className="border-t border-dashed border-gray-300 w-24 mb-2"></div>
                          <div className="text-[10px] text-gray-600">
                            {itinerary.segments.length === 1
                              ? 'Direct'
                              : `${itinerary.segments.length - 1} ${
                                  itinerary.segments.length - 1 === 1 ? 'stop' : 'stops'
                                }`}
                          </div>
                        </div>

                        <div className="text-right flex-1">
                          <div className="text-lg font-bold text-gray-900 mb-0.5">
                            {arrivalInfo.time}
                          </div>
                          <div className="text-xs font-semibold text-gray-900">
                            {AIRPORT_NAMES[lastSegment.arrival.iataCode]?.city || lastSegment.arrival.iataCode}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            {AIRPORT_NAMES[lastSegment.arrival.iataCode]?.airport || lastSegment.arrival.iataCode}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{arrivalInfo.date}</div>
                        </div>
                      </div>
                    </div>

                    {/* Segment Details */}
                    {itinerary.segments.map((segment: any, segIndex: number) => {
                      const segDeparture = formatDateTime(segment.departure.at);
                      const segArrival = formatDateTime(segment.arrival.at);
                      const isExpanded = expandedSegments[itinIndex * 100 + segIndex];

                      return (
                        <div key={segIndex} className="mb-3 last:mb-0">
                          <div
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-400 transition-all cursor-pointer"
                            onClick={() => toggleSegment(itinIndex * 100 + segIndex)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {/* Airline Logo */}
                                <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                                  <img
                                    src={getAirlineLogo(segment.carrierCode)}
                                    alt={AIRLINE_NAMES[segment.carrierCode] || segment.carrierCode}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <Plane className="w-5 h-5 text-gray-600 hidden" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900 text-sm">
                                    {AIRLINE_NAMES[segment.carrierCode] || segment.carrierCode}
                                  </div>
                                  <div className="text-[10px] text-gray-600">
                                    {segment.carrierCode} {segment.number} • {AIRPORT_NAMES[segment.departure.iataCode]?.city || segment.departure.iataCode} → {AIRPORT_NAMES[segment.arrival.iataCode]?.city || segment.arrival.iataCode}
                                  </div>
                                </div>
                                {/* Flight Times - Visible when collapsed */}
                                {!isExpanded && (
                                  <div className="flex items-start gap-4 mr-2">
                                    <div className="text-center">
                                      <div className="text-base font-bold text-gray-900">{segment.departure.iataCode}</div>
                                      <div className="text-xs font-semibold text-gray-700">{segDeparture.time}</div>
                                      <div className="text-[10px] text-gray-500">{segDeparture.date}</div>
                                      <div className="text-[10px] text-gray-600 font-medium mt-0.5">
                                        {AIRPORT_NAMES[segment.departure.iataCode]?.city || segment.departure.iataCode}
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        {AIRPORT_NAMES[segment.departure.iataCode]?.airport || ''}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-center pt-6">
                                      <ArrowRight className="w-4 h-4 text-gray-400" />
                                      <div className="text-[10px] text-gray-600 font-medium mt-1">{formatDuration(segment.duration)}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-base font-bold text-gray-900">{segment.arrival.iataCode}</div>
                                      <div className="text-xs font-semibold text-gray-700">{segArrival.time}</div>
                                      <div className="text-[10px] text-gray-500">{segArrival.date}</div>
                                      <div className="text-[10px] text-gray-600 font-medium mt-0.5">
                                        {AIRPORT_NAMES[segment.arrival.iataCode]?.city || segment.arrival.iataCode}
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        {AIRPORT_NAMES[segment.arrival.iataCode]?.airport || ''}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                            </div>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-0.5">Departure</div>
                                    <div className="font-semibold text-gray-900 text-sm">
                                      {segDeparture.time}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-700">{AIRPORT_NAMES[segment.departure.iataCode]?.city || segment.departure.iataCode}</div>
                                    <div className="text-[10px] text-gray-600">{AIRPORT_NAMES[segment.departure.iataCode]?.airport || segment.departure.iataCode}</div>
                                    <div className="text-[10px] text-gray-500">{segDeparture.date}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-0.5">Arrival</div>
                                    <div className="font-semibold text-gray-900 text-sm">
                                      {segArrival.time}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-700">{AIRPORT_NAMES[segment.arrival.iataCode]?.city || segment.arrival.iataCode}</div>
                                    <div className="text-[10px] text-gray-600">{AIRPORT_NAMES[segment.arrival.iataCode]?.airport || segment.arrival.iataCode}</div>
                                    <div className="text-[10px] text-gray-500">{segArrival.date}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDuration(segment.duration)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    <span>
                                      {flight.travelerPricings?.[0]?.fareDetailsBySegment?.[segIndex]
                                        ?.cabin || 'Economy'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Layover Notice */}
                          {segIndex < itinerary.segments.length - 1 && (() => {
                            const nextSegment = itinerary.segments[segIndex + 1];
                            const layoverStart = new Date(segment.arrival.at);
                            const layoverEnd = new Date(nextSegment.departure.at);
                            const layoverMinutes = Math.floor((layoverEnd.getTime() - layoverStart.getTime()) / (1000 * 60));
                            const layoverHours = Math.floor(layoverMinutes / 60);
                            const layoverMins = layoverMinutes % 60;

                            return (
                              <div className="flex items-center justify-center py-2">
                                <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-700">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Layover at {AIRPORT_NAMES[segment.arrival.iataCode]?.city || segment.arrival.iataCode} • {layoverHours}h {layoverMins}m
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Baggage & Policies */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Baggage & Policies</h2>

              <div className="space-y-2">
                {flight.travelerPricings?.[0]?.fareDetailsBySegment?.map(
                  (fareDetail: any, index: number) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Luggage className="w-3 h-3 text-gray-700" />
                        <span className="font-semibold text-gray-900 text-xs">Segment {index + 1}</span>
                      </div>
                      <div className="text-[10px] text-gray-600">
                        {fareDetail.includedCheckedBags?.quantity ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-gray-700" />
                            {fareDetail.includedCheckedBags.quantity} checked bag(s) included
                          </span>
                        ) : (
                          <span>No checked bags included</span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Booking Summary - Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-white rounded-lg p-4 border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Booking Summary</h2>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Base Fare</span>
                  <span className="font-semibold">
                    {flight.price.currency} {parseFloat(flight.price.base).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {(() => {
                  const baseFare = parseFloat(flight.price.base);
                  const totalFare = parseFloat(flight.price.total);
                  const taxesAndFees = totalFare - baseFare;

                  if (taxesAndFees > 0) {
                    return (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Taxes & Fees</span>
                        <span className="font-semibold">
                          {flight.price.currency}{' '}
                          {taxesAndFees.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="border-t border-gray-200 pt-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-900">Total Price</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {flight.price.currency}{' '}
                      {parseFloat(flight.price.total).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      For {flight.travelerPricings?.length || 1}{' '}
                      {flight.travelerPricings?.length === 1 ? 'passenger' : 'passengers'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Check className="w-3 h-3 text-gray-700" />
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Check className="w-3 h-3 text-gray-700" />
                  <span>Mobile ticket</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Check className="w-3 h-3 text-gray-700" />
                  <span>Flexible booking</span>
                </div>
              </div>

              <button
                onClick={handleContinueToBook}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                Continue to Book
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbox */}
      <AIChatbox />

      {/* Passenger Details Modal */}
      <PassengerDetailsModal
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        numberOfTravelers={flight.travelerPricings?.length || 1}
        bookingType="flight"
        onSubmit={handlePassengerDetailsSubmit}
      />
    </div>
  );
}
