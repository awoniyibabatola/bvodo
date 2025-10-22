'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Table2,
  Plane,
  Hotel,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye,
  User,
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';

interface Booking {
  id: string;
  bookingReference: string;
  bookingType: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  totalPrice: number;
  currency: string;
  status: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

type ViewMode = 'calendar' | 'table';

export default function CompanyAdminBookingsPage() {
  const [user, setUser] = useState({
    name: 'User',
    role: 'traveler',
    email: '',
    organization: '',
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(getApiEndpoint('company-admin/trips'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Render Calendar View
  const renderCalendarView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayBookings = getBookingsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 md:h-32 border border-gray-200 p-1 md:p-2 overflow-y-auto ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-xs md:text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayBookings.slice(0, 3).map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="block"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`text-[10px] p-1 rounded border ${getStatusColor(booking.status)} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-1">
                    {booking.bookingType === 'FLIGHT' ? (
                      <Plane className="w-2 h-2 md:w-3 md:h-3" />
                    ) : (
                      <Hotel className="w-2 h-2 md:w-3 md:h-3" />
                    )}
                    <span className="font-medium truncate">{booking.user.firstName}</span>
                  </div>
                  <div className="truncate">{booking.destination}</div>
                </div>
              </Link>
            ))}
            {dayBookings.length > 3 && (
              <div className="text-[10px] text-gray-600 font-medium pl-1">
                +{dayBookings.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">{monthName}</h2>
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

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-xs md:text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>
          {/* Days Grid */}
          <div className="grid grid-cols-7">{days}</div>
        </div>
      </div>
    );
  };

  // Render Table View
  const renderTableView = () => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                  Reference
                </th>
                <th className="px-3 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">
                  Traveler
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
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 md:px-4 py-3 text-xs md:text-sm font-medium text-gray-900">
                    {booking.bookingReference}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-medium text-gray-900">
                          {booking.user.firstName} {booking.user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{booking.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2">
                      {booking.bookingType === 'FLIGHT' ? (
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
                      <span className="font-medium">{booking.origin}</span>
                      <span>→</span>
                      <span className="font-medium">{booking.destination}</span>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs md:text-sm text-gray-700">
                    <div>
                      {new Date(booking.departureDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    {booking.returnDate && (
                      <div className="text-xs text-gray-500">
                        to{' '}
                        {new Date(booking.returnDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs md:text-sm font-medium text-gray-900">
                    {booking.currency} {booking.totalPrice.toLocaleString()}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Link
                      href={`/dashboard/bookings/${booking.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs md:text-sm"
                    >
                      <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <UnifiedNavBar currentPage="bookings" user={user} />

      <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Company Bookings</h1>
          <p className="text-sm md:text-base text-gray-600">View and manage all bookings in your organization</p>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden md:inline">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs md:text-sm">
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline">Filter</span>
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs md:text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Total Bookings</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">{bookings.length}</div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-xl md:text-2xl font-bold text-yellow-600">
              {bookings.filter((b) => b.status.toLowerCase() === 'pending').length}
            </div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Confirmed</div>
            <div className="text-xl md:text-2xl font-bold text-green-600">
              {bookings.filter((b) => ['confirmed', 'approved'].includes(b.status.toLowerCase())).length}
            </div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs md:text-sm text-gray-600 mb-1">Total Spend</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              ${bookings.reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'calendar' ? renderCalendarView() : renderTableView()}
      </div>
    </div>
  );
}
