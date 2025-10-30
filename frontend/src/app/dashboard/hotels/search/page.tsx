'use client';

import { useState, lazy, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCityCode } from '@/utils/cityMapping';
import CityAutocomplete from '@/components/CityAutocomplete';
import FancyLoader from '@/components/FancyLoader';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';

// Lazy load the map component
const HotelMap = lazy(() => import('@/components/HotelMap'));
import {
  Building2,
  Calendar,
  Users,
  Search,
  MapPin,
  ArrowLeft,
  Star,
  Wifi,
  Coffee,
  Utensils,
  Car,
  Dumbbell,
  Waves,
  Grid3x3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Plane,
  Clock,
  TrendingUp,
  Sparkles,
  History,
  Map,
  Maximize2,
  Minimize2,
  ChevronRight,
} from 'lucide-react';
import AIChatbox from '@/components/AIChatbox';

/**
 * Adapter function to transform backend response to match UI expectations
 *
 * Backend already transforms Duffel data and returns:
 * {
 *   searchResultId: string,
 *   hotel: { hotelId, name, media, amenities, location, address, rating, distance },
 *   price: { total, currency, base, public },
 *   offers: []
 * }
 *
 * This adapter ensures searchResultId is used consistently for navigation
 */
const adaptDuffelStaysData = (backendData: any) => {
  // Backend already transforms the data, so we mostly pass it through
  // Just ensure searchResultId is properly set for navigation
  return {
    searchResultId: backendData.searchResultId, // For fetching rates on detail page
    hotel: {
      ...backendData.hotel,
      hotelId: backendData.searchResultId || backendData.hotel?.hotelId, // Use searchResultId for navigation
    },
    price: backendData.price?.total || '0',
    currency: backendData.price?.currency || 'USD',
    rating: backendData.hotel?.rating || 0,
    offers: backendData.offers || [],
    deals: backendData.deals,
    isRefundable: backendData.isRefundable,
  };
};

