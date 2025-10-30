'use client';

import Link from 'next/link';
import { Check, Zap, Plane, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Starter',
      price: '500',
      period: '/month',
      description: 'Perfect for small teams getting started',
      features: [
        '$4,000 booking credit',
        'Basic travel perks',
        'Email support',
        'Standard booking tools',
        'Basic reporting',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Professional',
      price: '1,000',
      period: '/month',
      description: 'Ideal for growing businesses',
      features: [
        '$20,000 booking credit',
        'Enhanced travel perks',
        'Priority support',
        'Detailed analytics',
        'Team management',
        'Policy controls',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with unique needs',
      features: [
        'Custom booking credit',
        'Premium travel perks',
        'Concierge support',
        'Enterprise booking tools',
        'Advanced analytics & reporting',
        'Unlimited team members',
        'Custom policy controls',
        'API access',
        'Dedicated account manager',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full">
          <div className="flex justify-between items-center h-14 sm:h-16 px-4 md:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-[#ADF802]" />
              </div>
              <span className="font-bold text-lg sm:text-2xl text-black">bvodo</span>
            </Link>
            <div className="flex gap-2 sm:gap-4">
              <Link
                href="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-700 hover:text-[#ADF802] font-medium transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base bg-gray-900 text-white rounded-lg hover:bg-gray-800 hover:shadow-lg hover:shadow-[#ADF802]/20 transition font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ADF802]/10 rounded-full mb-6">
            <Zap className="w-4 h-4 text-black" />
            <span className="text-sm font-semibold text-black">Simple, transparent pricing</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-4 sm:mb-6">
            Choose Your Plan
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Get started with bvodo today. All plans include our core features with varying credit values and support levels.
          </p>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mt-12">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl border-2 p-8 text-left hover:scale-105 transition-all duration-300 ${
                  tier.popular
                    ? 'border-black shadow-2xl'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-black text-[#ADF802] text-sm font-bold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">{tier.name}</h3>
                  <p className="text-gray-600 text-sm">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    {tier.price !== 'Custom' && (
                      <span className="text-2xl font-bold text-black">$</span>
                    )}
                    <span className="text-5xl font-bold text-black">{tier.price}</span>
                    {tier.period && (
                      <span className="text-gray-500 text-lg">{tier.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.name === 'Enterprise' ? '/contact' : '/register'}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    tier.popular
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-6">
              Our team is here to help you find the perfect plan for your business.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-black rounded-xl hover:border-black transition font-bold"
            >
              Contact Sales
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-black text-gray-300 px-4 py-8 sm:py-12 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="/#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
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
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/cancellation-policy" className="hover:text-white transition">Cancellation Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Connect</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="#" className="hover:text-white transition">Twitter</Link></li>
                <li><Link href="#" className="hover:text-white transition">LinkedIn</Link></li>
                <li><Link href="#" className="hover:text-white transition">Instagram</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center text-xs sm:text-sm">
            <p>&copy; {new Date().getFullYear()} bvodo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
