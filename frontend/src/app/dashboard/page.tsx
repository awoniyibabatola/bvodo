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
  ArrowRight,
  Sparkles,
  X,
  Globe,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import AIChatbox from '@/components/AIChatbox';
import CreditCard from '@/components/CreditCard';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import BusinessFooter from '@/components/BusinessFooter';
import PolicyLimitsCard from '@/components/PolicyLimitsCard';
import { getApiEndpoint } from '@/lib/api-config';

interface DashboardStats {
  credits: {
    available: number;
    used: number;
    held: number;
    total: number;
    usagePercentage: number;
    thisMonth: number;
    transactions: number;
  };
  stats: {
    totalBookings: number;
    hotelsBooked: number;
    hotelNights: number;
    flightsTaken: number;
    destinations: number;
  };
  recentBookings: Array<{
    id: string;
    type: string;
    route: string;
    traveler: string;
    date: string;
    status: string;
    amount: string;
    image: string | null;
    airlineCode?: string | null;
    airline?: string | null;
  }>;
  organization: {
    name: string;
  };
}

// Helper function to get airline logo URL
const getAirlineLogo = (code: string) => {
  return `https://images.kiwi.com/airlines/64/${code}.png`;
};

export default function DashboardPage() {
  const [user, setUser] = useState({
    name: 'John Doe',
    role: 'admin',
    email: '',
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
        email: parsedUser.email,
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
        console.log('Dashboard stats received:', data);
        console.log('Recent bookings:', data.recentBookings);
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Navigation */}
      <UnifiedNavBar currentPage="dashboard" user={user} />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-semibold text-gray-900" style={{ fontSize: '22px' }}>
              Welcome back, {user.name.split(' ')[0]}!
            </h1>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-3.5 h-3.5" />
            <p className="text-xs">{user.organization} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Quick Action Cards - Modern Dark Design with Lime Accent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Book Flight */}
          <Link
            href="/dashboard/flights/search"
            className="group relative block rounded-xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300 border border-gray-200"
          >
            <div className="relative h-[140px] bg-white overflow-hidden">
              {/* Floating geometric shapes */}
              <div className="absolute top-3 right-3 w-16 h-16 border-2 border-gray-100 rounded-full group-hover:rotate-90 transition-transform duration-500"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-gray-50 rounded-lg rotate-12 group-hover:rotate-45 transition-transform duration-500"></div>

              <div className="relative h-full p-6 flex flex-col justify-between z-10">
                {/* Indicator dot */}
                <div className="flex justify-end">
                  <div className="w-2 h-2 bg-[#ADF802] rounded-full animate-pulse"></div>
                </div>

                {/* Text content */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    Book Flight
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-xs font-medium">Explore destinations</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Book Hotel */}
          <Link
            href="/dashboard/hotels/search"
            className="group relative block rounded-xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-300 border border-gray-200"
          >
            <div className="relative h-[140px] bg-white overflow-hidden">
              {/* Floating geometric shapes */}
              <div className="absolute top-4 left-4 w-20 h-20 border-2 border-gray-100 rounded-2xl rotate-12 group-hover:-rotate-12 transition-transform duration-500"></div>
              <div className="absolute bottom-6 right-6 w-14 h-14 bg-gray-50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>

              <div className="relative h-full p-6 flex flex-col justify-between z-10">
                {/* Indicator dot */}
                <div className="flex justify-start">
                  <div className="w-2 h-2 bg-[#ADF802] rounded-full animate-pulse"></div>
                </div>

                {/* Text content */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    Book Hotel
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-xs font-medium">Find your stay</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Policy Limits Card */}
        <div className="mb-8">
          <PolicyLimitsCard />
        </div>

        {/* AI Quick Booking Suggestions - HIDDEN ON MOBILE */}
        <div className="mb-8 md:mb-10 hidden lg:block">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-gray-900" />
            <h2 className="text-base md:text-lg font-bold text-gray-900">Book with AI Assistant</h2>
            <span className="px-2 py-0.5 bg-[#ADF802] text-gray-900 text-[10px] md:text-xs font-bold rounded-full">NEW</span>
          </div>
          {/* Horizontal scrollable container */}
          <div className="overflow-x-auto pb-3 md:pb-4 -mx-4 px-4 scrollbar-hide py-2">
            <div className="flex gap-3 md:gap-4 min-w-max">
            {/* Suggestion 1 - Quick Flight */}
            <button
              onClick={() => handleAISuggestionClick("I need a flight from Lagos to Nairobi next Tuesday for 2 people")}
              className="group relative text-left flex-shrink-0 w-[260px] sm:w-[280px]"
            >
              <div className="relative bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-gray-300 transition-all shadow-sm h-full">
                <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-gray-900 rounded-lg md:rounded-xl flex-shrink-0">
                    <Plane className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base text-gray-900 mb-0.5 md:mb-1">Quick Flight Booking</h3>
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-1">"Flight from Lagos to Nairobi..."</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs text-gray-600 font-medium">
                  <span>Try AI Chat</span>
                  <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>

            {/* Suggestion 2 - Hotel with Preferences */}
            <button
              onClick={() => handleAISuggestionClick("Find me a luxury hotel in Dubai with pool and gym, checking in December 25th for 3 nights")}
              className="group relative text-left flex-shrink-0 w-[260px] sm:w-[280px]"
            >
              <div className="relative bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-gray-300 transition-all shadow-sm h-full">
                <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-gray-800 rounded-lg md:rounded-xl flex-shrink-0">
                    <Hotel className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base text-gray-900 mb-0.5 md:mb-1">Hotel with Details</h3>
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-1">"Luxury hotel in Dubai with pool..."</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs text-gray-600 font-medium">
                  <span>Try AI Chat</span>
                  <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>

            {/* Suggestion 3 - Complex Trip */}
            <button
              onClick={() => handleAISuggestionClick("I need flight and hotel for a business trip to London from Lagos, departing next month for 5 days")}
              className="group relative text-left flex-shrink-0 w-[260px] sm:w-[280px]"
            >
              <div className="relative bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-gray-300 transition-all shadow-sm h-full">
                <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-gray-700 rounded-lg md:rounded-xl flex-shrink-0">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base text-gray-900 mb-0.5 md:mb-1">Complete Trip Planning</h3>
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-1">"Flight + hotel to London..."</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs text-gray-600 font-medium">
                  <span>Try AI Chat</span>
                  <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>

            {/* Suggestion 4 - Multi-City Trip */}
            <button
              onClick={() => handleAISuggestionClick("Book a multi-city trip: Lagos to Paris, Paris to Amsterdam, Amsterdam back to Lagos for a team of 3")}
              className="group relative text-left flex-shrink-0 w-[260px] sm:w-[280px]"
            >
              <div className="relative bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-gray-300 transition-all shadow-sm h-full">
                <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-gray-600 rounded-lg md:rounded-xl flex-shrink-0">
                    <Globe className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base text-gray-900 mb-0.5 md:mb-1">Multi-City Journey</h3>
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-1">"Lagos → Paris → Amsterdam..."</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs text-gray-600 font-medium">
                  <span>Try AI Chat</span>
                  <ArrowUpRight className="w-2.5 h-2.5 md:w-3 md:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        </div>
        </div>

        {/* Stats Grid - Credit Card + 4 Small Cards + Travel Tips */}
        <div className="flex flex-col lg:flex-row gap-3 mb-8 md:mb-10">
          {/* Credit Card - Flippable */}
          <div
            className="group cursor-pointer flex-shrink-0 w-full max-w-[400px] h-[240px] md:h-[220px] mx-auto lg:mx-0"
            onClick={() => setIsCardFlipped(!isCardFlipped)}
          >
            <div className="relative w-full h-full perspective-1000">
              <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front of Card */}
              <div className="absolute w-full h-full backface-hidden" style={{backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden'}}>
                <CreditCard
                  organizationName={user.organization}
                  availableBalance={dashboardStats?.credits.available || 0}
                  size="large"
                  disableInternalFlip={true}
                  usageData={{
                    used: dashboardStats?.credits.used || 0,
                    total: dashboardStats?.credits.total || 0,
                    usagePercentage: dashboardStats?.credits.usagePercentage || 0,
                  }}
                />
              </div>

              {/* Back of Card */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180" style={{backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden'}}>
                <div className="relative h-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                  {/* Magnetic stripe */}
                  <div className="w-full h-8 bg-gray-100 mt-5"></div>

                  {/* Credit Usage */}
                  <div className="flex-1 px-5 pt-5 pb-3 flex flex-col justify-center">
                    <div className="text-gray-600 text-[10px] font-medium mb-3">Credit Usage</div>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Used</span>
                        <span className="text-gray-900 font-semibold">
                          ${dashboardStats?.credits.used.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Total</span>
                        <span className="text-gray-900 font-semibold">
                          ${dashboardStats?.credits.total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900 rounded-full" style={{width: `${dashboardStats?.credits.usagePercentage || 0}%`}}></div>
                      </div>
                      <div className="text-gray-500 text-[10px] text-center pt-1">{dashboardStats?.credits.usagePercentage || 0}% utilized</div>
                    </div>
                  </div>

                  {/* Signature strip */}
                  <div className="h-8 bg-white/90 mx-5 mb-5 rounded flex items-center px-3">
                    <div className="text-gray-800 text-[10px] italic">Authorized Signature</div>
                  </div>

                  {/* Decorative circles */}
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-gray-500/10 rounded-full blur-2xl"></div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Travel Metrics - Spread to fill space */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 flex-1 w-full h-auto lg:h-[220px]">
            {/* Total Bookings */}
            <Link href="/dashboard/bookings" className="group relative h-full block">
              <div className="relative h-full bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                {/* Icon - Top Left */}
                <div className="flex items-start mb-4">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-gray-300 transition-colors">
                    <CheckCircle className="w-4 h-4 text-gray-700" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-end">
                  {/* Arrow */}
                  <div className="mb-2">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" strokeWidth={1} />
                  </div>

                  {/* Horizontal line - 1px above title */}
                  <div className="w-12 h-px bg-gray-900 mb-3"></div>

                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Total Bookings</div>
                  <div className="text-3xl font-bold text-gray-900">{dashboardStats?.stats.totalBookings || 0}</div>
                </div>
              </div>
            </Link>

            {/* Destinations */}
            <div className="group relative h-full cursor-pointer">
              <div className="relative h-full bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                {/* Icon - Top Left */}
                <div className="flex items-start mb-4">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-gray-300 transition-colors">
                    <MapPin className="w-4 h-4 text-gray-700" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-end">
                  {/* Arrow */}
                  <div className="mb-2">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" strokeWidth={1} />
                  </div>

                  {/* Horizontal line - 1px above title */}
                  <div className="w-12 h-px bg-gray-900 mb-3"></div>

                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Destinations</div>
                  <div className="text-3xl font-bold text-gray-900">{dashboardStats?.stats.destinations || 0}</div>
                </div>
              </div>
            </div>

            {/* Hotels */}
            <Link href="/dashboard/hotels/search" className="group relative h-full block">
              <div className="relative h-full bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                {/* Icon - Top Left */}
                <div className="flex items-start mb-4">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-gray-300 transition-colors">
                    <Hotel className="w-4 h-4 text-gray-700" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-end">
                  {/* Arrow */}
                  <div className="mb-2">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" strokeWidth={1} />
                  </div>

                  {/* Horizontal line - 1px above title */}
                  <div className="w-12 h-px bg-gray-900 mb-3"></div>

                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Hotels Booked</div>
                  <div className="text-3xl font-bold text-gray-900">{dashboardStats?.stats.hotelsBooked || 0}</div>
                </div>
              </div>
            </Link>

            {/* Flights */}
            <Link href="/dashboard/flights/search" className="group relative h-full block">
              <div className="relative h-full bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                {/* Icon - Top Left */}
                <div className="flex items-start mb-4">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-gray-300 transition-colors">
                    <Plane className="w-4 h-4 text-gray-700" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-end">
                  {/* Arrow */}
                  <div className="mb-2">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" strokeWidth={1} />
                  </div>

                  {/* Horizontal line - 1px above title */}
                  <div className="w-12 h-px bg-gray-900 mb-3"></div>

                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Flights Taken</div>
                  <div className="text-3xl font-bold text-gray-900">{dashboardStats?.stats.flightsTaken || 0}</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-16">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-xl md:rounded-3xl p-5 md:p-6 lg:p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-900 rounded-full"></div>
                <h2 className="text-xl md:text-xl font-bold text-gray-900">Recent Trips</h2>
              </div>
              <Link href="/dashboard/bookings" className="flex items-center gap-1 text-sm md:text-sm text-gray-700 hover:text-gray-900 font-semibold group transition-colors">
                View All
                <ArrowUpRight className="w-4 h-4 md:w-4 md:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            <div className="space-y-3 md:space-y-4">
              {(dashboardStats?.recentBookings && dashboardStats.recentBookings.length > 0 ? dashboardStats.recentBookings.slice(0, 3) : [
                { id: '', type: 'Flight', route: 'No bookings yet', traveler: 'Start booking', date: 'Today', status: 'Pending', amount: '$0', image: null, airlineCode: null, airline: null },
              ]).map((booking, index) => {
                // Determine the link based on booking id
                const isValidBooking = booking.route !== 'No bookings yet';
                const bookingLink = isValidBooking && booking.id
                  ? `/dashboard/bookings/${booking.id}`
                  : '#';

                return (
                <Link key={index} href={bookingLink} className="group relative block">
                  <div className="relative flex items-center gap-4 md:gap-4 p-4 md:p-4 bg-gray-50 rounded-2xl md:rounded-2xl border border-gray-200 hover:border-gray-400 transition-all cursor-pointer shadow-sm overflow-hidden active:scale-[0.99]">
                    {/* Thumbnail Image for Hotels */}
                    {booking.type === 'Hotel' && booking.image && (
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={booking.image}
                          alt={booking.route}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.classList.add('bg-gray-200');
                            const icon = document.createElement('div');
                            icon.className = 'absolute inset-0 flex items-center justify-center';
                            icon.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 8h.01M12 12h.01M15 16h.01"/></svg>';
                            target.parentElement!.appendChild(icon);
                          }}
                        />
                      </div>
                    )}

                    {/* Flight Icon/Logo */}
                    {booking.type === 'Flight' && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                        {booking.airlineCode ? (
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                            <img
                              src={getAirlineLogo(booking.airlineCode)}
                              alt={booking.airline || 'Airline'}
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.classList.add('bg-gray-900');
                                  parent.classList.remove('bg-gray-50');
                                  const fallbackIcon = parent.querySelector('.fallback-icon');
                                  if (fallbackIcon) {
                                    (fallbackIcon as HTMLElement).classList.remove('hidden');
                                  }
                                }
                              }}
                            />
                            <Plane className="fallback-icon hidden w-5 h-5 md:w-6 md:h-6 text-white" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                            <Plane className="w-5 h-5 md:w-6 md:h-6 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm md:text-base text-gray-900 mb-0.5 break-words line-clamp-1">{booking.route}</div>
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 flex-wrap">
                        <span className="break-words">{booking.traveler}</span>
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <span className="hidden sm:flex items-center gap-1">
                          <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {booking.date}
                        </span>
                      </div>
                    </div>

                    {/* Price and Status */}
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-bold text-sm md:text-base text-gray-900 mb-1 md:mb-1.5">{booking.amount}</div>
                      <div className={`text-[10px] md:text-xs font-medium px-2 md:px-3 py-1 md:py-1.5 rounded-full inline-flex items-center gap-1 md:gap-1.5 border ${
                        booking.status === 'confirmed' || booking.status === 'Confirmed' || booking.status === 'completed'
                          ? 'bg-[#ADF802]/10 text-gray-900 border-[#ADF802]/30'
                          : booking.status === 'awaiting_confirmation'
                          ? 'bg-blue-50/50 text-blue-800 border-blue-200/50'
                          : booking.status === 'pending' || booking.status === 'Pending' || booking.status === 'pending_approval'
                          ? 'bg-amber-50/50 text-amber-800 border-amber-200/50'
                          : booking.status === 'cancelled' || booking.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>
                        {(booking.status === 'confirmed' || booking.status === 'Confirmed' || booking.status === 'completed') && <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                        {(booking.status === 'pending' || booking.status === 'Pending' || booking.status === 'pending_approval' || booking.status === 'awaiting_confirmation') && <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                        <span className="hidden md:inline">
                          {booking.status === 'awaiting_confirmation'
                            ? 'Pending Confirmation'
                            : booking.status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                          }
                        </span>
                        <span className="md:hidden">
                          {booking.status === 'confirmed' || booking.status === 'Confirmed'
                            ? 'Confirmed'
                            : booking.status === 'pending' || booking.status === 'Pending'
                            ? 'Pending'
                            : booking.status === 'completed'
                            ? 'Completed'
                            : booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Actions - HIDDEN ON MOBILE */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 hidden lg:block">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-gray-900 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="space-y-2.5">
              <Link
                href="/dashboard/flights/search?new=true"
                className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <Plane className="w-5 h-5 text-gray-700" />
                    <span className="text-sm md:text-base text-gray-900">Book a Flight</span>
                  </div>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/dashboard/hotels/search"
                className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                    <Hotel className="w-5 h-5 text-gray-700" />
                    <span className="text-sm md:text-base text-gray-900">Book a Hotel</span>
                  </div>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {(user.role === 'admin' || user.role === 'company_admin') && (
                <>
                  <Link
                    href="/dashboard/users/invite"
                    className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-gray-700" />
                        <span className="text-sm md:text-base text-gray-900">Invite User</span>
                      </div>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/users"
                    className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-700" />
                        <span className="text-sm md:text-base text-gray-900">Manage Users</span>
                      </div>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/credits"
                    className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-gray-700" />
                        <span className="text-sm md:text-base text-gray-900">Manage Credits</span>
                      </div>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/credits/apply"
                    className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCardIcon className="w-5 h-5 text-gray-700" />
                        <span className="text-sm md:text-base text-gray-900">Apply for Credit</span>
                      </div>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/reports"
                    className="group block p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-gray-700" />
                        <span className="text-sm md:text-base text-gray-900">View Reports</span>
                      </div>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
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
          {/* Button content */}
          <div className="relative bg-gray-900 text-white rounded-full shadow-sm hover:bg-gray-800 transition-all">
            {/* Mobile version - Icon only */}
            <div className="md:hidden p-4">
              <Sparkles className="w-7 h-7" />
            </div>

            {/* Desktop version - Full button */}
            <div className="hidden md:flex items-center gap-3 px-6 py-4">
              <Sparkles className="w-6 h-6" />
              <div className="text-left">
                <div className="font-bold text-sm">Try AI Booking</div>
                <div className="text-xs text-gray-300">Just chat naturally</div>
              </div>
            </div>
          </div>

          {/* AI Badge */}
          <div className="absolute -top-2 -right-2 bg-[#ADF802] text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
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

      {/* Business Information Footer */}
      <BusinessFooter />
    </div>
  );
}
