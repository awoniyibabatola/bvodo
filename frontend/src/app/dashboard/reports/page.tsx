'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  Download,
  Calendar,
  Plane,
  Hotel,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Filter
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface Booking {
  id: string;
  bookingReference: string;
  bookingType: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  totalPrice: string;
  currency: string;
  status: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  bookedAt: string;
}

interface OrganizationStats {
  organization: {
    name: string;
    totalCredits: string;
    availableCredits: string;
    usedCredits: string;
  };
  users: {
    total: number;
    active: number;
    pending: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
  };
  totalSpend: string;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter, startDate, endDate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch stats
      const statsResponse = await fetch(getApiEndpoint('company-admin/stats'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch trips with filters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('bookingType', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const tripsResponse = await fetch(`${getApiEndpoint('company-admin/trips')}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const tripsData = await tripsResponse.json();
      if (tripsData.success) {
        setBookings(tripsData.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const flightBookings = bookings.filter(b => b.bookingType === 'flight');
    const hotelBookings = bookings.filter(b => b.bookingType === 'hotel');

    const totalSpent = bookings.reduce((sum, b) => {
      if (b.status === 'confirmed' || b.status === 'completed') {
        return sum + parseFloat(b.totalPrice);
      }
      return sum;
    }, 0);

    const uniqueDestinations = new Set(bookings.map(b => b.destination)).size;

    return {
      flights: flightBookings.length,
      hotels: hotelBookings.length,
      totalSpent,
      destinations: uniqueDestinations,
    };
  };

  const metrics = calculateMetrics();

  const exportToCSV = () => {
    const headers = ['Booking Ref', 'Type', 'Traveler', 'Origin', 'Destination', 'Departure', 'Return', 'Amount', 'Status', 'Booked Date'];
    const rows = bookings.map(b => [
      b.bookingReference,
      b.bookingType,
      `${b.user.firstName} ${b.user.lastName}`,
      b.origin || '-',
      b.destination,
      b.departureDate,
      b.returnDate || '-',
      `${b.currency} ${parseFloat(b.totalPrice).toFixed(2)}`,
      b.status,
      new Date(b.bookedAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      <div className="w-full px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Travel Reports</h1>
                <p className="text-gray-600">Organization travel analytics and insights</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Total Flights</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{metrics.flights}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <Hotel className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Total Hotels</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">{metrics.hotels}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Total Spend</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                ${metrics.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Destinations</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">{metrics.destinations}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="flight">Flights</option>
                <option value="hotel">Hotels</option>
                <option value="package">Packages</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Bookings</h2>
            <p className="text-sm text-gray-600 mt-1">{bookings.length} bookings found</p>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings found with current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Ref</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Traveler</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Dates</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="font-mono text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {booking.bookingReference}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {booking.bookingType === 'flight' ? (
                            <Plane className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Hotel className="w-4 h-4 text-purple-600" />
                          )}
                          <span className="capitalize text-sm">{booking.bookingType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {booking.user.firstName} {booking.user.lastName}
                          </div>
                          <div className="text-gray-500">{booking.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.origin ? `${booking.origin} → ` : ''}{booking.destination}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.departureDate).toLocaleDateString()}
                          {booking.returnDate && ` - ${new Date(booking.returnDate).toLocaleDateString()}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {booking.currency} {parseFloat(booking.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                          booking.status === 'confirmed' || booking.status === 'completed'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : booking.status === 'awaiting_confirmation'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : booking.status === 'pending' || booking.status === 'pending_approval'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : booking.status === 'cancelled' || booking.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {booking.status === 'awaiting_confirmation' ? 'Pending Confirmation' : booking.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
