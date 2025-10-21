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
} from 'lucide-react';
import { getCityCode } from '@/utils/cityMapping';
import CityAutocomplete from '@/components/CityAutocomplete';
import AIChatbox from '@/components/AIChatbox';
import PassengerDetailsModal from '@/components/PassengerDetailsModal';
import BookingSuccessModal from '@/components/BookingSuccessModal';

export default function HotelDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const hotelId = params.id as string;
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const rooms = parseInt(searchParams.get('rooms') || '1');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotelOffers, setHotelOffers] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'recommended'>('recommended');
  const [filterCancellation, setFilterCancellation] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Group booking modal state
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

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
  }, [hotelId, checkInDate, checkOutDate, adults, rooms]);

  // Debug: Log hotel address data
  useEffect(() => {
    if (hotelOffers?.hotel?.address) {
      console.log('Hotel address data:', hotelOffers.hotel.address);
      console.log('Address lines:', hotelOffers.hotel.address.lines);
      console.log('City name:', hotelOffers.hotel.address.cityName);
      console.log('Country code:', hotelOffers.hotel.address.countryCode);
    }
  }, [hotelOffers]);

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

      const bookingData = {
        bookingType: 'hotel',
        isGroupBooking,
        numberOfTravelers: passengers.length,
        groupName: isGroupBooking ? groupName : undefined,

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

      const response = await fetch('http://localhost:5000/api/v1/bookings', {
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

      console.log('=== Hotel Details Debug ===');
      console.log('hotelId:', hotelId);
      console.log('checkInDate:', checkInDate);
      console.log('checkOutDate:', checkOutDate);
      console.log('adults:', adults);
      console.log('rooms:', rooms);

      // Validate required parameters
      if (!checkInDate || !checkOutDate) {
        throw new Error('Missing required date parameters. Please search for hotels first.');
      }

      const params = new URLSearchParams({
        checkInDate,
        checkOutDate,
        adults: adults.toString(),
        roomQuantity: rooms.toString(),
        currency: 'USD',
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const fullUrl = `${apiUrl}/api/v1/hotels/${hotelId}/offers?${params}`;
      console.log('Fetching hotel offers from:', fullUrl);
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
        console.log('Hotel offers data:', data.data);
        console.log('Sample offer:', data.data.offers?.[0]);
        console.log('BoardType in offer:', data.data.offers?.[0]?.boardType);
        console.log('Full offer keys:', Object.keys(data.data.offers?.[0] || {}));
        console.log('Room data:', data.data.offers?.[0]?.room);
        console.log('Room description:', data.data.offers?.[0]?.room?.description);
        console.log('Policies data:', data.data.offers?.[0]?.policies);
        console.log('Policies keys:', Object.keys(data.data.offers?.[0]?.policies || {}));
        console.log('RateFamilyEstimated:', data.data.offers?.[0]?.rateFamilyEstimated);
        console.log('RoomInformation:', data.data.offers?.[0]?.roomInformation);
        setHotelOffers(data.data);
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
    const amenityMap: { [key: string]: any } = {
      WIFI: Wifi,
      RESTAURANT: Utensils,
      PARKING: Car,
      FITNESS: Dumbbell,
      POOL: Waves,
      BREAKFAST: Coffee,
    };
    return amenityMap[amenityCode] || Coffee;
  };

  // Get placeholder image for hotels without photos
  const getPlaceholderImage = () => {
    const images = [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&auto=format&fit=crop',
    ];
    // Use hotelId to consistently get the same image for this hotel
    const hash = hotelId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return images[hash % images.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 h-16">
              <Link
                href="/dashboard/hotels/search"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Search</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-gray-600 mt-2">Please try another hotel or different dates.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hotelOffers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 h-16">
              <Link
                href="/dashboard/hotels/search"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Search</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-700">Hotel information not available</p>
          </div>
        </div>
      </div>
    );
  }

  const hotel = hotelOffers.hotel;
  let offers = hotelOffers.offers || [];

  // Filter offers
  if (filterCancellation) {
    offers = offers.filter((offer: any) =>
      offer.policies?.cancellation?.type === 'FULL_REFUND'
    );
  }

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

  // Get hotel images or fallback to placeholders
  const hotelImages = hotel.media && hotel.media.length > 0
    ? hotel.media.map((m: any) => m.uri || m.url)
    : [getPlaceholderImage()];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/hotels/search"
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
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
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

        {/* Your Stay Card - Premium Design */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
            {/* Header with price - Gradient Background */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Total Price
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                      ${offers.length > 0 ? parseFloat(offers[0].price.total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '---'}
                    </span>
                    {offers.length > 0 && (
                      <span className="text-blue-100 text-xs md:text-sm font-medium">
                        ${(parseFloat(offers[0].price.total) / calculateNights()).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / night
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-semibold">Free cancellation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form content - Sleek Design */}
            <div className="p-4 md:p-6">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Check-in</label>
                  <input
                    type="date"
                    value={searchCheckIn}
                    onChange={(e) => setSearchCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white hover:border-blue-300 transition-colors font-semibold"
                  />
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Check-out</label>
                  <input
                    type="date"
                    value={searchCheckOut}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    min={searchCheckIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white hover:border-blue-300 transition-colors font-semibold"
                  />
                </div>

                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Adults</label>
                  <input
                    type="number"
                    value={searchAdults}
                    onChange={(e) => setSearchAdults(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={9}
                    className="w-full px-3 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-center hover:border-blue-300 transition-colors font-bold"
                  />
                </div>

                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Rooms</label>
                  <input
                    type="number"
                    value={searchRooms}
                    onChange={(e) => setSearchRooms(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={9}
                    className="w-full px-3 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-center hover:border-blue-300 transition-colors font-bold"
                  />
                </div>

                <button
                  onClick={() => {
                    router.push(`/dashboard/hotels/${hotelId}?checkIn=${searchCheckIn}&checkOut=${searchCheckOut}&adults=${searchAdults}&rooms=${searchRooms}`);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 text-base"
                >
                  <Search className="w-5 h-5" />
                  Update Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hotel Title & Info */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {hotel.name || 'Hotel'}
          </h1>

          {/* Address - Always show with hotel name and location */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">Location</p>
                <p className="text-gray-700 text-sm md:text-base">
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
                    className="text-blue-600 hover:text-blue-700 font-semibold mt-2 inline-flex items-center gap-1 text-sm"
                  >
                    View on map
                    <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description - Show with fallback */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm font-semibold text-gray-900 mb-2">About this property</p>
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              {hotel.description || `${hotel.name || 'This hotel'} offers quality accommodations and amenities for your stay. Contact the hotel directly for more detailed information about the property.`}
            </p>
          </div>

          {/* Rating badges - More prominent */}
          <div className="flex flex-wrap items-center gap-3">
            {hotel.rating && (
              <div className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg text-sm md:text-base">
                <Star className="w-4 md:w-5 h-4 md:h-5 fill-white" />
                <span>{hotel.rating} Star Hotel</span>
              </div>
            )}

            {hotel.distance?.value && (
              <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-green-50 border border-green-200 rounded-xl text-gray-700 font-semibold text-sm md:text-base">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-xs md:text-sm">{hotel.distance.value} {hotel.distance.unit} from center</span>
              </div>
            )}
          </div>
        </div>

        {/* Amenities - Full Width */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Amenities</h2>
          {hotel.amenities && hotel.amenities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {hotel.amenities.map((amenity: string, idx: number) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group bg-white"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900 capitalize">{amenity.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {['WIFI', 'PARKING', 'RESTAURANT', 'FITNESS', 'POOL', 'BREAKFAST', 'AIR_CONDITIONING', 'ROOM_SERVICE'].map((amenity: string, idx: number) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group bg-white"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900 capitalize">{amenity.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Rooms Section */}
        <div className="border-t border-gray-200 pt-12 available-rooms scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Choose Your Room
              </h2>
              <p className="text-gray-600">
                {offers.length} room{offers.length !== 1 ? 's' : ''} available for your dates
              </p>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all">
                  <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm font-semibold text-gray-700 border-none focus:outline-none bg-transparent cursor-pointer pr-2"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Free Cancellation Filter */}
              <button
                onClick={() => setFilterCancellation(!filterCancellation)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all font-semibold text-sm shadow-sm hover:shadow-md ${
                  filterCancellation
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Free Cancellation</span>
                {filterCancellation && (
                  <div className="ml-1 p-0.5 bg-white/20 rounded-full">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Show API limitation message if note exists */}
          {hotelOffers.note && (
            <div className="mb-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 mb-2 text-lg">Test Environment Notice</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">{hotelOffers.note}</p>
                </div>
              </div>
            </div>
          )}

          {offers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {offers.map((offer: any, index: number) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Room Image */}
                    {offer.room?.media && offer.room.media.length > 0 && (
                      <div className="lg:w-96 h-72 lg:h-auto relative overflow-hidden">
                        <img
                          src={offer.room.media[0].uri || offer.room.media[0].url}
                          alt="Room"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />

                        {/* Badges Overlay */}
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                          {offer.room?.typeEstimated?.category && (
                            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg font-semibold text-sm backdrop-blur-md">
                              {offer.room.typeEstimated.category.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </div>
                          )}

                          {offer.policies?.cancellation?.type === 'FULL_REFUND' && (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-xl shadow-lg font-semibold text-sm backdrop-blur-md">
                              <Check className="w-4 h-4" />
                              <span>Free Cancellation</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Room Details */}
                    <div className="flex-1 flex flex-col lg:flex-row">
                      {/* Left: Room Info */}
                      <div className="flex-1 p-6 lg:p-8">
                        {/* Room Title */}
                        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors capitalize">
                          {offer.room?.typeEstimated?.category
                            ? `${offer.room.typeEstimated.category.toLowerCase().replace(/_/g, ' ')} ${offer.room.typeEstimated.bedType ? offer.room.typeEstimated.bedType.toLowerCase() : ''} Room`
                            : 'Room'}
                        </h3>

                        {/* Room Description */}
                        {offer.room?.description?.text && (
                          <p className="text-sm md:text-base text-gray-600 mb-6 leading-relaxed">
                            {offer.room.description.text.toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase())}
                          </p>
                        )}

                        {/* Room Features */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          {offer.room?.typeEstimated && (
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                              <div className="p-2 bg-blue-600 rounded-lg">
                                <Bed className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-0.5">Bed Type</div>
                                <div className="text-sm font-bold text-gray-900">
                                  {offer.room.typeEstimated.beds} {offer.room.typeEstimated.bedType}
                                </div>
                              </div>
                            </div>
                          )}

                          {offer.guests && (
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                              <div className="p-2 bg-purple-600 rounded-lg">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-0.5">Capacity</div>
                                <div className="text-sm font-bold text-gray-900">
                                  Up to {offer.guests.adults} adults
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Room Facilities */}
                        {offer.room?.description?.facilities && offer.room.description.facilities.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Room Features</h4>
                            <div className="flex flex-wrap gap-2">
                              {offer.room.description.facilities.map((facility: string, idx: number) => {
                                const Icon = getAmenityIcon(facility);
                                return (
                                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                    <Icon className="w-4 h-4 text-blue-600" />
                                    <span className="capitalize font-medium">{facility.toLowerCase().replace(/_/g, ' ')}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Policies */}
                        <div className="flex flex-wrap gap-3">
                          {offer.policies?.cancellation && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-sm font-semibold text-gray-700">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span>
                                {offer.policies.cancellation.type === 'FULL_REFUND'
                                  ? 'Free cancellation'
                                  : offer.policies.cancellation.type === 'NON_REFUNDABLE'
                                  ? 'Non-refundable'
                                  : 'Cancellation available'}
                              </span>
                            </div>
                          )}
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
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl text-sm font-semibold text-gray-700">
                                  <Coffee className="w-4 h-4 text-orange-600" />
                                  <span>All Inclusive</span>
                                </div>
                              );
                            }
                            if (hasFullBoard) {
                              return (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl text-sm font-semibold text-gray-700">
                                  <Coffee className="w-4 h-4 text-orange-600" />
                                  <span>Full Board</span>
                                </div>
                              );
                            }
                            if (hasHalfBoard) {
                              return (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl text-sm font-semibold text-gray-700">
                                  <Coffee className="w-4 h-4 text-orange-600" />
                                  <span>Half Board</span>
                                </div>
                              );
                            }
                            if (hasBreakfast) {
                              return (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl text-sm font-semibold text-gray-700">
                                  <Coffee className="w-4 h-4 text-orange-600" />
                                  <span>Breakfast Included</span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-sm font-semibold text-gray-700">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <span>Instant Confirmation</span>
                          </div>
                          {offer.policies?.paymentType && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl text-sm font-semibold text-gray-700">
                              <CreditCard className="w-4 h-4 text-amber-600" />
                              <span className="capitalize">{offer.policies.paymentType.toLowerCase()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Pricing Card */}
                      <div className="lg:w-80 flex flex-col justify-between p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 border-t-2 lg:border-t-0 lg:border-l-2 border-gray-200">
                        <div>
                          <div className="mb-6">
                            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                              Total for {calculateNights()} {calculateNights() === 1 ? 'Night' : 'Nights'}
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                ${parseFloat(offer.price.total).toLocaleString('en-US', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                              <span className="text-base md:text-lg font-semibold text-gray-600">
                                {offer.price.currency}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                              ${(parseFloat(offer.price.total) / calculateNights()).toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })} per night
                            </div>
                          </div>

                          {/* Price Breakdown */}
                          <div className="p-4 bg-white/70 rounded-xl border border-gray-200 mb-6">
                            <div className="flex justify-between text-sm text-gray-700 mb-2">
                              <span>Room rate</span>
                              <span className="font-bold">${parseFloat(offer.price.base).toLocaleString()}</span>
                            </div>
                            {offer.price.taxes && (
                              <div className="flex justify-between text-sm text-gray-700 pb-2 mb-2 border-b border-gray-200">
                                <span>Taxes & fees</span>
                                <span className="font-bold">${(parseFloat(offer.price.total) - parseFloat(offer.price.base)).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-base font-bold text-gray-900">
                              <span>Total</span>
                              <span>${parseFloat(offer.price.total).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Book Button */}
                        <button
                          onClick={() => handleReserveRoom(offer)}
                          className="w-full py-3 md:py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-xl font-bold text-base md:text-lg hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 group"
                        >
                          <span>Reserve This Room</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>

                        <p className="text-xs text-center text-gray-600 mt-3">
                          No payment needed today
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-16 text-center border-2 border-dashed border-gray-300">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-6 shadow-lg">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">No rooms available</h3>
                <p className="text-gray-600 mb-6">
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
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Try Different Dates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar - Only show when offers exist */}
      {offers.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-gray-900">
                  ${parseFloat(offers[0].price.total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-sm text-gray-600">total</span>
              </div>
              <p className="text-xs text-gray-600">
                ${(parseFloat(offers[0].price.total) / calculateNights()).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / night
              </p>
            </div>
            <button
              onClick={() => {
                window.scrollTo({ top: document.querySelector('.available-rooms')?.getBoundingClientRect().top || 0, behavior: 'smooth' });
              }}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
            >
              <span>View Rooms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AI Chatbox */}
      <AIChatbox />

      {/* Passenger Details Modal */}
      <PassengerDetailsModal
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        numberOfTravelers={adults}
        bookingType="hotel"
        onSubmit={handlePassengerDetailsSubmit}
        totalPrice={selectedOffer ? parseFloat(selectedOffer.price.total) * rooms : 0}
        currency={selectedOffer?.price.currency || 'USD'}
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

            // Collect all passengers from all rooms
            const allPassengers = multiRoomData.rooms.flatMap(room => room.guests);

            const bookingData = {
              bookingType: 'hotel',
              isGroupBooking: multiRoomData.isGroupBooking,
              numberOfTravelers: multiRoomData.totalGuests,
              groupName: multiRoomData.groupName,

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

            const response = await fetch('http://localhost:5000/api/v1/bookings', {
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
      />
    </div>
  );
}
