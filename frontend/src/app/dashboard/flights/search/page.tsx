'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plane,
  ArrowLeftRight,
  Calendar,
  Users,
  User,
  Search,
  MapPin,
  ArrowLeft,
  Clock,
  DollarSign,
  Briefcase,
  Luggage,
  Plus,
  Minus,
  Building2,
} from 'lucide-react';
import AIChatbox from '@/components/AIChatbox';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import AirportAutocomplete from '@/components/AirportAutocomplete';

// Airline names mapping
const AIRLINE_NAMES: { [key: string]: string } = {
  // North America
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta Air Lines',
  'WN': 'Southwest Airlines',
  'B6': 'JetBlue Airways',
  'AS': 'Alaska Airlines',
  'NK': 'Spirit Airlines',
  'F9': 'Frontier Airlines',
  'G4': 'Allegiant Air',
  'SY': 'Sun Country Airlines',
  'AC': 'Air Canada',
  'WS': 'WestJet',
  'Y4': 'Volaris',
  'AM': 'Aeromexico',

  // Europe
  'BA': 'British Airways',
  'AF': 'Air France',
  'LH': 'Lufthansa',
  'KL': 'KLM',
  'IB': 'Iberia',
  'AZ': 'ITA Airways',
  'VS': 'Virgin Atlantic',
  'EI': 'Aer Lingus',
  'SK': 'SAS Scandinavian Airlines',
  'AY': 'Finnair',
  'LX': 'Swiss International Air Lines',
  'OS': 'Austrian Airlines',
  'SN': 'Brussels Airlines',
  'TP': 'TAP Air Portugal',
  'VY': 'Vueling',
  'U2': 'easyJet',
  'FR': 'Ryanair',
  'W6': 'Wizz Air',
  'BE': 'Flybe',
  'LO': 'LOT Polish Airlines',
  'OK': 'Czech Airlines',
  'RO': 'Tarom',
  'JU': 'Air Serbia',
  'A3': 'Aegean Airlines',
  'OU': 'Croatia Airlines',

  // Middle East
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'EY': 'Etihad Airways',
  'TK': 'Turkish Airlines',
  'MS': 'EgyptAir',
  'RJ': 'Royal Jordanian',
  'GF': 'Gulf Air',
  'WY': 'Oman Air',
  'SV': 'Saudi Arabian Airlines',
  'FZ': 'flydubai',
  'XY': 'flynas',
  'LY': 'El Al',
  'J2': 'Azerbaijan Airlines',

  // Asia-Pacific
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'NH': 'All Nippon Airways',
  'JL': 'Japan Airlines',
  'KE': 'Korean Air',
  'OZ': 'Asiana Airlines',
  'TG': 'Thai Airways',
  'MH': 'Malaysia Airlines',
  'GA': 'Garuda Indonesia',
  'PR': 'Philippine Airlines',
  'VN': 'Vietnam Airlines',
  'CI': 'China Airlines',
  'BR': 'EVA Air',
  'CZ': 'China Southern Airlines',
  'MU': 'China Eastern Airlines',
  'CA': 'Air China',
  'HU': 'Hainan Airlines',
  'AI': 'Air India',
  '6E': 'IndiGo',
  'SG': 'SpiceJet',
  'QZ': 'AirAsia',
  'AK': 'AirAsia',
  'D7': 'AirAsia X',
  'FD': 'Thai AirAsia',
  'TR': 'Scoot',
  '3K': 'Jetstar Asia',
  'JQ': 'Jetstar Airways',
  'HX': 'Hong Kong Airlines',
  'UO': 'HK Express',

  // Oceania
  'QF': 'Qantas',
  'VA': 'Virgin Australia',
  'NZ': 'Air New Zealand',
  'FJ': 'Fiji Airways',
  'PX': 'Air Niugini',

  // Africa
  'SA': 'South African Airways',
  'ET': 'Ethiopian Airlines',
  'KQ': 'Kenya Airways',
  'AT': 'Royal Air Maroc',
  'TU': 'Tunisair',
  'AH': 'Air Algerie',
  'UU': 'Air Austral',
  'MD': 'Air Madagascar',
  'KP': 'ASKY Airlines',

  // South America
  'LA': 'LATAM Airlines',
  'G3': 'GOL Linhas Aereas',
  'AD': 'Azul Brazilian Airlines',
  'AR': 'Aerolineas Argentinas',
  'CM': 'Copa Airlines',
  'AV': 'Avianca',
  'P5': 'Wingo',
  '4M': 'LATAM Argentina',
  'JJ': 'LATAM Brasil',
  'LP': 'LATAM Peru',
  'UC': 'LATAM Chile',

  // Budget/Low-cost carriers
  'VB': 'VivaAerobus',
  'N0': 'Norse Atlantic Airways',
  'DY': 'Norwegian Air Shuttle',
  'W4': 'Wizz Air Malta',
  'LS': 'Jet2.com',
  'BY': 'TUI Airways',
  'MT': 'Thomas Cook Airlines',

  // Additional Regional and International Carriers
  'WX': 'CityJet',
  'EW': 'Eurowings',
  'DE': 'Condor',
  'X3': 'TUIfly',
  'AB': 'Air Berlin',
  'HV': 'Transavia',
  'TO': 'Transavia France',
  'PC': 'Pegasus Airlines',
  'XQ': 'SunExpress',
  'ZB': 'Air Albania',
  'BT': 'airBaltic',
  'UX': 'Air Europa',
  'V7': 'Volotea',
  'I2': 'Iberia Express',
  'NT': 'Binter Canarias',
  'YW': 'Air Nostrum',
  'WF': 'Widerøe',
  'RC': 'Atlantic Airways',
  'OV': 'Estonian Air',
  'PS': 'Ukraine International Airlines',
  'U6': 'Ural Airlines',
  'S7': 'S7 Airlines',
  'SU': 'Aeroflot',
  'FV': 'Rossiya Airlines',
  'DP': 'Pobeda',
  'KC': 'Air Astana',
  'HY': 'Uzbekistan Airways',
  'T3': 'Eastern Airways',
  'ZI': 'Aigle Azur',

  // Asian Regional Carriers
  '9W': 'Jet Airways',
  'UK': 'Vistara',
  'IX': 'Air India Express',
  'I5': 'AirAsia India',
  'G8': 'Go Air',
  '5J': 'Cebu Pacific',
  'Z2': 'Philippines AirAsia',
  'J9': 'Jazeera Airways',
  'KU': 'Kuwait Airways',
  '7C': 'Jeju Air',
  'TW': 'T\'way Air',
  'LJ': 'Jin Air',
  'ZE': 'Eastar Jet',
  'BL': 'Jetstar Pacific',
  'VJ': 'VietJet Air',
  'PG': 'Bangkok Airways',
  'SL': 'Thai Lion Air',
  'DD': 'Nok Air',
  'BI': 'Royal Brunei Airlines',
  'MF': 'Xiamen Airlines',
  'FM': 'Shanghai Airlines',
  'SC': 'Shandong Airlines',
  'ZH': 'Shenzhen Airlines',
  '8L': 'Lucky Air',
  'GS': 'Tianjin Airlines',
  'BK': 'Okay Airways',
  'PN': 'West Air',
  'DR': 'Ruili Airlines',
  'KN': 'China United Airlines',
  'EU': 'Chengdu Airlines',

  // Middle East Additional
  'IY': 'Yemenia',
  'FDB': 'FlyDubai',
  'KB': 'Druk Air',
  'ME': 'Middle East Airlines',
  'IR': 'Iran Air',
  'EP': 'Iran Aseman Airlines',
  'W5': 'Mahan Air',

  // African Regional
  'MK': 'Air Mauritius',
  'UG': 'TunisAir Express',
  'FB': 'Bulgaria Air',
  'BJ': 'Nouvelair',
  'RA': 'Nepal Airlines',
  'H4': 'HiSky',
  'TB': 'TUI fly Belgium',
  'OR': 'TUI fly Netherlands',

  // Americas Additional
  'VX': 'Virgin America',
  'HA': 'Hawaiian Airlines',
  'AX': 'Trans States Airlines',
  'YX': 'Midwest Airlines',
  '9K': 'Cape Air',
  'OO': 'SkyWest Airlines',
  'YV': 'Mesa Airlines',
  'OH': 'PSA Airlines',
  'QX': 'Horizon Air',
  '5X': 'UPS Airlines',
  'FX': 'FedEx Express',
  'WG': 'Sunwing Airlines',
  'TS': 'Air Transat',
  'PD': 'Porter Airlines',
  'RS': 'Air Seoul',
  'BW': 'Caribbean Airlines',
  '4C': 'LATAM Colombia',
  'PZ': 'LATAM Paraguay',
  'XL': 'LATAM Ecuador',
  'H2': 'Sky Airline',
  'VH': 'Viva Air Colombia',
  '5U': 'TAG Airlines',
  'QO': 'Aeromexico Connect',
  'VW': 'Aeromar',
  '2D': 'Aero VIP',
  'ND': 'FMI Air',
};

