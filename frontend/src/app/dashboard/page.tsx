'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plane,
  Hotel,
  CheckCircle,
  Users,
  Clock,
  ChevronRight,
  TrendingUp,
  Calendar,
  MapPin,
  UserPlus,
  DollarSign,
  BarChart3,
  Search,
  ArrowUpRight,
  Sparkles,
  X
} from 'lucide-react';
import AIChatbox from '@/components/AIChatbox';
import CreditCard from '@/components/CreditCard';
import UserMenu from '@/components/UserMenu';
import { getApiEndpoint } from '@/lib/api-config';

interface DashboardStats {
  credits: {
    available: number;
    used: number;
    held: number;
    total: number;
    usagePercentage: number;
  };
  stats: {
    totalBookings: number;
    hotelsBooked: number;
    hotelNights: number;
    flightsTaken: number;
    destinations: number;
  };
  recentBookings: Array<{
    type: string;
    route: string;
    traveler: string;
    date: string;
    status: string;
    amount: string;
  }>;
  organization: {
    name: string;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState({
    name: 'John Doe',
    role: 'admin',
    organization: 'Acme Corporation',
    avatar: '',
  });
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatMessage, setAiChatMessage] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    const orgData = localStorage.getItem('organization');

    if (userData && orgData) {
      const parsedUser = JSON.parse(userData);
      const parsedOrg = JSON.parse(orgData);

      setUser({
        name: `${parsedUser.firstName} ${parsedUser.lastName}`,
        role: parsedUser.role,
        organization: parsedOrg.name,
        avatar: parsedUser.avatarUrl || '',
      });
    }

