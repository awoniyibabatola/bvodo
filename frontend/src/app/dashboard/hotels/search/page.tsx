'use client';

import { useState, lazy, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getCityCode } from '@/utils/cityMapping';
import CityAutocomplete from '@/components/CityAutocomplete';
import FancyLoader from '@/components/FancyLoader';

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
} from 'lucide-react';
import AIChatbox from '@/components/AIChatbox';

export default function HotelSearchPage() {
  const searchParams = useSearchParams();
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
      });

      console.log('[Hotels Search] Fetching with params:', params.toString());
      const response = await fetch(`http://localhost:5000/api/v1/hotels/search?${params}`);
      const data = await response.json();
      console.log('[Hotels Search] API response:', data);

      if (data.success) {
        let filteredHotels = data.data;
        console.log('[Hotels Search] Before filtering:', filteredHotels.length, 'hotels');

        // Check if we got fewer hotels than requested (means no more available)
        setHasMore(filteredHotels.length >= 20);

        // Debug: Check first hotel structure
        if (filteredHotels.length > 0) {
          console.log('[Hotels Search] Sample hotel data:', filteredHotels[0]);
        }

        // Apply filters - but don't filter by rating when coming from AI chat
        // The AI already filtered results, so we just show what it found
        if (minRatingFilter > 0 && !searchParams.get('fromAI')) {
          filteredHotels = filteredHotels.filter((hotel: any) => {
            const hotelRating = parseFloat(hotel.rating) || 0;
            return hotelRating >= minRatingFilter;
          });
          console.log('[Hotels Search] After rating filter:', filteredHotels.length, 'hotels');
        }
        if (maxPriceFilter > 0 && !searchParams.get('fromAI')) {
          filteredHotels = filteredHotels.filter((hotel: any) => parseFloat(hotel.price) <= maxPriceFilter);
          console.log('[Hotels Search] After price filter:', filteredHotels.length, 'hotels');
        }

        console.log('[Hotels Search] Setting hotels state with', filteredHotels.length, 'hotels');
        setHotels(filteredHotels);
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
  const handleQuickSearch = (cityName: string) => {
    setAddress(cityName);
    // Set default dates (tomorrow to day after)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    setCheckInDate(tomorrow.toISOString().split('T')[0]);
    setCheckOutDate(dayAfter.toISOString().split('T')[0]);
    setAdults(1);
    setRoomQuantity(1);

    // Scroll to search form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCurrentLimit(20); // Reset limit on new search

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
      });

      // If we have a valid city code from our map, use it; otherwise use full address for geocoding
      if (cityCode) {
        params.append('cityCode', cityCode);
      } else {
        // Use full address - backend will geocode it (neighborhoods, landmarks, etc.)
        params.append('address', address);
      }

      const response = await fetch(`http://localhost:5000/api/v1/hotels/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setHotels(data.data);
        setHasMore(data.data.length >= 20);
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
      });

      if (cityCode) {
        params.append('cityCode', cityCode);
      } else {
        params.append('address', address);
      }

      const response = await fetch(`http://localhost:5000/api/v1/hotels/search?${params}`);
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

  // Format hotel address for better display
  const formatHotelAddress = (hotel: any) => {
    const addr = hotel.hotel?.address;
    if (!addr) return address;

    // Build address parts
    const parts = [];

    // Add street address if available
    if (addr.lines && addr.lines.length > 0) {
      parts.push(addr.lines[0]);
    }

    // Add city and state/province if available
    if (addr.cityName) {
      let cityPart = addr.cityName;
      if (addr.stateCode) {
        cityPart += `, ${addr.stateCode}`;
      }
      parts.push(cityPart);
    }

    // If we have parts, join them; otherwise use country code or fallback
    if (parts.length > 0) {
      return parts.join(' • ');
    }

    return addr.countryCode || address;
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
            Search Hotels
          </h1>
          <p className="text-gray-600">Find the perfect accommodation for your business trip</p>
        </div>

        {/* Recent Bookings */}
        {!hotels.length && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastBookings.map((booking, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(booking.city)}
                  className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200 hover:border-blue-300"
                >
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
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
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
                      <Search className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Destinations */}
        {!hotels.length && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Popular Destinations</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularDestinations.map((destination, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(destination.city)}
                  className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200 hover:border-purple-300"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={destination.image}
                      alt={destination.city}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-lg">{destination.city}</h3>
                        <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded font-medium">
                          {destination.cityCode}
                        </span>
                      </div>
                      <p className="text-white/90 text-xs mb-1">{destination.description}</p>
                      <p className="text-white/70 text-xs">{destination.hotels}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
          <form onSubmit={handleSearch} className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
            {/* Location and Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
              {/* Address/City */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <CityAutocomplete
                  value={address}
                  onChange={setAddress}
                  placeholder="City or full address (e.g., Times Square, New York)"
                  required
                  className="py-3 border-2 hover:border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">Enter city name or detailed address for precise results</p>
              </div>

              {/* Check-in Date */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Check-out Date */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Nights Display */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                <div className="flex items-center h-[50px] px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                  <span className="text-2xl font-bold text-blue-600">{calculateNights()}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {calculateNights() === 1 ? 'night' : 'nights'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guests and Rooms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Adults */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adults</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={9}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Rooms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rooms</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={roomQuantity}
                    onChange={(e) => setRoomQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={9}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Search Radius */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Radius (km)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Math.max(1, parseInt(e.target.value) || 5))}
                    min={1}
                    max={300}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
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
                  Search Hotels
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
        {hotels.length > 0 && (
          <div>
            {/* Results Header with Filters and View Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredHotels.length} of {hotels.length} {hotels.length === 1 ? 'hotel' : 'hotels'}
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
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
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                    showFilters
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 shadow-sm'
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
                        ? 'bg-blue-600 text-white'
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
                        ? 'bg-blue-600 text-white'
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
                        ? 'bg-blue-600 text-white'
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
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
                  <button
                    onClick={() => {
                      setSortBy('recommended');
                      setMinRating(0);
                      setMaxPrice(0);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Reset All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Rating
                    </label>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                            minRating === rating
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-blue-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {rating === 0 ? (
                              <span className="text-sm font-medium">Any</span>
                            ) : (
                              <>
                                <span className="text-sm font-medium">{rating}</span>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Price (per night)
                    </label>
                    <div className="flex gap-2">
                      {[0, 150, 300, 500].map((price) => (
                        <button
                          key={price}
                          onClick={() => setMaxPrice(price)}
                          className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${
                            maxPrice === price
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-blue-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {price === 0 ? 'Any' : `$${price}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price">Price (Low to High)</option>
                      <option value="rating">Rating (High to Low)</option>
                      <option value="distance">Distance (Nearest)</option>
                    </select>
                  </div>

                  {/* Active Filters Count */}
                  <div className="flex items-end">
                    <div className="w-full px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                      <div className="text-xs text-gray-600 mb-1">Showing</div>
                      <div className="text-xl font-bold text-blue-600">
                        {filteredHotels.length} / {hotels.length}
                      </div>
                      <div className="text-xs text-gray-600">hotels</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredHotels.map((hotel, index) => (
              <div
                key={index}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Hotel Image */}
                  <div className="lg:w-80 h-64 lg:h-auto relative overflow-hidden">
                    <img
                      src={hotel.hotel?.media && hotel.hotel.media.length > 0
                        ? (hotel.hotel.media[0].uri || hotel.hotel.media[0].url)
                        : getPlaceholderImage(index)}
                      alt={hotel.hotel?.name || 'Hotel'}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Overlay badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                      {hotel.hotel?.rating && (
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold text-gray-900">
                            {hotel.hotel.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* City name at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 z-10">
                      <div className="flex items-center gap-2 text-white">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {hotel.hotel?.address?.cityName || address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="flex-1 p-6 lg:p-8">
                    <div className="mb-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                        {hotel.hotel?.name || 'Hotel'}
                      </h3>
                      <div className="flex items-start gap-2.5 text-gray-700 mb-3">
                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" />
                        <div className="flex-1">
                          <span className="line-clamp-2 text-sm font-medium">{formatHotelAddress(hotel)}</span>
                          {getDistanceDisplay(hotel) && (
                            <span className="text-xs text-blue-600 font-semibold mt-1 block bg-blue-50 px-2 py-1 rounded inline-block">
                              {getDistanceDisplay(hotel)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hotel Description */}
                      {hotel.hotel?.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          {hotel.hotel.description}
                        </p>
                      )}
                    </div>

                    {/* Key Features & Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Distance to City Center */}
                      {hotel.hotel?.distance?.value && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-gray-700">City Center</div>
                            <div className="text-xs text-blue-600 font-bold">
                              {hotel.hotel.distance.value} {hotel.hotel.distance.unit.toLowerCase()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Facilities Count */}
                      {hotel.hotel?.amenities && hotel.hotel.amenities.length > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-semibold text-gray-700">Facilities</div>
                            <div className="text-xs text-purple-600 font-bold">
                              {hotel.hotel.amenities.length}+ amenities
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Top Amenities */}
                    {hotel.hotel?.amenities && hotel.hotel.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Popular Facilities</div>
                        <div className="flex flex-wrap gap-2">
                          {hotel.hotel.amenities.slice(0, 6).map((amenity: string, idx: number) => {
                            const Icon = getAmenityIcon(amenity);
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg text-xs font-medium text-gray-700 hover:shadow-md transition-shadow"
                              >
                                <Icon className="w-4 h-4 text-blue-600" />
                                <span className="capitalize">{amenity.replace(/_/g, ' ').toLowerCase()}</span>
                              </div>
                            );
                          })}
                          {hotel.hotel.amenities.length > 6 && (
                            <div className="flex items-center px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                              +{hotel.hotel.amenities.length - 6} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Info Pills */}
                    <div className="flex flex-wrap gap-2">
                      {hotel.offers && hotel.offers.length > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Available Now
                        </div>
                      )}
                      {hotel.hotel?.rating && hotel.hotel.rating >= 4 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-semibold text-yellow-700">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          Highly Rated
                        </div>
                      )}
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
                        <Building2 className="w-3 h-3" />
                        Business Travel
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="lg:w-64 flex flex-col justify-between p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50/30 border-t lg:border-t-0 lg:border-l border-gray-200">
                    <div className="mb-6">
                      {hotel.offers && hotel.offers.length > 0 ? (
                        <>
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Total Price
                          </div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-3xl font-bold text-gray-900">
                              ${hotel.offers[0].price?.total || hotel.offers[0].price?.base || '0.00'}
                            </span>
                            <span className="text-sm font-medium text-gray-600">
                              {hotel.offers[0].price?.currency || 'USD'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            for {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Pricing
                          </div>
                          <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                            Check availability
                          </div>
                        </>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/hotels/${hotel.hotel?.hotelId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${adults}&rooms=${roomQuantity}`}
                      className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-300 text-center flex items-center justify-center gap-2 group"
                    >
                      <span>View Details</span>
                      <Building2 className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                <div className={`bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 h-full relative ${isFullMapView ? 'rounded-none h-screen' : ''}`}>
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
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{filteredHotels.length} hotels found</div>
                            <div className="text-xs text-gray-600">in {address || 'this area'}</div>
                          </div>
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>

                      {/* Fullscreen Toggle Button */}
                      <button
                        onClick={() => setIsFullMapView(!isFullMapView)}
                        className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                        title={isFullMapView ? 'Exit fullscreen' : 'Fullscreen map'}
                      >
                        {isFullMapView ? (
                          <Minimize2 className="w-5 h-5 text-blue-600" />
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
                      className={`group bg-white rounded-2xl overflow-hidden shadow-md border-2 transition-all duration-300 cursor-pointer ${
                        selectedHotel?.hotel?.hotelId === hotel.hotel?.hotelId
                          ? 'border-blue-500 shadow-xl'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex gap-4 p-4">
                        {/* Hotel Image */}
                        <div className="w-32 h-24 flex-shrink-0 relative overflow-hidden rounded-xl">
                          <img
                            src={hotel.hotel?.media && hotel.hotel.media.length > 0
                              ? (hotel.hotel.media[0].uri || hotel.hotel.media[0].url)
                              : getPlaceholderImage(index)}
                            alt={hotel.hotel?.name || 'Hotel'}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {hotel.hotel?.rating && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs font-bold text-gray-900">{hotel.hotel.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Hotel Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {hotel.hotel?.name || 'Hotel'}
                          </h3>
                          <div className="flex items-start gap-1.5 text-gray-600 mb-2">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                            <span className="line-clamp-1 text-xs">{formatHotelAddress(hotel)}</span>
                          </div>

                          {/* Price */}
                          {hotel.offers && hotel.offers.length > 0 ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-gray-900">
                                ${hotel.offers[0].price?.total || hotel.offers[0].price?.base || '0.00'}
                              </span>
                              <span className="text-xs text-gray-600">total</span>
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-blue-600">Check availability</div>
                          )}
                        </div>

                        {/* View Button */}
                        <Link
                          href={`/dashboard/hotels/${hotel.hotel?.hotelId}?checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${adults}&rooms=${roomQuantity}`}
                          className="flex-shrink-0 self-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-xs"
                          onClick={(e) => e.stopPropagation()}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map((hotel, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300"
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
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg z-10">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold text-gray-900">{hotel.hotel.rating}</span>
                        </div>
                      )}

                      {/* City name */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 z-10">
                        <div className="flex items-center gap-1.5 text-white text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            {hotel.hotel?.address?.cityName || address}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div className="p-5">
                      <h3 className="text-base font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {hotel.hotel?.name || 'Hotel'}
                      </h3>

                      <div className="flex items-start gap-2 text-gray-700 mb-3">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                        <div className="flex-1">
                          <span className="line-clamp-1 text-xs font-medium">{formatHotelAddress(hotel)}</span>
                          {getDistanceDisplay(hotel) && (
                            <span className="text-xs text-blue-600 font-semibold mt-1 block bg-blue-50 px-2 py-0.5 rounded inline-block">
                              {getDistanceDisplay(hotel)}
                            </span>
                          )}
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
                                  ${hotel.offers[0].price?.total || hotel.offers[0].price?.base || '0.00'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {hotel.offers[0].price?.currency || 'USD'} for {calculateNights()} {calculateNights() === 1 ? 'night' : 'nights'}
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
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 text-center flex items-center justify-center gap-2 text-sm"
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
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading 20 More...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      Load 20 More Hotels
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600">
                  Showing {filteredHotels.length} hotels • Click to load 20 more
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

      {/* AI Chatbox */}
      <AIChatbox />
    </div>
  );
}
