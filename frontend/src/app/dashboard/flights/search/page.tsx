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
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Leaf,
  ArrowUpDown,
} from 'lucide-react';
import AIChatbox from '@/components/AIChatbox';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import AirportAutocomplete from '@/components/AirportAutocomplete';
import TravelClassSelector from '@/components/TravelClassSelector';
import { getCityCode } from '@/utils/cityMapping';

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
  const [selectedFares, setSelectedFares] = useState<Map<string, any>>(new Map());
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<any>(null);
  const [showReturnFlightSelection, setShowReturnFlightSelection] = useState(false);
  const [showTransitionNotification, setShowTransitionNotification] = useState(false);

  // Sidebar Filter States
  const [filterStops, setFilterStops] = useState<number[]>([]);
  const [filterPriceRange, setFilterPriceRange] = useState<[number, number]>([0, 10000]);
  const [filterAirlines, setFilterAirlines] = useState<string[]>([]);
  const [filterDepartureTime, setFilterDepartureTime] = useState<string[]>([]);
  const [filterCO2, setFilterCO2] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'duration' | 'departure' | 'co2'>('price-asc');

  // Function to get full descriptive fare name
  const getFullFareName = (flight: any) => {
    const fareBrand = flight.fareBrandName || '';
    const cabinClass = flight.cabinClass || flight.cabin || 'economy';

    // Map cabin class to readable name
    const cabinMap: any = {
      'economy': 'Main Cabin',
      'premium_economy': 'Premium Economy',
      'business': 'Business Class',
      'first': 'First Class',
    };

    const cabinName = cabinMap[cabinClass.toLowerCase()] || 'Main Cabin';

    // If there's a fare brand, combine it with cabin
    if (fareBrand) {
      // Map common fare brand keywords to descriptive names
      const lowerBrand = fareBrand.toLowerCase();
      if (lowerBrand.includes('basic')) return `${cabinName} - Basic`;
      if (lowerBrand.includes('standard')) return `${cabinName} - Standard`;
      if (lowerBrand.includes('flex')) return `${cabinName} - Flexible`;
      if (lowerBrand.includes('comfort')) return `${cabinName} - Comfort`;
      if (lowerBrand.includes('premium') && !lowerBrand.includes('economy')) return `${cabinName} - Premium`;
      if (lowerBrand.includes('plus')) return `${cabinName} - Plus`;

      // If no keyword match, return brand + cabin
      return `${cabinName} - ${fareBrand}`;
    }

    return cabinName;
  };

  // Function to get unique fare options (deduplicate based on price + features)
  const getUniqueFares = (flightGroup: any[]) => {
    return flightGroup.reduce((acc: any[], fareOption: any) => {
      const farePrice = getFlightPrice(fareOption);
      const fullFareName = getFullFareName(fareOption);
      const fareBaggage = fareOption.outbound?.[0]?.baggage;

      // Create a unique key for this fare combination
      const fareKey = `${farePrice.total}-${fullFareName}-${fareOption.isRefundable}-${fareOption.isChangeable}-${fareBaggage?.checked || 'none'}-${fareBaggage?.carryOn || 'none'}`;

      // Only add if this combination doesn't exist yet
      const exists = acc.some(f => {
        const fPrice = getFlightPrice(f);
        const fName = getFullFareName(f);
        const fBaggage = f.outbound?.[0]?.baggage;
        const fKey = `${fPrice.total}-${fName}-${f.isRefundable}-${f.isChangeable}-${fBaggage?.checked || 'none'}-${fBaggage?.carryOn || 'none'}`;
        return fKey === fareKey;
      });

      if (!exists) {
        acc.push(fareOption);
      }

      return acc;
    }, []);
  };

  // Helper functions to access segment data (needed by key generators)
  const getSegmentAirlineCode = (segment: any) => {
    return segment.airlineCode || segment.carrierCode;
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

  // Helper function to create a unique key for outbound flight
  const getOutboundKey = (flight: any) => {
    if (!flight.outbound || flight.outbound.length === 0) return null;

    const segments = flight.outbound;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const departure = getSegmentDeparture(firstSegment);
    const arrival = getSegmentArrival(lastSegment);
    const depTime = new Date(departure.at);

    // Create key based on route, date/time, stops, and airlines
    const airlines = segments.map((seg: any) => getSegmentAirlineCode(seg)).join('-');
    return `${departure.iataCode}-${arrival.iataCode}-${depTime.toDateString()}-${depTime.getHours()}-${segments.length}-${airlines}`;
  };

  // Helper function to create a unique key for return flight
  const getReturnKey = (flight: any) => {
    if (!flight.inbound || flight.inbound.length === 0) return null;

    const segments = flight.inbound;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const departure = getSegmentDeparture(firstSegment);
    const arrival = getSegmentArrival(lastSegment);
    const depTime = new Date(departure.at);

    // Create key based on route, date/time, stops, and airlines
    const airlines = segments.map((seg: any) => getSegmentAirlineCode(seg)).join('-');
    return `${departure.iataCode}-${arrival.iataCode}-${depTime.toDateString()}-${depTime.getHours()}-${segments.length}-${airlines}`;
  };

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
          if (recentData.data?.[0]) {
            console.log('🔍 First booking structure:', recentData.data[0]);
            console.log('✈️ Airline data:', recentData.data[0].bookingData?.outbound?.[0]?.airline);
          }
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
        if (combined[0]) {
          console.log('🔍 First draft booking structure:', combined[0]);
          console.log('✈️ Draft airline data:', combined[0].bookingData?.outbound?.[0]?.airline);
        }
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
      // Convert city names to IATA codes
      const originCode = getCityCode(origin) || origin.toUpperCase();
      const destinationCode = getCityCode(destination) || destination.toUpperCase();

      // Validate IATA codes (must be 3 letters)
      if (!/^[A-Z]{3}$/.test(originCode)) {
        setError(`Invalid origin airport: "${origin}". Please select a city from the dropdown or enter a 3-letter airport code (e.g., BOS, LAX).`);
        setLoading(false);
        return;
      }
      if (!/^[A-Z]{3}$/.test(destinationCode)) {
        setError(`Invalid destination airport: "${destination}". Please select a city from the dropdown or enter a 3-letter airport code (e.g., BOS, LAX).`);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        origin: originCode,
        destination: destinationCode,
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
        // Provide more helpful error messages for common issues
        let errorMessage = data.message || 'Failed to search flights';

        // Check for IATA code validation errors
        if (errorMessage.toLowerCase().includes('iata') || errorMessage.toLowerCase().includes('invalid')) {
          errorMessage = `${errorMessage}\n\nPlease make sure you've selected valid airports from the dropdown. If searching for Monaco, use Nice (NCE) airport instead.`;
        }

        setError(errorMessage);
      }
    } catch (err: any) {
      let errorMessage = err.message || 'An error occurred while searching flights';

      // Provide helpful context for network or API errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        errorMessage = 'Unable to connect to the flight search service. Please check your internet connection and try again.';
      }

      setError(errorMessage);
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

  const getSegmentNumber = (segment: any) => {
    return segment.flightNumber || segment.number;
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

  // Filter Helper Functions
  const getNumberOfStops = (flight: any): number => {
    const segments = getFlightSegments(flight);
    return segments.length - 1;
  };

  const estimateCO2 = (flight: any): number => {
    const duration = getFlightDuration(flight);
    const hours = parseFloat(duration.replace('PT', '').replace('H', '.').replace('M', '')) || 0;
    return Math.round(hours * 90);
  };

  const getDepartureTimeCategory = (flight: any): string => {
    const segments = getFlightSegments(flight);
    if (segments.length === 0) return 'unknown';
    const departureTime = getSegmentDeparture(segments[0]).at;
    const hour = new Date(departureTime).getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  };

  const sortFlights = (flightsToSort: any[]) => {
    const sorted = [...flightsToSort];
    switch (sortBy) {
      case 'price-asc': return sorted.sort((a, b) => getFlightPrice(a).total - getFlightPrice(b).total);
      case 'price-desc': return sorted.sort((a, b) => getFlightPrice(b).total - getFlightPrice(a).total);
      case 'duration': return sorted.sort((a, b) => {
        const aDur = getFlightDuration(a);
        const bDur = getFlightDuration(b);
        return aDur.localeCompare(bDur);
      });
      case 'departure': return sorted.sort((a, b) => {
        const aSegs = getFlightSegments(a);
        const bSegs = getFlightSegments(b);
        return getSegmentDeparture(aSegs[0]).at.localeCompare(getSegmentDeparture(bSegs[0]).at);
      });
      case 'co2': return sorted.sort((a, b) => estimateCO2(a) - estimateCO2(b));
      default: return sorted;
    }
  };

  const filterFlights = (flightsToFilter: any[]) => {
    return flightsToFilter.filter((flight) => {
      if (filterStops.length > 0) {
        const stops = getNumberOfStops(flight);
        if (!filterStops.includes(stops)) return false;
      }
      const price = getFlightPrice(flight).total;
      if (price < filterPriceRange[0] || price > filterPriceRange[1]) return false;
      if (filterAirlines.length > 0) {
        const flightAirlines = getAirlineCodes(flight);
        const hasMatchingAirline = flightAirlines.some(code => filterAirlines.includes(code));
        if (!hasMatchingAirline) return false;
      }
      if (filterDepartureTime.length > 0) {
        const timeCategory = getDepartureTimeCategory(flight);
        if (!filterDepartureTime.includes(timeCategory)) return false;
      }
      const co2 = estimateCO2(flight);
      if (co2 < filterCO2[0] || co2 > filterCO2[1]) return false;
      return true;
    });
  };

  const clearAllFilters = () => {
    setFilterStops([]);
    setFilterPriceRange([0, 10000]);
    setFilterAirlines([]);
    setFilterDepartureTime([]);
    setFilterCO2([0, 1000]);
    setSortBy('price-asc');
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <UnifiedNavBar showBackButton={true} backButtonHref="/dashboard" backButtonLabel="Back to Dashboard" user={user} />

        {/* Transition Notification */}
        {showTransitionNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="animate-fade-scale">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md mx-4">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-7 h-7 text-gray-900" />
                    </div>
                    <div className="text-white">
                      <div className="font-bold text-lg">Outbound Flight Selected</div>
                      <div className="text-sm text-gray-300">Step 1 of 2 complete</div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Outbound flight</span>
                      </div>
                      <div className="w-full h-1 bg-gray-900 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">2</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Return flight</span>
                      </div>
                      <div className="w-full h-1 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-center text-sm">
                    Great! Now choose your return flight to complete your booking
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-100">
                  <div className="h-full bg-gray-900 animate-progress"></div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
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
            className="md:hidden relative w-full mb-6 py-5 px-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl font-bold flex items-center justify-between gap-3 shadow-xl hover:shadow-2xl active:scale-[0.97] transition-all duration-300 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ADF802]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-base">Start Your Flight Search</span>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
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
              {/* From & To - with swap button */}
              <div className="lg:col-span-7 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 relative">
                {/* From */}
                <div>
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

                {/* Swap Button - absolutely positioned between From and To */}
                <button
                  type="button"
                  onClick={swapLocations}
                  className="hidden lg:flex absolute left-1/2 -translate-x-1/2 bottom-3 z-10 p-1.5 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-900 transition-all shadow-sm group"
                  title="Swap origin and destination"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-gray-600 transition-transform duration-300 group-hover:rotate-180" />
                </button>

                {/* To */}
                <div>
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
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
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
                      className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
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
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 text-base border border-gray-300 rounded-lg bg-white cursor-pointer min-h-[44px]"
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
              <TravelClassSelector
                value={travelClass}
                onChange={setTravelClass}
                variant="desktop"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 md:py-4 text-base md:text-base bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all hover:bg-gray-800"
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSearchForm(false)}
            ></div>

            {/* Modal */}
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl border border-gray-200 max-h-[75vh] overflow-y-auto shadow-2xl">
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between z-10">
                <h2 className="text-base font-bold text-gray-900">Modify Search</h2>
                <button
                  onClick={() => setShowSearchForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSearch} className="p-5 space-y-3.5">
                {/* Trip Type */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTripType('roundtrip')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      tripType === 'roundtrip'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Round trip
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('oneway')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      tripType === 'oneway'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    One-way
                  </button>
                </div>

                {/* From/To */}
                <div className="space-y-3">
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

                  {/* Swap button hidden on mobile - not needed due to space constraints */}

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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Departure</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full pl-10 pr-2 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                      />
                    </div>
                  </div>

                  {tripType === 'roundtrip' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Return</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          min={departureDate || new Date().toISOString().split('T')[0]}
                          required={tripType === 'roundtrip'}
                          className="w-full pl-10 pr-2 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Passengers */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Passengers</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <input
                      type="text"
                      value={`${getTotalPassengers()} ${getTotalPassengers() === 1 ? 'Passenger' : 'Passengers'}`}
                      readOnly
                      onClick={() => setShowPassengerSelector(!showPassengerSelector)}
                      className="w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg bg-white cursor-pointer min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Travel Class */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Travel Class</label>
                  <TravelClassSelector
                    value={travelClass}
                    onChange={setTravelClass}
                    variant="mobile"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-base bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
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
                        {booking.flightBookings?.[0]?.airlineCode ? (
                          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                            <img
                              src={getAirlineLogo(booking.flightBookings[0].airlineCode)}
                              alt={booking.flightBookings[0].airline || 'Airline'}
                              className="w-full h-full object-contain p-1.5"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.classList.add('bg-gray-900');
                                  parent.classList.remove('bg-gray-50', 'border-gray-200');
                                  const fallbackIcon = parent.querySelector('.fallback-icon');
                                  if (fallbackIcon) {
                                    (fallbackIcon as HTMLElement).classList.remove('hidden');
                                  }
                                }
                              }}
                            />
                            <Plane className="fallback-icon hidden w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Plane className="w-5 h-5 text-white" />
                          </div>
                        )}
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
                        {booking.flightBookings?.[0]?.airlineCode ? (
                          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                            <img
                              src={getAirlineLogo(booking.flightBookings[0].airlineCode)}
                              alt={booking.flightBookings[0].airline || 'Airline'}
                              className="w-full h-full object-contain p-1.5"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.classList.add('bg-gray-900');
                                  parent.classList.remove('bg-gray-50', 'border-gray-200');
                                  const fallbackIcon = parent.querySelector('.fallback-icon');
                                  if (fallbackIcon) {
                                    (fallbackIcon as HTMLElement).classList.remove('hidden');
                                  }
                                }
                              }}
                            />
                            <Plane className="fallback-icon hidden w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Plane className="w-5 h-5 text-white" />
                          </div>
                        )}
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
            {/* Step Indicator for Round-Trip */}
            {(() => {
              const hasRoundTrip = flights.some(f => f.inbound && f.inbound.length > 0);

              if (hasRoundTrip && showReturnFlightSelection && selectedOutboundFlight) {
                // Show selected outbound flight summary
                const outboundSegments = selectedOutboundFlight.outbound || [];
                const firstSegment = outboundSegments[0];
                const lastSegment = outboundSegments[outboundSegments.length - 1];
                const departure = getSegmentDeparture(firstSegment);
                const arrival = getSegmentArrival(lastSegment);
                const depTime = new Date(departure.at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const arrTime = new Date(arrival.at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div className="mb-6 space-y-4">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Outbound Selected</span>
                      </div>
                      <div className="w-16 h-0.5 bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <span className="text-sm font-medium text-gray-900">Choose Return</span>
                      </div>
                    </div>

                    {/* Selected Outbound Flight Card */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Plane className="w-5 h-5 text-green-700 rotate-90" />
                            <div>
                              <div className="text-xs font-bold text-green-700 uppercase">Outbound Flight Selected</div>
                              <div className="text-sm font-bold text-gray-900 mt-1">
                                {departure.iataCode} → {arrival.iataCode}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                {depTime} - {arrTime} • {new Date(departure.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowReturnFlightSelection(false);
                            setSelectedOutboundFlight(null);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Return Flight Selection Header */}
                    <div className="bg-white border-2 border-gray-800 rounded-xl p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                          <Plane className="w-5 h-5 text-white -rotate-90" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Select Your Return Flight</h3>
                          <p className="text-sm text-gray-600 mt-0.5">
                            Choose when you want to fly back
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (hasRoundTrip && !showReturnFlightSelection) {
                return (
                  <div className="mb-6">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <span className="text-sm font-medium text-gray-900">Choose Outbound</span>
                      </div>
                      <div className="w-16 h-0.5 bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <span className="text-sm font-medium text-gray-500">Choose Return</span>
                      </div>
                    </div>

                    {/* Outbound Selection Header */}
                    <div className="bg-white border-2 border-gray-800 rounded-xl p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                          <Plane className="w-5 h-5 text-white rotate-90" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Select Your Outbound Flight</h3>
                          <p className="text-sm text-gray-600 mt-0.5">
                            Choose when you want to depart
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* Results Section with Sidebar */}
            <div className="flex gap-4 lg:gap-6">
              {/* Sidebar - Filters */}
              <div className="hidden lg:block w-52 lg:w-56 flex-shrink-0">
                <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filters
                    </h3>
                    <button onClick={clearAllFilters} className="text-xs text-gray-600 hover:text-gray-900 font-medium">
                      Clear All
                    </button>
                  </div>

                  {/* Sort By */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="duration">Duration</option>
                      <option value="departure">Departure Time</option>
                      <option value="co2">CO2 Emissions</option>
                    </select>
                  </div>

                  {/* Stops */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Stops</label>
                    <div className="space-y-2">
                      {[0, 1, 2].map(stopCount => (
                        <label key={stopCount} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterStops.includes(stopCount)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterStops([...filterStops, stopCount]);
                              } else {
                                setFilterStops(filterStops.filter(s => s !== stopCount));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">
                            {stopCount === 0 ? 'Non-stop' : stopCount === 1 ? '1 Stop' : '2+ Stops'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Airlines */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Airlines</label>
                    <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-2">
                      {[...new Set(flights.flatMap(f => getAirlineCodes(f)))].sort().map(code => (
                        <label key={code} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterAirlines.includes(code)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterAirlines([...filterAirlines, code]);
                              } else {
                                setFilterAirlines(filterAirlines.filter(a => a !== code));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{AIRLINE_NAMES[code] || code}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Departure Time */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Departure Time</label>
                    <div className="space-y-2">
                      {[
                        { value: 'morning', label: 'Morning', icon: '🌅' },
                        { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
                        { value: 'evening', label: 'Evening', icon: '🌇' },
                        { value: 'night', label: 'Night', icon: '🌙' }
                      ].map(time => (
                        <label key={time.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterDepartureTime.includes(time.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterDepartureTime([...filterDepartureTime, time.value]);
                              } else {
                                setFilterDepartureTime(filterDepartureTime.filter(t => t !== time.value));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{time.icon} {time.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flights List */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-gray-900 rounded-full"></div>
                    <h2 className="text-sm md:text-lg font-bold text-gray-900">
                      Available Flights
                      <span className="inline-block ml-2 px-2 py-0.5 bg-[#ADF802] rounded text-xs font-bold text-gray-900">
                        {filterFlights(flights).length}
                      </span>
                    </h2>
                  </div>
                </div>

            {(() => {
              // Determine if this is a round-trip search
              const hasRoundTrip = flights.some(f => f.inbound && f.inbound.length > 0);

              if (hasRoundTrip && !showReturnFlightSelection) {
                // STEP 1: Group flights by OUTBOUND itinerary only
                const outboundGroups: { [key: string]: any[] } = {};

                // Apply filters first
                const filtered = filterFlights(flights);

                filtered.forEach((flight) => {
                  const outboundKey = getOutboundKey(flight);
                  if (!outboundKey) return;

                  if (!outboundGroups[outboundKey]) {
                    outboundGroups[outboundKey] = [];
                  }
                  outboundGroups[outboundKey].push(flight);
                });

                // Convert to array and sort each group
                return Object.values(outboundGroups).map((flightGroup) => {
                  return sortFlights(flightGroup);
                });
              } else if (hasRoundTrip && showReturnFlightSelection && selectedOutboundFlight) {
                // STEP 2: Show RETURN flights for the selected outbound
                const returnGroups: { [key: string]: any[] } = {};

                // Apply filters first
                const filtered = filterFlights(flights);

                filtered.forEach((flight) => {
                  // Only show flights that match the selected outbound
                  const outboundKey = getOutboundKey(flight);
                  const selectedOutboundKey = getOutboundKey(selectedOutboundFlight);

                  if (outboundKey !== selectedOutboundKey) return;

                  const returnKey = getReturnKey(flight);
                  if (!returnKey) return;

                  if (!returnGroups[returnKey]) {
                    returnGroups[returnKey] = [];
                  }
                  returnGroups[returnKey].push(flight);
                });

                // Convert to array and sort each group
                return Object.values(returnGroups).map((flightGroup) => {
                  return sortFlights(flightGroup);
                });
              } else {
                // ONE-WAY flights: Group by outbound route
                const groupedFlights: { [key: string]: any[] } = {};

                // Apply filters first
                const filtered = filterFlights(flights);

                filtered.forEach((flight) => {
                  const segments = getFlightSegments(flight);
                  if (segments.length === 0) return;

                  const firstSegment = segments[0];
                  const lastSegment = segments[segments.length - 1];
                  const departure = getSegmentDeparture(firstSegment);
                  const arrival = getSegmentArrival(lastSegment);
                  const depTime = new Date(departure.at);

                  const routeKey = `${departure.iataCode}-${arrival.iataCode}-${depTime.toDateString()}-${depTime.getHours()}-${segments.length}`;

                  if (!groupedFlights[routeKey]) {
                    groupedFlights[routeKey] = [];
                  }
                  groupedFlights[routeKey].push(flight);
                });

                // Convert to array and sort each group
                return Object.values(groupedFlights).map((flightGroup) => {
                  return sortFlights(flightGroup);
                });
              }
            })().map((flightGroup, groupIndex) => {
              // Use the first (cheapest) flight for display
              const flight = flightGroup[0];
              const index = groupIndex;
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

              // Get price
              const price = getFlightPrice(flight);

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="p-6">
                    {/* Header: Airline Name + Price */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                          <img
                            src={getAirlineLogo(getSegmentAirlineCode(firstSegment))}
                            alt={AIRLINE_NAMES[getSegmentAirlineCode(firstSegment)] || getSegmentAirlineCode(firstSegment)}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <Plane className="w-7 h-7 text-gray-400 hidden" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">
                            {airlines.length > 0 ? airlines.map(code => AIRLINE_NAMES[code] || code).join(', ') : 'Flight'}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {getSegmentAirlineCode(firstSegment)} {getSegmentNumber(firstSegment)}
                            {airlines.length > 1 && <span className="ml-2 text-[#ADF802]">• Multiple airlines</span>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {price.currency} {price.total.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {(() => {
                            const hasRoundTrip = flights.some(f => f.inbound && f.inbound.length > 0);
                            return hasRoundTrip ? 'Total price' : 'per person';
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Flight Route */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {departureTime}
                          </div>
                          <div className="text-sm font-semibold text-gray-600 mt-1">
                            {departure.iataCode}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {AIRPORT_CITY_NAMES[departure.iataCode] || departure.iataCode}
                          </div>
                        </div>

                        <div className="flex-1 px-6">
                          <div className="relative">
                            <div className="border-t-2 border-gray-300"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2">
                              <Plane className="w-4 h-4 text-gray-400 rotate-90" />
                            </div>
                          </div>
                          <div className="text-center mt-2">
                            <div className="text-xs font-medium text-gray-600">{duration}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {stops === 0 ? 'Direct' : `${stops} ${stops === 1 ? 'stop' : 'stops'}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {arrivalTime}
                          </div>
                          <div className="text-sm font-semibold text-gray-600 mt-1">
                            {arrival.iataCode}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {AIRPORT_CITY_NAMES[arrival.iataCode] || arrival.iataCode}
                          </div>
                        </div>
                      </div>

                      {/* Layover Information */}
                      {stops > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{stops} Stop{stops > 1 ? 's' : ''}:</span>
                            <div className="flex items-center gap-2">
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
                                  <span key={segIndex} className="text-gray-900 font-medium">
                                    {segArrival.iataCode} ({layoverHours > 0 && `${layoverHours}h `}{layoverMins}m)
                                    {segIndex < segments.length - 2 && <span className="mx-1 text-gray-400">•</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Flight Details - Compact Row */}
                    <div className="flex items-center gap-4 flex-wrap mt-4 text-xs text-gray-600">
                      {/* Cabin Class */}
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || flight.cabinClass || 'Economy'}</span>
                      </div>

                      {/* Baggage */}
                      {(() => {
                        const firstSegment = flight.outbound?.[0];
                        const baggage = firstSegment?.baggage;

                        if (baggage?.checked && baggage.checked !== '0 bags') {
                          return (
                            <div className="flex items-center gap-1.5">
                              <Luggage className="w-3.5 h-3.5" />
                              <span>{baggage.checked}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Fare Brand */}
                      {flight.fareBrandName && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900">{flight.fareBrandName}</span>
                        </div>
                      )}

                      {/* Refundable/Changeable */}
                      {flight.isRefundable && (
                        <div className="flex items-center gap-1.5 text-green-700">
                          <Check className="w-3.5 h-3.5" />
                          <span>Refundable</span>
                        </div>
                      )}
                      {flight.isChangeable && (
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Check className="w-3.5 h-3.5" />
                          <span>Changeable</span>
                        </div>
                      )}
                    </div>

                    {/* Return Flight Section - Only show in outbound selection mode */}
                    {flight.inbound && flight.inbound.length > 0 && !showReturnFlightSelection && (
                      <div className="mt-6 pt-5 border-t-2 border-dashed border-gray-300">
                        <div className="mb-4 flex items-center justify-center gap-2">
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg">
                            <Plane className="w-4 h-4 text-white -rotate-90" />
                            <span className="text-sm font-bold text-white">Return Flight</span>
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-3 md:gap-6 items-center">
                          {/* Return Flight Airline Info */}
                          <div className="flex-shrink-0 text-center">
                            {(() => {
                              const returnSegments = flight.inbound;
                              const firstReturnSegment = returnSegments[0];
                              const returnAirlineCode = getSegmentAirlineCode(firstReturnSegment);

                              return (
                                <>
                                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden mb-1 md:mb-2">
                                    <img
                                      src={getAirlineLogo(returnAirlineCode)}
                                      alt={AIRLINE_NAMES[returnAirlineCode] || returnAirlineCode}
                                      className="w-full h-full object-contain p-2"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    <Plane className="w-6 h-6 md:w-8 md:h-8 text-gray-600 hidden" />
                                  </div>
                                  <div className="text-xs font-bold text-gray-900">{returnAirlineCode}</div>
                                  <div className="text-[10px] text-gray-500">{getSegmentNumber(firstReturnSegment)}</div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Return Flight Details */}
                          <div className="flex-1 w-full">
                            {/* Return Route */}
                            {(() => {
                              const returnSegments = flight.inbound;
                              const firstReturnSegment = returnSegments[0];
                              const lastReturnSegment = returnSegments[returnSegments.length - 1];
                              const returnDeparture = getSegmentDeparture(firstReturnSegment);
                              const returnArrival = getSegmentArrival(lastReturnSegment);

                              const returnDepartureTime = new Date(returnDeparture.at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              const returnArrivalTime = new Date(returnArrival.at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                              // Calculate return duration
                              let returnDuration = '';
                              if (firstReturnSegment.duration) {
                                returnDuration = firstReturnSegment.duration.replace('PT', '').toLowerCase();
                              }
                              const returnStops = returnSegments.length - 1;

                              return (
                                <>
                                  <div className="flex items-center justify-between mb-2 md:mb-4">
                                    <div className="text-center flex-1">
                                      <div className="text-sm md:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">
                                        {returnDepartureTime}
                                      </div>
                                      <div className="text-xs font-semibold text-gray-900">
                                        {returnDeparture.iataCode}
                                      </div>
                                      <div className="text-[10px] text-gray-500 mt-0.5">
                                        {AIRPORT_CITY_NAMES[returnDeparture.iataCode] || returnDeparture.iataCode}
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
                                        <div className="text-[10px] font-medium text-gray-600">{returnDuration}</div>
                                        <div className="text-[10px] text-gray-500">
                                          {returnStops === 0 ? 'Direct' : `${returnStops} ${returnStops === 1 ? 'stop' : 'stops'}`}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-center flex-1">
                                      <div className="text-sm md:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">
                                        {returnArrivalTime}
                                      </div>
                                      <div className="text-xs font-semibold text-gray-900">
                                        {returnArrival.iataCode}
                                      </div>
                                      <div className="text-[10px] text-gray-500 mt-0.5">
                                        {AIRPORT_CITY_NAMES[returnArrival.iataCode] || returnArrival.iataCode}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Return Layover Information */}
                                  {returnStops > 0 && (
                                    <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                      <div className="flex items-start gap-2 md:gap-3">
                                        <div className="p-1 md:p-1.5 bg-gray-200 rounded-md flex-shrink-0">
                                          <Clock className="w-3 h-3 text-gray-700" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-[10px] font-bold text-gray-900 mb-0.5 md:mb-1">
                                            Layover{returnStops > 1 ? 's' : ''}: {returnStops} Stop{returnStops > 1 ? 's' : ''}
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 md:gap-2">
                                            {returnSegments.slice(0, -1).map((segment: any, segIndex: number) => {
                                              const nextSegment = returnSegments[segIndex + 1];
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

                                  {/* Return Baggage Allowance */}
                                  {(() => {
                                    const returnBaggage = returnSegments[0]?.baggage;
                                    if (returnBaggage) {
                                      return (
                                        <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-gray-600 mt-2 md:mt-3">
                                          {returnBaggage.checked && returnBaggage.checked !== '0 bags' && (
                                            <div className="flex items-center gap-1">
                                              <Luggage className="w-3 h-3 text-gray-700" />
                                              <span className="font-medium">{returnBaggage.checked}</span>
                                            </div>
                                          )}
                                          {returnBaggage.carryOn && returnBaggage.carryOn !== '0 bags' && (
                                            <div className="flex items-center gap-1">
                                              <Briefcase className="w-3 h-3 text-gray-700" />
                                              <span className="font-medium">{returnBaggage.carryOn} carry-on</span>
                                            </div>
                                          )}
                                          {(!returnBaggage.checked || returnBaggage.checked === '0 bags') &&
                                           (!returnBaggage.carryOn || returnBaggage.carryOn === '0 bags') && (
                                            <div className="flex items-center gap-1 text-yellow-600">
                                              <Luggage className="w-3 h-3" />
                                              <span className="font-medium">No baggage included</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fare Options - Only show if there are unique fares */}
                    {getUniqueFares(flightGroup).length > 1 && (
                      <div className="mt-6 pt-5 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-semibold text-gray-900">
                            Choose your fare
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Swipe to see more</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                        {/* Horizontal Sliding Carousel */}
                        <div className="relative">
                          <div
                            className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                            style={{
                              WebkitOverflowScrolling: 'touch',
                            }}
                          >
                          {getUniqueFares(flightGroup).map((fareOption: any, fareIndex: number) => {
                            const farePrice = getFlightPrice(fareOption);
                            const isSelected = selectedFares.get(`group-${groupIndex}`)?.id === fareOption.id || (fareIndex === 0 && !selectedFares.has(`group-${groupIndex}`));
                            const fareBaggage = fareOption.outbound?.[0]?.baggage;
                            const fullFareName = getFullFareName(fareOption);
                            const hasReturnFlight = fareOption.inbound && fareOption.inbound.length > 0;

                            return (
                              <div
                                key={fareIndex}
                                onClick={() => {
                                  const newSelected = new Map(selectedFares);
                                  newSelected.set(`group-${groupIndex}`, fareOption);
                                  setSelectedFares(newSelected);
                                }}
                                className={`relative p-5 rounded-lg cursor-pointer transition-all duration-200 flex-shrink-0 w-72 snap-start ${
                                  isSelected
                                    ? 'bg-gray-900 text-white shadow-lg ring-2 ring-gray-900'
                                    : 'bg-white border border-gray-200 hover:border-gray-400 hover:shadow-md'
                                }`}
                              >
                                {/* Selected Indicator */}
                                {isSelected && (
                                  <div className="absolute top-3 right-3">
                                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-gray-900" />
                                    </div>
                                  </div>
                                )}

                                {/* Fare Name */}
                                <div className={`text-sm font-bold mb-3 pr-8 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                  {fullFareName}
                                </div>

                                {/* Price */}
                                <div className="mb-3">
                                  <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                    {farePrice.currency} {farePrice.total.toLocaleString('en-US', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })}
                                  </div>
                                  {fareIndex > 0 && (
                                    <div className={`text-xs mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                      +{farePrice.currency} {(farePrice.total - getFlightPrice(flightGroup[0]).total).toLocaleString('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0,
                                      })} more
                                    </div>
                                  )}
                                  {hasReturnFlight && (
                                    <div className={`text-[10px] mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                      Round-trip pricing
                                    </div>
                                  )}
                                </div>

                                {/* Features */}
                                <div className="space-y-2">
                                  {/* Flexibility */}
                                  <div className="flex items-center gap-2 text-xs">
                                    {fareOption.isRefundable ? (
                                      <Check className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-900'}`} />
                                    ) : (
                                      <X className={`w-3.5 h-3.5 ${isSelected ? 'text-gray-400' : 'text-gray-300'}`} />
                                    )}
                                    <span className={isSelected ? 'text-white' : 'text-gray-700'}>
                                      {fareOption.isRefundable ? 'Refundable' : 'Non-refundable'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs">
                                    {fareOption.isChangeable ? (
                                      <Check className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-900'}`} />
                                    ) : (
                                      <X className={`w-3.5 h-3.5 ${isSelected ? 'text-gray-400' : 'text-gray-300'}`} />
                                    )}
                                    <span className={isSelected ? 'text-white' : 'text-gray-700'}>
                                      {fareOption.isChangeable ? 'Changes allowed' : 'No changes'}
                                    </span>
                                  </div>

                                  {/* Baggage - Outbound */}
                                  {fareBaggage?.checked && fareBaggage.checked !== '0 bags' ? (
                                    <div className="flex items-center gap-2 text-xs">
                                      <Luggage className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-900'}`} />
                                      <span className={isSelected ? 'text-white' : 'text-gray-700'}>
                                        {fareBaggage.checked}
                                        {hasReturnFlight && ' (each way)'}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-xs">
                                      <X className={`w-3.5 h-3.5 ${isSelected ? 'text-gray-400' : 'text-gray-300'}`} />
                                      <span className={`${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                                        No checked bag
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => {
                              const selectedFlight = selectedFares.get(`group-${groupIndex}`) || flight;
                              const hasRoundTrip = flights.some(f => f.inbound && f.inbound.length > 0);

                              // If this is outbound selection step in round-trip
                              if (hasRoundTrip && !showReturnFlightSelection) {
                                setSelectedOutboundFlight(selectedFlight);
                                setShowReturnFlightSelection(true);
                                setShowTransitionNotification(true);
                                setTimeout(() => {
                                  setShowTransitionNotification(false);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }, 4000);
                              } else {
                                // For return selection or one-way, proceed to booking
                                // Add timestamp for 10-minute expiry tracking
                                const flightWithTimestamp = {
                                  ...selectedFlight,
                                  _savedAt: new Date().toISOString()
                                };
                                sessionStorage.setItem(`flight_${selectedFlight.id || index}`, JSON.stringify(flightWithTimestamp));
                                window.location.href = `/dashboard/flights/${selectedFlight.id || index}`;
                              }
                            }}
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                          >
                            {(() => {
                              const hasRoundTrip = flights.some(f => f.inbound && f.inbound.length > 0);
                              if (hasRoundTrip && !showReturnFlightSelection) {
                                return <>Choose Return Flight<ChevronRight className="w-4 h-4" /></>;
                              }
                              return <>Continue<Plane className="w-4 h-4" /></>;
                            })()}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Single Fare - Direct CTA */}
                    {flightGroup.length === 1 && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            const hasRoundTrip = flights.some(f => f.inbound && f.inbound.length > 0);

                            // If this is outbound selection step in round-trip
                            if (hasRoundTrip && !showReturnFlightSelection) {
                              setSelectedOutboundFlight(flight);
                              setShowReturnFlightSelection(true);
                              setShowTransitionNotification(true);
                              setTimeout(() => {
                                setShowTransitionNotification(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }, 4000);
                            } else {
                              // For return selection or one-way, proceed to booking
                              // Add timestamp for 10-minute expiry tracking
                              const flightWithTimestamp = {
                                ...flight,
                                _savedAt: new Date().toISOString()
                              };
                              sessionStorage.setItem(`flight_${flight.id || index}`, JSON.stringify(flightWithTimestamp));
                              window.location.href = `/dashboard/flights/${flight.id || index}`;
                            }
                          }}
                          className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          {(() => {
                            const hasRoundTrip = flights.some(f => f.inbound && f.inbound.length > 0);
                            if (hasRoundTrip && !showReturnFlightSelection) {
                              return <>Choose Return Flight<ChevronRight className="w-4 h-4" /></>;
                            }
                            return <>Select Flight<Plane className="w-4 h-4" /></>;
                          })()}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
              </div>
            </div>
        )}
      </div>

      {/* AI Chatbox */}
      <AIChatbox />
      </div>
    </>
  );
}