export default function HotelSearchPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState({
    name: 'User',
    role: 'traveler',
    email: '',
    organization: '',
  });
  const [address, setAddress] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [roomQuantity, setRoomQuantity] = useState(1);
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'distance' | 'price'>('recommended');
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [isFullMapView, setIsFullMapView] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(0); // 0 means no filter
  const [currentLimit, setCurrentLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [loadingCardIndex, setLoadingCardIndex] = useState<number | null>(null);
  const [viewedHotels, setViewedHotels] = useState<any[]>([]);
  const [userPolicy, setUserPolicy] = useState<any>(undefined); // undefined = loading, null = no policy, object = has policy
  const [policyLimit, setPolicyLimit] = useState<number | null>(null);

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

    // Load viewed hotels from localStorage
    const viewedHotelsData = localStorage.getItem('viewedHotels');
    if (viewedHotelsData) {
      try {
        const parsed = JSON.parse(viewedHotelsData);
        setViewedHotels(parsed);
      } catch (error) {
        console.error('Error parsing viewed hotels:', error);
      }
    }
  }, []);

  // Fetch user's policy and apply hotel limits
  useEffect(() => {
    const fetchUserPolicy = async () => {
      try {
        const token = localStorage.getItem('accessToken'); // Fixed: Use 'accessToken' not 'token'
        console.log('[Policy] Fetching policy, token exists:', !!token);
        if (!token) return;

        console.log('[Policy] Making API request to /api/v1/policies/my-policy');
        const response = await fetch(getApiEndpoint('/policies/my-policy'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('[Policy] Response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('[Policy] API response:', result);

          const policy = result.data; // Extract data from response

          // If no policy assigned to user, show all hotels
          if (!policy) {
            console.log('[Policy] No policy assigned to user - showing ALL hotels (no filtering)');
            setUserPolicy(null);
            setPolicyLimit(null);
            // maxPrice stays at 0, meaning no filter
            return;
          }

          setUserPolicy(policy);

          // Apply hotel max amount per night as the default filter
          if (policy.hotelMaxAmountPerNight) {
            const limit = parseFloat(policy.hotelMaxAmountPerNight);
            setPolicyLimit(limit);
            console.log('[Policy] Policy limit found:', limit);

            // Only set maxPrice if it's not already set from URL params
            if (maxPrice === 0) {
              setMaxPrice(limit);
              console.log('[Policy] Applied hotel limit - filtering enabled:', limit);
            }
          } else {
            console.log('[Policy] Policy has no hotel limit - showing ALL hotels (no filtering)');
            setPolicyLimit(null);
            // Keep maxPrice at 0 to show all hotels
          }
        } else {
          console.log('[Policy] API request failed with status:', response.status);
          console.log('[Policy] Showing ALL hotels (no filtering)');
        }
      } catch (error) {
        console.error('[Policy] Error fetching user policy:', error);
      }
    };

    fetchUserPolicy();
  }, [user.email]); // Run when user email is available

  // Save viewed hotel to localStorage
  const saveViewedHotel = (hotel: any) => {
    const hotelData = {
      id: hotel.hotel?.hotelId || hotel.searchResultId,
      name: hotel.hotel?.name || 'Hotel',
      city: hotel.hotel?.address?.city_name || address,
      image: hotel.hotel?.media?.[0]?.url || hotel.hotel?.media?.[0]?.uri || '',
      price: hotel.offers?.[0]?.price?.total || '0',
      currency: hotel.offers?.[0]?.price?.currency || 'USD',
      rating: hotel.hotel?.rating || 0,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults: adults,
      rooms: roomQuantity,
      viewedAt: new Date().toISOString(),
    };

    // Get existing viewed hotels
    const existing = JSON.parse(localStorage.getItem('viewedHotels') || '[]');

    // Remove if already exists (to update position)
    const filtered = existing.filter((h: any) => h.id !== hotelData.id);

    // Add to beginning (most recent first)
    const updated = [hotelData, ...filtered].slice(0, 6); // Keep only last 6

    // Save to localStorage
    localStorage.setItem('viewedHotels', JSON.stringify(updated));
    setViewedHotels(updated);
  };

  // Remove viewed hotel
  const removeViewedHotel = (hotelId: string) => {
    const existing = JSON.parse(localStorage.getItem('viewedHotels') || '[]');
    const filtered = existing.filter((h: any) => h.id !== hotelId);
    localStorage.setItem('viewedHotels', JSON.stringify(filtered));
    setViewedHotels(filtered);
  };

  // Read URL params and trigger search on mount
  useEffect(() => {
    const location = searchParams.get('location');
    const checkIn = searchParams.get('checkInDate');
    const checkOut = searchParams.get('checkOutDate');
    const adultsParam = searchParams.get('adults');
    const maxPriceParam = searchParams.get('maxPrice');
    const minRatingParam = searchParams.get('minRating');

    console.log('[Hotels Search] URL params:', { location, checkIn, checkOut, adultsParam, maxPriceParam, minRatingParam });

    if (location && checkIn && checkOut) {
      console.log('[Hotels Search] Triggering automatic search...');
      // Set form values from URL params
      setAddress(location);
      setCheckInDate(checkIn);
      setCheckOutDate(checkOut);
      if (adultsParam) {
        setAdults(parseInt(adultsParam));
      }
      if (maxPriceParam) {
        setMaxPrice(parseInt(maxPriceParam));
      }
      if (minRatingParam) {
        setMinRating(parseFloat(minRatingParam));
      }

      // Trigger search automatically
      performSearch(location, checkIn, checkOut, parseInt(adultsParam || '1'), parseInt(maxPriceParam || '0'), parseFloat(minRatingParam || '0'));
    } else {
      console.log('[Hotels Search] Missing required params, skipping auto-search');
    }
  }, [searchParams]);

  const performSearch = async (location: string, checkIn: string, checkOut: string, adultsCount: number, maxPriceFilter: number, minRatingFilter: number) => {
    console.log('[Hotels Search] performSearch called with:', { location, checkIn, checkOut, adultsCount, maxPriceFilter, minRatingFilter });
    setLoading(true);
    setError('');
    setCurrentLimit(20); // Reset limit on new search

    try {
      const cityCode = getCityCode(location);
      console.log('[Hotels Search] getCityCode result:', { location, cityCode });

      if (!cityCode) {
        throw new Error(`Invalid city name: ${location}`);
      }

      const params = new URLSearchParams({
        cityCode,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: adultsCount.toString(),
        radius: radius.toString(),
        radiusUnit: 'KM',
        roomQuantity: roomQuantity.toString(),
        limit: '20', // Always start with 20
        provider: 'duffel', // Use Duffel Stays API
      });

      console.log('[Hotels Search] Fetching with params:', params.toString());
      const response = await fetch(`${getApiEndpoint('hotels/search')}?${params}`);
      const data = await response.json();
      console.log('[Hotels Search] API response:', data);

      if (data.success) {
        // Debug: Check first hotel structure from backend
        if (data.data && data.data.length > 0) {
          console.log('[Hotels Search] First hotel from backend:', data.data[0]);
          console.log('[Hotels Search] searchResultId:', data.data[0].searchResultId);
          console.log('[Hotels Search] hotel.hotelId:', data.data[0].hotel?.hotelId);
        }

        // Adapt Duffel Stays data to UI format
        let adaptedHotels = data.data.map(adaptDuffelStaysData);

        // Debug: Check first adapted hotel
        if (adaptedHotels.length > 0) {
          console.log('[Hotels Search] First adapted hotel:', adaptedHotels[0]);
          console.log('[Hotels Search] Adapted searchResultId:', adaptedHotels[0].searchResultId);
          console.log('[Hotels Search] Adapted hotel.hotelId:', adaptedHotels[0].hotel?.hotelId);
        }
        console.log('[Hotels Search] Before filtering:', adaptedHotels.length, 'hotels');

        // Check if we got fewer hotels than requested (means no more available)
        setHasMore(adaptedHotels.length >= 20);

        // Debug: Check first hotel structure
        if (adaptedHotels.length > 0) {
          console.log('[Hotels Search] Sample adapted hotel data:', adaptedHotels[0]);
        }

        // Apply filters - but don't filter by rating when coming from AI chat
        // The AI already filtered results, so we just show what it found
        if (minRatingFilter > 0 && !searchParams.get('fromAI')) {
          adaptedHotels = adaptedHotels.filter((hotel: any) => {
            const hotelRating = parseFloat(hotel.rating) || 0;
            return hotelRating >= minRatingFilter;
          });
          console.log('[Hotels Search] After rating filter:', adaptedHotels.length, 'hotels');
        }
        if (maxPriceFilter > 0 && !searchParams.get('fromAI')) {
          adaptedHotels = adaptedHotels.filter((hotel: any) => parseFloat(hotel.price) <= maxPriceFilter);
          console.log('[Hotels Search] After price filter:', adaptedHotels.length, 'hotels');
        }

        console.log('[Hotels Search] Setting hotels state with', adaptedHotels.length, 'hotels');
        setHotels(adaptedHotels);
      } else {
        setError(data.message || 'Failed to search hotels');
      }
    } catch (err: any) {
      console.error('[Hotels Search] Error:', err);
      setError(err.message || 'An error occurred while searching hotels');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for past bookings
  const pastBookings = [
    {
      city: 'Dubai',
      cityCode: 'DXB',
      hotel: 'Sofitel Dubai Jumeirah Beach',
      date: 'Oct 15, 2025',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&auto=format&fit=crop',
    },
    {
      city: 'Lagos',
      cityCode: 'LOS',
      hotel: 'The Lagos Continental Hotel',
      date: 'Sep 28, 2025',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop',
    },
  ];

  // Popular destinations with attractive images
  const popularDestinations = [
    {
      city: 'Dubai',
      cityCode: 'DXB',
      description: 'Luxury & Business',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&auto=format&fit=crop',
      hotels: '467 hotels',
    },
    {
      city: 'New York',
      cityCode: 'NYC',
      description: 'Business Capital',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&auto=format&fit=crop',
      hotels: '566 hotels',
    },
    {
      city: 'London',
      cityCode: 'LON',
      description: 'European Hub',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&auto=format&fit=crop',
      hotels: '420 hotels',
    },
    {
      city: 'Singapore',
      cityCode: 'SIN',
      description: 'Asia Gateway',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&auto=format&fit=crop',
      hotels: '380 hotels',
    },
  ];

  // Quick search handler for destination cards
  const handleQuickSearch = async (cityName: string, cardIndex: number) => {
    // Set form values
    setAddress(cityName);
    // Set default dates (tomorrow to day after)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const checkIn = tomorrow.toISOString().split('T')[0];
    const checkOut = dayAfter.toISOString().split('T')[0];

    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    setAdults(1);
    setRoomQuantity(1);

    // Automatically trigger search
    setLoading(true);
    setLoadingCardIndex(cardIndex);
    setError('');
    setCurrentLimit(20);
    setShowSearchForm(false);

    try {
      // Try to get city code first for known cities
      const cityCode = getCityCode(cityName);

      const params = new URLSearchParams({
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: '1',
        roomQuantity: '1',
        radius: '5',
        radiusUnit: 'KM',
        currency: 'USD',
        limit: '20',
        provider: 'duffel', // Use Duffel Stays API
      });

      // If we have a valid city code from our map, use it; otherwise use full address for geocoding
      if (cityCode) {
        params.append('cityCode', cityCode);
      } else {
        // Use full address - backend will geocode it (neighborhoods, landmarks, etc.)
        params.append('address', cityName);
      }

      const response = await fetch(`${getApiEndpoint('hotels/search')}?${params}`);
      const data = await response.json();

      if (data.success) {
        // Adapt Duffel Stays data to UI format
        const adaptedHotels = data.data.map(adaptDuffelStaysData);
        setHotels(adaptedHotels);
        setHasMore(adaptedHotels.length >= 20);

        // Scroll to results
        setTimeout(() => {
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }, 100);
      } else {
        setError(data.message || 'Failed to search hotels');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      setLoadingCardIndex(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCurrentLimit(20); // Reset limit on new search
    setShowSearchForm(false); // Close modal on mobile after search

    try {
      if (!address.trim()) {
        setError('Please enter a location');
        setLoading(false);
        return;
      }

      // Try to get city code first for known cities
      const cityCode = getCityCode(address);

      const params = new URLSearchParams({
        checkInDate,
        checkOutDate,
        adults: adults.toString(),
        roomQuantity: roomQuantity.toString(),
        radius: radius.toString(),
        radiusUnit: 'KM',
        currency: 'USD',
        limit: '20', // Always start with 20
        provider: 'duffel', // Use Duffel Stays API
      });

      // If we have a valid city code from our map, use it; otherwise use full address for geocoding
      if (cityCode) {
        params.append('cityCode', cityCode);
      } else {
        // Use full address - backend will geocode it (neighborhoods, landmarks, etc.)
        params.append('address', address);
      }

      const response = await fetch(`${getApiEndpoint('hotels/search')}?${params}`);
      const data = await response.json();

      if (data.success) {
        // Adapt Duffel Stays data to UI format
        const adaptedHotels = data.data.map(adaptDuffelStaysData);
        setHotels(adaptedHotels);
        setHasMore(adaptedHotels.length >= 20);
      } else {
        setError(data.message || 'Failed to search hotels');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const cityCode = getCityCode(address);
      const newLimit = currentLimit + 20;

      const params = new URLSearchParams({
        checkInDate,
        checkOutDate,
        adults: adults.toString(),
        roomQuantity: roomQuantity.toString(),
        radius: radius.toString(),
        radiusUnit: 'KM',
        currency: 'USD',
        limit: newLimit.toString(),
        provider: 'duffel', // Use Duffel Stays API
      });

      if (cityCode) {
        params.append('cityCode', cityCode);
      } else {
        params.append('address', address);
      }

      const response = await fetch(`${getApiEndpoint('hotels/search')}?${params}`);
      const data = await response.json();

      if (data.success) {
        setHotels(data.data);
        setCurrentLimit(newLimit);
        setHasMore(data.data.length >= newLimit);
      } else {
        setError(data.message || 'Failed to load more hotels');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading more hotels');
    } finally {
      setLoadingMore(false);
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
    const amenityMap: { [key: string]: any} = {
      WIFI: Wifi,
      RESTAURANT: Utensils,
      PARKING: Car,
      FITNESS: Dumbbell,
      POOL: Waves,
      BREAKFAST: Coffee,
    };
    return amenityMap[amenityCode] || Coffee;
  };

  // Format hotel address - show full address
  const formatHotelAddress = (hotel: any) => {
    const addr = hotel.hotel?.address;

    // Debug: log address data for first hotel
    if (hotels.indexOf(hotel) === 0) {
      console.log('[Address Debug] Full address object:', addr);
      console.log('[Address Debug] Available fields:', {
        line_one: addr?.line_one,
        line_two: addr?.line_two,
        city_name: addr?.city_name,
        region: addr?.region,
        postal_code: addr?.postal_code,
        country_code: addr?.country_code,
      });
    }

    if (!addr) return address;

    // Build full address with all available parts
    const parts = [];

    if (addr.line_one) parts.push(addr.line_one);
    if (addr.line_two) parts.push(addr.line_two);
    if (addr.city_name) parts.push(addr.city_name);
    if (addr.region) parts.push(addr.region);
    if (addr.postal_code) parts.push(addr.postal_code);
    if (addr.country_code) parts.push(addr.country_code);

    // Return full address or fallback
    return parts.length > 0 ? parts.join(', ') : address;
  };

  // Get distance display
  const getDistanceDisplay = (hotel: any) => {
    if (hotel.hotel?.distance) {
      const distance = hotel.hotel.distance.value;
      const unit = hotel.hotel.distance.unit === 'KM' ? 'km' : 'mi';
      return `${distance.toFixed(1)} ${unit} away`;
    }
    return null;
  };

  // Get placeholder image for hotels without photos
  const getPlaceholderImage = (index: number) => {
    const images = [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&auto=format&fit=crop',
    ];
    return images[index % images.length];
  };

  // Helper to get price from hotel offer
  const getHotelPrice = (hotel: any): number => {
    if (hotel.offers && hotel.offers.length > 0) {
      return parseFloat(hotel.offers[0].price?.total || hotel.offers[0].price?.base || '0');
    }
    return 0;
  };

  // Format price with thousand separators
  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Filter and sort hotels
  const getFilteredAndSortedHotels = () => {
    let filtered = [...hotels];

    // Don't apply UI filters if this came from AI chat (AI already filtered)
    const fromAI = searchParams.get('fromAI');

    // Filter by minimum rating
    if (minRating > 0 && !fromAI) {
      filtered = filtered.filter(hotel => {
        const rating = hotel.hotel?.rating || 0;
        console.log('[Hotels Filter] Hotel rating check:', { name: hotel.hotel?.name, rating, minRating });
        return rating >= minRating;
      });
    }

    // Filter by maximum price
    if (maxPrice > 0 && !fromAI) {
      filtered = filtered.filter(hotel => {
        const price = getHotelPrice(hotel);
        return price > 0 && price <= maxPrice;
      });
    }

    // Sort hotels
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          const ratingA = a.hotel?.rating || 0;
          const ratingB = b.hotel?.rating || 0;
          return ratingB - ratingA;
        case 'distance':
          const distA = a.hotel?.distance?.value || 999;
          const distB = b.hotel?.distance?.value || 999;
          return distA - distB;
        case 'price':
          const priceA = getHotelPrice(a);
          const priceB = getHotelPrice(b);
          // Show hotels with prices first, then sort by price
          if (priceA === 0 && priceB === 0) return 0;
          if (priceA === 0) return 1;
          if (priceB === 0) return -1;
          return priceA - priceB;
        case 'recommended':
        default:
          return 0;
      }
    });

    console.log('[Hotels Filter] Final filtered count:', filtered.length, 'out of', hotels.length);
    return filtered;
  };

  const filteredHotels = getFilteredAndSortedHotels();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <UnifiedNavBar showBackButton={false} backButtonHref="/dashboard" backButtonLabel="Back to Dashboard" user={user} />

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {/* Search Type Toggle */}
        <div className="flex gap-2 mb-4">
          <Link
            href="/dashboard/flights/search"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          >
            <div className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" />
              <span>Flights</span>
            </div>
          </Link>
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Hotels</span>
            </div>
          </div>
        </div>

        {/* Page Header - SIMPLIFIED FOR MOBILE */}
        <div className="mb-4 md:mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-xl lg:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
              Search Hotels
            </h1>
            <p className="text-sm md:text-xs text-gray-600 hidden md:block">Find the perfect accommodation for your business trip</p>
          </div>

          {/* Policy Limit Badge - Top Right */}
          {policyLimit ? (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-gray-500">Your Policy Limit</span>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-lg font-bold text-blue-700">${policyLimit}</span>
                <span className="text-xs text-blue-600">per night</span>
              </div>
            </div>
          ) : userPolicy === null && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-gray-500">Booking Policy</span>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs text-gray-600">No limit - All hotels available</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Form - Desktop only, always hidden on mobile */}
        <div className="hidden md:block relative mb-6 md:mb-8">
          <form onSubmit={handleSearch} className="relative bg-white rounded-lg p-3 md:p-4 lg:p-5 border border-gray-200">
            {/* Location and Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 mb-4 md:mb-6">
              {/* Address/City */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 md:mb-2">Location</label>
                <CityAutocomplete
                  value={address}
                  onChange={setAddress}
                  placeholder="City or address"
                  required
                  className="py-2.5 md:py-3 text-sm border hover:border-gray-300"
                />
                <p className="text-[10px] text-gray-500 mt-1">City name or detailed address</p>
              </div>

              {/* Check-in Date */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 md:mb-2">Check-in</label>
                <div className="relative">
                  <Calendar className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 text-sm text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none hover:border-gray-300 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Check-out Date */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 md:mb-2">Check-out</label>
                <div className="relative">
                  <Calendar className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 text-sm text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none hover:border-gray-300 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Nights Display */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 md:mb-2">Duration</label>
                <div className="flex items-center h-[42px] md:h-[50px] px-3 md:px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-lg md:text-xl font-bold text-gray-900">{calculateNights()}</span>
                  <span className="ml-2 text-xs text-gray-600">
                    {calculateNights() === 1 ? 'night' : 'nights'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guests and Rooms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              {/* Adults */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 md:mb-2">Adults</label>
                <div className="relative">
                  <Users className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={9}
                    required
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none hover:border-gray-300 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Rooms */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 md:mb-2">Rooms</label>
                <div className="relative">
                  <Building2 className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={roomQuantity}
                    onChange={(e) => setRoomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={9}
                    required
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none hover:border-gray-300 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Search Radius */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 md:mb-2">
                  Radius (km)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Math.max(1, parseInt(e.target.value) || 5))}
                    min={1}
                    max={300}
                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none hover:border-gray-300 min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 md:py-4 text-base md:text-sm bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all hover:bg-gray-800"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Hotels
                </>
              )}
            </button>
          </form>
        </div>

        {/* Mobile Search Button - Shows on mobile when no results yet */}
        {!hotels.length && (
          <button
            onClick={() => setShowSearchForm(true)}
            className="md:hidden relative w-full mb-6 py-5 px-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl font-bold flex items-center justify-between gap-3 shadow-xl hover:shadow-2xl active:scale-[0.97] transition-all duration-300 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ADF802]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-base">Start Your Hotel Search</span>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
          </button>
        )}

        {/* Loading Indicator - Visible on all screen sizes */}
        {loading && (
          <div className="mb-8">
            <FancyLoader message="Searching for hotels..." />
          </div>
        )}

        {/* Recent Bookings */}
        {!hotels.length && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-gray-900 rounded-full"></div>
              <History className="w-4 h-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Bookings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastBookings.map((booking, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(booking.city, index)}
                  disabled={loadingCardIndex === index}
                  className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCardIndex === index && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-gray-700">Searching...</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="w-32 h-24 flex-shrink-0 overflow-hidden">
                      <img
                        src={booking.image}
                        alt={booking.hotel}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 p-4 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">{booking.city}</span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                          {booking.cityCode}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{booking.hotel}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{booking.date}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Search className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Hotels */}
        {!hotels.length && viewedHotels.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-gray-900 rounded-full"></div>
              <Clock className="w-4 h-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-900">Recently Viewed</h2>
            </div>
            {/* MOBILE: Horizontal scroll | DESKTOP: Grid */}
            <div className="overflow-x-auto md:overflow-x-visible pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <div className="flex md:grid md:grid-cols-2 gap-4 min-w-max md:min-w-0">
              {viewedHotels.map((hotel, index) => (
                <div
                  key={hotel.id}
                  className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 w-[280px] md:w-auto flex-shrink-0"
                >
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeViewedHotel(hotel.id);
                    }}
                    className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 hover:bg-red-50 rounded-full border border-gray-200 hover:border-red-300 transition-all"
                    title="Remove from history"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600 hover:text-red-600" />
                  </button>

                  <Link
                    href={`/dashboard/hotels/${hotel.id}?checkIn=${hotel.checkIn}&checkOut=${hotel.checkOut}&adults=${hotel.adults}&rooms=${hotel.rooms}`}
                    className="flex gap-4"
                  >
                    <div className="w-32 h-24 flex-shrink-0 overflow-hidden">
                      {hotel.image ? (
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{hotel.name}</h3>
                        {hotel.rating > 0 && (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-medium text-gray-700">{hotel.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600 line-clamp-1">{hotel.city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {hotel.price && parseFloat(hotel.price) > 0 && (
                            <span className="font-semibold text-gray-900">
                              ${formatPrice(hotel.price)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {(() => {
                              const viewedDate = new Date(hotel.viewedAt);
                              const now = new Date();
                              const diffMs = now.getTime() - viewedDate.getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMs / 3600000);
                              const diffDays = Math.floor(diffMs / 86400000);

                              if (diffMins < 1) return 'Just now';
                              if (diffMins < 60) return `${diffMins}m ago`;
                              if (diffHours < 24) return `${diffHours}h ago`;
                              return `${diffDays}d ago`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Popular Destinations */}
        {!hotels.length && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-gray-900 rounded-full"></div>
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-900">Popular Destinations</h2>
            </div>
            {/* MOBILE: Horizontal scroll | DESKTOP: Grid */}
            <div className="overflow-x-auto md:overflow-x-visible pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-max md:min-w-0">
              {popularDestinations.map((destination, index) => {
                const cardIndex = 100 + index; // Offset to avoid conflict with pastBookings indices
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(destination.city, cardIndex)}
                    disabled={loadingCardIndex === cardIndex}
                    className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed w-[240px] md:w-auto flex-shrink-0"
                  >
                    {loadingCardIndex === cardIndex && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium text-gray-700">Searching...</span>
                        </div>
                      </div>
                    )}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={destination.image}
                      alt={destination.city}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-sm">{destination.city}</h3>
                        <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded">
                          {destination.cityCode}
                        </span>
                      </div>
                      <p className="text-white/90 text-[10px] mb-1">{destination.description}</p>
                      <p className="text-white/70 text-[10px]">
                        <span className="inline-block px-1.5 py-0.5 bg-[#ADF802] text-gray-900 rounded text-[9px] font-bold mr-1">{destination.hotels.split(' ')[0]}</span>
                        hotels
                      </p>
                    </div>
                  </div>
                </button>
                );
              })}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-gray-100 border border-gray-300 rounded-xl text-gray-700">
            {error}
          </div>
        )}

        {/* Results */}
        {hotels.length > 0 && (
          <div>
            {/* Results Header with Filters and View Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gray-900 rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-900">
                  {filteredHotels.length} of {hotels.length} {hotels.length === 1 ? 'hotel' : 'hotels'}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border border-gray-200">
                  <ArrowUpDown className="w-4 h-4 text-gray-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm font-medium text-gray-700 border-none focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="rating">Highest Rating</option>
                    <option value="distance">Closest Distance</option>
                  </select>
                </div>

                {/* Rating Filter */}
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-lg border border-gray-200">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="text-sm font-medium text-gray-700 border-none focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="0">All Ratings</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                {/* Filters Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
                    showFilters
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-200">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="List view"
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Grid view"
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'map'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Map view"
                  >
                    <Map className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Extended Filters Panel */}
            {showFilters && (
              <div className="bg-white rounded-lg p-3 md:p-4 lg:p-5 border border-gray-200 mb-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Advanced Filters</h3>
                  <button
                    onClick={() => {
                      setSortBy('recommended');
                      setMinRating(0);
                      setMaxPrice(0);
                    }}
                    className="text-xs text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Reset All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Rating Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Minimum Rating
                    </label>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            minRating === rating
                              ? 'border-gray-900 bg-gray-100 text-gray-900'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {rating === 0 ? (
                              <span className="text-xs font-medium">Any</span>
                            ) : (
                              <>
                                <span className="text-xs font-medium">{rating}</span>
                                <Star className="w-3 h-3 fill-current" />
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Max Price (per night)
                    </label>
                    <div className="flex gap-2">
                      {[0, 150, 300, 500].map((price) => (
                        <button
                          key={price}
                          onClick={() => setMaxPrice(price)}
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            maxPrice === price
                              ? 'border-gray-900 bg-gray-100 text-gray-900'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {price === 0 ? 'Any' : `$${price}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-100 outline-none text-sm"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price">Price (Low to High)</option>
                      <option value="rating">Rating (High to Low)</option>
                      <option value="distance">Distance (Nearest)</option>
                    </select>
                  </div>

                  {/* Active Filters Count */}
                  <div className="flex items-end">
                    <div className="w-full px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-[10px] text-gray-600 mb-1">Showing</div>
                      <div className="text-lg font-bold text-gray-900">
                        {filteredHotels.length} / {hotels.length}
                      </div>
                      <div className="text-[10px] text-gray-600">hotels</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-3 md:space-y-4">
                {filteredHotels.map((hotel, index) => (
              <div
                key={index}
                className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 border-l-2 border-l-gray-900"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Hotel Image */}
                  <div className="lg:w-72 h-48 md:h-64 lg:h-auto relative overflow-hidden flex-shrink-0">
                    <img
                      src={hotel.hotel?.media && hotel.hotel.media.length > 0
                        ? (hotel.hotel.media[0].uri || hotel.hotel.media[0].url)
                        : getPlaceholderImage(index)}
                      alt={hotel.hotel?.name || 'Hotel'}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Overlay badges */}
                    <div className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 flex items-start justify-between z-10">
                      {hotel.hotel?.rating && (
                        <div className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-white/95 rounded-lg border border-gray-200">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-gray-900">
                            {hotel.hotel.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Full address at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 md:p-6 z-10">
                      <div className="flex items-center gap-1.5 md:gap-2 text-white">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-sm font-semibold line-clamp-1">
                          {formatHotelAddress(hotel)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="flex-1 p-4 md:p-4 lg:p-5">
                    <div className="mb-3 md:mb-5">
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0"></div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-1">
                          {hotel.hotel?.name || 'Hotel'}
                        </h3>
                      </div>
                      <div className="flex items-start gap-1.5 md:gap-2.5 text-gray-700 mb-2 md:mb-3">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                        <div className="flex-1">
                          <span className="line-clamp-2 text-[10px] md:text-xs font-medium">{formatHotelAddress(hotel)}</span>
                        </div>
                      </div>

                      {/* Hotel Description - HIDDEN ON MOBILE */}
                      {hotel.hotel?.description && (
                        <p className="hidden md:block text-[10px] md:text-xs text-gray-600 line-clamp-2 mb-3 md:mb-4 leading-relaxed">
                          {hotel.hotel.description}
                        </p>
                      )}
                    </div>

                    {/* Key Features & Info Grid */}
                    <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                      {/* Distance to City Center */}
                      {hotel.hotel?.distance?.value && (
                        <div className="flex items-start gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <MapPin className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-[10px] font-semibold text-gray-700">City Center</div>
                            <div className="text-[10px] text-gray-900 font-bold">
                              {hotel.hotel.distance.value} {hotel.hotel.distance.unit.toLowerCase()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Facilities Count */}
                      {hotel.hotel?.amenities && hotel.hotel.amenities.length > 0 && (
                        <div className="flex items-start gap-1.5 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <Sparkles className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-[10px] font-semibold text-gray-700">Facilities</div>
                            <div className="text-[10px] text-gray-900 font-bold">
                              {hotel.hotel.amenities.length}+ amenities
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Top Amenities - HIDDEN ON MOBILE */}
                    {hotel.hotel?.amenities && hotel.hotel.amenities.length > 0 && (
                      <div className="mb-3 md:mb-4 hidden md:block">
                        <div className="text-[10px] font-semibold text-gray-700 mb-1.5 md:mb-2">Popular Facilities</div>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {hotel.hotel.amenities.slice(0, 6).map((amenity: any, idx: number) => {
                            const amenityText = typeof amenity === 'string' ? amenity : (amenity?.description || amenity?.type || 'Amenity');
                            return (
                              <div
                                key={idx}
                                className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] text-gray-700"
                              >
                                <span>{amenityText.replace(/_/g, ' ').toLowerCase()}</span>
                              </div>
                            );
                          })}
                          {hotel.hotel.amenities.length > 6 && (
                            <div className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] text-gray-600">
                              +{hotel.hotel.amenities.length - 6} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Info Pills */}
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {hotel.offers && hotel.offers.length > 0 && (
                        <div className="flex items-center gap-1 px-2 md:px-2.5 py-0.5 md:py-1 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-700">
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                          Available
                        </div>
                      )}
                      {hotel.hotel?.rating && hotel.hotel.rating >= 4 && (
                        <div className="flex items-center gap-1 px-2 md:px-2.5 py-0.5 md:py-1 bg-[#ADF802] border border-[#ADF802] rounded text-[10px] font-semibold text-gray-900">
                          <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-gray-900 text-gray-900" />
                          Highly Rated
                        </div>
                      )}
                      <div className="hidden md:flex items-center gap-1 px-2 md:px-2.5 py-0.5 md:py-1 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-700">
                        <Building2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        Business Travel
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="lg:w-64 flex flex-col justify-between p-3 md:p-4 lg:p-5 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200">
                    <div className="mb-3 md:mb-6">
                      {hotel.offers && hotel.offers.length > 0 ? (
                        <>
                          <div className="text-[10px] font-semibold text-gray-600 mb-1 md:mb-2">
                            Total Price
                          </div>
                          <div className="flex items-baseline gap-1 mb-0.5 md:mb-1">
                            <span className="text-lg md:text-2xl font-bold text-gray-900">
                              ${formatPrice(hotel.offers[0].price?.total || hotel.offers[0].price?.base || '0.00')}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium">
                            for {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] font-semibold text-gray-600 mb-1 md:mb-2">
                            Pricing
                          </div>
                          <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 md:px-3 py-1.5 md:py-2 rounded-lg">
                            Check availability
                          </div>
                        </>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/hotels/${hotel.hotel?.hotelId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${adults}&rooms=${roomQuantity}`}
                      onClick={() => saveViewedHotel(hotel)}
                      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
                ))}
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && (
              <div className={`${isFullMapView ? 'fixed inset-0 z-50 bg-white' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-400px)] min-h-[600px]'}`}>
                {/* Map Container */}
                <div className={`bg-white rounded-2xl overflow-hidden border border-gray-200 h-full relative ${isFullMapView ? 'rounded-none h-screen' : ''}`}>
                  <Suspense
                    fallback={
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading map...</p>
                        </div>
                      </div>
                    }
                  >
                    <HotelMap
                      hotels={filteredHotels}
                      selectedHotel={selectedHotel}
                      onHotelSelect={setSelectedHotel}
                      checkInDate={checkInDate}
                      checkOutDate={checkOutDate}
                      adults={adults}
                      roomQuantity={roomQuantity}
                    />
                  </Suspense>

                  {/* Map overlay with hotel count and fullscreen toggle */}
                  <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-auto">
                    <div className="flex items-center justify-between gap-4">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-gray-200 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              <span className="inline-block px-2 py-0.5 bg-[#ADF802] rounded text-xs font-bold text-gray-900 mr-2">{filteredHotels.length}</span>
                              hotels found
                            </div>
                            <div className="text-xs text-gray-600">in {address || 'this area'}</div>
                          </div>
                          <MapPin className="w-5 h-5 text-gray-700" />
                        </div>
                      </div>

                      {/* Fullscreen Toggle Button */}
                      <button
                        onClick={() => setIsFullMapView(!isFullMapView)}
                        className="bg-white/95 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        title={isFullMapView ? 'Exit fullscreen' : 'Fullscreen map'}
                      >
                        {isFullMapView ? (
                          <Minimize2 className="w-5 h-5 text-gray-700" />
                        ) : (
                          <Maximize2 className="w-5 h-5 text-gray-700" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hotel List Sidebar - Hidden in fullscreen */}
                {!isFullMapView && (
                  <div className="overflow-y-auto h-full space-y-4 pr-2">
                  {filteredHotels.map((hotel, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedHotel(hotel)}
                      className={`group bg-white rounded-lg overflow-hidden border transition-all duration-300 cursor-pointer ${
                        selectedHotel?.hotel?.hotelId === hotel.hotel?.hotelId
                          ? 'border-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-3 p-2 md:p-3">
                        {/* Hotel Image */}
                        <div className="w-28 md:w-32 h-20 md:h-24 flex-shrink-0 relative overflow-hidden rounded-xl">
                          <img
                            src={hotel.hotel?.media && hotel.hotel.media.length > 0
                              ? (hotel.hotel.media[0].uri || hotel.hotel.media[0].url)
                              : getPlaceholderImage(index)}
                            alt={hotel.hotel?.name || 'Hotel'}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {hotel.hotel?.rating && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs font-bold text-gray-900">{hotel.hotel.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Hotel Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors line-clamp-1">
                            {hotel.hotel?.name || 'Hotel'}
                          </h3>
                          <div className="flex items-start gap-1.5 text-gray-600 mb-2">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-600" />
                            <span className="line-clamp-1 text-xs">{formatHotelAddress(hotel)}</span>
                          </div>

                          {/* Price */}
                          {hotel.offers && hotel.offers.length > 0 ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-gray-900">
                                ${formatPrice(hotel.offers[0].price?.total || hotel.offers[0].price?.base || '0.00')}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-gray-700">Check availability</div>
                          )}
                        </div>

                        {/* View Button */}
                        <Link
                          href={`/dashboard/hotels/${hotel.hotel?.hotelId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${adults}&rooms=${roomQuantity}`}
                          className="flex-shrink-0 self-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium transition-all text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveViewedHotel(hotel);
                          }}
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {filteredHotels.map((hotel, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 border-l-2 border-l-gray-900"
                  >
                    {/* Hotel Image */}
                    <div className="h-48 relative overflow-hidden">
                      <img
                        src={hotel.hotel?.media && hotel.hotel.media.length > 0
                          ? (hotel.hotel.media[0].uri || hotel.hotel.media[0].url)
                          : getPlaceholderImage(index)}
                        alt={hotel.hotel?.name || 'Hotel'}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Rating Badge */}
                      {hotel.hotel?.rating && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 z-10">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold text-gray-900">{hotel.hotel.rating}</span>
                        </div>
                      )}

                      {/* Full address */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 z-10">
                        <div className="flex items-center gap-1.5 text-white text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="font-medium line-clamp-1">
                            {formatHotelAddress(hotel)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0"></div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1 leading-tight">
                          {hotel.hotel?.name || 'Hotel'}
                        </h3>
                      </div>

                      <div className="flex items-start gap-2 text-gray-700 mb-3">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                        <div className="flex-1">
                          <span className="line-clamp-1 text-xs font-medium">{formatHotelAddress(hotel)}</span>
                        </div>
                      </div>

                      {/* Amenities */}
                      {hotel.hotel?.amenities && hotel.hotel.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {hotel.hotel.amenities.slice(0, 4).map((amenity: string, idx: number) => {
                            const Icon = getAmenityIcon(amenity);
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700"
                              >
                                <Icon className="w-3 h-3 text-gray-600" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Distance */}
                      {hotel.hotel?.distance?.value && (
                        <div className="text-xs text-gray-600 mb-4">
                          {hotel.hotel.distance.value} {hotel.hotel.distance.unit.toLowerCase()} away
                        </div>
                      )}

                      {/* Price */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            {hotel.offers && hotel.offers.length > 0 ? (
                              <>
                                <div className="text-xs text-gray-500">Total Price</div>
                                <div className="text-xl font-bold text-gray-900">
                                  ${formatPrice(hotel.offers[0].price?.total || hotel.offers[0].price?.base || '0.00')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  for {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-xs text-gray-500">Price</div>
                                <div className="text-sm font-medium text-gray-600">
                                  View details for pricing
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/dashboard/hotels/${hotel.hotel?.hotelId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${adults}&rooms=${roomQuantity}`}
                          onClick={() => saveViewedHotel(hotel)}
                          className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-medium text-center text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && filteredHotels.length > 0 && filteredHotels.length >= 20 && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 bg-gray-900 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading 20 More...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Load 20 More Hotels</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-600">
                  Showing {filteredHotels.length} hotels
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && hotels.length === 0 && !error && checkInDate && checkOutDate && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hotels found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or expanding the search radius
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button - Mobile Only (shows when results exist) */}
      {hotels.length > 0 && (
        <button
          onClick={() => setShowSearchForm(true)}
          className="md:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-4 bg-gray-900 text-white rounded-lg font-semibold border border-gray-200"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Modify Search</span>
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

          {/* Modal Content - Bottom Sheet */}
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl border border-gray-200 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">Modify Search</h2>
              <button
                onClick={() => setShowSearchForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSearch} className="p-5 space-y-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                <CityAutocomplete
                  value={address}
                  onChange={setAddress}
                  placeholder="City or address"
                  required
                  className="py-3 text-base border hover:border-gray-400"
                />
              </div>

              {/* Check-in and Check-out */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full pl-10 pr-2 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Check-out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      required
                      className="w-full pl-10 pr-2 py-3 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Duration Display - Compact */}
              {calculateNights() > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{calculateNights()}</span> {calculateNights() === 1 ? 'night' : 'nights'}
                  </span>
                </div>
              )}

              {/* Adults and Rooms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Adults</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={adults}
                      onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={9}
                      required
                      className="w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Rooms</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={roomQuantity}
                      onChange={(e) => setRoomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={9}
                      required
                      className="w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Search Radius */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Search Radius</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Math.max(1, parseInt(e.target.value) || 5))}
                    min={1}
                    max={300}
                    className="w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                  />
                </div>
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
                    Search Hotels
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Chatbox */}
      <AIChatbox />
    </div>
  );
}