    // Fetch dashboard stats
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No auth token found');
        setIsLoading(false);
        return;
      }

      const response = await fetch(getApiEndpoint('dashboard/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAISuggestionClick = (message: string) => {
    setAiChatMessage(message);
    setShowAIChat(true);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
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
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">bvodo</span>
              </Link>
              <div className="hidden md:flex gap-2">
                <Link href="/dashboard" className="px-4 py-2 text-gray-900 font-medium bg-gray-100 rounded-xl">Dashboard</Link>
                {user.role === 'super_admin' ? (
                  <Link href="/super-admin" className="px-4 py-2 text-white font-medium bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:shadow-lg transition">Super Admin</Link>
                ) : (
                  <>
                    <Link href="/dashboard/bookings" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Bookings</Link>
                    <Link href="/dashboard/flights/search" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Flights</Link>
                    <Link href="/dashboard/hotels/search" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Hotels</Link>
                    {(user.role === 'admin' || user.role === 'manager' || user.role === 'company_admin') && (
                      <Link href="/dashboard/approvals" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Approvals</Link>
                    )}
                    {(user.role === 'admin' || user.role === 'company_admin') && (
                      <>
                        <Link href="/dashboard/users" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Users</Link>
                        <Link href="/dashboard/reports" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Reports</Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <UserMenu user={user} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              Welcome back, {user.name.split(' ')[0]}!
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <p className="text-sm">{user.organization} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* AI Quick Booking Suggestions - Horizontal Slider */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-cyan-500" />
            <h2 className="text-lg font-bold text-gray-900">Book with AI Assistant</h2>
            <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-full">NEW</span>
          </div>
          {/* Horizontal scrollable container */}
          <div className="overflow-x-auto pb-4 pt-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-3">
            {/* Suggestion 1 - Quick Flight */}
            <button
              onClick={() => handleAISuggestionClick("I need a flight from Lagos to Nairobi next Tuesday for 2 people")}
              className="group relative text-left flex-shrink-0 w-[280px] md:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-lg opacity-15 group-hover:opacity-25 transition"></div>
              <div className="relative bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-5 hover:border-cyan-400 transition-all hover:scale-105 hover:shadow-md h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                    <Plane className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Quick Flight Booking</h3>
                    <p className="text-sm text-gray-600">"Flight from Lagos to Nairobi..."</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-xs text-cyan-700 font-medium">
                  <span>Try AI Chat</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>

            {/* Suggestion 2 - Hotel with Preferences */}
            <button
              onClick={() => handleAISuggestionClick("Find me a luxury hotel in Dubai with pool and gym, checking in December 25th for 3 nights")}
              className="group relative text-left flex-shrink-0 w-[280px] md:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-15 group-hover:opacity-25 transition"></div>
              <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5 hover:border-purple-400 transition-all hover:scale-105 hover:shadow-md h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                    <Hotel className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Hotel with Details</h3>
                    <p className="text-sm text-gray-600">"Luxury hotel in Dubai with pool..."</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-700 font-medium">
                  <span>Try AI Chat</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>

            {/* Suggestion 3 - Complex Trip */}
            <button
              onClick={() => handleAISuggestionClick("I need flight and hotel for a business trip to London from Lagos, departing next month for 5 days")}
              className="group relative text-left flex-shrink-0 w-[280px] md:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-15 group-hover:opacity-25 transition"></div>
              <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 hover:border-emerald-400 transition-all hover:scale-105 hover:shadow-md h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Complete Trip Planning</h3>
                    <p className="text-sm text-gray-600">"Flight + hotel to London..."</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <span>Try AI Chat</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - Credit Card + 4 Small Cards */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          {/* Credit Card - Flippable */}
          <div
            className="group relative cursor-pointer perspective-1000 flex-shrink-0"
            onClick={() => setIsCardFlipped(!isCardFlipped)}
            style={{ width: '450px', height: '280px', maxWidth: '100%' }}
          >
            <div className={`absolute inset-0 transition-transform duration-700 transform-style-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front of Card */}
              <div className="absolute w-full h-full backface-hidden">
                <CreditCard
                  organizationName={user.organization}
                  availableBalance={dashboardStats?.credits.available || 0}
                  size="large"
                />
              </div>

              {/* Back of Card */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-30"></div>
                <div className="relative h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl p-6 shadow-2xl overflow-hidden">
                  {/* Magnetic stripe */}
                  <div className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-800 -mx-6 mb-6"></div>

                  {/* Credit Usage */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-white/70 text-xs font-medium uppercase tracking-wider mb-2">Credit Usage</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80">Credit Used</span>
                          <span className="text-white font-bold">
                            ${dashboardStats?.credits.used.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80">Total Credit</span>
                          <span className="text-white font-bold">
                            ${dashboardStats?.credits.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-3">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{width: `${dashboardStats?.credits.usagePercentage || 0}%`}}></div>
                        </div>
                        <div className="text-white/60 text-xs text-center">{dashboardStats?.credits.usagePercentage || 0}% utilized</div>
                      </div>
                    </div>
                  </div>

                  {/* Signature strip */}
                  <div className="absolute bottom-6 left-6 right-6 h-10 bg-white/90 rounded flex items-center px-4">
                    <div className="text-gray-800 text-xs italic font-handwriting">Authorized Signature</div>
                  </div>

                  {/* Decorative circles */}
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Travel Metrics Cards - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Hotels Booked */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-4 border border-gray-200 hover:border-purple-300 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md shadow-purple-500/30">
                    <Hotel className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-purple-600 font-bold">Total</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-gray-900">{dashboardStats?.stats.hotelsBooked || 0}</div>
                  <div className="text-xs text-gray-600">Hotels Booked</div>
                </div>
              </div>
            </div>

            {/* Hotel Nights */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-4 border border-gray-200 hover:border-indigo-300 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-md shadow-indigo-500/30">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Nights</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-gray-900">{dashboardStats?.stats.hotelNights || 0}</div>
                  <div className="text-xs text-gray-600">Hotel Nights</div>
                </div>
              </div>
            </div>

            {/* Flights Taken */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-4 border border-gray-200 hover:border-blue-300 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md shadow-blue-500/30">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-blue-600 font-bold">Total</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-gray-900">{dashboardStats?.stats.flightsTaken || 0}</div>
                  <div className="text-xs text-gray-600">Flights Taken</div>
                </div>
              </div>
            </div>

            {/* Destinations */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white backdrop-blur-xl rounded-2xl p-4 border border-gray-200 hover:border-emerald-300 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-md shadow-emerald-500/30">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Unique</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold text-gray-900">{dashboardStats?.stats.destinations || 0}</div>
                  <div className="text-xs text-gray-600">Destinations</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
              <Link href="/dashboard/bookings" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium group">
                View All
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            <div className="space-y-4">
              {(dashboardStats?.recentBookings && dashboardStats.recentBookings.length > 0 ? dashboardStats.recentBookings : [
                { type: 'Flight', route: 'No bookings yet', traveler: 'Start booking', date: 'Today', status: 'Pending', amount: '$0' },
              ]).map((booking, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all cursor-pointer hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-gradient-to-br ${
                        booking.type === 'Flight'
                          ? 'from-blue-500 to-cyan-500 shadow-blue-500/30'
                          : 'from-purple-500 to-pink-500 shadow-purple-500/30'
                      } rounded-2xl shadow-lg`}>
                        {booking.type === 'Flight' ? (
                          <Plane className="w-5 h-5 text-white" />
                        ) : (
                          <Hotel className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 mb-1.5">{booking.route}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{booking.traveler}</span>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {booking.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 mb-1.5">{booking.amount}</div>
                      <div className={`text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
                        booking.status === 'confirmed' || booking.status === 'Confirmed' || booking.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : booking.status === 'awaiting_confirmation'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : booking.status === 'cancelled' || booking.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {(booking.status === 'confirmed' || booking.status === 'Confirmed' || booking.status === 'completed') && <CheckCircle className="w-3 h-3" />}
                        {(booking.status === 'pending' || booking.status === 'Pending' || booking.status === 'pending_approval' || booking.status === 'awaiting_confirmation') && <Clock className="w-3 h-3" />}
                        {booking.status === 'awaiting_confirmation' ? 'Pending Confirmation' : booking.status.replace(/_/g, ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white backdrop-blur-xl rounded-3xl p-8 border border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                href="/dashboard/flights/search"
                className="group relative block"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition"></div>
                <div className="relative flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transition-all group-hover:scale-105 shadow-lg shadow-blue-500/25">
                  <div className="flex items-center gap-3">
                    <Plane className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white">Book a Flight</span>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/dashboard/hotels/search"
                className="group block p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Hotel className="w-5 h-5 text-gray-700" />
                    <span className="font-semibold text-gray-900">Book a Hotel</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {(user.role === 'admin' || user.role === 'company_admin') && (
                <>
                  <Link
                    href="/dashboard/users/invite"
                    className="group block p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-gray-700" />
                        <span className="font-semibold text-gray-900">Invite User</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/users"
                    className="group block p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-700" />
                        <span className="font-semibold text-gray-900">Manage Users</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/credits"
                    className="group block p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-gray-700" />
                        <span className="font-semibold text-gray-900">Manage Credits</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/reports"
                    className="group block p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-gray-700" />
                        <span className="font-semibold text-gray-900">View Reports</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Booking Button */}
      {!showAIChat && (
        <button
          onClick={() => {
            setAiChatMessage('');
            setShowAIChat(true);
          }}
          className="fixed bottom-6 right-6 z-40 group"
        >
          {/* Pulsing background */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-ping opacity-75"></div>

          {/* Button content */}
          <div className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105">
            {/* Mobile version - Icon only */}
            <div className="md:hidden p-4">
              <Sparkles className="w-7 h-7" />
            </div>

            {/* Desktop version - Full button */}
            <div className="hidden md:flex items-center gap-3 px-6 py-4">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <div className="text-left">
                <div className="font-bold text-sm">Try AI Booking</div>
                <div className="text-xs text-cyan-100">Just chat naturally</div>
              </div>
            </div>
          </div>

          {/* AI Badge */}
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
            AI
          </div>
        </button>
      )}

      {/* AI Chatbox Modal */}
      {showAIChat && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end p-0 md:p-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAIChat(false)}
          ></div>

          {/* Chat Container */}
          <div className="relative w-full md:w-[450px] h-[100vh] md:h-[700px] bg-white md:rounded-2xl overflow-hidden shadow-2xl animate-slide-up md:animate-scale-in">
            {/* Close button */}
            <button
              onClick={() => setShowAIChat(false)}
              className="absolute top-4 right-4 z-[60] p-2 bg-gray-900/80 backdrop-blur-sm hover:bg-gray-900 rounded-full transition-all duration-200 text-white shadow-lg"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>

            {/* AIChatbox Component */}
            <div className="w-full h-full">
              <AIChatbox initialMessage={aiChatMessage} forceOpen={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
