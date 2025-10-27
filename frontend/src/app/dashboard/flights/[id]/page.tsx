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
import SeatSelection from '@/components/SeatSelection';
import BaggageSelection from '@/components/BaggageSelection';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
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

  const [flight, setFlight] = useState<any>(null);
  const [expandedSegments, setExpandedSegments] = useState<{ [key: number]: boolean }>({});
  const [isOfferExpired, setIsOfferExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  // Multi-step booking modal state
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [showBaggageSelection, setShowBaggageSelection] = useState(false);

  // Collected booking data across steps
  const [collectedPassengers, setCollectedPassengers] = useState<any[]>([]);
  const [collectedSeats, setCollectedSeats] = useState<any[]>([]);
  const [collectedBaggage, setCollectedBaggage] = useState<any[]>([]);
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupName, setGroupName] = useState<string | undefined>();

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'card'>('credit');
  const [userCredits, setUserCredits] = useState<number>(0);

  useEffect(() => {
    // Try to get flight data from sessionStorage first
    const sessionKey = `flight_${flightId}`;
    const cachedFlightData = sessionStorage.getItem(sessionKey);

    if (cachedFlightData) {
      try {
        const parsedFlight = JSON.parse(cachedFlightData);
        setFlight(parsedFlight);

        // Check if offer has expired (10 minutes)
        const savedAt = parsedFlight._savedAt ? new Date(parsedFlight._savedAt) : null;
        const now = new Date();
        const EXPIRY_MINUTES = 10;

        if (savedAt) {
          const minutesElapsed = (now.getTime() - savedAt.getTime()) / (1000 * 60);

          if (minutesElapsed >= EXPIRY_MINUTES) {
            // Offer has expired
            setIsOfferExpired(true);
            setTimeRemaining(0);
            setIsValidating(false);
          } else {
            // Offer still valid, calculate remaining time
            const remaining = Math.floor((EXPIRY_MINUTES * 60) - ((now.getTime() - savedAt.getTime()) / 1000));
            setTimeRemaining(remaining);

            // Validate offer with backend
            validateOffer(parsedFlight.id);
          }
        } else {
          // No timestamp, assume expired
          setIsOfferExpired(true);
          setTimeRemaining(0);
          setIsValidating(false);
        }
      } catch (error) {
        console.error('Failed to parse flight data from sessionStorage:', error);
        router.push('/dashboard/flights/search');
      }
    } else {
      // If no cached data found, redirect back to search
      console.error('No flight data found. Redirecting to search page.');
      router.push('/dashboard/flights/search');
    }
  }, [flightId, router]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isOfferExpired) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setIsOfferExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isOfferExpired]);

  // Validate offer with backend
  const validateOffer = async (offerId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`flights/offers/${offerId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        // Offer no longer available
        setIsOfferExpired(true);
        setTimeRemaining(0);
      }
    } catch (error) {
      console.error('Offer validation failed:', error);
      setIsOfferExpired(true);
      setTimeRemaining(0);
    } finally {
      setIsValidating(false);
    }
  };

  // Fetch user's credit balance
  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(getApiEndpoint('dashboard/stats'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserCredits(data.credits?.available || 0);
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
      }
    };

    fetchUserCredits();
  }, []);

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

  // Helper functions to normalize flight data between Duffel and Amadeus formats
  const getItineraries = (flight: any) => {
    if (flight.outbound) {
      // Duffel format - convert to itinerary-like structure
      const itineraries = [
        {
          segments: flight.outbound,
          duration: flight.outbound[0]?.duration || '',
        },
      ];
      if (flight.inbound) {
        itineraries.push({
          segments: flight.inbound,
          duration: flight.inbound[0]?.duration || '',
        });
      }
      return itineraries;
    } else if (flight.itineraries) {
      // Amadeus format
      return flight.itineraries;
    }
    return [];
  };

  const getSegmentAirlineCode = (segment: any) => {
    return segment.airlineCode || segment.carrierCode;
  };

  const getSegmentNumber = (segment: any) => {
    return segment.flightNumber || segment.number;
  };

  const getSegmentDeparture = (segment: any) => {
    if (segment.departure?.time) {
      // Duffel format
      return {
        at: segment.departure.time,
        iataCode: segment.departure.airportCode,
        terminal: segment.departure.terminal,
        airport: segment.departure.airport, // Full airport name
        city: segment.departure.city,
      };
    } else if (segment.departure?.at) {
      // Amadeus format
      return segment.departure;
    }
    return { at: '', iataCode: '', terminal: '', airport: '', city: '' };
  };

  const getSegmentArrival = (segment: any) => {
    if (segment.arrival?.time) {
      // Duffel format
      return {
        at: segment.arrival.time,
        iataCode: segment.arrival.airportCode,
        terminal: segment.arrival.terminal,
        airport: segment.arrival.airport, // Full airport name
        city: segment.arrival.city,
      };
    } else if (segment.arrival?.at) {
      // Amadeus format
      return segment.arrival;
    }
    return { at: '', iataCode: '', terminal: '', airport: '', city: '' };
  };

  const getFlightPrice = (flight: any) => {
    if (flight.price) {
      return {
        base: flight.price.base || flight.price.total,
        total: flight.price.total,
        currency: flight.price.currency,
      };
    }
    return { base: 0, total: 0, currency: 'USD' };
  };

  const getTravelerPricings = (flight: any) => {
    // Duffel doesn't have travelerPricings, return a default structure
    if (flight.travelerPricings) {
      return flight.travelerPricings;
    }
    // Return a single traveler for Duffel
    return [{ travelerType: 'ADULT' }];
  };

  const handleContinueToBook = () => {
    setShowPassengerModal(true);
  };

  // Step 1: Passenger details collected
  const handlePassengerDetailsSubmit = async (
    passengers: any[],
    isGroupBooking: boolean,
    groupName?: string
  ) => {
    // Store passenger data
    setCollectedPassengers(passengers);
    setIsGroupBooking(isGroupBooking);
    setGroupName(groupName);

    // Close passenger modal
    setShowPassengerModal(false);

    // Move to Step 2: Seat Selection
    // Check if provider supports seat maps (only Duffel does)
    if (flight.provider === 'duffel') {
      setShowSeatSelection(true);
    } else {
      // Skip to baggage for providers that don't support seat maps
      setShowBaggageSelection(true);
    }
  };

  // Step 2: Seats collected (or skipped)
  const handleSeatSelectionConfirm = (selectedSeats: any[]) => {
    setCollectedSeats(selectedSeats);
    setShowSeatSelection(false);

    // Move to Step 3: Baggage Selection
    setShowBaggageSelection(true);
  };

  // Step 2 Alternative: User skips seat selection
  const handleSkipSeats = () => {
    setCollectedSeats([]);
    setShowSeatSelection(false);

    // Move to Step 3: Baggage Selection
    setShowBaggageSelection(true);
  };

  // Step 3: Baggage collected (or skipped) - Final step, submit booking
  const handleBaggageSelectionConfirm = async (selectedBaggage: any[]) => {
    setCollectedBaggage(selectedBaggage);
    setShowBaggageSelection(false);

    // Now submit the complete booking with all collected data
    await submitCompleteBooking(collectedPassengers, collectedSeats, selectedBaggage);
  };

  // Step 3 Alternative: User skips baggage
  const handleSkipBaggage = async () => {
    setCollectedBaggage([]);
    setShowBaggageSelection(false);

    // Submit booking without baggage
    await submitCompleteBooking(collectedPassengers, collectedSeats, []);
  };

  // Final submission with all collected data
  const submitCompleteBooking = async (
    passengers: any[],
    seats: any[],
    baggage: any[]
  ) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        alert('Please log in to make a booking');
        router.push('/login');
        return;
      }

      const itineraries = getItineraries(flight);
      const firstSegment = itineraries[0].segments[0];
      const lastSegment = itineraries[0].segments[itineraries[0].segments.length - 1];
      const returnSegment = itineraries[1]?.segments[0];

      const firstDeparture = getSegmentDeparture(firstSegment);
      const lastArrival = getSegmentArrival(lastSegment);
      const returnDeparture = returnSegment ? getSegmentDeparture(returnSegment) : null;
      const returnLastSegment = itineraries[1] ? itineraries[1].segments[itineraries[1].segments.length - 1] : null;
      const returnArrival = returnLastSegment ? getSegmentArrival(returnLastSegment) : null;

      const airlineCode = getSegmentAirlineCode(firstSegment);
      const flightNumber = getSegmentNumber(firstSegment);
      const returnFlightNumber = returnSegment ? getSegmentNumber(returnSegment) : null;

      const price = getFlightPrice(flight);
      const travelerPricings = getTravelerPricings(flight);

      // Build services array from seats and baggage (Duffel format)
      const services: Array<{ id: string; quantity: number }> = [];

      // Add seat services (each seat is quantity 1)
      seats.forEach((seat) => {
        services.push({
          id: seat.serviceId,
          quantity: 1,
        });
      });

      // Add baggage services (can be quantity > 1)
      baggage.forEach((bag) => {
        services.push({
          id: bag.serviceId,
          quantity: bag.quantity,
        });
      });

      // Calculate additional services cost
      const seatsCost = seats.reduce((sum, seat) => sum + (seat.price?.amount || 0), 0);
      const baggageCost = baggage.reduce((sum, bag) => sum + (bag.totalPrice || 0), 0);
      const servicesCost = seatsCost + baggageCost;

      const bookingData = {
        bookingType: 'flight',
        isGroupBooking,
        numberOfTravelers: passengers.length,
        groupName: isGroupBooking ? groupName : undefined,

        // Payment method - NEW!
        paymentMethod,

        // Provider details - needed for Duffel order creation on approval
        provider: 'duffel',                  // Provider type (duffel, amadeus)
        providerName: 'duffel',              // Provider display name
        providerBookingReference: flight.id, // Duffel offer ID

        // Trip details
        origin: firstDeparture.iataCode,
        destination: lastArrival.iataCode,
        departureDate: firstDeparture.at,
        returnDate: returnDeparture?.at || null,
        passengers: passengers.length,
        passengerDetails: passengers,

        // Pricing (include services in total)
        basePrice: parseFloat(price.base.toString()),
        taxesFees: parseFloat(price.total.toString()) - parseFloat(price.base.toString()),
        totalPrice: parseFloat(price.total.toString()) + servicesCost,
        currency: price.currency,

        // Services (seats & baggage) - NEW!
        services: services.length > 0 ? services : undefined,

        // Flight specific details
        flightDetails: {
          airline: AIRLINE_NAMES[airlineCode] || airlineCode,
          airlineCode: airlineCode,
          flightNumber: flightNumber,
          departureAirport: firstDeparture.iataCode,
          departureAirportCode: firstDeparture.iataCode,
          arrivalAirport: lastArrival.iataCode,
          arrivalAirportCode: lastArrival.iataCode,
          departureTime: firstDeparture.at,
          arrivalTime: lastArrival.at,
          cabinClass: travelerPricings[0]?.fareDetailsBySegment?.[0]?.cabin || firstSegment.cabinClass || 'ECONOMY',
          numberOfStops: itineraries[0].segments.length - 1,
          duration: itineraries[0].duration,
          baggageAllowance: travelerPricings[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0,
          isRoundTrip: itineraries.length > 1,
          returnFlightNumber: returnFlightNumber || null,
          returnDepartureTime: returnDeparture?.at || null,
          returnArrivalTime: returnArrival?.at || null,
        },

        // Store raw flight data AND seat/baggage selections for display and processing later
        bookingData: {
          ...flight,
          // Add seat and baggage selections to bookingData
          seatsSelected: seats?.length > 0 ? seats.map(seat => ({
            passengerId: seat.passengerId,
            passengerName: seat.passengerName,
            segmentId: seat.segmentId,
            seatDesignator: seat.seatDesignator,
            serviceId: seat.serviceId,
            price: seat.price
          })) : undefined,
          baggageSelected: baggage?.length > 0 ? baggage.map(bag => ({
            serviceId: bag.serviceId,
            description: bag.description,
            quantity: bag.quantity,
            price: bag.price,
            totalPrice: bag.totalPrice
          })) : undefined,
        },
      };

      console.log('=== BOOKING SUBMISSION ===');
      console.log('Passengers:', passengers.length);
      console.log('Seats selected:', seats.length);
      console.log('Seats data:', seats);
      console.log('Baggage items:', baggage.length);
      console.log('Baggage data:', baggage);
      console.log('Services array:', services);
      console.log('seatsSelected in bookingData:', bookingData.bookingData.seatsSelected);
      console.log('baggageSelected in bookingData:', bookingData.bookingData.baggageSelected);
      console.log('Total price (including services):', bookingData.totalPrice);
      console.log('Services cost:', servicesCost);
      console.log('=========================');

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

        // If card payment, redirect to Stripe checkout
        if (paymentMethod === 'card' && result.checkoutUrl) {
          console.log('Redirecting to Stripe checkout:', result.checkoutUrl);
          window.location.href = result.checkoutUrl;
        } else {
          // For credit payment, show success and go to booking details
          alert('Booking created successfully!');
          router.push(`/dashboard/bookings/${result.data.id}`);
        }
      } else {
        const error = await response.json();

        // Handle specific error cases
        if (error.error === 'OFFER_EXPIRED') {
          alert(
            `❌ This flight offer has expired!\n\n` +
            `Flight offers are only valid for 5-15 minutes from the time of search. ` +
            `This ensures you get the most accurate pricing and availability.\n\n` +
            `You'll be redirected to search for fresh flights.`
          );
          // Redirect back to flight search after 2 seconds
          setTimeout(() => {
            router.push('/dashboard/flights/search');
          }, 2000);
        } else if (error.error === 'STRIPE_CHECKOUT_FAILED') {
          alert(
            `❌ Payment Session Failed\n\n` +
            `We couldn't create a payment session with Stripe.\n` +
            `${error.details || ''}\n\n` +
            `Please try again. If the problem persists, contact support.`
          );
        } else if (error.error === 'CHECKOUT_URL_MISSING') {
          alert(
            `❌ Payment Setup Failed\n\n` +
            `Unable to set up payment for this booking.\n\n` +
            `Please try again or contact support.`
          );
        } else {
          alert(error.message || 'Failed to create booking');
        }
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
              href="/dashboard/flights/search?restore=true"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Search</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Offer Expiry Timer or Expired Banner */}
      {timeRemaining !== null && !isOfferExpired && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                <span className="text-sm font-semibold text-blue-900">
                  This offer expires in: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs text-blue-700">Complete your booking soon!</span>
            </div>
          </div>
        </div>
      )}

      {isOfferExpired && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-red-900 mb-2">Flight Offer Expired</h2>
              <p className="text-sm text-red-700 mb-4">
                This flight offer has expired after 10 minutes. Prices and availability may have changed.
              </p>
              <Link
                href="/dashboard/flights/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Search for New Flights
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flight Details - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Overview */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h1 className="text-base font-bold text-gray-900 mb-4">Flight Details</h1>

              {/* Itineraries */}
              {getItineraries(flight).map((itinerary: any, itinIndex: number) => {
                const firstSegment = itinerary.segments[0];
                const lastSegment = itinerary.segments[itinerary.segments.length - 1];
                const firstDeparture = getSegmentDeparture(firstSegment);
                const lastArrival = getSegmentArrival(lastSegment);
                const departureInfo = formatDateTime(firstDeparture.at);
                const arrivalInfo = formatDateTime(lastArrival.at);

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
                            {firstDeparture.city || AIRPORT_NAMES[firstDeparture.iataCode]?.city || firstDeparture.iataCode}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            {firstDeparture.airport || AIRPORT_NAMES[firstDeparture.iataCode]?.airport || firstDeparture.iataCode}
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
                            {lastArrival.city || AIRPORT_NAMES[lastArrival.iataCode]?.city || lastArrival.iataCode}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            {lastArrival.airport || AIRPORT_NAMES[lastArrival.iataCode]?.airport || lastArrival.iataCode}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{arrivalInfo.date}</div>
                        </div>
                      </div>
                    </div>

                    {/* Segment Details */}
                    {itinerary.segments.map((segment: any, segIndex: number) => {
                      const segmentDeparture = getSegmentDeparture(segment);
                      const segmentArrival = getSegmentArrival(segment);
                      const segDeparture = formatDateTime(segmentDeparture.at);
                      const segArrival = formatDateTime(segmentArrival.at);
                      const airlineCode = getSegmentAirlineCode(segment);
                      const flightNumber = getSegmentNumber(segment);
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
                                    src={getAirlineLogo(airlineCode)}
                                    alt={AIRLINE_NAMES[airlineCode] || airlineCode}
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
                                    {AIRLINE_NAMES[airlineCode] || airlineCode}
                                  </div>
                                  <div className="text-[10px] text-gray-600">
                                    {airlineCode} {flightNumber} • {segmentDeparture.city || AIRPORT_NAMES[segmentDeparture.iataCode]?.city || segmentDeparture.iataCode} → {segmentArrival.city || AIRPORT_NAMES[segmentArrival.iataCode]?.city || segmentArrival.iataCode}
                                  </div>
                                </div>
                                {/* Flight Times - Visible when collapsed */}
                                {!isExpanded && (
                                  <div className="flex items-start gap-4 mr-2">
                                    <div className="text-center">
                                      <div className="text-base font-bold text-gray-900">{segmentDeparture.iataCode}</div>
                                      <div className="text-xs font-semibold text-gray-700">{segDeparture.time}</div>
                                      <div className="text-[10px] text-gray-500">{segDeparture.date}</div>
                                      <div className="text-[10px] text-gray-600 font-medium mt-0.5">
                                        {segmentDeparture.city || AIRPORT_NAMES[segmentDeparture.iataCode]?.city || segmentDeparture.iataCode}
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        {segmentDeparture.airport || AIRPORT_NAMES[segmentDeparture.iataCode]?.airport || ''}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-center pt-6">
                                      <ArrowRight className="w-4 h-4 text-gray-400" />
                                      <div className="text-[10px] text-gray-600 font-medium mt-1">{formatDuration(segment.duration)}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-base font-bold text-gray-900">{segmentArrival.iataCode}</div>
                                      <div className="text-xs font-semibold text-gray-700">{segArrival.time}</div>
                                      <div className="text-[10px] text-gray-500">{segArrival.date}</div>
                                      <div className="text-[10px] text-gray-600 font-medium mt-0.5">
                                        {segmentArrival.city || AIRPORT_NAMES[segmentArrival.iataCode]?.city || segmentArrival.iataCode}
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        {segmentArrival.airport || AIRPORT_NAMES[segmentArrival.iataCode]?.airport || ''}
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
                                    <div className="text-xs font-semibold text-gray-700">{segmentDeparture.city || AIRPORT_NAMES[segmentDeparture.iataCode]?.city || segmentDeparture.iataCode}</div>
                                    <div className="text-[10px] text-gray-600">{segmentDeparture.airport || AIRPORT_NAMES[segmentDeparture.iataCode]?.airport || segmentDeparture.iataCode}</div>
                                    <div className="text-[10px] text-gray-500">{segDeparture.date}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-gray-500 mb-0.5">Arrival</div>
                                    <div className="font-semibold text-gray-900 text-sm">
                                      {segArrival.time}
                                    </div>
                                    <div className="text-xs font-semibold text-gray-700">{segmentArrival.city || AIRPORT_NAMES[segmentArrival.iataCode]?.city || segmentArrival.iataCode}</div>
                                    <div className="text-[10px] text-gray-600">{segmentArrival.airport || AIRPORT_NAMES[segmentArrival.iataCode]?.airport || segmentArrival.iataCode}</div>
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
                                      {getTravelerPricings(flight)[0]?.fareDetailsBySegment?.[segIndex]
                                        ?.cabin || segment.cabinClass || 'Economy'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Layover Notice */}
                          {segIndex < itinerary.segments.length - 1 && (() => {
                            const nextSegment = itinerary.segments[segIndex + 1];
                            const nextSegmentDeparture = getSegmentDeparture(nextSegment);
                            const layoverStart = new Date(segmentArrival.at);
                            const layoverEnd = new Date(nextSegmentDeparture.at);
                            const layoverMinutes = Math.floor((layoverEnd.getTime() - layoverStart.getTime()) / (1000 * 60));
                            const layoverHours = Math.floor(layoverMinutes / 60);
                            const layoverMins = layoverMinutes % 60;

                            return (
                              <div className="flex items-center justify-center py-2">
                                <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-700">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Layover at {segmentArrival.city || AIRPORT_NAMES[segmentArrival.iataCode]?.city || segmentArrival.iataCode} • {layoverHours}h {layoverMins}m
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
                {getTravelerPricings(flight)[0]?.fareDetailsBySegment ? (
                  getTravelerPricings(flight)[0].fareDetailsBySegment.map(
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
                  )
                ) : (
                  <div className="p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="text-[10px] text-gray-600">
                      Baggage information will be provided after booking
                    </div>
                  </div>
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
                    {getFlightPrice(flight).currency} {parseFloat(getFlightPrice(flight).base.toString()).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {(() => {
                  const price = getFlightPrice(flight);
                  const baseFare = parseFloat(price.base.toString());
                  const totalFare = parseFloat(price.total.toString());
                  const taxesAndFees = totalFare - baseFare;

                  if (taxesAndFees > 0) {
                    return (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Taxes & Fees</span>
                        <span className="font-semibold">
                          {price.currency}{' '}
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
                      {getFlightPrice(flight).currency}{' '}
                      {parseFloat(getFlightPrice(flight).total.toString()).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      For {getTravelerPricings(flight).length || 1}{' '}
                      {getTravelerPricings(flight).length === 1 ? 'passenger' : 'passengers'}
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

              {/* Payment Method Selector */}
              <div className="mb-4">
                <PaymentMethodSelector
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  userCredits={userCredits}
                  bookingAmount={parseFloat(getFlightPrice(flight).total.toString())}
                />
              </div>

              <button
                onClick={handleContinueToBook}
                disabled={isOfferExpired || isValidating}
                className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isOfferExpired || isValidating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isValidating ? 'Validating Offer...' : isOfferExpired ? 'Offer Expired' : 'Proceed to Booking'}
                {!isValidating && !isOfferExpired && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbox */}
      <AIChatbox />

      {/* Step 1: Passenger Details Modal */}
      <PassengerDetailsModal
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        numberOfTravelers={getTravelerPricings(flight).length || 1}
        bookingType="flight"
        totalPrice={parseFloat(getFlightPrice(flight).total.toString())}
        currency={getFlightPrice(flight).currency}
        paymentMethod={paymentMethod}
        onSubmit={handlePassengerDetailsSubmit}
      />

      {/* Step 2: Seat Selection Modal */}
      {collectedPassengers.length > 0 && (
        <SeatSelection
          isOpen={showSeatSelection}
          onClose={handleSkipSeats}
          offerId={flight.id}
          passengers={collectedPassengers.map((p, index) => ({
            id: `passenger-${index}`,
            firstName: p.firstName,
            lastName: p.lastName,
          }))}
          onConfirm={handleSeatSelectionConfirm}
        />
      )}

      {/* Step 3: Baggage Selection Modal */}
      {collectedPassengers.length > 0 && (
        <BaggageSelection
          isOpen={showBaggageSelection}
          onClose={handleSkipBaggage}
          offerId={flight.id}
          passengers={collectedPassengers.map((p, index) => ({
            id: `passenger-${index}`,
            firstName: p.firstName,
            lastName: p.lastName,
          }))}
          onConfirm={handleBaggageSelectionConfirm}
        />
      )}
    </div>
  );
}
