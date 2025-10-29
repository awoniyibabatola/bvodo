'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  Users,
  Wifi,
  Coffee,
  Utensils,
  Car,
  Dumbbell,
  Waves,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Bed,
  CreditCard,
  Sparkles,
  ArrowRight,
  Heart,
  Share2,
  X,
  Grid3x3,
  Info,
  Clock,
  Shield,
  Award,
  Zap,
  Briefcase,
  DollarSign,
  Wind,
  Bath,
  Tv,
  Phone,
  Droplet,
  PartyPopper,
} from 'lucide-react';
import { getCityCode } from '@/utils/cityMapping';
import { getApiEndpoint } from '@/lib/api-config';
import CityAutocomplete from '@/components/CityAutocomplete';
import AIChatbox from '@/components/AIChatbox';
import PassengerDetailsModal from '@/components/PassengerDetailsModal';
import BookingSuccessModal from '@/components/BookingSuccessModal';
import PaymentSummaryModal from '@/components/PaymentSummaryModal';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import BusinessFooter from '@/components/BusinessFooter';

export default function HotelDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchResultId = params.id as string; // NOTE: Changed from hotelId to searchResultId for Duffel Stays
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const rooms = parseInt(searchParams.get('rooms') || '1');
  const city = searchParams.get('city') || '';

  // Build back URL with search parameters preserved
  const backToSearchUrl = `/dashboard/hotels/search?${new URLSearchParams({
    ...(city && { city }),
    ...(checkInDate && { checkIn: checkInDate }),
    ...(checkOutDate && { checkOut: checkOutDate }),
    ...(adults && { adults: adults.toString() }),
    ...(rooms && { rooms: rooms.toString() }),
  }).toString()}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotelOffers, setHotelOffers] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'recommended'>('recommended');
  const [policyFilter, setPolicyFilter] = useState<'all' | 'refundable' | 'non-refundable'>('all'); // Policy filter
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set()); // Will be populated with all rooms on mount
  const [groupByPolicy, setGroupByPolicy] = useState(true); // Group by refundable/non-refundable
  const [roomImageIndices, setRoomImageIndices] = useState<{ [key: number]: number }>({}); // Track current image for each room
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true); // About this property collapse state

  // Group booking modal state
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'card'>('credit');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [userRole, setUserRole] = useState<string>('traveler');

  // Search form state
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCheckIn, setSearchCheckIn] = useState(checkInDate);
  const [searchCheckOut, setSearchCheckOut] = useState(checkOutDate);
  const [searchAdults, setSearchAdults] = useState(adults);
  const [searchRooms, setSearchRooms] = useState(rooms);

  // Update state when URL params change
  useEffect(() => {
    setSearchCheckIn(checkInDate);
    setSearchCheckOut(checkOutDate);
    setSearchAdults(adults);
    setSearchRooms(rooms);
  }, [checkInDate, checkOutDate, adults, rooms]);

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      fetchHotelOffers();
    }
  }, [searchResultId, checkInDate, checkOutDate, adults, rooms]);

  // Expand all rooms by default when offers are loaded
  useEffect(() => {
    if (hotelOffers?.offers && hotelOffers.offers.length > 0) {
      // Expand all rooms by default
      const allIndices = new Set<number>(hotelOffers.offers.map((_: any, idx: number) => idx));
      setExpandedRooms(allIndices);
    }
  }, [hotelOffers?.offers]);

  // Debug: Log hotel address data
  useEffect(() => {
    if (hotelOffers?.hotel?.address) {
      console.log('Hotel address data:', hotelOffers.hotel.address);
      console.log('Address lines:', hotelOffers.hotel.address.lines);
      console.log('City name:', hotelOffers.hotel.address.cityName);
      console.log('Country code:', hotelOffers.hotel.address.countryCode);
    }
  }, [hotelOffers]);

  // Fetch user credits and role (uses dashboard/stats endpoint which returns correct credits based on role)
  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        // Get user role from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUserRole(parsedUser.role || 'traveler');
        }

        const response = await fetch(getApiEndpoint('dashboard/stats'), {
          headers: {
            'Authorization': `Bearer ${token}`,
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Use city mapping to convert city name to code
    const cityCode = getCityCode(searchLocation);

    if (!cityCode) {
      alert('Please enter a valid city name or code');
      return;
    }

    // Navigate to search page with parameters
    const searchUrl = `/dashboard/hotels/search?city=${encodeURIComponent(searchLocation)}&checkIn=${searchCheckIn}&checkOut=${searchCheckOut}&adults=${searchAdults}&rooms=${searchRooms}`;
    router.push(searchUrl);
  };

  const handleReserveRoom = (offer: any) => {
    setSelectedOffer(offer);
    setShowPaymentSummary(true);
  };

  const handleContinueToGuestDetails = () => {
    setShowPaymentSummary(false);
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

      // STEP 1: Create quote from rate ID BEFORE booking
      // This validates rate availability and locks pricing
      console.log('Creating quote for rate:', selectedOffer.id);
      let quoteId: string | null = null;
      try {
        const quoteResponse = await fetch(getApiEndpoint(`hotels/quotes`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rateId: selectedOffer.id,
          }),
        });

        if (!quoteResponse.ok) {
          const quoteError = await quoteResponse.json();
          throw new Error(quoteError.message || 'Failed to create quote. Rate may have expired.');
        }

        const quoteData = await quoteResponse.json();
        quoteId = quoteData.data.id;
        console.log('✅ Quote created:', quoteId);
      } catch (quoteError: any) {
        console.error('Quote creation failed:', quoteError);
        alert(quoteError.message || 'This hotel room is no longer available. Please search again for fresh availability.');
        return;
      }

      // STEP 2: Create booking with quoteId
      const bookingData = {
        bookingType: 'hotel',
        isGroupBooking,
        numberOfTravelers: passengers.length,
        groupName: isGroupBooking ? groupName : undefined,

        // Provider details - CRITICAL for Duffel Stays booking creation
        provider: 'duffel',
        providerName: 'Duffel Stays',
        providerBookingReference: selectedOffer.id, // Rate ID for Duffel Stays

        // Trip details
        destination: hotel.address?.cityName || hotel.name,
        departureDate: checkInDate,
        returnDate: checkOutDate,
        passengers: passengers.length,
        passengerDetails: passengers,

        // Pricing
        basePrice: parseFloat(selectedOffer.price.base),
        taxesFees: parseFloat(selectedOffer.price.total) - parseFloat(selectedOffer.price.base),
        totalPrice: parseFloat(selectedOffer.price.total),
        currency: selectedOffer.price.currency,

        // Payment method
        paymentMethod,

        // Instant confirmation flag (for hotels, most are instant but check if available in offer)
        isInstantConfirmation: selectedOffer?.instantConfirmation !== false, // Default true unless explicitly false

        // Store selected offer data for webhook processing
        bookingData: {
          selectedOffer: selectedOffer,
          rateId: selectedOffer.id, // Store rate ID in bookingData for webhook access
          quoteId: quoteId, // 🔥 CRITICAL FIX: Store quoteId for webhook to use
        },

        // Hotel specific details
        hotelDetails: {
          hotelId: hotel.hotelId,
          hotelName: hotel.name,
          checkInDate: new Date(checkInDate).toISOString(),
          checkOutDate: new Date(checkOutDate).toISOString(),
          numberOfNights: calculateNights(),
          numberOfRooms: rooms,
          roomType: selectedOffer.room?.typeEstimated?.category || 'STANDARD',
          bedType: selectedOffer.room?.typeEstimated?.bedType || 'DOUBLE',
          guestsPerRoom: selectedOffer.guests?.adults || adults,
          roomDescription: selectedOffer.room?.description?.text || '',
          amenities: selectedOffer.room?.description?.facilities || [],
          mealPlan: selectedOffer.boardType || 'ROOM_ONLY',
          cancellationPolicy: selectedOffer.policies?.cancellation?.type || 'NON_REFUNDABLE',
          address: hotel.address?.lines?.join(', ') || hotel.address?.cityName || 'N/A',
          city: hotel.address?.cityName || hotel.name || 'Unknown',
          country: hotel.address?.countryCode || hotel.address?.cityName || 'Unknown',
          photoUrl: hotel.media && hotel.media.length > 0 ? (hotel.media[0].uri || hotel.media[0].url) : null,
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

        // Check if there's a checkout URL (indicates card payment via Stripe)
        if (result.checkoutUrl) {
          // Redirect to Stripe checkout
          console.log('Redirecting to Stripe:', result.checkoutUrl);
          window.location.href = result.checkoutUrl;
          return;
        }

        // For credit payments, show success modal
        setShowPassengerModal(false);
        setBookingResult(result.data);
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  const fetchHotelOffers = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('=== Hotel Details Debug (Duffel Stays) ===');
      console.log('searchResultId:', searchResultId);
      console.log('checkInDate:', checkInDate);
      console.log('checkOutDate:', checkOutDate);
      console.log('adults:', adults);
      console.log('rooms:', rooms);

      // Validate required parameters
      if (!checkInDate || !checkOutDate) {
        throw new Error('Missing required date parameters. Please search for hotels first.');
      }

      // STRATEGY: Always try to fetch from API first if we have a valid search result ID (starts with 'srr_')
      // This ensures we get ALL room types with their photos and details, not just the cheapest rate
      const hasValidSearchResultId = searchResultId && searchResultId.startsWith('srr_');

      if (hasValidSearchResultId) {
        console.log('✅ Valid search result ID detected, fetching all rooms from API');
        // Proceed to API fetch below
      } else {
        // FALLBACK: Check if we have hotel data in sessionStorage
        // This is used when we don't have a valid search result ID (Duffel test environment limitation)
        const storedHotelData = sessionStorage.getItem('selectedHotelData');
        if (storedHotelData) {
          try {
            const hotelData = JSON.parse(storedHotelData);
            console.log('⚠️ Using stored hotel data from search results (Duffel test environment)');
            console.log('Hotel data:', hotelData);

            // Transform to expected format for detail page
            setHotelOffers({
              hotel: hotelData.hotel,
              offers: hotelData.offers || [],
              price: hotelData.price,
              checkInDate: hotelData.checkInDate,
              checkOutDate: hotelData.checkOutDate,
              rooms: hotelData.rooms,
              guests: hotelData.guests,
              // Add note explaining test environment limitation
              note: 'You are viewing the best available rate. In production, all room types with detailed photos and descriptions will be displayed.',
            });

            setLoading(false);
            return; // Exit early, no need to fetch from API
          } catch (parseError) {
            console.warn('Failed to parse stored hotel data, falling back to API fetch');
          }
        }
      }

      // FETCH FROM API: Get all room types with photos and details from Duffel Stays
      // Skip API call if we know it will fail (using accommodation ID instead of search result ID)
      if (searchResultId.startsWith('acc_')) {
        console.warn('⚠️ Cannot fetch rates with accommodation ID. Duffel requires search result IDs.');
        throw new Error('Hotel details are only available immediately after searching. Please return to search and try again.');
      }

      const fullUrl = `${getApiEndpoint('hotels/rates')}/${searchResultId}`;
      console.log('Fetching all room types and rates from Duffel Stays:', fullUrl);
      const response = await fetch(fullUrl);

      // Check if response is OK before parsing
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to load hotel offers (${response.status})`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use default error message
          if (response.status === 404) {
            errorMessage = 'Hotel not found or no offers available';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        // Backend already returns properly transformed data with hotel and offers
        // No need to transform again - just use it directly!
        const transformedData = data.data;

        console.log('Hotel data from backend:', transformedData);
        console.log('Number of offers:', transformedData.offers?.length || 0);
        console.log('Sample offer structure:', transformedData.offers?.[0]);

        // Log the room type structure for debugging
        if (transformedData.offers && transformedData.offers.length > 0) {
          console.log('First offer room type:', transformedData.offers[0].room?.typeEstimated?.category);
          console.log('First offer room bed:', transformedData.offers[0].room?.typeEstimated?.bedType);
        }

        setHotelOffers(transformedData);
      } else {
        setError(data.message || 'Failed to load hotel offers');
      }
    } catch (err: any) {
      console.error('Hotel offers fetch error:', err);
      setError(err.message || 'An error occurred while loading hotel offers');
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getAmenityIcon = (amenityCode: string) => {
    const code = amenityCode.toUpperCase();

    const amenityMap: { [key: string]: any} = {
      // WiFi & Internet
      WIFI: Wifi,
      WI_FI: Wifi,
      WIRELESS_INTERNET: Wifi,
      FREE_WIFI: Wifi,
      INTERNET: Wifi,

      // Dining
      RESTAURANT: Utensils,
      DINING: Utensils,
      BREAKFAST: Coffee,
      FREE_BREAKFAST: Coffee,
      ROOM_SERVICE: Coffee,
      BAR: Coffee,
      MINIBAR: Coffee,
      KITCHEN: Utensils,
      KITCHENETTE: Utensils,

      // Parking
      PARKING: Car,
      FREE_PARKING: Car,
      VALET_PARKING: Car,
      CAR_PARK: Car,
      GARAGE: Car,

      // Fitness & Recreation
      FITNESS: Dumbbell,
      FITNESS_CENTER: Dumbbell,
      FITNESS_CENTRE: Dumbbell,
      GYM: Dumbbell,
      POOL: Waves,
      SWIMMING_POOL: Waves,
      OUTDOOR_POOL: Waves,
      INDOOR_POOL: Waves,
      SPA: Waves,
      SAUNA: Waves,
      HOT_TUB: Waves,
      JACUZZI: Waves,

      // Business
      BUSINESS_CENTER: Briefcase,
      BUSINESS_CENTRE: Briefcase,
      MEETING_ROOMS: Briefcase,
      CONFERENCE_ROOM: Briefcase,
      WORK_DESK: Briefcase,

      // Services
      CONCIERGE: PartyPopper,
      '24_HOUR_FRONT_DESK': Clock,
      FRONT_DESK: Clock,
      RECEPTION: Clock,
      LAUNDRY: Droplet,
      DRY_CLEANING: Droplet,
      IRONING: Droplet,

      // Room Features
      AIR_CONDITIONING: Wind,
      HEATING: Wind,
      TV: Tv,
      CABLE_TV: Tv,
      SATELLITE_TV: Tv,
      FLAT_SCREEN_TV: Tv,
      TELEPHONE: Phone,
      SAFE: Shield,
      MINI_BAR: Coffee,
      BALCONY: Building2,
      TERRACE: Building2,

      // Bathroom
      PRIVATE_BATHROOM: Bath,
      SHOWER: Droplet,
      BATHTUB: Bath,
      HAIRDRYER: Droplet,
      TOILETRIES: Droplet,

      // Accessibility
      ACCESSIBLE: Shield,
      WHEELCHAIR_ACCESSIBLE: Shield,
      ACCESSIBILITY_MOBILITY: Shield,
      ELEVATOR: Building2,
      LIFT: Building2,

      // Payment & Extras
      CASH_MACHINE: DollarSign,
      ATM: DollarSign,
      CURRENCY_EXCHANGE: DollarSign,

      // Pets
      PETS_ALLOWED: Star,
      PET_FRIENDLY: Star,

      // Misc
      LOUNGE: Users,
      LIBRARY: Building2,
      GARDEN: Building2,
      SMOKING_AREA: Building2,
    };

    // Direct match
    if (amenityMap[code]) {
      return amenityMap[code];
    }

    // Fuzzy matching for partial matches
    if (code.includes('WIFI') || code.includes('INTERNET')) return Wifi;
    if (code.includes('POOL') || code.includes('SWIM')) return Waves;
    if (code.includes('GYM') || code.includes('FITNESS')) return Dumbbell;
    if (code.includes('PARKING') || code.includes('GARAGE')) return Car;
    if (code.includes('BREAKFAST') || code.includes('DINING') || code.includes('RESTAURANT')) return Utensils;
    if (code.includes('BUSINESS') || code.includes('MEETING') || code.includes('CONFERENCE')) return Briefcase;
    if (code.includes('CONCIERGE') || code.includes('DESK')) return PartyPopper;
    if (code.includes('ACCESSIBLE') || code.includes('WHEELCHAIR') || code.includes('MOBILITY')) return Shield;
    if (code.includes('SPA') || code.includes('SAUNA') || code.includes('JACUZZI')) return Waves;
    if (code.includes('LAUNDRY') || code.includes('CLEANING')) return Droplet;
    if (code.includes('TV') || code.includes('TELEVISION')) return Tv;
    if (code.includes('AIR_COND') || code.includes('HEATING')) return Wind;
    if (code.includes('BAR') || code.includes('COFFEE')) return Coffee;

    // Default fallback
    return Building2;
  };

  // Get placeholder image for hotels without photos
  const getPlaceholderImage = (id: string) => {
    const images = [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&auto=format&fit=crop',
    ];
    // Use id to consistently get the same image for this hotel
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return images[hash % images.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gray-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-4 h-16">
              <Link
                href={backToSearchUrl}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Search</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <Info className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hotel Details Temporarily Unavailable</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Why is this happening?</strong> Detailed rates for this hotel are currently not available.
                  This may occur when hotel search results are older than a few minutes.
                </p>
              </div>
              <Link
                href="/dashboard/hotels/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotelOffers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-4 h-16">
              <Link
                href={backToSearchUrl}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Search</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-700">Hotel information not available</p>
          </div>
        </div>
      </div>
    );
  }

  const hotel = hotelOffers.hotel;
  let offers = hotelOffers.offers || [];

  // Filter offers by policy
  if (policyFilter === 'refundable') {
    offers = offers.filter((offer: any) => {
      const cancellationType = offer.policies?.cancellation?.type;
      return cancellationType === 'FULL_REFUND' ||
             (offer.policies?.cancellation?.timeline &&
              offer.policies.cancellation.timeline.length > 0);
    });
  } else if (policyFilter === 'non-refundable') {
    offers = offers.filter((offer: any) => {
      const cancellationType = offer.policies?.cancellation?.type;
      return !cancellationType ||
             cancellationType === 'NON_REFUNDABLE' ||
             (cancellationType !== 'FULL_REFUND' &&
              (!offer.policies?.cancellation?.timeline ||
               offer.policies.cancellation.timeline.length === 0));
    });
  }
  // 'all' means no filtering

  // Sort offers
  offers = [...offers].sort((a: any, b: any) => {
    const priceA = parseFloat(a.price.total);
    const priceB = parseFloat(b.price.total);

    switch (sortBy) {
      case 'price-low':
        return priceA - priceB;
      case 'price-high':
        return priceB - priceA;
      case 'recommended':
      default:
        return 0;
    }
  });

  // Group offers by cancellation policy if enabled
  const groupedOffers = groupByPolicy ? {
    refundable: offers.filter((offer: any) => {
      const cancellationType = offer.policies?.cancellation?.type;
      return cancellationType === 'FULL_REFUND' ||
             (offer.policies?.cancellation?.timeline &&
              offer.policies.cancellation.timeline.length > 0);
    }),
    nonRefundable: offers.filter((offer: any) => {
      const cancellationType = offer.policies?.cancellation?.type;
      return !cancellationType ||
             cancellationType === 'NON_REFUNDABLE' ||
             (cancellationType !== 'FULL_REFUND' &&
              (!offer.policies?.cancellation?.timeline ||
               offer.policies.cancellation.timeline.length === 0));
    })
  } : { all: offers };

  // Get hotel images or fallback to placeholders
  const hotelImages = hotel.media && hotel.media.length > 0
    ? hotel.media.map((m: any) => m.uri || m.url)
    : [getPlaceholderImage(searchResultId)];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
  };

  const toggleRoomExpansion = (index: number) => {
    setExpandedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const nextRoomImage = (roomIndex: number, imageCount: number) => {
    setRoomImageIndices(prev => ({
      ...prev,
      [roomIndex]: ((prev[roomIndex] || 0) + 1) % imageCount
    }));
  };

  const previousRoomImage = (roomIndex: number, imageCount: number) => {
    setRoomImageIndices(prev => ({
      ...prev,
      [roomIndex]: ((prev[roomIndex] || 0) - 1 + imageCount) % imageCount
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={backToSearchUrl}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group"
            >
              <div className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-semibold hidden sm:inline">Back to Search</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSaved(!isSaved)}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors group"
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600 group-hover:text-red-500'} transition-colors`} />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Save</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Modern Image Gallery */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Photo Gallery Grid */}
        <div className="relative mb-8">
          <div className="grid grid-cols-4 gap-2 h-[300px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            {/* Main large image */}
            <div className="col-span-4 md:col-span-2 row-span-2 relative group cursor-pointer overflow-hidden">
              <img
                src={hotelImages[0]}
                alt={`${hotel.name || 'Hotel'} - Main`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onClick={() => setShowAllPhotos(true)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>

            {/* Grid of smaller images */}
            {hotelImages.slice(1, 5).map((img: string, idx: number) => (
              <div
                key={idx}
                className="col-span-2 md:col-span-1 relative group cursor-pointer overflow-hidden"
                onClick={() => setShowAllPhotos(true)}
              >
                <img
                  src={img}
                  alt={`${hotel.name || 'Hotel'} - ${idx + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
            ))}
          </div>

          {/* Show all photos button */}
          <button
            onClick={() => setShowAllPhotos(true)}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-200"
          >
            <Grid3x3 className="w-4 h-4" />
            <span>Show all {hotelImages.length} photos</span>
          </button>
        </div>

        {/* Full Screen Photo Modal */}
        {showAllPhotos && (
          <div className="fixed inset-0 bg-black z-[100] overflow-y-auto">
            <div className="min-h-screen">
              {/* Close button */}
              <button
                onClick={() => setShowAllPhotos(false)}
                className="fixed top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Photo grid */}
              <div className="max-w-5xl mx-auto px-6 py-12">
                <h2 className="text-3xl font-bold text-white mb-8">All Photos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotelImages.map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                      <img
                        src={img}
                        alt={`${hotel.name || 'Hotel'} - Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Your Stay Card - Clean Corporate Design */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Header with price - Minimal Design */}
            <div className="bg-gray-900 px-3 md:px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-[10px] font-semibold mb-1">
                    Total Price
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl md:text-2xl font-bold text-white">
                      ${offers.length > 0 ? parseFloat(offers[0].price.total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '---'}
                    </span>
                    {offers.length > 0 && (
                      <span className="text-gray-400 text-[10px] md:text-xs">
                        ${(parseFloat(offers[0].price.total) / calculateNights()).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / night
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-[10px] text-gray-300">
                    <Check className="w-3 h-3" />
                    <span>Free cancellation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form content - Minimal Design */}
            <div className="p-3 md:p-4">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={searchCheckIn}
                    onChange={(e) => setSearchCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white hover:border-gray-300 transition-colors"
                  />
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    value={searchCheckOut}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    min={searchCheckIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white hover:border-gray-300 transition-colors"
                  />
                </div>

                <div className="w-16">
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Adults</label>
                  <input
                    type="number"
                    value={searchAdults}
                    onChange={(e) => setSearchAdults(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={9}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white text-center hover:border-gray-300 transition-colors"
                  />
                </div>

                <div className="w-16">
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Rooms</label>
                  <input
                    type="number"
                    value={searchRooms}
                    onChange={(e) => setSearchRooms(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={9}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white text-center hover:border-gray-300 transition-colors"
                  />
                </div>

                <button
                  onClick={() => {
                    router.push(`/dashboard/hotels/${searchResultId}?checkIn=${searchCheckIn}&checkOut=${searchCheckOut}&adults=${searchAdults}&rooms=${searchRooms}`);
                  }}
                  className="px-4 py-1.5 bg-gray-900 text-white rounded font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1 text-xs"
                >
                  <Search className="w-3 h-3" />
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hotel Title & Info */}
        <div className="mb-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            {hotel.name || 'Hotel'}
          </h1>

          {/* Two Column Layout for Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left Column - Location and Rating */}
            <div className="space-y-3">
              {/* Location */}
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Location</p>
                    <p className="text-gray-700 text-xs">
                      {(() => {
                        // Build address from available data
                        const addressParts = [];

                        // Add street address if available
                        if (hotel.address?.lines?.length > 0) {
                          addressParts.push(hotel.address.lines.join(', '));
                        }

                        // Add city - prioritize cityName over cityCode
                        if (hotel.address?.cityName) {
                          addressParts.push(hotel.address.cityName);
                        } else if (hotel.cityCode) {
                          // Map common city codes to full names
                          const cityMap: { [key: string]: string } = {
                            'NYC': 'New York',
                            'LON': 'London',
                            'PAR': 'Paris',
                            'DXB': 'Dubai',
                            'LAX': 'Los Angeles',
                            'SFO': 'San Francisco',
                            'CHI': 'Chicago',
                            'MIA': 'Miami',
                            'LAS': 'Las Vegas',
                            'BOS': 'Boston',
                            'ATL': 'Atlanta',
                            'SEA': 'Seattle',
                            'SYD': 'Sydney',
                            'MEL': 'Melbourne',
                            'SIN': 'Singapore',
                            'HKG': 'Hong Kong',
                            'TOK': 'Tokyo',
                            'BER': 'Berlin',
                            'ROM': 'Rome',
                            'BCN': 'Barcelona',
                          };
                          addressParts.push(cityMap[hotel.cityCode] || hotel.cityCode);
                        }

                        // Add state/region if available
                        if (hotel.address?.stateCode) {
                          addressParts.push(hotel.address.stateCode);
                        }

                        // Add country
                        if (hotel.address?.countryCode) {
                          // Map country codes to full names
                          const countryMap: { [key: string]: string } = {
                            'US': 'United States',
                            'GB': 'United Kingdom',
                            'FR': 'France',
                            'AE': 'United Arab Emirates',
                            'AU': 'Australia',
                            'SG': 'Singapore',
                            'JP': 'Japan',
                            'DE': 'Germany',
                            'IT': 'Italy',
                            'ES': 'Spain',
                            'CA': 'Canada',
                            'CN': 'China',
                            'IN': 'India',
                          };
                          addressParts.push(countryMap[hotel.address.countryCode] || hotel.address.countryCode);
                        }

                        // If we have address parts, join them
                        if (addressParts.length > 0) {
                          return addressParts.join(', ');
                        }

                        // Last resort: show hotel name as location
                        return hotel.name || 'Location not specified';
                      })()}
                    </p>
                    {hotel.name && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          hotel.name + (hotel.address?.cityName ? ` ${hotel.address.cityName}` : '') + (hotel.address?.countryCode ? ` ${hotel.address.countryCode}` : '')
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-gray-900 font-semibold mt-1 inline-flex items-center gap-1 text-[10px]"
                      >
                        View on map
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating badges */}
              <div className="flex flex-wrap items-center gap-2">
                {hotel.rating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-900 text-white rounded text-xs font-semibold">
                    <Star className="w-3 h-3 fill-white" />
                    <span>{hotel.rating} Star Hotel</span>
                  </div>
                )}

                {hotel.distance?.value && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-700 text-[10px]">
                    <MapPin className="w-3 h-3 text-gray-600" />
                    <span>{hotel.distance.value} {hotel.distance.unit} from center</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Description */}
            <div>
              <div className="p-2 bg-gray-50 rounded border border-gray-200 h-full">
                <p className="text-xs font-semibold text-gray-900 mb-1">About this property</p>
                <div className="text-gray-700 leading-relaxed text-xs">
                  {(() => {
                    const description = hotel.description || `${hotel.name || 'This hotel'} offers quality accommodations and amenities for your stay. Contact the hotel directly for more detailed information about the property.`;
                    const shouldTruncate = description.length > 150;

                    if (!shouldTruncate) {
                      return <p>{description}</p>;
                    }

                    return (
                      <>
                        <p>
                          {isDescriptionExpanded ? description : `${description.substring(0, 150)}...`}
                        </p>
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="text-gray-900 hover:text-gray-700 font-semibold mt-1 inline-flex items-center gap-1 text-[10px]"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              See less
                              <ChevronDown className="w-3 h-3 rotate-180" />
                            </>
                          ) : (
                            <>
                              See more
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities - Minimal Design */}
        <div className="mb-8">
          <h2 className="text-sm md:text-base font-bold text-gray-900 mb-3">Amenities</h2>
          {hotel.amenities && hotel.amenities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {hotel.amenities.map((amenity: string, idx: number) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:border-gray-300 transition-all bg-white"
                  >
                    <Icon className="w-3 h-3 text-gray-600" />
                    <span className="text-[10px] text-gray-900">{amenity.toLowerCase().replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {['WIFI', 'PARKING', 'RESTAURANT', 'FITNESS', 'POOL', 'BREAKFAST', 'AIR_CONDITIONING', 'ROOM_SERVICE'].map((amenity: string, idx: number) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:border-gray-300 transition-all bg-white"
                  >
                    <Icon className="w-3 h-3 text-gray-600" />
                    <span className="text-[10px] text-gray-900">{amenity.toLowerCase().replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Rooms Section */}
        <div className="border-t border-gray-200 pt-6 available-rooms scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm md:text-base font-bold text-gray-900 mb-1">
                Choose Your Room
              </h2>
              <p className="text-xs text-gray-600">
                {offers.length} room{offers.length !== 1 ? 's' : ''} available for your dates
              </p>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Policy Filter Dropdown */}
              <div className="relative">
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded border border-gray-200 hover:border-gray-300 transition-all">
                  <Shield className="w-3 h-3 text-gray-600" />
                  <select
                    value={policyFilter}
                    onChange={(e) => setPolicyFilter(e.target.value as any)}
                    className="text-[10px] font-semibold text-gray-700 border-none focus:outline-none bg-transparent cursor-pointer pr-1"
                  >
                    <option value="all">All Rooms</option>
                    <option value="refundable">Free Cancellation Only</option>
                    <option value="non-refundable">Non-Refundable Only</option>
                  </select>
                </div>
              </div>

              {/* Group by Policy Toggle */}
              <button
                onClick={() => setGroupByPolicy(!groupByPolicy)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded border transition-all font-semibold text-[10px] ${
                  groupByPolicy
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Grid3x3 className="w-3 h-3" />
                <span>Group by Policy</span>
                {groupByPolicy && (
                  <div className="ml-1">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded border border-gray-200 hover:border-gray-300 transition-all">
                  <ArrowUpDown className="w-3 h-3 text-gray-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-[10px] font-semibold text-gray-700 border-none focus:outline-none bg-transparent cursor-pointer pr-1"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Show API limitation message if note exists */}
          {hotelOffers.note && (
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1 text-xs">Test Environment Notice</h4>
                  <p className="text-[10px] text-gray-700 leading-relaxed">{hotelOffers.note}</p>
                </div>
              </div>
            </div>
          )}

          {offers.length > 0 ? (
            <div className="space-y-6">
              {/* Render grouped offers */}
              {Object.entries(groupedOffers).map(([groupKey, groupOffers]) => {
                if (!groupOffers || (groupOffers as any[]).length === 0) return null;

                const isRefundable = groupKey === 'refundable';
                const isNonRefundable = groupKey === 'nonRefundable';

                return (
                  <div key={groupKey} className="space-y-3">
                    {/* Group Header */}
                    {groupByPolicy && (
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                        {isRefundable && (
                          <>
                            <Shield className="w-4 h-4 text-green-600" />
                            <h3 className="text-sm font-bold text-gray-900">
                              Free Cancellation Available
                            </h3>
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              {(groupOffers as any[]).length} option{(groupOffers as any[]).length !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                        {isNonRefundable && (
                          <>
                            <X className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-900">
                              Non-Refundable Rates
                            </h3>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                              {(groupOffers as any[]).length} option{(groupOffers as any[]).length !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Rooms in this group */}
                    <div className="grid grid-cols-1 gap-3">
                      {(groupOffers as any[]).map((offer: any, index: number) => {
                        // Calculate global index for expanded state
                        const globalIndex = offers.findIndex((o: any) => o.id === offer.id);
                        const isExpanded = expandedRooms.has(globalIndex);
                        return (
                <div
                  key={index}
                  className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all"
                >
                  {/* Collapsible Header - Always Visible */}
                  <button
                    onClick={() => toggleRoomExpansion(globalIndex)}
                    className="w-full p-3 sm:p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-2 sm:hidden">
                      {/* Top Row: Title and Price */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Bed className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-gray-900 capitalize line-clamp-2">
                              {offer.room?.typeEstimated?.category
                                ? `${offer.room.typeEstimated.category.toLowerCase().replace(/_/g, ' ')} ${offer.room.typeEstimated.bedType ? offer.room.typeEstimated.bedType.toLowerCase() : ''}`
                                : 'Room'}
                            </h3>
                            {offer.room?.typeEstimated && (
                              <p className="text-[10px] text-gray-600 mt-0.5">
                                {offer.room.typeEstimated.beds} {offer.room.typeEstimated.bedType}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-base font-bold text-gray-900">
                              ${parseFloat(offer.price.total).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Bottom Row: Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pl-6">
                        {/* Cancellation Policy Badge */}
                        {(() => {
                          const cancellationType = offer.policies?.cancellation?.type;
                          const hasTimeline = offer.policies?.cancellation?.timeline &&
                                              offer.policies.cancellation.timeline.length > 0;
                          const isRefundable = cancellationType === 'FULL_REFUND' || hasTimeline;

                          if (isRefundable) {
                            return (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px] font-semibold">
                                <Check className="w-2.5 h-2.5" />
                                <span>Free Cancel</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-600 text-white rounded text-[9px] font-semibold">
                                <X className="w-2.5 h-2.5" />
                                <span>Non-Refund</span>
                              </div>
                            );
                          }
                        })()}

                        {/* Available rooms count */}
                        {offer.quantityAvailable !== undefined && offer.quantityAvailable > 0 && offer.quantityAvailable <= 5 && (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[9px] font-semibold">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{offer.quantityAvailable} left</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between gap-3">
                      <div className="flex-1 flex items-center gap-3">
                        {/* Room Icon/Type */}
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 capitalize">
                              {offer.room?.typeEstimated?.category
                                ? `${offer.room.typeEstimated.category.toLowerCase().replace(/_/g, ' ')} ${offer.room.typeEstimated.bedType ? offer.room.typeEstimated.bedType.toLowerCase() : ''}`
                                : 'Room'}
                            </h3>
                            {offer.room?.typeEstimated && (
                              <p className="text-[10px] text-gray-600">
                                {offer.room.typeEstimated.beds} {offer.room.typeEstimated.bedType}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quick badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Cancellation Policy Badge */}
                          {(() => {
                            const cancellationType = offer.policies?.cancellation?.type;
                            const hasTimeline = offer.policies?.cancellation?.timeline &&
                                                offer.policies.cancellation.timeline.length > 0;
                            const isRefundable = cancellationType === 'FULL_REFUND' || hasTimeline;

                            if (isRefundable) {
                              return (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded text-[10px] font-semibold">
                                  <Check className="w-3 h-3" />
                                  <span>Refundable</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-600 text-white rounded text-[10px] font-semibold">
                                  <X className="w-3 h-3" />
                                  <span>Non-Refundable</span>
                                </div>
                              );
                            }
                          })()}

                          {/* Available rooms count */}
                          {offer.quantityAvailable !== undefined && offer.quantityAvailable > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold">
                              <Clock className="w-3 h-3" />
                              <span>
                                {offer.quantityAvailable === 1
                                  ? 'Only 1 left'
                                  : offer.quantityAvailable <= 3
                                    ? `Only ${offer.quantityAvailable} left`
                                    : `${offer.quantityAvailable} available`
                                }
                              </span>
                            </div>
                          )}

                          {/* Guest capacity */}
                          {offer.guests && (
                            <div className="flex px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">
                              Up to {offer.guests.adults} adults
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price and Expand Icon */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            ${parseFloat(offer.price.total).toLocaleString('en-US', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            for {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isExpanded && (
                  <div className="flex flex-col lg:flex-row border-t border-gray-200">
                    {/* Room Image Gallery */}
                    {offer.room?.media && offer.room.media.length > 0 && (
                      <div className="lg:w-64 h-44 sm:h-52 lg:h-auto relative overflow-hidden group">
                        <img
                          src={offer.room.media[roomImageIndices[globalIndex] || 0].uri || offer.room.media[roomImageIndices[globalIndex] || 0].url}
                          alt={`Room - Photo ${(roomImageIndices[globalIndex] || 0) + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Image Navigation - Only show if more than 1 photo */}
                        {offer.room.media.length > 1 && (
                          <>
                            {/* Previous Button - Always visible on mobile */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                previousRoomImage(globalIndex, offer.room.media.length);
                              }}
                              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>

                            {/* Next Button - Always visible on mobile */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nextRoomImage(globalIndex, offer.room.media.length);
                              }}
                              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>

                            {/* Image Counter */}
                            <div className="absolute bottom-2 right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/70 text-white rounded text-[9px] sm:text-[10px] font-semibold">
                              {(roomImageIndices[globalIndex] || 0) + 1} / {offer.room.media.length}
                            </div>
                          </>
                        )}

                        {/* Badges Overlay */}
                        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                          {offer.room?.typeEstimated?.category && (
                            <div className="px-2 py-1 bg-gray-900 text-white rounded text-[10px] font-semibold">
                              {offer.room.typeEstimated.category.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </div>
                          )}

                          {offer.policies?.cancellation?.type === 'FULL_REFUND' && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-[10px] font-semibold">
                              <Check className="w-3 h-3" />
                              <span>Free Cancellation</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Room Details */}
                    <div className="flex-1 flex flex-col lg:flex-row">
                      {/* Left: Room Info */}
                      <div className="flex-1 p-3 lg:p-4">
                        {/* Room Description */}
                        {offer.room?.description?.text && (
                          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                            {offer.room.description.text.toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase())}
                          </p>
                        )}

                        {/* Room Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {offer.room?.typeEstimated && (
                            <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-gray-50 rounded border border-gray-200">
                              <Bed className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-[10px] text-gray-600">Bed Type</div>
                                <div className="text-xs font-semibold text-gray-900 truncate">
                                  {offer.room.typeEstimated.beds} {offer.room.typeEstimated.bedType}
                                </div>
                              </div>
                            </div>
                          )}

                          {offer.guests && (
                            <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-gray-50 rounded border border-gray-200">
                              <Users className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-[10px] text-gray-600">Capacity</div>
                                <div className="text-xs font-semibold text-gray-900 truncate">
                                  Up to {offer.guests.adults} adults
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Room Facilities */}
                        {offer.room?.description?.facilities && offer.room.description.facilities.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-semibold text-gray-900 mb-2">Room Features</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {offer.room.description.facilities.slice(0, 8).map((facility: string, idx: number) => {
                                const Icon = getAmenityIcon(facility);
                                return (
                                  <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[9px] sm:text-[10px] text-gray-700">
                                    <Icon className="w-3 h-3 text-gray-600 flex-shrink-0" />
                                    <span className="capitalize whitespace-nowrap">{facility.toLowerCase().replace(/_/g, ' ')}</span>
                                  </div>
                                );
                              })}
                              {offer.room.description.facilities.length > 8 && (
                                <div className="flex items-center px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[9px] sm:text-[10px] text-gray-600 font-medium">
                                  +{offer.room.description.facilities.length - 8} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Policies */}
                        <div className="flex flex-wrap gap-2">
                          {/* Cancellation Policy - Color coded */}
                          {(() => {
                            const cancellationType = offer.policies?.cancellation?.type;
                            const hasTimeline = offer.policies?.cancellation?.timeline &&
                                                offer.policies.cancellation.timeline.length > 0;
                            const isRefundable = cancellationType === 'FULL_REFUND' || hasTimeline;

                            if (isRefundable) {
                              return (
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 rounded text-[10px] font-semibold text-green-700">
                                  <Shield className="w-3 h-3 text-green-600" />
                                  <span>Free Cancellation</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-semibold text-gray-700">
                                  <X className="w-3 h-3 text-gray-600" />
                                  <span>Non-Refundable</span>
                                </div>
                              );
                            }
                          })()}
                          {(() => {
                            // Parse description for breakfast/meal keywords
                            const description = (offer.room?.description?.text || '').toLowerCase();
                            const hasBreakfast = description.includes('breakfast') ||
                                               description.includes('morning meal') ||
                                               description.includes('continental breakfast') ||
                                               description.includes('buffet breakfast');
                            const hasHalfBoard = description.includes('half board') || description.includes('half-board');
                            const hasFullBoard = description.includes('full board') || description.includes('full-board');
                            const hasAllInclusive = description.includes('all inclusive') || description.includes('all-inclusive');

                            if (hasAllInclusive) {
                              return (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-700">
                                  <Coffee className="w-3 h-3 text-gray-600" />
                                  <span>All Inclusive</span>
                                </div>
                              );
                            }
                            if (hasFullBoard) {
                              return (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-700">
                                  <Coffee className="w-3 h-3 text-gray-600" />
                                  <span>Full Board</span>
                                </div>
                              );
                            }
                            if (hasHalfBoard) {
                              return (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-700">
                                  <Coffee className="w-3 h-3 text-gray-600" />
                                  <span>Half Board</span>
                                </div>
                              );
                            }
                            if (hasBreakfast) {
                              return (
                                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-700">
                                  <Coffee className="w-3 h-3 text-gray-600" />
                                  <span>Breakfast Included</span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-700">
                            <Zap className="w-3 h-3 text-gray-600" />
                            <span>Instant Confirmation</span>
                          </div>
                          {offer.policies?.paymentType && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-700">
                              <CreditCard className="w-3 h-3 text-gray-600" />
                              <span className="capitalize">{offer.policies.paymentType.toLowerCase()}</span>
                            </div>
                          )}
                          {/* Availability badge */}
                          {offer.quantityAvailable !== undefined && offer.quantityAvailable > 0 && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${
                              offer.quantityAvailable <= 3
                                ? 'bg-orange-50 border border-orange-200 text-orange-700'
                                : 'bg-blue-50 border border-blue-200 text-blue-700'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>
                                {offer.quantityAvailable === 1
                                  ? 'Only 1 room left!'
                                  : offer.quantityAvailable <= 3
                                    ? `Only ${offer.quantityAvailable} rooms left!`
                                    : `${offer.quantityAvailable} rooms available`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Pricing Card */}
                      <div className="lg:w-64 flex flex-col justify-between p-3 lg:p-4 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200">
                        <div>
                          <div className="mb-3">
                            <div className="text-[10px] font-semibold text-gray-600 mb-1">
                              Total for {calculateNights()} {calculateNights() === 1 ? 'Night' : 'Nights'}
                            </div>
                            <div className="flex items-baseline gap-1 mb-1">
                              <span className="text-xl font-bold text-gray-900">
                                ${parseFloat(offer.price.total).toLocaleString('en-US', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                              <span className="text-xs text-gray-600">
                                {offer.price.currency}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-600">
                              ${(parseFloat(offer.price.total) / calculateNights()).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })} per night
                            </div>
                          </div>

                          {/* Price Breakdown */}
                          <div className="p-2 bg-white rounded border border-gray-200 mb-3">
                            <div className="flex justify-between text-[10px] text-gray-700 mb-1">
                              <span>Room rate</span>
                              <span className="font-semibold">${parseFloat(offer.price.base).toLocaleString()}</span>
                            </div>
                            {offer.price.taxes && (
                              <div className="flex justify-between text-[10px] text-gray-700 pb-1 mb-1 border-b border-gray-200">
                                <span>Taxes & fees</span>
                                <span className="font-semibold">${(parseFloat(offer.price.total) - parseFloat(offer.price.base)).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-bold text-gray-900">
                              <span>Total</span>
                              <span>${parseFloat(offer.price.total).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Book Button */}
                        <button
                          onClick={() => handleReserveRoom(offer)}
                          className="w-full py-2 bg-gray-900 text-white rounded font-semibold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Reserve Room</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <p className="text-[10px] text-center text-gray-600 mt-2">
                          No payment needed today
                        </p>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
              <div className="max-w-md mx-auto">
                <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900 mb-2">No rooms available</h3>
                <p className="text-xs text-gray-600 mb-4">
                  There are no available rooms for the selected dates. Please try different dates or search for another property.
                </p>
                <button
                  onClick={() => {
                    const newCheckIn = new Date();
                    newCheckIn.setDate(newCheckIn.getDate() + 1);
                    const newCheckOut = new Date();
                    newCheckOut.setDate(newCheckOut.getDate() + 2);
                    setSearchCheckIn(newCheckIn.toISOString().split('T')[0]);
                    setSearchCheckOut(newCheckOut.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-1 text-xs"
                >
                  <Calendar className="w-3 h-3" />
                  Try Different Dates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar - Only show when offers exist */}
      {offers.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-gray-900">
                  ${parseFloat(offers[0].price.total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-gray-600">total</span>
              </div>
              <p className="text-[10px] text-gray-600">
                ${(parseFloat(offers[0].price.total) / calculateNights()).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / night
              </p>
            </div>
            <button
              onClick={() => {
                window.scrollTo({ top: document.querySelector('.available-rooms')?.getBoundingClientRect().top || 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1 text-xs"
            >
              <span>View Rooms</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* AI Chatbox */}
      <AIChatbox />

      {/* Payment Summary Modal */}
      <PaymentSummaryModal
        isOpen={showPaymentSummary}
        onClose={() => setShowPaymentSummary(false)}
        onContinue={handleContinueToGuestDetails}
        selectedOffer={selectedOffer}
        hotelName={hotelOffers?.hotel?.name || ''}
        roomType={selectedOffer?.room?.type || selectedOffer?.room?.name || 'Room'}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        numberOfNights={(() => {
          if (checkInDate && checkOutDate) {
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
          }
          return 1;
        })()}
        adults={adults}
        rooms={rooms}
        currency={selectedOffer?.price?.currency || 'USD'}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        userCredits={userCredits}
        userRole={userRole}
      />

      {/* Passenger Details Modal */}
      <PassengerDetailsModal
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        numberOfTravelers={adults}
        bookingType="hotel"
        onSubmit={handlePassengerDetailsSubmit}
        totalPrice={selectedOffer ? parseFloat(selectedOffer.price.total) * rooms : 0}
        currency={selectedOffer?.price.currency || 'USD'}
        paymentMethod={paymentMethod}
        numberOfRooms={rooms}
        availableOffers={hotelOffers?.offers || []}
        onMultiRoomSubmit={async (multiRoomData) => {
          try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
              alert('Please log in to make a booking');
              router.push('/login');
              return;
            }

            const hotel = hotelOffers.hotel;

            // STEP 1: Create quote from first room's rate ID BEFORE booking
            // For multi-room bookings, we use the first room's rate to create the quote
            const primaryRateId = multiRoomData.rooms[0]?.offerId;
            console.log('Creating quote for multi-room booking, primary rate:', primaryRateId);
            let quoteId: string | null = null;
            try {
              const quoteResponse = await fetch(getApiEndpoint(`hotels/quotes`), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  rateId: primaryRateId,
                }),
              });

              if (!quoteResponse.ok) {
                const quoteError = await quoteResponse.json();
                throw new Error(quoteError.message || 'Failed to create quote. Rates may have expired.');
              }

              const quoteData = await quoteResponse.json();
              quoteId = quoteData.data.id;
              console.log('✅ Multi-room quote created:', quoteId);
            } catch (quoteError: any) {
              console.error('Multi-room quote creation failed:', quoteError);
              alert(quoteError.message || 'These hotel rooms are no longer available. Please search again for fresh availability.');
              return;
            }

            // STEP 2: Collect all passengers from all rooms
            const allPassengers = multiRoomData.rooms.flatMap(room => room.guests);

            // STEP 3: Create booking with quoteId
            const bookingData = {
              bookingType: 'hotel',
              isGroupBooking: multiRoomData.isGroupBooking,
              numberOfTravelers: multiRoomData.totalGuests,
              groupName: multiRoomData.groupName,

              // Provider details - CRITICAL for Duffel Stays booking creation
              provider: 'duffel',
              providerName: 'Duffel Stays',
              providerBookingReference: multiRoomData.rooms[0]?.offerId, // Rate ID from first room

              // Payment method
              paymentMethod,

              // Instant confirmation flag (for hotels)
              isInstantConfirmation: multiRoomData.rooms[0]?.offerDetails?.instantConfirmation !== false,

              // Store selected offer data for webhook processing
              bookingData: {
                rooms: multiRoomData.rooms.map(room => ({
                  ...room.offerDetails,
                  rateId: room.offerId,
                })),
                rateId: multiRoomData.rooms[0]?.offerId, // Primary rate ID
                quoteId: quoteId, // 🔥 CRITICAL FIX: Store quoteId for webhook to use
              },

              // Trip details
              destination: hotel.address?.cityName || hotel.name,
              departureDate: checkInDate,
              returnDate: checkOutDate,
              passengers: multiRoomData.totalGuests,
              passengerDetails: allPassengers,

              // Pricing
              basePrice: multiRoomData.rooms.reduce((sum, room) => sum + (parseFloat(room.offerDetails?.price?.base || '0')), 0),
              taxesFees: multiRoomData.rooms.reduce((sum, room) => {
                const total = parseFloat(room.offerDetails?.price?.total || '0');
                const base = parseFloat(room.offerDetails?.price?.base || '0');
                return sum + (total - base);
              }, 0),
              totalPrice: multiRoomData.totalPrice,
              currency: multiRoomData.rooms[0]?.offerDetails?.price?.currency || 'USD',

              // Hotel specific details for multi-room
              hotelDetails: {
                hotelId: hotel.hotelId,
                hotelName: hotel.name,
                checkInDate: new Date(checkInDate).toISOString(),
                checkOutDate: new Date(checkOutDate).toISOString(),
                numberOfNights: calculateNights(),
                numberOfRooms: multiRoomData.rooms.length,
                isMultiRoom: true,
                rooms: multiRoomData.rooms,

                // Keep backward compatibility fields from first room
                roomType: multiRoomData.rooms[0]?.offerDetails?.room?.typeEstimated?.category || 'STANDARD',
                bedType: multiRoomData.rooms[0]?.offerDetails?.room?.typeEstimated?.bedType || 'DOUBLE',
                guestsPerRoom: multiRoomData.rooms[0]?.guests?.length || adults,
                roomDescription: multiRoomData.rooms[0]?.offerDetails?.room?.description?.text || '',
                amenities: multiRoomData.rooms[0]?.offerDetails?.room?.description?.facilities || [],
                mealPlan: multiRoomData.rooms[0]?.offerDetails?.boardType || 'ROOM_ONLY',
                cancellationPolicy: multiRoomData.rooms[0]?.offerDetails?.policies?.cancellation?.type || 'NON_REFUNDABLE',
                address: hotel.address?.lines?.join(', ') || hotel.address?.cityName || 'N/A',
                city: hotel.address?.cityName || hotel.name || 'Unknown',
                country: hotel.address?.countryCode || hotel.address?.cityName || 'Unknown',
                photoUrl: hotel.media && hotel.media.length > 0 ? (hotel.media[0].uri || hotel.media[0].url) : null,
              },
            };

            console.log('Submitting multi-room booking:', bookingData);

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

              // Check if there's a checkout URL (indicates card payment via Stripe)
              if (result.checkoutUrl) {
                // Redirect to Stripe checkout
                console.log('Redirecting to Stripe:', result.checkoutUrl);
                window.location.href = result.checkoutUrl;
                return;
              }

              // For credit payments, show success modal
              setShowPassengerModal(false);
              setBookingResult({
                ...result.data,
                numberOfRooms: multiRoomData.rooms.length,
              });
              setShowSuccessModal(true);
            } else {
              const error = await response.json();
              alert(error.message || 'Failed to create multi-room booking');
            }
          } catch (error) {
            console.error('Multi-room booking error:', error);
            alert('Failed to create multi-room booking. Please try again.');
          }
        }}
        bookingDetails={{
          hotelName: hotel?.name || 'Hotel',
          roomType: selectedOffer?.room?.typeEstimated?.category
            ? `${selectedOffer.room.typeEstimated.category.toLowerCase().replace(/_/g, ' ')} ${selectedOffer.room.typeEstimated.bedType ? selectedOffer.room.typeEstimated.bedType.toLowerCase() : ''} Room`
            : 'Standard Room',
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          numberOfNights: calculateNights(),
        }}
      />

      {/* Success Modal */}
      <BookingSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/dashboard/bookings');
        }}
        bookingDetails={{
          confirmationNumber: bookingResult?.confirmationNumber,
          numberOfRooms: bookingResult?.numberOfRooms || rooms,
          hotelName: hotel?.name,
        }}
        bookingType="hotel"
        tripDetails={{
          destination: city || hotel?.address?.cityName || hotel?.name,
          checkInDate: searchCheckIn,
          checkOutDate: searchCheckOut,
        }}
      />

      {/* Business Information Footer */}
      <BusinessFooter />
    </div>
  );
}
