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
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  flightBookings?: any[];
  hotelBookings?: any[];
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
    // All statuses use grayscale colors for minimal corporate design
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
          </h1>
          <p className="text-xs text-gray-600">View and manage all your travel bookings</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

            {/* Type Filter */}
            <div>
              <select
                value={filters.bookingType}
                onChange={(e) => setFilters({ ...filters, bookingType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="">All Types</option>
                <option value="flight">Flights</option>
                <option value="hotel">Hotels</option>
                <option value="package">Packages</option>
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
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="relative"
                >
                  {/* Card */}
                  <div className="bg-white rounded overflow-hidden border border-gray-200 hover:border-gray-300 transition">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Icon */}
                          <div className="p-2 rounded border border-gray-200 bg-white">
                            {booking.bookingType === 'flight' ? (
                              <Plane className="w-4 h-4 text-gray-700" />
                            ) : (
                              <Hotel className="w-4 h-4 text-gray-700" />
                            )}
                          </div>

                          {/* Booking Info */}
                          <div className="flex-1 min-w-0">
                            {/* Header with reference and badges */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-sm font-bold text-gray-900">
                                {booking.bookingReference}
                              </h3>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 border ${getStatusColor(
                                  booking.status
                                )}`}
                              >
                                {getStatusIcon(booking.status)}
                                {formatStatus(booking.status)}
                              </span>
                              {booking.isGroupBooking && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 bg-gray-50 text-gray-700 border border-gray-200">
                                  <Users className="w-2.5 h-2.5" />
                                  Group ({booking.numberOfTravelers})
                                </span>
                              )}
                            </div>

                            {/* Route/Destination Info */}
                            <div className="bg-gray-50 rounded p-2 mb-2 border border-gray-200">
                              <div className="flex items-center gap-1.5 text-gray-900 font-semibold mb-1">
                                <MapPin className="w-3 h-3 text-gray-600" />
                                <span className="text-xs">
                                  {booking.origin && `${booking.origin} → `}
                                  {booking.destination}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-[10px] text-gray-600 pl-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-500" />
                                  <span>{formatDate(booking.departureDate)}</span>
                                  {booking.returnDate && (
                                    <span>→ {formatDate(booking.returnDate)}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-500" />
                                  <span>
                                    {booking.passengers}{' '}
                                    {booking.passengers === 1 ? 'passenger' : 'passengers'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Footer info */}
                            <div className="space-y-3">
                              {/* Guest Names */}
                              {booking.passengerDetails && booking.passengerDetails.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <Users className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="text-[10px] font-semibold text-gray-700 mb-1">
                                      {booking.isGroupBooking && booking.groupName ? (
                                        <span className="text-gray-900">{booking.groupName}</span>
                                      ) : (
                                        <span>{booking.bookingType === 'flight' ? 'Passengers' : 'Guests'}:</span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {booking.passengerDetails.slice(0, 3).map((passenger, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded">
                                          <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-[9px]">
                                            {passenger.firstName.charAt(0)}{passenger.lastName.charAt(0)}
                                          </div>
                                          <span className="text-[10px] font-medium text-gray-900">
                                            {passenger.firstName} {passenger.lastName}
                                          </span>
                                        </div>
                                      ))}
                                      {booking.passengerDetails.length > 3 && (
                                        <div className="flex items-center px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg">
                                          <span className="text-xs font-semibold text-gray-600">
                                            +{booking.passengerDetails.length - 3} more
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Booker Info */}
                              <div className="flex items-center gap-1.5 text-sm text-gray-500 pt-2 border-t border-gray-100">
                                <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold text-[9px]">
                                  {booking.user.firstName.charAt(0)}{booking.user.lastName.charAt(0)}
                                </div>
                                <span className="text-[10px]">
                                  Booked by <span className="font-semibold text-gray-700">{booking.user.firstName} {booking.user.lastName}</span> on {formatDate(booking.bookedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="text-right ml-4 flex flex-col items-end gap-2">
                          <div className="bg-gray-50 rounded px-3 py-2 border border-gray-200">
                            <div className="text-[10px] text-gray-600 mb-0.5">Total Price</div>
                            <div className="text-sm font-bold text-gray-900">
                              ${booking.totalPrice.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{booking.currency}</div>
                          </div>
                          <Link
                            href={`/dashboard/bookings/${booking.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded text-xs font-semibold hover:bg-gray-800 transition"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
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
                        className={`h-20 md:h-28 border border-gray-200 p-1 md:p-2 overflow-y-auto ${
                          isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-xs md:text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
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
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
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
                              <Plane className="w-4 h-4 text-blue-600" />
                              <span className="text-xs md:text-sm text-gray-700">Flight</span>
                            </>
                          ) : (
                            <>
                              <Hotel className="w-4 h-4 text-purple-600" />
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
                        ${booking.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {formatStatus(booking.status)}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs md:text-sm"
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
