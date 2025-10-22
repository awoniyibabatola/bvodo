'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Plane,
  Hotel,
  Car,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Lock,
  FileText,
  Zap,
  Users,
  Upload,
  CreditCard,
  UtensilsCrossed,
  Bell,
  Rocket,
  MessageSquare,
  Sparkles,
  X
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import AIChatbox to avoid SSR issues
const AIChatbox = dynamic(() => import('@/components/AIChatbox'), { ssr: false });

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [flightPosition, setFlightPosition] = useState(0);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [cardFlip, setCardFlip] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeInvoice, setActiveInvoice] = useState(0);
  const [chatScroll, setChatScroll] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Testimonial carousel
  const testimonials = [
    {
      name: "Chidi Okafor",
      role: "CFO, TechHub Nigeria",
      company: "Lagos, Nigeria",
      quote: "bvodo reduced our travel management time by 70%. The invoicing and expense tracking are game-changers for our accounting team."
    },
    {
      name: "Amara Mensah",
      role: "Operations Manager",
      company: "Accra, Ghana",
      quote: "From flights to Uber rides, everything is in one place. The group invoicing feature saves us hours every month!"
    },
    {
      name: "Kwame Nkrumah",
      role: "Travel Coordinator",
      company: "Nairobi, Kenya",
      quote: "Managing 200+ employees' travel was a nightmare. Now it's seamless. The expense reports are automatically generated!"
    }
  ];

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    const flightInterval = setInterval(() => {
      setFlightPosition((prev) => (prev + 1) % 100);
    }, 50);

    // Invoice slide-in animation
    const invoiceTimeout = setTimeout(() => {
      setInvoiceVisible(true);
    }, 1000);

    // Card flip animation
    const cardInterval = setInterval(() => {
      setCardFlip(prev => !prev);
    }, 3000);

    // Scroll parallax effect
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    // Moving invoices carousel
    const invoiceInterval = setInterval(() => {
      setActiveInvoice((prev) => (prev + 1) % 3);
    }, 3000);

    // Chat auto-scroll animation
    const chatScrollInterval = setInterval(() => {
      setChatScroll((prev) => {
        const next = prev + 1;
        return next > 100 ? 0 : next; // Reset after reaching bottom
      });
    }, 50);

    return () => {
      clearInterval(testimonialInterval);
      clearInterval(flightInterval);
      clearInterval(cardInterval);
      clearInterval(invoiceInterval);
      clearInterval(chatScrollInterval);
      clearTimeout(invoiceTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [testimonials.length]);

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      const maxScroll = chatMessagesRef.current.scrollHeight - chatMessagesRef.current.clientHeight;
      chatMessagesRef.current.scrollTop = (chatScroll / 100) * maxScroll;
    }
  }, [chatScroll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full">
          <div className="flex justify-between items-center h-14 sm:h-16 px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Plane className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                bvodo
              </span>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Link
                href="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-700 hover:text-gray-900 font-medium transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Balanced Gradient Background */}
      <section className="w-full relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-purple-50/50">
        {/* Balanced gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/25 via-transparent to-purple-100/25"></div>

        {/* Balanced parallax background elements */}
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-200/25 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-100/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.15}px)` }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="animate-slide-in-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Rocket className="w-3 h-3 sm:w-4 sm:h-4" />
              Built for African Businesses
            </div>
            <h1 className="text-5xl sm:text-5xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-gray-900">
              Corporate Travel Made{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Simple
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-xl">
              Streamline your organization&apos;s travel booking with our all-in-one platform.
              Manage flights, hotels, budgets, and approvals effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/register"
                className="px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-xl transition font-semibold text-center hover:scale-105"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-center"
              >
                Learn More
              </Link>
            </div>
            <div className="flex items-center gap-4 sm:gap-8 mt-6 sm:mt-8">
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">500+</div>
                <div className="text-xs sm:text-sm text-gray-600">Organizations</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-xs sm:text-sm text-gray-600">Bookings</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">$2M+</div>
                <div className="text-xs sm:text-sm text-gray-600">Managed</div>
              </div>
            </div>
          </div>
          {/* Phone Mockup with Animation */}
          <div className="relative animate-slide-in-right hidden lg:block">
            {/* Decorative blob shapes in background */}
            <div className="absolute -top-12 -right-12 w-48 h-48 lg:w-64 lg:h-64 bg-gradient-to-br from-yellow-300/40 to-orange-400/40 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-12 -left-12 w-56 h-56 lg:w-72 lg:h-72 bg-gradient-to-br from-cyan-300/40 to-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Main container with tilted backdrop */}
            <div className="relative">
              {/* Tilted decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-[3rem] lg:rounded-[4rem] transform rotate-3 scale-105"></div>

              {/* Phone container */}
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 rounded-[3rem] lg:rounded-[4rem] p-4 sm:p-6 lg:p-8 shadow-xl animate-float">
              {/* Phone Frame with creative corners */}
              <div className="relative mx-auto w-[240px] sm:w-[280px] lg:w-[300px] h-[480px] sm:h-[560px] lg:h-[600px] bg-gray-900 shadow-2xl border-[10px] sm:border-[12px] lg:border-[14px] border-gray-800 overflow-hidden rounded-[2.5rem] lg:rounded-[3rem]">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>

                {/* Screen */}
                <div className="w-full h-full bg-white overflow-hidden">
                  {/* App Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 pt-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <Plane className="w-4 h-4" />
                        </div>
                        <span className="font-bold">bvodo</span>
                      </div>
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-full">Live</div>
                    </div>
                  </div>

                  {/* Flight Animation */}
                  <div className="p-4 space-y-3 relative overflow-hidden h-[500px]">
                    {/* Animated Flight Path */}
                    <div className="absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                    <div
                      className="absolute top-[76px] text-2xl transition-all duration-1000 ease-linear"
                      style={{ left: `${flightPosition}%` }}
                    >
                      ✈️
                    </div>

                    {/* Booking Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mt-24 shadow-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs text-gray-500">Next Trip</div>
                          <div className="font-bold text-lg">Lagos → Nairobi</div>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
                          <Plane className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Departure</div>
                          <div className="font-semibold">Dec 15, 10:30</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Status</div>
                          <div className="font-semibold text-green-600">✓ Confirmed</div>
                        </div>
                      </div>
                    </div>

                    {/* Expense Items */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-600 px-1">Recent Expenses</div>

                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Hotel className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-xs">
                            <div className="font-semibold">Radisson Blu</div>
                            <div className="text-gray-500">2 nights</div>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-bold">$280</div>
                          <div className="text-gray-500">Approved</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-xs">
                            <div className="font-semibold">Uber to Airport</div>
                            <div className="text-gray-500">Dec 10, 2024</div>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-bold">$25</div>
                          <div className="text-gray-500">Pending</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Plane className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="text-xs">
                            <div className="font-semibold">Flight ET-901</div>
                            <div className="text-gray-500">Ethiopian Air</div>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-bold">$450</div>
                          <div className="text-green-600">Paid</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </div>
              </div>

              {/* Floating Alert Notifications */}
              {/* Booking Confirmed Alert - Top Right */}
              <div className="absolute -top-8 -right-12 bg-white rounded-2xl shadow-2xl p-4 border border-green-100 animate-float w-64">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-gray-900 mb-1">Booking Confirmed!</div>
                    <div className="text-xs text-gray-600">Flight LOS → NBO</div>
                    <div className="text-xs text-green-600 font-medium mt-1">Just now</div>
                  </div>
                </div>
              </div>

              {/* Invoice Ready Alert - Bottom Left */}
              <div className="absolute -bottom-8 -left-12 bg-white rounded-2xl shadow-2xl p-4 border border-purple-100 animate-float w-60" style={{ animationDelay: '2s' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-gray-900 mb-1">Invoice Ready</div>
                    <div className="text-xs text-gray-600">December expenses - $2,430</div>
                  </div>
                </div>
              </div>

              {/* Approval Alert - Bottom Right */}
              <div className="absolute bottom-12 -right-16 bg-white rounded-2xl shadow-2xl p-3 border border-orange-100 animate-float w-52" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xs text-gray-900">Needs Approval</div>
                    <div className="text-[10px] text-gray-600">3 pending requests</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section 1 - Travel Freedom */}
      <section className="w-full relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Image - Creative Rounded Shape */}
          <div className="relative group order-2 lg:order-1 max-w-[280px] sm:max-w-sm lg:max-w-md mx-auto w-full">
            {/* Animated glow effect */}
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl sm:blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-500 animate-pulse"></div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 sm:-top-8 sm:-right-8 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 blur-xl sm:blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute -bottom-4 -left-4 sm:-bottom-8 sm:-left-8 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-50 blur-xl sm:blur-2xl group-hover:scale-110 transition-transform duration-500"></div>

            {/* Main image container with combined rounded shapes */}
            <div className="relative">
              {/* Background shape layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-[2rem] sm:rounded-[3rem] transform rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>

              {/* Image with creative clipping */}
              <div className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-xl sm:shadow-2xl transform group-hover:scale-105 transition-transform duration-500" style={{
                clipPath: 'polygon(0% 5%, 5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%)'
              }}>
                <Image
                  src="/images/medium-shot-smiley-man-walking-with-baggage.jpg"
                  alt="Professional traveler with confidence"
                  width={450}
                  height={550}
                  className="w-full h-auto object-cover"
                />
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-transparent"></div>
              </div>

              {/* Policy Compliance Alert - Top Right */}
              <div className="absolute -top-3 -right-4 sm:-top-6 sm:-right-8 bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-2xl p-2 sm:p-3 border border-green-200 animate-float w-36 sm:w-48">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[10px] sm:text-xs text-gray-900">Policy Approved</div>
                    <div className="text-[8px] sm:text-[10px] text-gray-600">Within budget</div>
                  </div>
                </div>
              </div>

              {/* Fast Booking Alert - Bottom Left */}
              <div className="absolute -bottom-3 -left-4 sm:-bottom-6 sm:-left-8 bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-2xl p-2 sm:p-3 border border-blue-200 animate-float w-32 sm:w-44" style={{ animationDelay: '1.5s' }}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[10px] sm:text-xs text-gray-900">Booked in 3 min</div>
                    <div className="text-[8px] sm:text-[10px] text-gray-600">Flight confirmed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
              <Plane className="w-4 h-4" />
              Stress-Free Travel
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your Team Deserves <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Seamless</span> Travel
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
              No more juggling between multiple platforms, endless emails, or confusing spreadsheets. Give your team the freedom to focus on what matters while we handle the complexity of corporate travel.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Book in Minutes, Not Hours</h3>
                  <p className="text-gray-600">
                    From search to confirmation in under 5 minutes. Real-time availability from thousands of airlines and hotels across Africa.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">One Platform for Everyone</h3>
                  <p className="text-gray-600">
                    Whether it's the CEO flying to a conference or your entire sales team on the road—manage it all from one dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Policy Compliance Built-In</h3>
                  <p className="text-gray-600">
                    Set travel policies once and let the system enforce them automatically. No more manual reviews or policy violations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Benefits Section 2 - Professional Service */}
      <section className="w-full relative bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-6">
                <Hotel className="w-4 h-4" />
                Professional Experience
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                World-Class Service, <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">African</span> Expertise
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                We understand the unique challenges of corporate travel in Africa. From Lagos to Nairobi, Accra to Johannesburg—we've got you covered with local knowledge and global standards.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Real-Time Expense Tracking</h3>
                    <p className="text-gray-600">
                      Every flight, hotel, Uber ride, and meal automatically logged and categorized. Know exactly where your travel budget is going.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Automated Invoice Generation</h3>
                    <p className="text-gray-600">
                      Professional invoices created with one click. Individual, group, or consolidated—exported directly to your accounting software.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Smart Cost Optimization</h3>
                    <p className="text-gray-600">
                      AI-powered recommendations help you find the best deals while maintaining quality. Save up to 30% on your travel budget.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image - Circular Top with Straight Bottom */}
            <div className="relative group max-w-[280px] sm:max-w-sm lg:max-w-md mx-auto w-full">
              {/* Animated glow effect */}
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full blur-2xl sm:blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-500 animate-pulse"></div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -left-4 sm:-top-8 sm:-left-8 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-50 blur-xl sm:blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              <div className="absolute -bottom-3 -right-3 sm:-bottom-6 sm:-right-6 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full opacity-60 blur-xl sm:blur-2xl group-hover:scale-110 transition-transform duration-500"></div>

              {/* Main image container with arch shape */}
              <div className="relative">
                {/* Background shape layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-t-full transform -rotate-3 group-hover:-rotate-6 transition-transform duration-500"></div>

                {/* Image with arch/dome top and straight bottom */}
                <div className="relative overflow-hidden shadow-xl sm:shadow-2xl transform group-hover:scale-105 transition-transform duration-500 rounded-t-[6rem] sm:rounded-t-[10rem] rounded-b-2xl sm:rounded-b-3xl">
                  <Image
                    src="/images/portrait-business-black-man-with-confidence-balcony-corporate-career-financial-advisor-ambition-smile-male-person-arms-crossed-with-experience-investment-growth-opportunity.jpg"
                    alt="Confident business professional"
                    width={450}
                    height={600}
                    className="w-full h-auto object-cover"
                  />
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent"></div>

                  {/* Decorative corner accents */}
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-600/40 to-transparent"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-pink-600/40 to-transparent"></div>
                </div>

                {/* Expense Tracked Alert - Top Right */}
                <div className="absolute -top-2 -right-5 sm:-top-4 sm:-right-10 bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-2xl p-2 sm:p-3 border border-orange-200 animate-float w-40 sm:w-52">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[10px] sm:text-xs text-gray-900">Expense Auto-Logged</div>
                      <div className="text-[8px] sm:text-[10px] text-gray-600">$850 categorized</div>
                    </div>
                  </div>
                </div>

                {/* Budget Alert - Bottom Left */}
                <div className="absolute -bottom-2 -left-5 sm:-bottom-4 sm:-left-10 bg-white rounded-lg sm:rounded-xl shadow-lg sm:shadow-2xl p-2 sm:p-3 border border-purple-200 animate-float w-36 sm:w-48" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[10px] sm:text-xs text-gray-900">Under Budget</div>
                      <div className="text-[8px] sm:text-[10px] text-gray-600">30% saved this Q</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Booking Demo Section */}
      <section className="w-full relative py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full blur-3xl opacity-30 -z-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -z-10"></div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full text-sm font-semibold text-cyan-700 mb-6 animate-bounce">
            <Sparkles className="w-4 h-4" />
            AI-Powered Booking
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Book Travel by Just Chatting
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            No forms. No complexity. Just tell our AI what you need in plain English.
          </p>
        </div>

        {/* Chat Interface Mockup */}
        <div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Phone Mockup */}
            <div className="relative animate-scale-in">
              <div className="relative mx-auto w-[340px] h-[700px] bg-gray-900 rounded-[3rem] shadow-2xl border-[14px] border-gray-800 overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>

                {/* Screen */}
                <div className="w-full h-full bg-white overflow-hidden">
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white p-4 pt-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">AI Assistant</h3>
                          <div className="flex items-center gap-1 text-xs text-cyan-100">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                            Online
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                        Demo
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div ref={chatMessagesRef} className="p-4 space-y-4 bg-gradient-to-b from-blue-50/30 to-white h-[560px] overflow-y-auto scroll-smooth">
                    {/* User Message 1 */}
                    <div className="flex justify-end">
                      <div className="max-w-[75%] bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-sm p-3 shadow">
                        <p className="text-xs">Flight to Nairobi next Tuesday, 3 people</p>
                        <div className="text-[10px] text-blue-100 mt-1">10:23 AM</div>
                      </div>
                    </div>

                    {/* AI Response 1 */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-3 shadow">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] text-gray-800 mb-2">Found options Lagos → Nairobi:</p>

                            <div className="space-y-2 mb-2">
                              <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1">
                                    <Plane className="w-3 h-3 text-blue-600" />
                                    <span className="font-bold text-[11px]">Ethiopian</span>
                                  </div>
                                  <span className="text-xs font-bold text-blue-600">$1,350</span>
                                </div>
                                <div className="text-[9px] text-gray-600">10:30 AM • 6h 30m</div>
                              </div>

                              <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1">
                                    <Plane className="w-3 h-3 text-green-600" />
                                    <span className="font-bold text-[11px]">Kenya Airways</span>
                                  </div>
                                  <span className="text-xs font-bold text-green-600">$1,560</span>
                                </div>
                                <div className="text-[9px] text-gray-600">2:15 PM • 5h 45m Direct</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">10:23 AM</div>
                      </div>
                    </div>

                    {/* User Message 2 */}
                    <div className="flex justify-end">
                      <div className="max-w-[75%] bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-sm p-3 shadow">
                        <p className="text-xs">Kenya Airways + hotel near airport for 2 nights</p>
                        <div className="text-[10px] text-blue-100 mt-1">10:25 AM</div>
                      </div>
                    </div>

                    {/* AI Response 2 */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-3 shadow">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] text-gray-800 mb-2">Great choice! ✈️</p>

                            <div className="bg-purple-50 rounded-lg p-2 border border-purple-100 mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                  <Hotel className="w-3 h-3 text-purple-600" />
                                  <span className="font-bold text-[11px]">Radisson Blu</span>
                                </div>
                                <span className="text-xs font-bold text-purple-600">$420</span>
                              </div>
                              <div className="text-[9px] text-gray-600 mb-1">⭐⭐⭐⭐⭐ 4.8/5</div>
                              <div className="text-[9px] text-gray-500">3 rooms • 2 nights</div>
                            </div>

                            <div className="bg-green-100 rounded-lg p-2 border border-green-300">
                              <div className="text-[10px]">
                                <p className="font-semibold text-gray-900">Total: $1,980</p>
                                <p className="text-gray-600 text-[9px]">Flights + Hotel for 3 pax</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">10:26 AM</div>
                      </div>
                    </div>

                    {/* User Message 3 */}
                    <div className="flex justify-end">
                      <div className="max-w-[75%] bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-sm p-3 shadow">
                        <p className="text-xs">Perfect! Book it all</p>
                        <div className="text-[10px] text-blue-100 mt-1">10:27 AM</div>
                      </div>
                    </div>

                    {/* AI Response 3 - Confirmation */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl rounded-tl-sm p-3 shadow-lg border border-green-400">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-xs mb-1">🎉 All Done!</p>
                            <div className="space-y-1 text-[10px]">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" />
                                <span>3 tickets Kenya Airways</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" />
                                <span>3 rooms Radisson Blu</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" />
                                <span>Invoice sent to email</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/20 text-[9px]">
                              ⏱️ Done in 4 minutes
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-green-100 mt-1">10:27 AM</div>
                      </div>
                    </div>

                    {/* Typing Indicator */}
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-3 shadow">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Input - Disabled Demo State */}
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        disabled
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-400 cursor-not-allowed text-xs"
                      />
                      <button
                        disabled
                        className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl opacity-50 cursor-not-allowed"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-cyan-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl animate-pulse"></div>
            </div>

            {/* Right Side - Book with Bvodo Content */}
            <div className="animate-slide-in-right max-w-2xl">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full text-sm font-semibold text-cyan-700 mb-6">
                  <MessageSquare className="w-4 h-4" />
                  Coming Soon
                </div>
                <h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                  Book with Bvodo AI
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                  Experience the future of corporate travel. Our AI assistant understands natural language and handles everything from search to booking to invoicing—all in one conversation.
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-900">Natural Conversations</h4>
                    <p className="text-gray-600">
                      Skip the forms. Just tell us what you need: "Book 3 people to Nairobi next week" and we handle the rest.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-900">Instant Smart Results</h4>
                    <p className="text-gray-600">
                      Get real-time options from multiple airlines, hotels, and transport providers—all compared and ready to book.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-900">Complete End-to-End</h4>
                    <p className="text-gray-600">
                      From initial request to confirmation email and invoice generation—everything handled in minutes, not hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-900">Context-Aware Intelligence</h4>
                    <p className="text-gray-600">
                      Our AI remembers your preferences, company policies, and budget limits—making every interaction smarter.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Modern Features Section */}
      <section id="features" className="w-full relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-tr from-pink-100 to-blue-100 rounded-full blur-3xl opacity-30 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-xs sm:text-sm font-semibold text-blue-700 mb-4 sm:mb-6 animate-bounce">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            Everything in One Platform
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Built for Modern Teams
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            From booking to invoicing, manage your entire travel workflow in seconds
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Large Feature 1 */}
          <div className="md:col-span-3 group relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 text-white overflow-hidden hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 animate-fade-in">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10">
              <div className="mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Plane className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3">Instant Flight & Hotel Booking</h3>
              <p className="text-sm sm:text-base text-blue-100 mb-3 sm:mb-4">Real-time pricing from Amadeus & Booking.com. Search thousands of flights and hotels across Africa.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 sm:px-3 bg-white/20 rounded-full text-xs backdrop-blur-sm">Amadeus API</span>
                <span className="px-2.5 py-1 sm:px-3 bg-white/20 rounded-full text-xs backdrop-blur-sm">Live Pricing</span>
              </div>
            </div>
          </div>

          {/* Medium Feature */}
          <div className="md:col-span-3 group relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border-2 border-gray-100 hover:border-blue-200 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 animate-pulse"></div>
            <div className="relative z-10">
              <div className="mb-3 sm:mb-4 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                <Car className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-gray-900">Ground Transportation</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Uber, taxis, car rentals - all tracked automatically. One platform for all travel needs.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 sm:px-3 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Uber Integration</span>
                <span className="px-2.5 py-1 sm:px-3 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Auto-Track</span>
              </div>
            </div>
          </div>

          {/* Small Features */}
          <div className="md:col-span-2 group relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white overflow-hidden hover:scale-[1.02] transition-all duration-500 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2">Real-Time Expense Tracking</h3>
              <p className="text-green-100 text-xs sm:text-sm">Every expense, categorized automatically</p>
            </div>
          </div>

          <div className="md:col-span-2 group relative bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white overflow-hidden hover:scale-[1.02] transition-all duration-500 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="mb-2 sm:mb-3 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2">Smart Approvals</h3>
              <p className="text-orange-100 text-xs sm:text-sm">Multi-level workflow automation</p>
            </div>
          </div>

          <div className="md:col-span-2 group relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border-2 border-gray-100 hover:border-purple-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="absolute -bottom-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 animate-pulse"></div>
            <div className="relative z-10">
              <div className="mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2 text-gray-900">Analytics Dashboard</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Insights & cost optimization</p>
            </div>
          </div>

          {/* AI Chat Booking Feature */}
          <div className="md:col-span-3 group relative bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-3xl p-8 text-white overflow-hidden hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 animate-fade-in" style={{ animationDelay: '0.33s' }}>
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10">
              <div className="mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <MessageSquare className="w-16 h-16" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-2xl font-bold">AI-Powered Chat Booking</h3>
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-cyan-100 mb-4">Just chat naturally. "Book me a flight to Nairobi next Tuesday" - done! Our AI understands your intent and handles the rest.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">Natural Language</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">Instant Quotes</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">Smart Assistant</span>
              </div>
            </div>
          </div>

          {/* Wide Feature */}
          <div className="md:col-span-3 group relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-3xl p-8 text-white overflow-hidden hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <div className="absolute top-0 left-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10">
              <div className="mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <FileText className="w-16 h-16" />
              </div>
              <h3 className="text-3xl font-bold mb-3">Automated Invoicing Magic</h3>
              <p className="text-purple-100 text-lg mb-4">Individual, group, or bulk invoices generated in 1 click. Export to QuickBooks, Xero, or download as PDF.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">One-Click</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">Group Invoicing</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">Auto-Export</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">PDF/Excel</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 group relative bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl p-6 text-white overflow-hidden hover:scale-[1.02] transition-all duration-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="mb-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Lock className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
              <p className="text-gray-300 text-sm">Bank-level encryption & compliance</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {[
            { number: '70%', label: 'Time Saved' },
            { number: '10K+', label: 'Bookings/Month' },
            { number: '$2M+', label: 'Managed' },
            { number: '500+', label: 'Companies' },
          ].map((stat, index) => (
            <div key={index} className="text-center group hover:scale-110 transition-transform duration-300">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Invoicing Feature Highlight */}
      <section className="w-full py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6">
                <FileText className="w-4 h-4" />
                Invoicing Made Simple
              </div>
              <h2 className="text-4xl font-bold mb-6">From Expense to Invoice in Seconds</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-xl">
                Automatically generate invoices from travel expenses. Individual, group, or consolidated - your choice.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                  <div>
                    <div className="font-semibold">One-Click Generation</div>
                    <div className="text-blue-100">Create professional invoices instantly with all expense details</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                  <div>
                    <div className="font-semibold">Group Invoicing</div>
                    <div className="text-blue-100">Combine multiple team members' expenses into one invoice</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                  <div>
                    <div className="font-semibold">Auto-Categorization</div>
                    <div className="text-blue-100">Flights, hotels, Uber rides, meals - all automatically categorized</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative space-y-6">
              {/* Credit Card */}
              <div className="perspective-1000">
                <div
                  className={`relative w-full h-52 transition-all duration-700 transform-style-3d ${cardFlip ? 'rotate-y-180' : ''}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Card Front */}
                  <div
                    className="absolute w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex flex-col h-full justify-between text-white">
                      <div className="flex justify-between items-start">
                        <div className="text-2xl font-bold">bvodo</div>
                        <div className="w-12 h-8 bg-yellow-400/30 rounded"></div>
                      </div>
                      <div>
                        <div className="text-xl tracking-widest mb-4 font-mono">
                          •••• •••• •••• 4242
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-xs text-white/60">Cardholder</div>
                            <div className="font-semibold">ACME CORP</div>
                          </div>
                          <div>
                            <div className="text-xs text-white/60">Expires</div>
                            <div className="font-semibold">12/25</div>
                          </div>
                          <div className="text-2xl font-bold">VISA</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div
                    className="absolute w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl rotate-y-180"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="w-full h-12 bg-black mt-6"></div>
                    <div className="px-6 mt-4">
                      <div className="bg-white/90 h-10 flex items-center justify-end px-4 rounded">
                        <span className="font-mono text-sm">123</span>
                      </div>
                      <div className="text-white/60 text-xs mt-4">
                        For customer service call 1-800-BVODO
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Invoice */}
              <div
                className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transition-all duration-1000 ${
                  invoiceVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
              >
                <div className="bg-white rounded-xl p-6 shadow-2xl relative overflow-hidden">
                  {/* Animated stamp */}
                  <div className={`absolute top-4 right-4 transition-all duration-500 ${invoiceVisible ? 'rotate-0 opacity-100' : 'rotate-45 opacity-0'}`}>
                    <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium border-2 border-green-500 rotate-12">
                      PAID
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Invoice</div>
                      <div className="font-bold text-gray-900">#INV-2024-1234</div>
                    </div>
                    <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      bvodo
                    </div>
                  </div>

                  {/* Animated line items */}
                  <div className="space-y-3 mb-4">
                    {[
                      { label: 'Flight (LOS-NBO)', amount: '$450.00', delay: '0ms' },
                      { label: 'Hotel (2 nights)', amount: '$280.00', delay: '100ms' },
                      { label: 'Uber Rides (3)', amount: '$45.00', delay: '200ms' },
                      { label: 'Meals & Others', amount: '$75.00', delay: '300ms' }
                    ].map((item, index) => (
                      <div
                        key={index}
                        className={`flex justify-between text-sm transition-all duration-500`}
                        style={{
                          transitionDelay: item.delay,
                          transform: invoiceVisible ? 'translateX(0)' : 'translateX(-20px)',
                          opacity: invoiceVisible ? 1 : 0
                        }}
                      >
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold">{item.amount}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`flex justify-between text-lg font-bold pt-4 border-t transition-all duration-700 ${
                    invoiceVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                  }`}>
                    <span>Total</span>
                    <span className="text-blue-600">$850.00</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 text-xs bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium">
                      📧 Email
                    </button>
                    <button className="flex-1 text-xs bg-purple-50 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 transition font-medium">
                      📄 Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Moving Invoices Showcase */}
      <section className="w-full relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full text-sm font-semibold text-green-700 mb-6">
            <CreditCard className="w-4 h-4" />
            Invoice Automation
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
            See Your Invoices Come to Life
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how effortlessly we transform your travel expenses into professional invoices
          </p>
        </div>

        {/* Invoice Stack Animation */}
        <div className="relative h-[600px] flex items-center justify-center">
          {/* Background invoices */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[0, 1, 2].map((index) => {
              const isActive = index === activeInvoice;
              const offset = (index - activeInvoice + 3) % 3;

              return (
                <div
                  key={index}
                  className="absolute transition-all duration-700 ease-out"
                  style={{
                    transform: `
                      translateX(${offset === 0 ? '0' : offset === 1 ? '400px' : '-400px'}px)
                      translateY(${offset === 0 ? '0' : '50px'}px)
                      scale(${offset === 0 ? '1' : '0.85'})
                      rotateY(${offset === 1 ? '15deg' : offset === 2 ? '-15deg' : '0deg'})
                    `,
                    opacity: offset === 0 ? 1 : 0.4,
                    zIndex: offset === 0 ? 10 : 1,
                  }}
                >
                  <div className="bg-white rounded-2xl shadow-2xl p-8 w-[400px] border-2 border-gray-100">
                    {/* Invoice Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          bvodo
                        </div>
                        <div className="text-sm text-gray-500">Corporate Travel Platform</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase mb-1">Invoice</div>
                        <div className="font-bold text-lg">
                          {index === 0 ? '#INV-2024-1234' : index === 1 ? '#INV-2024-1235' : '#INV-2024-1236'}
                        </div>
                      </div>
                    </div>

                    {/* Invoice Type Badge */}
                    <div className="mb-6">
                      <span className={`inline-block px-4 py-2 rounded-lg text-xs font-semibold ${
                        index === 0 ? 'bg-blue-100 text-blue-700' :
                        index === 1 ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {index === 0 ? '📄 Individual Invoice' : index === 1 ? '👥 Group Invoice (5 travelers)' : '⚡ One-Click Invoice'}
                      </span>
                    </div>

                    {/* Client Info */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Bill To:</div>
                      <div className="font-semibold text-gray-900">
                        {index === 0 ? 'Acme Corporation' : index === 1 ? 'TechHub Nigeria' : 'StartupGH Ltd'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {index === 0 ? 'Lagos, Nigeria' : index === 1 ? 'Abuja, Nigeria' : 'Accra, Ghana'}
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-3 mb-6">
                      {index === 0 && (
                        <>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Plane className="w-4 h-4 text-blue-600" />
                              Flight LOS → NBO
                            </span>
                            <span className="font-semibold">$450.00</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-purple-600" />
                              Hotel (3 nights)
                            </span>
                            <span className="font-semibold">$420.00</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Car className="w-4 h-4 text-green-600" />
                              Uber Rides (4)
                            </span>
                            <span className="font-semibold">$60.00</span>
                          </div>
                        </>
                      )}
                      {index === 1 && (
                        <>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Plane className="w-4 h-4 text-blue-600" />
                              Group Flights (5 pax)
                            </span>
                            <span className="font-semibold">$2,250.00</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-purple-600" />
                              Hotels (10 nights)
                            </span>
                            <span className="font-semibold">$1,400.00</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Car className="w-4 h-4 text-green-600" />
                              Ground Transport
                            </span>
                            <span className="font-semibold">$300.00</span>
                          </div>
                        </>
                      )}
                      {index === 2 && (
                        <>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Plane className="w-4 h-4 text-blue-600" />
                              Flight ACC → JNB
                            </span>
                            <span className="font-semibold">$620.00</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-purple-600" />
                              Hotel (2 nights)
                            </span>
                            <span className="font-semibold">$280.00</span>
                          </div>
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-gray-600 flex items-center gap-2">
                              <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                              Meals & Expenses
                            </span>
                            <span className="font-semibold">$150.00</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-6 border-t-2 border-gray-900">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {index === 0 ? '$930.00' : index === 1 ? '$3,950.00' : '$1,050.00'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4">
                      <div className={`inline-block px-4 py-2 rounded-lg text-xs font-bold ${
                        offset === 0 ? 'bg-green-100 text-green-700 border-2 border-green-500 animate-pulse' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {offset === 0 ? '✓ PROCESSED' : 'QUEUED'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setActiveInvoice(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === activeInvoice
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-3'
                    : 'bg-gray-300 w-3 h-3 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Features Below */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-center mb-3">
              <Zap className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">One-Click Generation</h3>
            <p className="text-gray-600 text-sm">Create invoices instantly from any booking or expense report</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-center mb-3">
              <Users className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Group Invoicing</h3>
            <p className="text-gray-600 text-sm">Consolidate multiple travelers into a single invoice automatically</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-center mb-3">
              <Upload className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Export Anywhere</h3>
            <p className="text-gray-600 text-sm">PDF, Excel, QuickBooks, Xero - export to your favorite tools</p>
          </div>
        </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Floating decorations */}
        <div className="absolute top-20 left-10 w-16 h-16 sm:w-20 sm:h-20 bg-blue-200/30 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 sm:w-32 sm:h-32 bg-purple-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Loved by African Businesses</h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600">See what our customers say</p>
        </div>
        <div className="relative">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-12 border border-gray-100 animate-scale-in">
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{testimonials[currentTestimonial].name}</div>
              <div className="text-sm sm:text-base text-gray-600">{testimonials[currentTestimonial].role}</div>
              <div className="text-xs sm:text-sm text-gray-500">{testimonials[currentTestimonial].company}</div>
            </div>
            <div className="text-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600 mx-auto mb-3 sm:mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed italic">
                "{testimonials[currentTestimonial].quote}"
              </p>
            </div>
          </div>
          {/* Carousel Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition ${
                  index === currentTestimonial ? 'bg-blue-600 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full relative bg-gradient-to-r from-blue-600 to-purple-600 py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative max-w-4xl mx-auto text-center px-4 md:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 animate-fade-in">
            Ready to Transform Your Corporate Travel?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Join hundreds of African organizations saving time and money
          </p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base bg-white text-blue-600 rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold animate-scale-in"
            style={{ animationDelay: '0.2s' }}
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-gray-400 py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Plane className="text-white w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-white font-bold text-base sm:text-lg">bvodo</span>
              </div>
              <p className="text-xs sm:text-sm">
                Corporate travel made simple for African businesses
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="#" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm">
            <p>&copy; 2024 bvodo. Built for African businesses.</p>
          </div>
        </div>
      </footer>

      {/* Floating AI Chat Button - Mobile-First */}
      {!showAIChat && (
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-40 group"
          aria-label="Open AI Chat"
        >
          {/* Pulsing rings */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-ping opacity-75"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-pulse"></div>

          {/* Main button */}
          <div className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-110">
            {/* Mobile version - Just icon */}
            <div className="md:hidden p-4">
              <Sparkles className="w-7 h-7" />
            </div>

            {/* Desktop version - Icon + Text */}
            <div className="hidden md:flex items-center gap-3 px-6 py-4">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <div className="text-left">
                <div className="font-bold text-sm">Try AI Booking</div>
                <div className="text-xs text-cyan-100">Just chat naturally</div>
              </div>
            </div>
          </div>

          {/* Badge - "NEW" or "AI" */}
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
            AI
          </div>
        </button>
      )}

      {/* AI Chatbox Modal */}
      {showAIChat && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end p-0 md:p-8">
          {/* Backdrop - click to close */}
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
              <AIChatbox forceOpen={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

