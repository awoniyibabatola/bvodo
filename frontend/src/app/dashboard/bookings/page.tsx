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
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
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
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'approved':
      case 'awaiting_confirmation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
      case 'pending_approval':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Plane className="text-white w-5 h-5" />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  bvodo
                </span>
              </Link>
              <div className="hidden md:flex gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/bookings"
                  className="px-4 py-2 text-gray-900 font-medium bg-gray-100 rounded-xl"
                >
                  Bookings
                </Link>
                <Link
                  href="/dashboard/flights/search"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                >
                  Flights
                </Link>
                <Link
                  href="/dashboard/hotels/search"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                >
                  Hotels
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            My Bookings
          </h1>
          <p className="text-gray-600">View and manage all your travel bookings</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by reference, destination, or traveler..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="flight">Flights</option>
                <option value="hotel">Hotels</option>
                <option value="package">Packages</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">Start planning your next trip!</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard/flights/search"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Book a Flight
              </Link>
              <Link
                href="/dashboard/hotels/search"
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 transition"
              >
                Book a Hotel
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="group relative"
                >
                  {/* Glow effect */}
                  <div className={`absolute -inset-0.5 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500 ${
                    booking.bookingType === 'flight'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}></div>

                  {/* Card */}
                  <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    {/* Top accent bar */}
                    <div className={`h-2 ${
                      booking.bookingType === 'flight'
                        ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600'
                        : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600'
                    }`}></div>

                    <div className="p-8">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-6 flex-1">
                          {/* Icon with animated background */}
                          <div className="relative">
                            <div className={`absolute inset-0 rounded-2xl blur-md opacity-50 ${
                              booking.bookingType === 'flight'
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                : 'bg-gradient-to-br from-purple-500 to-pink-500'
                            }`}></div>
                            <div
                              className={`relative p-4 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300 ${
                                booking.bookingType === 'flight'
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
                              }`}
                            >
                              {booking.bookingType === 'flight' ? (
                                <Plane className="w-7 h-7 text-white" />
                              ) : (
                                <Hotel className="w-7 h-7 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Booking Info */}
                          <div className="flex-1 min-w-0">
                            {/* Header with reference and badges */}
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                {booking.bookingReference}
                              </h3>
                              <span
                                className={`text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border-2 shadow-sm ${getStatusColor(
                                  booking.status
                                )}`}
                              >
                                {getStatusIcon(booking.status)}
                                {formatStatus(booking.status)}
                              </span>
                              {booking.isGroupBooking && (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-2 border-indigo-200 shadow-sm">
                                  <Users className="w-3.5 h-3.5" />
                                  Group ({booking.numberOfTravelers})
                                </span>
                              )}
                            </div>

                            {/* Route/Destination Info */}
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 mb-4 border border-gray-100">
                              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <span className="text-lg">
                                  {booking.origin && `${booking.origin} → `}
                                  {booking.destination}
                                </span>
                              </div>
                              <div className="flex items-center gap-6 text-sm text-gray-600 pl-7">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{formatDate(booking.departureDate)}</span>
                                  {booking.returnDate && (
                                    <span className="font-medium">→ {formatDate(booking.returnDate)}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">
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
                                  <Users className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="text-xs font-semibold text-gray-700 mb-1">
                                      {booking.isGroupBooking && booking.groupName ? (
                                        <span className="text-indigo-900">{booking.groupName}</span>
                                      ) : (
                                        <span>{booking.bookingType === 'flight' ? 'Passengers' : 'Guests'}:</span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {booking.passengerDetails.slice(0, 3).map((passenger, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                                          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                                            {passenger.firstName.charAt(0)}{passenger.lastName.charAt(0)}
                                          </div>
                                          <span className="text-xs font-medium text-gray-900">
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
                              <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px] shadow-sm">
                                  {booking.user.firstName.charAt(0)}{booking.user.lastName.charAt(0)}
                                </div>
                                <span className="text-xs">
                                  Booked by <span className="font-semibold text-gray-700">{booking.user.firstName} {booking.user.lastName}</span> on {formatDate(booking.bookedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="text-right ml-6 flex flex-col items-end gap-4">
                          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl px-6 py-4 border-2 border-blue-100 shadow-sm">
                            <div className="text-xs text-gray-600 font-medium mb-1">Total Price</div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              ${booking.totalPrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium mt-1">{booking.currency}</div>
                          </div>
                          <Link
                            href={`/dashboard/bookings/${booking.id}`}
                            className="group/btn relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                            <Eye className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">View Details</span>
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
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                  disabled={pagination.page === 1}
                  className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-sm text-gray-600">
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
                  className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
