'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  Users,
  Plane,
  Hotel,
  DollarSign,
  MapPin,
  Calendar,
  Award,
  Activity,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
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

type TabType = 'overview' | 'travelers' | 'active';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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

      // Fetch all trips
      const tripsResponse = await fetch(getApiEndpoint('company-admin/trips'), {
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

  const getBookingsOverTime = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        flights: 0,
        hotels: 0,
      };
    });

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.bookedAt);
      const monthIndex = last6Months.findIndex(
        m => m.month === bookingDate.toLocaleDateString('en-US', { month: 'short' }) &&
             m.year === bookingDate.getFullYear()
      );

      if (monthIndex !== -1) {
        if (booking.bookingType === 'flight') {
          last6Months[monthIndex].flights += 1;
        } else if (booking.bookingType === 'hotel') {
          last6Months[monthIndex].hotels += 1;
        }
      }
    });

    return last6Months;
  };

  const getSpendByType = () => {
    const flightSpend = bookings
      .filter(b => b.bookingType === 'flight' && (b.status === 'confirmed' || b.status === 'completed'))
      .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

    const hotelSpend = bookings
      .filter(b => b.bookingType === 'hotel' && (b.status === 'confirmed' || b.status === 'completed'))
      .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

    return [
      { name: 'Flights', value: flightSpend, color: '#1f2937' },
      { name: 'Hotels', value: hotelSpend, color: '#ADF802' },
    ];
  };

  const getTopTravelers = () => {
    const userStats = new Map();

    bookings.forEach(booking => {
      const userId = booking.user.id;
      const userName = `${booking.user.firstName} ${booking.user.lastName}`;

      if (!userStats.has(userId)) {
        userStats.set(userId, {
          name: userName,
          bookings: 0,
          spend: 0,
        });
      }

      const stats = userStats.get(userId);
      stats.bookings += 1;
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        stats.spend += parseFloat(booking.totalPrice);
      }
    });

    return Array.from(userStats.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);
  };

  const getActiveTrips = () => {
    const now = new Date();
    return bookings.filter(booking => {
      const departureDate = new Date(booking.departureDate);
      const returnDate = booking.returnDate ? new Date(booking.returnDate) : departureDate;

      return (
        (booking.status === 'confirmed' || booking.status === 'completed') &&
        departureDate <= now &&
        returnDate >= now
      );
    });
  };

  const getTopDestinations = () => {
    const destStats = new Map();

    bookings.forEach(booking => {
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        const count = destStats.get(booking.destination) || 0;
        destStats.set(booking.destination, count + 1);
      }
    });

    return Array.from(destStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([destination, count]) => ({ destination, count }));
  };

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
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const metrics = calculateMetrics();
  const bookingsOverTime = getBookingsOverTime();
  const spendByType = getSpendByType();
  const topTravelers = getTopTravelers();
  const activeTrips = getActiveTrips();
  const topDestinations = getTopDestinations();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-xs md:text-sm text-gray-600">Insights and trends for your organization</p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Key Metrics - Matrix Table */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">Metric</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase">Value</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase hidden md:table-cell">% of Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase hidden lg:table-cell">Indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <Plane className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">Total Flights</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold text-gray-900">{metrics.flights}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {bookings.length > 0 ? ((metrics.flights / bookings.length) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="w-full bg-gray-100 rounded-full h-2 max-w-[200px]">
                      <div
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: bookings.length > 0 ? `${(metrics.flights / bookings.length) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <Hotel className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">Total Hotels</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold text-gray-900">{metrics.hotels}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {bookings.length > 0 ? ((metrics.hotels / bookings.length) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="w-full bg-gray-100 rounded-full h-2 max-w-[200px]">
                      <div
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: bookings.length > 0 ? `${(metrics.hotels / bookings.length) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition bg-[#ADF802]/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#ADF802] rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-gray-900" />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">Total Spend</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold text-gray-900">
                      ${metrics.totalSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-sm text-gray-600">100%</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="w-full bg-gray-100 rounded-full h-2 max-w-[200px]">
                      <div className="bg-[#ADF802] h-2 rounded-full transition-all" style={{ width: '100%' }}></div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">Unique Destinations</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold text-gray-900">{metrics.destinations}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {bookings.length > 0 ? ((metrics.destinations / bookings.length) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="w-full bg-gray-100 rounded-full h-2 max-w-[200px]">
                      <div
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: bookings.length > 0 ? `${Math.min((metrics.destinations / bookings.length) * 100, 100)}%` : '0%' }}
                      ></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-1 md:p-1.5 inline-flex gap-1 md:gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('travelers')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap ${
                activeTab === 'travelers'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Award className="w-4 h-4" />
              Top Travelers
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap ${
                activeTab === 'active'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Currently Traveling
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Bookings Over Time Chart */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900">Bookings Trend</h3>
                  <p className="text-xs text-gray-600">Last 6 months</p>
                </div>
              </div>
              <div className="h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="flights"
                      stroke="#1f2937"
                      strokeWidth={3}
                      dot={{ fill: '#1f2937', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Flights"
                    />
                    <Line
                      type="monotone"
                      dataKey="hotels"
                      stroke="#ADF802"
                      strokeWidth={3}
                      dot={{ fill: '#ADF802', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Hotels"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Bookings Matrix Table */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900">Monthly Breakdown</h3>
                    <p className="text-xs text-gray-600">Detailed month-by-month data</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Month</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Flights</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Hotels</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookingsOverTime.map((month, index) => {
                      const total = month.flights + month.hotels;
                      const prevTotal = index > 0 ? bookingsOverTime[index - 1].flights + bookingsOverTime[index - 1].hotels : 0;
                      const trend = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
                      return (
                        <tr key={`${month.month}-${month.year}`} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900 text-sm">
                                {month.month} {month.year}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-900/5 text-gray-900">
                              {month.flights}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-[#ADF802]/10 text-gray-900">
                              {month.hotels}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-gray-900">{total}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {index > 0 && (
                              <div className="flex items-center gap-2">
                                <div className={`text-xs font-medium ${
                                  trend > 0 ? 'text-green-700' : trend < 0 ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      trend > 0 ? 'bg-green-500' : trend < 0 ? 'bg-red-500' : 'bg-gray-400'
                                    }`}
                                    style={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {bookingsOverTime.reduce((sum, m) => sum + m.flights, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {bookingsOverTime.reduce((sum, m) => sum + m.hotels, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {bookingsOverTime.reduce((sum, m) => sum + m.flights + m.hotels, 0)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spend by Type - Table */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900">Spend by Type</h3>
                    <p className="text-xs text-gray-600">Total distribution breakdown</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">% Share</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Visual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {spendByType.map((item, index) => {
                      const totalSpend = spendByType.reduce((sum, s) => sum + s.value, 0);
                      const percentage = totalSpend > 0 ? (item.value / totalSpend) * 100 : 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {item.name === 'Flights' ? (
                                <Plane className="w-4 h-4 text-gray-700" />
                              ) : (
                                <Hotel className="w-4 h-4 text-gray-700" />
                              )}
                              <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-gray-900 text-sm">
                              ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-900">
                              {percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="w-full bg-gray-100 rounded-full h-2 max-w-[300px]">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: item.color
                                }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        ${spendByType.reduce((sum, s) => sum + s.value, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">100%</td>
                      <td className="px-4 py-3 hidden lg:table-cell"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Destinations - Table */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900">Top Destinations</h3>
                    <p className="text-xs text-gray-600">Most visited locations</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Destination</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Bookings</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Popularity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topDestinations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                          No destinations data available
                        </td>
                      </tr>
                    ) : (
                      topDestinations.map((dest, index) => (
                        <tr key={dest.destination} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 text-white font-bold text-sm">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium text-gray-900 text-sm">{dest.destination}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-[#ADF802]/20 text-gray-900 border border-[#ADF802]/30">
                              {dest.count} trips
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="w-full bg-gray-100 rounded-full h-2 max-w-[200px]">
                              <div
                                className="bg-[#ADF802] h-2 rounded-full transition-all"
                                style={{ width: `${(dest.count / topDestinations[0].count) * 100}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Flights Table */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900">All Flights</h3>
                    <p className="text-xs text-gray-600">{bookings.filter(b => b.bookingType === 'flight').length} flight bookings</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Traveler</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.filter(b => b.bookingType === 'flight').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                          No flight bookings available
                        </td>
                      </tr>
                    ) : (
                      bookings.filter(b => b.bookingType === 'flight').slice(0, 10).map(flight => (
                        <tr key={flight.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/bookings/${flight.id}`}
                              className="font-mono text-xs text-gray-900 hover:text-gray-700 font-semibold hover:underline"
                            >
                              {flight.bookingReference}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {flight.user.firstName} {flight.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{flight.user.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-900">
                              <Plane className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {flight.origin} → {flight.destination}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="text-sm text-gray-600 whitespace-nowrap">
                              {new Date(flight.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                              {flight.currency} {parseFloat(flight.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              flight.status === 'confirmed' || flight.status === 'completed'
                                ? 'bg-[#ADF802]/20 text-gray-900 border border-[#ADF802]/30'
                                : flight.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}>
                              {flight.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {bookings.filter(b => b.bookingType === 'flight').length > 10 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-600">Showing 10 of {bookings.filter(b => b.bookingType === 'flight').length} flights</p>
                </div>
              )}
            </div>

            {/* All Hotels Table */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#ADF802] rounded-full"></div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900">All Hotels</h3>
                    <p className="text-xs text-gray-600">{bookings.filter(b => b.bookingType === 'hotel').length} hotel bookings</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Check-in</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.filter(b => b.bookingType === 'hotel').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                          No hotel bookings available
                        </td>
                      </tr>
                    ) : (
                      bookings.filter(b => b.bookingType === 'hotel').slice(0, 10).map(hotel => (
                        <tr key={hotel.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/bookings/${hotel.id}`}
                              className="font-mono text-xs text-gray-900 hover:text-gray-700 font-semibold hover:underline"
                            >
                              {hotel.bookingReference}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {hotel.user.firstName} {hotel.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{hotel.user.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-900">
                              <Hotel className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="whitespace-nowrap">{hotel.destination}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="text-sm text-gray-600 whitespace-nowrap">
                              {new Date(hotel.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                              {hotel.currency} {parseFloat(hotel.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              hotel.status === 'confirmed' || hotel.status === 'completed'
                                ? 'bg-[#ADF802]/20 text-gray-900 border border-[#ADF802]/30'
                                : hotel.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}>
                              {hotel.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {bookings.filter(b => b.bookingType === 'hotel').length > 10 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-600">Showing 10 of {bookings.filter(b => b.bookingType === 'hotel').length} hotels</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'travelers' && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">Top Travelers</h3>
                <p className="text-xs text-gray-600">Most active users</p>
              </div>
            </div>

            {topTravelers.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-sm">No traveler data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-[400px] md:h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topTravelers} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'spend') {
                            return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Total Spend'];
                          }
                          return [value, 'Bookings'];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                      <Bar
                        dataKey="bookings"
                        fill="#1f2937"
                        radius={[0, 8, 8, 0]}
                        name="Bookings"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table view for more details */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Traveler</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Bookings</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topTravelers.map((traveler, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 text-white font-bold text-sm">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900 text-sm">{traveler.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg text-sm font-semibold text-gray-900">
                              {traveler.bookings}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-gray-900 text-sm">
                              ${traveler.spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-[#ADF802] rounded-full"></div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900">Currently Traveling</h3>
                  <p className="text-xs text-gray-600">{activeTrips.length} active trips</p>
                </div>
              </div>
            </div>

            {activeTrips.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-sm">No active trips at the moment</p>
                <p className="text-gray-500 text-xs mt-2">Trips will appear here when travelers are on their journey</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Traveler</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Dates</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeTrips.map(trip => {
                      const initials = `${trip.user.firstName.charAt(0)}${trip.user.lastName.charAt(0)}`.toUpperCase();
                      return (
                        <tr key={trip.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              trip.bookingType === 'flight'
                                ? 'bg-gray-900'
                                : 'bg-[#ADF802]'
                            }`}>
                              {trip.bookingType === 'flight' ? (
                                <Plane className="w-4 h-4 text-white" />
                              ) : (
                                <Hotel className="w-4 h-4 text-gray-900" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/bookings/${trip.id}`}
                              className="font-mono text-xs text-gray-900 hover:text-gray-700 font-semibold hover:underline"
                            >
                              {trip.bookingReference}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{initials}</span>
                              </div>
                              <div className="text-sm min-w-0">
                                <div className="font-medium text-gray-900">
                                  {trip.user.firstName} {trip.user.lastName}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{trip.user.email}</div>
                              </div>
                            </div>
                          </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-900">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {trip.origin ? `${trip.origin} → ` : ''}{trip.destination}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {new Date(trip.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {trip.returnDate && ` - ${new Date(trip.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                            {trip.currency} {parseFloat(trip.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#ADF802]/20 text-gray-900 border border-[#ADF802]/30">
                            <Activity className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