// Airport/City names mapping (common airports)
const AIRPORT_CITY_NAMES: { [key: string]: string } = {
  // USA
  'JFK': 'New York',
  'LGA': 'New York',
  'EWR': 'Newark',
  'LAX': 'Los Angeles',
  'SFO': 'San Francisco',
  'ORD': 'Chicago',
  'MIA': 'Miami',
  'DFW': 'Dallas',
  'SEA': 'Seattle',
  'BOS': 'Boston',
  'ATL': 'Atlanta',
  'IAD': 'Washington DC',
  'DCA': 'Washington DC',
  'LAS': 'Las Vegas',
  'PHX': 'Phoenix',
  'DEN': 'Denver',
  'MCO': 'Orlando',
  'MSP': 'Minneapolis',
  'DTW': 'Detroit',
  'PHL': 'Philadelphia',

  // Europe
  'LHR': 'London',
  'LGW': 'London',
  'CDG': 'Paris',
  'ORY': 'Paris',
  'AMS': 'Amsterdam',
  'FRA': 'Frankfurt',
  'MUC': 'Munich',
  'FCO': 'Rome',
  'MAD': 'Madrid',
  'BCN': 'Barcelona',
  'LIS': 'Lisbon',
  'BRU': 'Brussels',
  'VIE': 'Vienna',
  'ZRH': 'Zurich',
  'CPH': 'Copenhagen',
  'ARN': 'Stockholm',
  'OSL': 'Oslo',
  'HEL': 'Helsinki',
  'DUB': 'Dublin',
  'ATH': 'Athens',
  'IST': 'Istanbul',
  'PRG': 'Prague',
  'WAW': 'Warsaw',
  'BUD': 'Budapest',

  // Middle East
  'DXB': 'Dubai',
  'DWC': 'Dubai',
  'AUH': 'Abu Dhabi',
  'DOH': 'Doha',
  'CAI': 'Cairo',
  'TLV': 'Tel Aviv',
  'AMM': 'Amman',
  'JED': 'Jeddah',
  'RUH': 'Riyadh',

  // Asia
  'HKG': 'Hong Kong',
  'SIN': 'Singapore',
  'NRT': 'Tokyo',
  'HND': 'Tokyo',
  'ICN': 'Seoul',
  'PVG': 'Shanghai',
  'PEK': 'Beijing',
  'BKK': 'Bangkok',
  'KUL': 'Kuala Lumpur',
  'DEL': 'Delhi',
  'BOM': 'Mumbai',
  'BLR': 'Bangalore',
  'MNL': 'Manila',
  'CGK': 'Jakarta',

  // Africa
  'JNB': 'Johannesburg',
  'CPT': 'Cape Town',
  'LOS': 'Lagos',
  'ACC': 'Accra',
  'NBO': 'Nairobi',
  'ADD': 'Addis Ababa',
  'CMN': 'Casablanca',
  'ALG': 'Algiers',
  'TUN': 'Tunis',

  // Oceania
  'SYD': 'Sydney',
  'MEL': 'Melbourne',
  'AKL': 'Auckland',
  'BNE': 'Brisbane',
  'PER': 'Perth',

  // South America
  'GRU': 'São Paulo',
  'GIG': 'Rio de Janeiro',
  'EZE': 'Buenos Aires',
  'BOG': 'Bogotá',
  'LIM': 'Lima',
  'SCL': 'Santiago',
};

