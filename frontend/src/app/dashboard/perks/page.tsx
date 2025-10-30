'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gift,
  Trophy,
  Star,
  Sparkles,
  Check,
  Lock,
  ArrowRight,
  Plane,
  Crown,
  Zap
} from 'lucide-react';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import BusinessFooter from '@/components/BusinessFooter';
import { getApiEndpoint } from '@/lib/api-config';

interface DashboardStats {
  stats: {
    totalBookings: number;
  };
}

// Tier configuration
const TIERS = [
  {
    name: 'Explorer',
    min: 0,
    max: 5,
    color: 'from-gray-400 to-gray-600',
    icon: Plane,
    bgGradient: 'from-gray-50 to-gray-100',
    borderColor: 'border-gray-300',
    rewards: [
      'Welcome to Bvodo',
      'Access to standard support',
      'Basic booking features'
    ]
  },
  {
    name: 'Adventurer',
    min: 6,
    max: 15,
    color: 'from-blue-400 to-blue-600',
    icon: Star,
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-300',
    rewards: [
      '$25 Gift Card',
      'Priority email support',
      'Exclusive travel tips',
      'Early access to deals'
    ]
  },
  {
    name: 'Globetrotter',
    min: 16,
    max: 30,
    color: 'from-purple-400 to-purple-600',
    icon: Trophy,
    bgGradient: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-300',
    rewards: [
      '$50 Gift Card',
      '24/7 Priority support',
      'Dedicated account manager',
      'Premium travel insurance',
      'Lounge access vouchers'
    ]
  },
  {
    name: 'Elite Traveler',
    min: 31,
    max: Infinity,
    color: 'from-amber-400 to-amber-600',
    icon: Crown,
    bgGradient: 'from-amber-50 to-amber-100',
    borderColor: 'border-amber-300',
    rewards: [
      '$100 Gift Card',
      'VIP concierge service',
      'Complimentary upgrades',
      'Exclusive luxury deals',
      'Annual travel voucher',
      'Invitation-only events'
    ]
  }
];

