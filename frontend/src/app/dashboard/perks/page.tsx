'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gift,
  Check,
  Sparkles,
  Plane,
  Zap,
  ArrowRight,
  Hotel,
  DollarSign,
  Clock,
  ShieldCheck,
  Headphones,
  TrendingUp
} from 'lucide-react';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import BusinessFooter from '@/components/BusinessFooter';

export default function PerksPage() {
  const [user, setUser] = useState({
    name: 'John Doe',
    role: 'admin',
    email: '',
    organization: 'Acme Corporation',
    avatar: '',
  });

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
  }, []);

  // Benefits data
  const benefits = [
    {
      icon: Gift,
      title: 'Exclusive Gift Cards',
      description: 'Earn gift cards as you travel more. Heavy fliers get rewarded with Amazon, dining, and travel vouchers.'
    },
    {
      icon: DollarSign,
      title: 'Travel Credits',
      description: 'Unlock travel credits on future bookings. The more you fly, the more you save on your next trip.'
    },
    {
      icon: Headphones,
      title: 'Priority Support',
      description: 'Get dedicated support when you need it. VIP access to our travel specialists 24/7.'
    },
    {
      icon: Zap,
      title: 'Early Access',
      description: 'Be the first to know about flash sales, exclusive deals, and limited-time offers.'
    },
    {
      icon: ShieldCheck,
      title: 'Premium Insurance',
      description: 'Complimentary travel insurance coverage for your peace of mind on every journey.'
    },
    {
      icon: TrendingUp,
      title: 'Upgrade Opportunities',
      description: 'Priority upgrades on flights and hotels. Experience luxury without the premium price.'
    }
  ];

  // Tier showcase
  const tiers = [
    {
      name: 'Explorer',
      bookings: '1-5 trips',
      perks: ['Welcome bonus', 'Basic support', 'Email updates']
    },
    {
      name: 'Adventurer',
      bookings: '6-15 trips',
      perks: ['Gift card rewards', 'Priority support', 'Early access to deals', 'Exclusive tips']
    },
    {
      name: 'Globetrotter',
      bookings: '16-30 trips',
      perks: ['Gift card rewards', '24/7 dedicated support', 'Premium insurance', 'Lounge vouchers', 'Upgrade priority']
    },
    {
      name: 'Elite',
      bookings: '31+ trips',
      perks: ['Gift card rewards', 'VIP concierge', 'Luxury upgrades', 'Annual voucher', 'Exclusive events', 'Personal manager']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <UnifiedNavBar currentPage="perks" user={user} />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-[#ADF802] rounded-full text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            Travel Perks Program
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6">
            Book More,
            <br />
            <span className="text-[#ADF802]">Earn More</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every trip brings you closer to exclusive rewards, gift cards, and premium travel benefits.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-10 text-center">
            What You'll Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-black transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#ADF802] transition-colors">
                    <Icon className="w-7 h-7 text-[#ADF802] group-hover:text-black transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier Levels */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
              Four Ways to Fly
            </h2>
            <p className="text-lg text-gray-600">
              Progress through tiers as you book more trips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 border-2 ${
                  index === tiers.length - 1
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-200 hover:border-black'
                } transition-all duration-300`}
              >
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                    index === tiers.length - 1 ? 'bg-[#ADF802]' : 'bg-gray-100'
                  }`}>
                    <Plane className={`w-6 h-6 ${
                      index === tiers.length - 1 ? 'text-black' : 'text-black'
                    }`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className={`text-sm ${
                    index === tiers.length - 1 ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {tier.bookings}
                  </p>
                </div>

                <ul className="space-y-3">
                  {tier.perks.map((perk, perkIndex) => (
                    <li key={perkIndex} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        index === tiers.length - 1 ? 'text-[#ADF802]' : 'text-black'
                      }`} />
                      <span className={`text-sm ${
                        index === tiers.length - 1 ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-10 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#ADF802] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Plane className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">1. Book Your Trip</h3>
              <p className="text-gray-600">
                Search and book flights or hotels through our platform
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-5">
                <TrendingUp className="w-8 h-8 text-[#ADF802]" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">2. Earn Automatically</h3>
              <p className="text-gray-600">
                Every completed booking counts toward your next tier
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#ADF802] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Gift className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">3. Unlock Rewards</h3>
              <p className="text-gray-600">
                Receive gift cards, credits, and exclusive perks
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-black rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start Earning Today
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Your next trip could be your first step toward exclusive rewards
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/flights/search"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#ADF802] text-black font-bold rounded-xl hover:bg-[#9DE600] transition-colors text-lg"
            >
              <Plane className="w-5 h-5" />
              Search Flights
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard/hotels/search"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors text-lg"
            >
              <Hotel className="w-5 h-5" />
              Find Hotels
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <div className="mt-20">
        <BusinessFooter />
      </div>
    </div>
  );
}