// Function to get airline logo URL
const getAirlineLogo = (code: string) => {
  return `https://images.kiwi.com/airlines/64/${code}.png`;
};

export default function FlightSearchPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState({
    name: 'User',
    role: 'traveler',
    email: '',
    organization: '',
  });
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  const [from, setFrom] = useState('');
  const [fromDisplay, setFromDisplay] = useState('');
  const [to, setTo] = useState('');
  const [toDisplay, setToDisplay] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [travelClass, setTravelClass] = useState('ECONOMY');
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [selectedAirline, setSelectedAirline] = useState<string>('all');
  const [selectedCabinClass, setSelectedCabinClass] = useState<string>('all');
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [showPassengerSelector, setShowPassengerSelector] = useState(false);
  const passengerSelectorRef = useRef<HTMLDivElement>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [draftBookings, setDraftBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Close passenger selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (passengerSelectorRef.current && !passengerSelectorRef.current.contains(event.target as Node)) {
        setShowPassengerSelector(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: `${parsedUser.firstName} ${parsedUser.lastName}`,
        role: parsedUser.role,
        email: parsedUser.email,
        organization: parsedUser.organization || '',
      });
    }

    // Fetch recent and draft flight bookings
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('🔑 Token exists:', !!token);
        if (!token) {
          console.log('❌ No token found');
          setLoadingBookings(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch recent confirmed flight bookings
        const recentUrl = `${getApiEndpoint('bookings')}?bookingType=flight&status=confirmed&limit=5&sortBy=createdAt&sortOrder=desc`;
        console.log('📡 Fetching confirmed bookings:', recentUrl);
        const recentResponse = await fetch(recentUrl, { headers });
        const recentData = await recentResponse.json();
        console.log('✅ Confirmed bookings response:', recentData);
        if (recentData.success) {
          console.log('✅ Setting recent bookings:', recentData.data?.length || 0, 'items');
          setRecentBookings(recentData.data || []);
        }

        // Fetch draft/pending flight bookings (pending_approval and approved)
        const pendingUrl = `${getApiEndpoint('bookings')}?bookingType=flight&status=pending_approval&limit=5&sortBy=createdAt&sortOrder=desc`;
        console.log('📡 Fetching pending bookings:', pendingUrl);
        const [pendingResponse, approvedResponse] = await Promise.all([
          fetch(pendingUrl, { headers }),
          fetch(
            `${getApiEndpoint('bookings')}?bookingType=flight&status=approved&limit=5&sortBy=createdAt&sortOrder=desc`,
            { headers }
          ),
        ]);

        const pendingData = await pendingResponse.json();
        const approvedData = await approvedResponse.json();
        console.log('✅ Pending bookings response:', pendingData);
        console.log('✅ Approved bookings response:', approvedData);

        const combined = [
          ...(pendingData.success ? pendingData.data || [] : []),
          ...(approvedData.success ? approvedData.data || [] : []),
        ];

        console.log('✅ Combined draft bookings:', combined.length, 'items');
        // Sort by createdAt and take top 5
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDraftBookings(combined.slice(0, 5));
      } catch (error) {
        console.error('❌ Error fetching bookings:', error);
      } finally {
        setLoadingBookings(false);
        console.log('✅ Loading complete');
      }
    };

    fetchBookings();
  }, []);

  // Read URL params and trigger search on mount, or restore from sessionStorage
  useEffect(() => {
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const depDate = searchParams.get('departureDate');
    const retDate = searchParams.get('returnDate');
    const adults = searchParams.get('adults');
    const directFlight = searchParams.get('directFlight');
    const clearCache = searchParams.get('new'); // Check if we should start fresh
    const restoreCache = searchParams.get('restore'); // Explicit flag to restore

    // Clear cache if 'new' param is present OR if no explicit restore flag
    if (clearCache === 'true' || (!restoreCache && !origin)) {
      sessionStorage.removeItem('flightSearchResults');
      console.log('🗑️ Cleared search cache');
      return; // Start with empty form
    }

    // Priority 1: URL params - if present, do a new search
    if (origin && destination && depDate) {
      console.log('🔍 Searching from URL params');
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
      return;
    }

    // Priority 2: Restore from cache ONLY if explicitly requested
    if (restoreCache === 'true') {
      const cachedSearch = sessionStorage.getItem('flightSearchResults');
      if (cachedSearch) {
        try {
          const cached = JSON.parse(cachedSearch);
          // Only use cache if less than 30 minutes old
          const cacheAge = Date.now() - cached.timestamp;
          if (cacheAge < 30 * 60 * 1000) {
            console.log('✅ Restoring search from cache');
            setFlights(cached.results);
            setFrom(cached.params.from);
            setTo(cached.params.to);
            setFromDisplay(cached.params.fromDisplay);
            setToDisplay(cached.params.toDisplay);
            setDepartureDate(cached.params.departureDate);
            setReturnDate(cached.params.returnDate);
            setTripType(cached.params.tripType);
            setPassengers(cached.params.passengers);
            setTravelClass(cached.params.travelClass);
          } else {
            console.log('⏰ Cache expired');
            sessionStorage.removeItem('flightSearchResults');
          }
        } catch (e) {
          console.error('Error restoring search cache:', e);
          sessionStorage.removeItem('flightSearchResults');
        }
      }
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
        provider: 'duffel', // Use Duffel as primary provider
      });

      const response = await fetch(`${getApiEndpoint('flights/search')}?${params}`);
      const data = await response.json();

      if (data.success) {
        setFlights(data.data);
        // Store search results in sessionStorage
        sessionStorage.setItem('flightSearchResults', JSON.stringify({
          results: data.data,
          params: {
            from: origin,
            to: destination,
            fromDisplay,
            toDisplay,
            departureDate: depDate,
            returnDate: retDate,
            tripType: retDate ? 'roundtrip' : 'oneway',
            passengers,
            travelClass,
          },
          timestamp: Date.now(),
        }));
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
        provider: 'duffel', // Use Duffel as primary provider
      });

      // Update URL with search params (without navigation)
      window.history.replaceState({}, '', `?${params}`);

      const response = await fetch(`${getApiEndpoint('flights/search')}?${params}`);
      const data = await response.json();

      if (data.success) {
        setFlights(data.data);
        // Store search results in sessionStorage
        sessionStorage.setItem('flightSearchResults', JSON.stringify({
          results: data.data,
          params: {
            from,
            to,
            fromDisplay,
            toDisplay,
            departureDate,
            returnDate,
            tripType,
            passengers,
            travelClass,
          },
          timestamp: Date.now(),
        }));
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
    const tempCode = from;
    const tempDisplay = fromDisplay;
    setFrom(to);
    setFromDisplay(toDisplay);
    setTo(tempCode);
    setToDisplay(tempDisplay);
  };

  const getTotalPassengers = () => {
    return passengers.adults + passengers.children + passengers.infants;
  };

  // Helper functions to normalize flight data between Duffel and Amadeus formats
  const getFlightSegments = (flight: any) => {
    if (flight.outbound) {
      // Duffel format
      return flight.outbound;
    } else if (flight.itineraries && flight.itineraries[0]) {
      // Amadeus format
      return flight.itineraries[0].segments;
    }
    return [];
  };

  const getAirlineCodes = (flight: any): string[] => {
    const segments = getFlightSegments(flight);
    if (flight.outbound) {
      // Duffel format - use airlineCode
      return [...new Set(segments.map((seg: any) => seg.airlineCode))].filter(Boolean) as string[];
    } else {
      // Amadeus format - use carrierCode
      return [...new Set(segments.map((seg: any) => seg.carrierCode))].filter(Boolean) as string[];
    }
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
      };
    } else if (segment.departure?.at) {
      // Amadeus format
      return segment.departure;
    }
    return { at: '', iataCode: '', terminal: '' };
  };

  const getSegmentArrival = (segment: any) => {
    if (segment.arrival?.time) {
      // Duffel format
      return {
        at: segment.arrival.time,
        iataCode: segment.arrival.airportCode,
        terminal: segment.arrival.terminal,
      };
    } else if (segment.arrival?.at) {
      // Amadeus format
      return segment.arrival;
    }
    return { at: '', iataCode: '', terminal: '' };
  };

  const getFlightDuration = (flight: any) => {
    if (flight.outbound && flight.outbound[0]) {
      // Duffel format - duration is on each segment
      return flight.outbound[0].duration || '';
    } else if (flight.itineraries && flight.itineraries[0]) {
      // Amadeus format - duration is on itinerary
      return flight.itineraries[0].duration || '';
    }
    return '';
  };

  const getFlightPrice = (flight: any) => {
    if (flight.price) {
      // Duffel format
      return {
        total: flight.price.total,
        currency: flight.price.currency,
      };
    } else if (flight.price?.total) {
      // Amadeus format
      return {
        total: parseFloat(flight.price.total),
        currency: flight.price.currency,
      };
    }
    return { total: 0, currency: 'USD' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <UnifiedNavBar showBackButton={true} backButtonHref="/dashboard" backButtonLabel="Back to Dashboard" user={user} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {/* Search Type Toggle */}
        <div className="flex gap-2 mb-4">
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white">
            <div className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" />
              <span>Flights</span>
            </div>
          </div>
          <Link
            href="/dashboard/hotels/search"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          >
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Hotels</span>
            </div>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            Search Flights
          </h1>
          <p className="text-xs md:text-sm text-gray-600">Find the best flight deals for your next trip</p>
        </div>

        {/* Mobile Search Button - Shows on mobile when no results yet */}
        {!flights.length && (
          <button
            onClick={() => setShowSearchForm(true)}
            className="md:hidden w-full mb-6 py-3 px-4 bg-white text-gray-700 rounded-lg font-medium border border-gray-200 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Start Your Flight Search</span>
          </button>
        )}

        {/* Search Form - Desktop only, always hidden on mobile */}
        <div className="hidden md:block relative mb-6 md:mb-8">
          <form onSubmit={handleSearch} className="bg-white rounded-lg p-3 md:p-4 lg:p-5 border border-gray-200">
            {/* Trip Type */}
            <div className="flex gap-2 mb-3 md:mb-4">
              <button
                type="button"
                onClick={() => setTripType('roundtrip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  tripType === 'roundtrip'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                Round trip
              </button>
              <button
                type="button"
                onClick={() => setTripType('oneway')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  tripType === 'oneway'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                One-way
              </button>
            </div>

            {/* Location and Date Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 mb-4 md:mb-6">
              {/* From */}
              <div className="lg:col-span-3">
                <AirportAutocomplete
                  value={from}
                  onChange={(code, display) => {
                    setFrom(code);
                    setFromDisplay(display);
                  }}
                  placeholder="City or Airport"
                  label="From"
                  required
                  initialDisplayValue={fromDisplay}
                />
              </div>

              {/* Swap Button */}
              <div className="lg:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={swapLocations}
                  className="w-full lg:w-auto p-2.5 md:p-3 bg-gray-100 border border-gray-300 rounded-lg"
                >
                  <ArrowLeftRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
              </div>

              {/* To */}
              <div className="lg:col-span-3">
                <AirportAutocomplete
                  value={to}
                  onChange={(code, display) => {
                    setTo(code);
                    setToDisplay(display);
                  }}
                  placeholder="City or Airport"
                  label="To"
                  required
                  initialDisplayValue={toDisplay}
                />
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
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
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
                      className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Passengers */}
              <div className={tripType === 'roundtrip' ? 'lg:col-span-1' : 'lg:col-span-3'} ref={passengerSelectorRef}>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Passengers</label>
                <div className="relative">
                  <Users className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 z-10" />
                  <input
                    type="text"
                    value={`${getTotalPassengers()} ${getTotalPassengers() === 1 ? 'Passenger' : 'Passengers'}`}
                    readOnly
                    onClick={() => setShowPassengerSelector(!showPassengerSelector)}
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm border border-gray-300 rounded-lg bg-white cursor-pointer"
                  />

                  {/* Passenger Selector Dropdown */}
                  {showPassengerSelector && (
                    <div className="absolute z-[100] w-full md:w-96 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 md:p-5 max-h-[500px] overflow-y-auto">
                      <h3 className="text-sm font-bold text-gray-900 mb-4">Select Passengers</h3>

                      {/* Adults */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-semibold text-gray-900">Adults</div>
                          <div className="text-xs text-gray-500">Age 12+</div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                          <button
                            type="button"
                            onClick={() => setPassengers(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                            disabled={passengers.adults <= 1}
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-900 text-base md:text-lg">{passengers.adults}</span>
                          <button
                            type="button"
                            onClick={() => setPassengers(p => ({ ...p, adults: Math.min(9, p.adults + 1) }))}
                            disabled={passengers.adults >= 9}
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-semibold text-gray-900">Children</div>
                          <div className="text-xs text-gray-500">Age 2-11</div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                          <button
                            type="button"
                            onClick={() => setPassengers(p => ({ ...p, children: Math.max(0, p.children - 1) }))}
                            disabled={passengers.children <= 0}
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-900 text-base md:text-lg">{passengers.children}</span>
                          <button
                            type="button"
                            onClick={() => setPassengers(p => ({ ...p, children: Math.min(9, p.children + 1) }))}
                            disabled={passengers.children >= 9}
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Infants */}
                      <div className="flex items-center justify-between py-3 pb-4">
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-semibold text-gray-900">Infants</div>
                          <div className="text-xs text-gray-500">Under 2</div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                          <button
                            type="button"
                            onClick={() => setPassengers(p => ({ ...p, infants: Math.max(0, p.infants - 1) }))}
                            disabled={passengers.infants <= 0}
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-900 text-base md:text-lg">{passengers.infants}</span>
                          <button
                            type="button"
                            onClick={() => setPassengers(p => ({ ...p, infants: Math.min(passengers.adults, p.infants + 1) }))}
                            disabled={passengers.infants >= passengers.adults}
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {passengers.infants > 0 && passengers.infants >= passengers.adults && (
                        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-800 font-medium">Each infant must be accompanied by an adult</p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowPassengerSelector(false)}
                        className="w-full py-2.5 md:py-3 bg-gray-900 text-white rounded-lg text-sm md:text-base font-semibold"
                      >
                        Done
                      </button>
                    </div>
                  )}
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
                    className={`p-3 md:p-4 rounded-lg font-medium border ${
                      travelClass === cls.value
                        ? 'border-gray-900 bg-gray-100 text-gray-900'
                        : 'border-gray-300 bg-white text-gray-700'
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
              className="w-full py-3 md:py-4 text-sm md:text-base bg-gray-900 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            className="md:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-4 bg-gray-900 text-white rounded-lg font-semibold border border-gray-900"
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
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowSearchForm(false)}
            ></div>

            {/* Modal */}
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-lg border-t border-gray-300 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gray-900 rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">Modify Search</h2>
                </div>
                <button
                  onClick={() => setShowSearchForm(false)}
                  className="p-2 rounded-full"
                >
                  <Search className="w-5 h-5 text-gray-600 rotate-45" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSearch} className="p-3">
                {/* Trip Type */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setTripType('roundtrip')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      tripType === 'roundtrip'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    Round trip
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('oneway')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      tripType === 'oneway'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                    }`}
                  >
                    One-way
                  </button>
                </div>

                {/* From/To */}
                <div className="space-y-3 mb-4">
                  <AirportAutocomplete
                    value={from}
                    onChange={(code, display) => {
                      setFrom(code);
                      setFromDisplay(display);
                    }}
                    placeholder="City or Airport"
                    label="From"
                    required
                    initialDisplayValue={fromDisplay}
                  />

                  <button
                    type="button"
                    onClick={swapLocations}
                    className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-gray-600 mx-auto" />
                  </button>

                  <AirportAutocomplete
                    value={to}
                    onChange={(code, display) => {
                      setTo(code);
                      setToDisplay(display);
                    }}
                    placeholder="City or Airport"
                    label="To"
                    required
                    initialDisplayValue={toDisplay}
                  />
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
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
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
                          className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Passengers */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Passengers</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <input
                      type="text"
                      value={`${getTotalPassengers()} ${getTotalPassengers() === 1 ? 'Passenger' : 'Passengers'}`}
                      readOnly
                      onClick={() => setShowPassengerSelector(!showPassengerSelector)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white cursor-pointer"
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
                        className={`p-3 rounded-lg font-medium border ${
                          travelClass === cls.value
                            ? 'border-gray-900 bg-gray-100 text-gray-900'
                            : 'border-gray-300 bg-white text-gray-700'
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
                  className="w-full py-3 text-sm bg-gray-900 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Draft and Recent Bookings - Show only when no search results */}
        {(() => {
          console.log('🎨 Render conditions:', {
            loading,
            flightsLength: flights.length,
            error,
            loadingBookings,
            draftBookingsLength: draftBookings.length,
            recentBookingsLength: recentBookings.length,
            shouldShow: !loading && flights.length === 0 && !error
          });
          return null;
        })()}
        {!loading && flights.length === 0 && !error && (
          <div className="mb-8 space-y-6">
            {/* Draft Flights */}
            {draftBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-[#ADF802] rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Pending Bookings
                    <span className="inline-block ml-2 px-2 py-0.5 bg-[#ADF802] rounded text-xs font-bold text-gray-900">
                      {draftBookings.length}
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/dashboard/bookings/${booking.id}`}
                      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-[#ADF802] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            Pending Approval
                          </span>
                        </div>
                        <Plane className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="space-y-2">
                        {/* Passenger Name */}
                        {booking.passengerDetails?.[0] && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1 flex-wrap">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="break-words">{booking.passengerDetails[0].firstName} {booking.passengerDetails[0].lastName}</span>
                            {booking.passengerDetails.length > 1 && (
                              <span className="text-gray-400 flex-shrink-0">+{booking.passengerDetails.length - 1}</span>
                            )}
                          </div>
                        )}

                        {/* Route with City Names */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-gray-900 break-words">
                                {booking.bookingData?.outbound?.[0]?.departure?.city || booking.bookingData?.outbound?.[0]?.departure?.airportCode || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 break-words">
                                {booking.bookingData?.outbound?.[0]?.departure?.airportCode}
                              </div>
                            </div>
                            <ArrowLeftRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 text-right min-w-0">
                              <div className="text-sm font-bold text-gray-900 break-words">
                                {booking.bookingData?.outbound?.[booking.bookingData.outbound.length - 1]?.arrival?.city || booking.bookingData?.outbound?.[booking.bookingData.outbound.length - 1]?.arrival?.airportCode || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 break-words">
                                {booking.bookingData?.outbound?.[booking.bookingData.outbound.length - 1]?.arrival?.airportCode}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          {new Date(booking.bookingData?.outbound?.[0]?.departure?.time || booking.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                          {booking.currency} {parseFloat(booking.totalPrice)?.toFixed(2)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Bookings */}
            {recentBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-gray-900 rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Recent Bookings
                    <span className="inline-block ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs font-bold text-gray-900">
                      {recentBookings.length}
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/dashboard/bookings/${booking.id}`}
                      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-900 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                            Confirmed
                          </span>
                        </div>
                        <Plane className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="space-y-2">
                        {/* Passenger Name */}
                        {booking.passengerDetails?.[0] && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1 flex-wrap">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="break-words">{booking.passengerDetails[0].firstName} {booking.passengerDetails[0].lastName}</span>
                            {booking.passengerDetails.length > 1 && (
                              <span className="text-gray-400 flex-shrink-0">+{booking.passengerDetails.length - 1}</span>
                            )}
                          </div>
                        )}

                        {/* Route with City Names */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-gray-900 break-words">
                                {booking.bookingData?.outbound?.[0]?.departure?.city || booking.bookingData?.outbound?.[0]?.departure?.airportCode || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 break-words">
                                {booking.bookingData?.outbound?.[0]?.departure?.airportCode}
                              </div>
                            </div>
                            <ArrowLeftRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 text-right min-w-0">
                              <div className="text-sm font-bold text-gray-900 break-words">
                                {booking.bookingData?.outbound?.[booking.bookingData.outbound.length - 1]?.arrival?.city || booking.bookingData?.outbound?.[booking.bookingData.outbound.length - 1]?.arrival?.airportCode || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 break-words">
                                {booking.bookingData?.outbound?.[booking.bookingData.outbound.length - 1]?.arrival?.airportCode}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          {new Date(booking.bookingData?.outbound?.[0]?.departure?.time || booking.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                          {booking.currency} {parseFloat(booking.totalPrice)?.toFixed(2)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingBookings && draftBookings.length === 0 && recentBookings.length === 0 && (
              <div className="text-center py-12">
                <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent or pending flight bookings</p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
            {error}
          </div>
        )}

        {/* Results */}
        {flights.length > 0 && (
          <div className="space-y-3 md:space-y-6">
            {/* Results Header with Filter */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gray-900 rounded-full"></div>
                <h2 className="text-sm md:text-lg font-bold text-gray-900">
                  Available Flights
                  <span className="inline-block ml-2 px-2 py-0.5 bg-[#ADF802] rounded text-xs font-bold text-gray-900">
                    {flights.filter(f => {
                      // Filter by airline
                      if (selectedAirline !== 'all') {
                        const airlines = getAirlineCodes(f);
                        if (!airlines.includes(selectedAirline)) return false;
                      }
                      // Filter by cabin class
                      if (selectedCabinClass !== 'all') {
                        const cabinClass = f.cabinClass || f.cabin || 'ECONOMY';
                        if (cabinClass !== selectedCabinClass) return false;
                      }
                      return true;
                    }).length}
                  </span>
                </h2>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3">
                <label className="text-xs font-semibold text-gray-700">Filter:</label>

                {/* Cabin Class Filter */}
                <select
                  value={selectedCabinClass}
                  onChange={(e) => setSelectedCabinClass(e.target.value)}
                  className="w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white font-medium text-gray-900"
                >
                  <option value="all">All Classes</option>
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">Premium Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First Class</option>
                </select>

                {/* Airline Filter */}
                <select
                  value={selectedAirline}
                  onChange={(e) => setSelectedAirline(e.target.value)}
                  className="w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white font-medium text-gray-900"
                >
                  <option value="all">All Airlines</option>
                  {[...new Set(flights.flatMap(f => {
                    // Handle both Duffel (outbound/inbound) and Amadeus (itineraries) formats
                    if (f.outbound) {
                      return [...f.outbound, ...(f.inbound || [])].map((seg: any) => seg.airlineCode);
                    } else if (f.itineraries) {
                      return f.itineraries[0].segments.map((seg: any) => seg.carrierCode);
                    }
                    return [];
                  }))].sort().map(code => (
                    <option key={code} value={code}>
                      {AIRLINE_NAMES[code as string] || code} ({code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {flights.filter(f => {
              // Filter by airline
              if (selectedAirline !== 'all') {
                const airlines = getAirlineCodes(f);
                if (!airlines.includes(selectedAirline)) return false;
              }
              // Filter by cabin class
              if (selectedCabinClass !== 'all') {
                const cabinClass = f.cabinClass || f.cabin || 'ECONOMY';
                if (cabinClass !== selectedCabinClass) return false;
              }
              return true;
            }).map((flight, index) => {
              const segments = getFlightSegments(flight);
              const firstSegment = segments[0];
              const lastSegment = segments[segments.length - 1];
              const departure = getSegmentDeparture(firstSegment);
              const arrival = getSegmentArrival(lastSegment);
              const departureTime = new Date(departure.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const arrivalTime = new Date(arrival.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const duration = getFlightDuration(flight).replace('PT', '').toLowerCase();
              const stops = segments.length - 1;

              // Get unique airlines
              const airlines = getAirlineCodes(flight);
              const airlineNames = airlines.join(', ');

              return (
                <div
                  key={index}
                  className="bg-white rounded-lg overflow-hidden border border-gray-200"
                >
                  <div className="p-3 md:p-4 lg:p-5">
                    <div className="flex flex-col lg:flex-row gap-3 md:gap-6 items-center">
                      {/* Airline Info with Logo */}
                      <div className="flex-shrink-0 text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden mb-1 md:mb-2">
                          <img
                            src={getAirlineLogo(getSegmentAirlineCode(firstSegment))}
                            alt={AIRLINE_NAMES[getSegmentAirlineCode(firstSegment)] || getSegmentAirlineCode(firstSegment)}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              // Fallback to plane icon if logo fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Plane className="w-6 h-6 md:w-8 md:h-8 text-gray-600 hidden" />
                        </div>
                        <div className="text-xs font-bold text-gray-900">{getSegmentAirlineCode(firstSegment)}</div>
                        <div className="text-[10px] text-gray-500">{getSegmentNumber(firstSegment)}</div>
                      </div>

                      {/* Flight Details */}
                      <div className="flex-1 w-full">
                        {/* Airline Name - Prominent Header */}
                        <div className="mb-3 md:mb-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                <Plane className="w-4 h-4 text-gray-700" />
                              </div>
                              <span className="text-xs md:text-sm font-bold text-gray-900">
                                {airlines.length > 0 ? airlines.map(code => AIRLINE_NAMES[code] || code).join(', ') : 'Flight'}
                              </span>
                            </div>
                            {airlines.length > 1 && (
                              <span className="text-[10px] md:text-xs font-semibold text-gray-900 bg-[#ADF802] px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#ADF802]">
                                Multiple Airlines
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                          <div className="text-center flex-1">
                            <div className="text-sm md:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">
                              {departureTime}
                            </div>
                            <div className="text-xs font-semibold text-gray-900">
                              {departure.iataCode}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {AIRPORT_CITY_NAMES[departure.iataCode] || departure.iataCode}
                            </div>
                          </div>

                          <div className="flex-1 px-2 md:px-6">
                            <div className="relative">
                              <div className="border-t-2 border-dashed border-gray-300"></div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1.5 md:px-3">
                                <Plane className="w-4 h-4 text-gray-600 rotate-90" />
                              </div>
                            </div>
                            <div className="text-center mt-1 md:mt-2">
                              <div className="text-[10px] font-medium text-gray-600">{duration}</div>
                              <div className="text-[10px] text-gray-500">
                                {stops === 0 ? 'Direct' : `${stops} ${stops === 1 ? 'stop' : 'stops'}`}
                              </div>
                            </div>
                          </div>

                          <div className="text-center flex-1">
                            <div className="text-sm md:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">
                              {arrivalTime}
                            </div>
                            <div className="text-xs font-semibold text-gray-900">
                              {arrival.iataCode}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {AIRPORT_CITY_NAMES[arrival.iataCode] || arrival.iataCode}
                            </div>
                          </div>
                        </div>

                        {/* Layover Information */}
                        {stops > 0 && (
                          <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="p-1 md:p-1.5 bg-gray-200 rounded-md flex-shrink-0">
                                <Clock className="w-3 h-3 text-gray-700" />
                              </div>
                              <div className="flex-1">
                                <div className="text-[10px] font-bold text-gray-900 mb-0.5 md:mb-1">
                                  Layover{stops > 1 ? 's' : ''}: {stops} Stop{stops > 1 ? 's' : ''}
                                </div>
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                  {segments.slice(0, -1).map((segment: any, segIndex: number) => {
                                    const nextSegment = segments[segIndex + 1];
                                    const segArrival = getSegmentArrival(segment);
                                    const nextSegDeparture = getSegmentDeparture(nextSegment);
                                    const layoverStart = new Date(segArrival.at);
                                    const layoverEnd = new Date(nextSegDeparture.at);
                                    const layoverMinutes = Math.floor((layoverEnd.getTime() - layoverStart.getTime()) / 60000);
                                    const layoverHours = Math.floor(layoverMinutes / 60);
                                    const layoverMins = layoverMinutes % 60;

                                    return (
                                      <div key={segIndex} className="flex flex-col gap-0.5 px-2 md:px-2.5 py-1 md:py-1.5 bg-white border border-gray-200 rounded-md">
                                        <div className="flex items-center gap-1 md:gap-1.5">
                                          <MapPin className="w-2.5 h-2.5 text-gray-600" />
                                          <span className="text-[10px] font-bold text-gray-900">
                                            {segArrival.iataCode}
                                          </span>
                                          <span className="text-[10px] text-gray-700 font-medium">
                                            {layoverHours > 0 && `${layoverHours}h `}{layoverMins}m
                                          </span>
                                        </div>
                                        <div className="text-[9px] text-gray-600 pl-4 md:pl-5">
                                          {AIRPORT_CITY_NAMES[segArrival.iataCode] || segArrival.iataCode}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cabin Class */}
                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-gray-600 mt-2 md:mt-3">
                          <Briefcase className="w-3 h-3" />
                          <span className="font-medium">{flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'Economy'}</span>
                        </div>
                      </div>

                      {/* Price & CTA */}
                      <div className="flex-shrink-0 lg:w-56 w-full">
                        <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                          <div className="text-[10px] text-gray-500 mb-1 md:mb-2">
                            Total Price
                          </div>
                          <div className="text-lg md:text-xl font-bold text-gray-900 mb-0.5 md:mb-1">
                            {getFlightPrice(flight).currency}{' '}
                            {getFlightPrice(flight).total.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-[10px] text-gray-500 mb-3 md:mb-4">
                            for {getTotalPassengers()} {getTotalPassengers() === 1 ? 'passenger' : 'passengers'}
                          </div>

                          <button
                            onClick={() => {
                              // Store flight data in sessionStorage to avoid URL length limits
                              sessionStorage.setItem(`flight_${flight.id || index}`, JSON.stringify(flight));
                              // Navigate to details page
                              window.location.href = `/dashboard/flights/${flight.id || index}`;
                            }}
                            className="w-full px-4 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
                          >
                            View Details
                            <Plane className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
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