export default function PerksPage() {
  const [user, setUser] = useState({
    name: 'John Doe',
    role: 'admin',
    email: '',
    organization: 'Acme Corporation',
    avatar: '',
  });
  const [totalBookings, setTotalBookings] = useState(0);
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

    // Fetch dashboard stats for booking count
    fetchBookingCount();
  }, []);

  const fetchBookingCount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(getApiEndpoint('dashboard/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: DashboardStats = await response.json();
        setTotalBookings(data.stats.totalBookings || 0);
      }
    } catch (error) {
      console.error('Error fetching booking count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine current tier based on bookings
  const getCurrentTier = () => {
    return TIERS.find(tier => totalBookings >= tier.min && totalBookings <= tier.max) || TIERS[0];
  };

  // Get next tier
  const getNextTier = () => {
    const currentIndex = TIERS.findIndex(tier => tier === getCurrentTier());
    return currentIndex < TIERS.length - 1 ? TIERS[currentIndex + 1] : null;
  };

  // Calculate progress to next tier
  const getProgress = () => {
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();

    if (!nextTier) return 100; // Already at max tier

    const currentProgress = totalBookings - currentTier.min;
    const tierRange = nextTier.min - currentTier.min;
    return Math.min((currentProgress / tierRange) * 100, 100);
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progress = getProgress();
  const bookingsToNextTier = nextTier ? nextTier.min - totalBookings : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <UnifiedNavBar currentPage="perks" user={user} />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Travel Perks</h1>
              <p className="text-gray-600 mt-1">Earn rewards as you explore the world</p>
            </div>
          </div>
        </div>

        {/* Current Status Card */}
        <div className={`bg-gradient-to-br ${currentTier.bgGradient} border-2 ${currentTier.borderColor} rounded-2xl p-6 md:p-8 mb-8 shadow-lg`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 bg-gradient-to-br ${currentTier.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                <currentTier.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium mb-1">Current Tier</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{currentTier.name}</div>
                <div className="text-sm text-gray-600 mt-1">{totalBookings} {totalBookings === 1 ? 'booking' : 'bookings'} completed</div>
              </div>
            </div>

            {nextTier && (
              <div className="w-full md:w-auto">
                <div className="text-sm text-gray-600 font-medium mb-2">Next: {nextTier.name}</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 md:w-64">
                    <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${currentTier.color} transition-all duration-500 ease-out`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    {bookingsToNextTier} more
                  </div>
                </div>
              </div>
            )}

            {!nextTier && (
              <div className="flex items-center gap-2 text-amber-600">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">Highest Tier Achieved!</span>
              </div>
            )}
          </div>
        </div>

        {/* All Tiers Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-pink-500" />
            Your Journey
          </h2>

          <div className="space-y-6">
            {TIERS.map((tier, index) => {
              const isUnlocked = totalBookings >= tier.min;
              const isCurrent = tier === currentTier;
              const Icon = tier.icon;

              return (
                <div key={tier.name} className="relative">
                  {/* Connecting line for non-last tiers */}
                  {index < TIERS.length - 1 && (
                    <div className={`absolute left-6 top-12 w-0.5 h-12 ${isUnlocked ? 'bg-gradient-to-b ' + tier.color : 'bg-gray-200'}`} />
                  )}

                  <div className={`flex items-start gap-4 transition-all duration-300 ${isCurrent ? 'scale-105' : ''}`}>
                    {/* Icon */}
                    <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center ${isUnlocked ? `bg-gradient-to-br ${tier.color}` : 'bg-gray-200'} shadow-md`}>
                      {isUnlocked ? (
                        <Icon className="w-6 h-6 text-white" />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-lg font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                          {tier.name}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs font-semibold rounded-full">
                            Current
                          </span>
                        )}
                        {isUnlocked && !isCurrent && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>

                      <div className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'} mb-2`}>
                        {tier.min === 0 ? 'Start' : tier.min} - {tier.max === Infinity ? '∞' : tier.max} bookings
                      </div>

                      {/* Progress bar for current tier */}
                      {isCurrent && nextTier && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>{totalBookings} bookings</span>
                            <span>{nextTier.min} to unlock {nextTier.name}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${tier.color} transition-all duration-500`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Rewards */}
                      {isUnlocked && (
                        <div className="space-y-1">
                          {tier.rewards.map((reward, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <Zap className="w-3 h-3 text-pink-500 flex-shrink-0" />
                              <span>{reward}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isUnlocked && (
                        <div className="text-sm text-gray-400">
                          🔒 Unlock at {tier.min} bookings
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rewards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {TIERS.map(tier => {
            const isUnlocked = totalBookings >= tier.min;
            const Icon = tier.icon;

            return (
              <div
                key={tier.name}
                className={`rounded-xl border-2 p-5 transition-all duration-300 ${
                  isUnlocked
                    ? `${tier.borderColor} bg-gradient-to-br ${tier.bgGradient} shadow-md hover:shadow-lg`
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  isUnlocked ? `bg-gradient-to-br ${tier.color}` : 'bg-gray-200'
                }`}>
                  {isUnlocked ? (
                    <Icon className="w-5 h-5 text-white" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <h3 className={`font-bold mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                  {tier.rewards[0]}
                </p>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-[#0f1729] via-[#1a2332] to-[#0f1729] rounded-2xl p-8 text-center shadow-lg">
          <Sparkles className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Keep Traveling, Keep Earning!</h2>
          <p className="text-gray-300 mb-6">
            Book your next trip to unlock exclusive rewards and benefits
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/flights/search"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Plane className="w-4 h-4" />
              Book Flight
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/hotels/search"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors"
            >
              <Gift className="w-4 h-4" />
              Book Hotel
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="mt-16">
        <BusinessFooter />
      </div>
    </div>
  );
}
