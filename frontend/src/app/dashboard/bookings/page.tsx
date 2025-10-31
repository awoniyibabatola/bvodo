'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plane,
  Hotel,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Download,
  Eye,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Table2,
  Calendar as CalendarIcon,
  List,
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';

interface Booking {
  id: string;
  bookingReference: string;
  bookingType: string;
  isGroupBooking: boolean;
  numberOfTravelers: number;
  groupName?: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  passengers: number;
  passengerDetails?: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
  totalPrice: number;
  currency: string;
  status: string;
  bookedAt: string;
  providerConfirmationNumber?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  flightBookings?: Array<{
    departureAirport: string;
    arrivalAirport: string;
    airline: string;
    airlineCode?: string;
  }>;
  hotelBookings?: Array<{
    photoUrl?: string;
    rooms?: Array<{
      guests?: Array<{
        firstName: string;
        lastName: string;
      }>;
    }>;
  }>;
}

type ViewMode = 'list' | 'calendar' | 'table';

export default function BookingsPage() {
  const [user, setUser] = useState({
    name: 'User',
    role: 'traveler',
    email: '',
    organization: '',
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    status: '',
    bookingType: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

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
    fetchBookings();
  }, [pagination.page, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.bookingType && { bookingType: filters.bookingType }),
      });

      const response = await fetch(
        `${getApiEndpoint('bookings')}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
      case 'pending_approval':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    // Confirmed/approved get lemon, cancelled gets red, others remain grayscale
    if (status === 'confirmed' || status === 'approved') {
      return 'bg-[#ADF802] text-gray-900 border-[#ADF802]';
    }
    if (status === 'cancelled') {
      return 'bg-red-500 text-white border-red-500';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatStatus = (status: string) => {
    // Custom formatting for specific statuses
    switch (status) {
      case 'awaiting_confirmation':
        return 'PENDING CONFIRMATION';
      case 'pending_approval':
        return 'PENDING APPROVAL';
      default:
        return status.replace(/_/g, ' ').toUpperCase();
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter((booking) => {
      const departureDate = booking.departureDate.split('T')[0];
      const returnDate = booking.returnDate?.split('T')[0];
      return departureDate === dateStr || returnDate === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        booking.bookingReference.toLowerCase().includes(searchLower) ||
        booking.destination.toLowerCase().includes(searchLower) ||
        booking.user.firstName.toLowerCase().includes(searchLower) ||
        booking.user.lastName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <UnifiedNavBar currentPage="bookings" user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            My Bookings
            {pagination.total > 0 && (
              <span className="inline-block ml-2 px-2 py-0.5 bg-[#ADF802] rounded text-xs font-bold text-gray-900">
                {pagination.total}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-600">View and manage all your travel bookings</p>
        </div>

        {/* Booking Type Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1">
            <button
              onClick={() => setFilters({ ...filters, bookingType: '' })}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                filters.bookingType === ''
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>All Bookings</span>
                {filters.bookingType === '' && bookings.length > 0 && (
                  <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                    {bookings.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setFilters({ ...filters, bookingType: 'flight' })}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                filters.bookingType === 'flight'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4" />
                <span>Flights</span>
                {filters.bookingType === 'flight' && bookings.filter(b => b.bookingType === 'flight').length > 0 && (
                  <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                    {bookings.filter(b => b.bookingType === 'flight').length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setFilters({ ...filters, bookingType: 'hotel' })}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                filters.bookingType === 'hotel'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                <span>Hotels</span>
                {filters.bookingType === 'hotel' && bookings.filter(b => b.bookingType === 'hotel').length > 0 && (
                  <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                    {bookings.filter(b => b.bookingType === 'hotel').length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-white rounded p-0.5 border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded text-[10px] md:text-xs font-medium transition ${
                viewMode === 'list'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-3 h-3" />
              <span className="hidden md:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded text-[10px] md:text-xs font-medium transition ${
                viewMode === 'calendar'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span className="hidden md:inline">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded text-[10px] md:text-xs font-medium transition ${
                viewMode === 'table'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Table2 className="w-3 h-3" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded p-4 mb-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by reference, destination, or traveler..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center mx-auto mb-3 border border-gray-200">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No bookings found</h3>
            <p className="text-xs text-gray-600 mb-4">Start planning your next trip!</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard/flights/search"
                className="px-4 py-2 bg-gray-900 text-white rounded text-xs font-semibold hover:bg-gray-800 transition"
              >
                Book a Flight
              </Link>
              <Link
                href="/dashboard/hotels/search"
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:border-gray-400 transition"
              >
                Book a Hotel
              </Link>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {filteredBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="group relative block"
                >
                  {/* Clean Minimal Card */}
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                    <div className="p-5">
                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-start gap-5">
                        {/* Image/Icon - Hotel thumbnail, Airline logo, or Icon */}
                        {booking.bookingType === 'hotel' && booking.hotelBookings?.[0]?.photoUrl ? (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={booking.hotelBookings[0].photoUrl}
                              alt={booking.destination}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : booking.bookingType === 'flight' && booking.flightBookings?.[0]?.airlineCode ? (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200 p-2 flex items-center justify-center">
                            <img
                              src={`https://images.kiwi.com/airlines/64/${booking.flightBookings[0].airlineCode}.png`}
                              alt={booking.flightBookings[0].airline}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                // Fallback to icon if airline logo fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg></div>';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition flex-shrink-0">
                            {booking.bookingType === 'flight' ? (
                              <Plane className="w-5 h-5 text-gray-600" />
                            ) : (
                              <Hotel className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        )}

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          {/* Reference, Type & Status */}
                          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                            <h3 className="text-base font-semibold text-gray-900">
                              {booking.bookingReference}
                            </h3>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {booking.bookingType === 'flight' ? 'Flight' : 'Hotel'}
                            </span>
                            <span
                              className={`text-xs font-medium px-2.5 py-0.5 rounded inline-flex items-center gap-1 ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {getStatusIcon(booking.status)}
                              {formatStatus(booking.status)}
                            </span>
                            {booking.isGroupBooking && (
                              <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-50 text-gray-600">
                                <Users className="w-3 h-3 inline mr-1" />
                                {booking.numberOfTravelers} travelers
                              </span>
                            )}
                          </div>

                          {/* Route - Simplified */}
                          <div className="flex items-center gap-2.5 mb-3.5 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                              {booking.bookingType === 'flight' && booking.flightBookings?.[0] ? (
                                <>
                                  <span>{booking.flightBookings[0].departureAirport}</span>
                                  <span className="text-gray-400">→</span>
                                  <span>{booking.flightBookings[0].arrivalAirport}</span>
                                </>
                              ) : (
                                <>
                                  {booking.origin && <span>{booking.origin}</span>}
                                  {booking.origin && <span className="text-gray-400">→</span>}
                                  <span>{booking.destination}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Metadata Row - Compact */}
                          <div className="flex items-center gap-5 text-xs flex-wrap">
                            {/* Date */}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-600">
                                {formatDate(booking.departureDate)}
                                {booking.returnDate && booking.bookingType === 'hotel' && (
                                  <> - {formatDate(booking.returnDate)}</>
                                )}
                              </span>
                            </div>

                            {/* Travelers/Guests with Names */}
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-600">
                                {booking.passengerDetails?.[0] ? (
                                  <>
                                    {booking.passengerDetails[0].firstName} {booking.passengerDetails[0].lastName}
                                    {booking.passengers > 1 && <span className="text-gray-400"> +{booking.passengers - 1}</span>}
                                  </>
                                ) : booking.hotelBookings?.[0]?.rooms?.[0]?.guests?.[0] ? (
                                  <>
                                    {booking.hotelBookings[0].rooms[0].guests[0].firstName} {booking.hotelBookings[0].rooms[0].guests[0].lastName}
                                    {booking.passengers > 1 && <span className="text-gray-400"> +{booking.passengers - 1}</span>}
                                  </>
                                ) : (
                                  <>{booking.passengers} {booking.passengers === 1 ? 'person' : 'people'}</>
                                )}
                              </span>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-900 font-semibold">
                                {booking.currency} ${booking.totalPrice.toLocaleString('en-US')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Subtle View Indicator */}
                        <div className="flex items-center flex-shrink-0">
                          <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-900 transition">
                            <Eye className="w-4 h-4 text-gray-600 group-hover:text-white transition" />
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout - Clean & Minimal */}
                      <div className="md:hidden space-y-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Image/Icon - Hotel thumbnail, Airline logo, or Icon */}
                            {booking.bookingType === 'hotel' && booking.hotelBookings?.[0]?.photoUrl ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                <img
                                  src={booking.hotelBookings[0].photoUrl}
                                  alt={booking.destination}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : booking.bookingType === 'flight' && booking.flightBookings?.[0]?.airlineCode ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200 p-2 flex items-center justify-center">
                                <img
                                  src={`https://images.kiwi.com/airlines/64/${booking.flightBookings[0].airlineCode}.png`}
                                  alt={booking.flightBookings[0].airline}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    // Fallback to icon if airline logo fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg></div>';
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-lg bg-gray-50 flex-shrink-0">
                                {booking.bookingType === 'flight' ? (
                                  <Plane className="w-4 h-4 text-gray-700" />
                                ) : (
                                  <Hotel className="w-4 h-4 text-gray-700" />
                                )}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {booking.bookingReference}
                              </h3>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {booking.bookingType === 'flight' ? 'Flight' : 'Hotel'}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-2 py-1 rounded inline-flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {getStatusIcon(booking.status)}
                            {formatStatus(booking.status)}
                          </span>
                        </div>

                        {/* Route - Simplified */}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <div className="flex items-center gap-2 text-gray-900 font-medium flex-1 min-w-0">
                            {booking.bookingType === 'flight' && booking.flightBookings?.[0] ? (
                              <>
                                <span className="truncate">{booking.flightBookings[0].departureAirport}</span>
                                <span className="text-gray-400 flex-shrink-0">→</span>
                                <span className="truncate">{booking.flightBookings[0].arrivalAirport}</span>
                              </>
                            ) : (
                              <>
                                {booking.origin && <span className="truncate">{booking.origin}</span>}
                                {booking.origin && <span className="text-gray-400 flex-shrink-0">→</span>}
                                <span className="truncate">{booking.destination}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Info Grid - Cleaner */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <div>
                              <div className="text-gray-500">
                                {booking.bookingType === 'hotel' ? 'Check-in - Check-out' : 'Travel Date'}
                              </div>
                              <div className="font-medium text-gray-900">
                                {formatDate(booking.departureDate)}
                                {booking.returnDate && booking.bookingType === 'hotel' && (
                                  <> - {formatDate(booking.returnDate)}</>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <div className="min-w-0 flex-1">
                              <div className="text-gray-500">
                                {booking.bookingType === 'hotel' ? 'Guests' : 'Travelers'}
                              </div>
                              <div className="font-medium text-gray-900 truncate">
                                {booking.passengerDetails?.[0] ? (
                                  <>
                                    {booking.passengerDetails[0].firstName} {booking.passengerDetails[0].lastName}
                                    {booking.passengers > 1 && <span className="text-gray-400"> +{booking.passengers - 1}</span>}
                                  </>
                                ) : booking.hotelBookings?.[0]?.rooms?.[0]?.guests?.[0] ? (
                                  <>
                                    {booking.hotelBookings[0].rooms[0].guests[0].firstName} {booking.hotelBookings[0].rooms[0].guests[0].lastName}
                                    {booking.passengers > 1 && <span className="text-gray-400"> +{booking.passengers - 1}</span>}
                                  </>
                                ) : (
                                  <>{booking.passengers} {booking.passengers === 1 ? 'person' : 'people'}</>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price - Bottom */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500">Total Cost</div>
                          <div className="text-base font-semibold text-gray-900">
                            {booking.currency} ${booking.totalPrice.toLocaleString('en-US')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                  disabled={pagination.page === 1}
                  className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>

                <span className="text-xs text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        ) : viewMode === 'calendar' ? (
          /* Calendar View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-gray-700">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {(() => {
                  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
                  const days = [];

                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(<div key={`empty-${i}`} className="h-20 md:h-28 bg-gray-50 border border-gray-200"></div>);
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dayBookings = getBookingsForDate(date);
                    const isToday = new Date().toDateString() === date.toDateString();

                    days.push(
                      <div
                        key={day}
                        className={`h-20 md:h-28 border p-1 md:p-2 overflow-y-auto ${
                          isToday ? 'bg-[#F7FEE7] border-[#ADF802]' : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-xs md:text-sm font-semibold mb-1 ${isToday ? 'text-[#ADF802]' : 'text-gray-700'}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.slice(0, 2).map((booking) => (
                            <Link
                              key={booking.id}
                              href={`/dashboard/bookings/${booking.id}`}
                              className="block"
                            >
                              <div className={`text-[9px] md:text-[10px] p-1 rounded border ${getStatusColor(booking.status)} hover:shadow-md transition-shadow`}>
                                <div className="flex items-center gap-1">
                                  {booking.bookingType === 'flight' ? (
                                    <Plane className="w-2 h-2 md:w-3 md:h-3" />
                                  ) : (
                                    <Hotel className="w-2 h-2 md:w-3 md:h-3" />
                                  )}
                                  <span className="font-medium truncate">{booking.destination}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="text-[9px] md:text-[10px] text-gray-600 font-medium pl-1">
                              +{dayBookings.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return days;
                })()}
              </div>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                      Reference
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                      Route
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                      Dates
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                      Passengers
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 md:px-4 py-3 text-xs md:text-sm font-medium text-gray-900">
                        {booking.bookingReference}
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-2">
                          {booking.bookingType === 'flight' ? (
                            <>
                              <Plane className="w-4 h-4 text-gray-700" />
                              <span className="text-xs md:text-sm text-gray-700">Flight</span>
                            </>
                          ) : (
                            <>
                              <Hotel className="w-4 h-4 text-gray-700" />
                              <span className="text-xs md:text-sm text-gray-700">Hotel</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-1 text-xs md:text-sm text-gray-700">
                          {booking.origin && <span className="font-medium">{booking.origin}</span>}
                          {booking.origin && <span>→</span>}
                          <span className="font-medium">{booking.destination}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-gray-700">
                        <div>{formatDate(booking.departureDate)}</div>
                        {booking.returnDate && (
                          <div className="text-xs text-gray-500">to {formatDate(booking.returnDate)}</div>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-gray-700">
                        {booking.passengers}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-xs md:text-sm font-medium text-gray-900">
                        ${booking.totalPrice.toLocaleString('en-US')}
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {formatStatus(booking.status)}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-xs md:text-sm"
                        >
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden md:inline">View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
