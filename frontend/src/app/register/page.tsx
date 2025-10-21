'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plane, Building2, User, Mail, Lock, Check, ArrowRight, Sparkles, Shield, Zap, TrendingUp, Users, Globe, Star } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    organizationName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiEndpoint('auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store tokens
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('organization', JSON.stringify(data.data.organization));

        // Show success message
        alert('Registration successful! Redirecting to dashboard...');

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        alert(data.message || 'Registration failed. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-scale-in">
        <div className="grid lg:grid-cols-2 min-h-[800px]">
          {/* Left Side - Visual/Branding */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 flex flex-col justify-between overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-float"></div>

            <div className="relative z-10">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 mb-12 group">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Plane className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-white">
                  bvodo
                </span>
              </Link>

              {/* Main Content */}
              <div className="text-white space-y-8">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                    Join 500+ Organizations
                  </h1>
                  <p className="text-xl text-blue-100 leading-relaxed">
                    Simplify corporate travel management across Africa with our all-in-one platform
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Instant Booking</h3>
                      <p className="text-blue-100 text-sm">Book flights, hotels, and ground transport in seconds</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Smart Analytics</h3>
                      <p className="text-blue-100 text-sm">Track expenses and optimize travel spending</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-pink-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Team Management</h3>
                      <p className="text-blue-100 text-sm">Manage unlimited travelers with role-based access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="relative z-10 grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-blue-100">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">10K+</div>
                <div className="text-sm text-blue-100">Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">4.9★</div>
                <div className="text-sm text-blue-100">Rating</div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center relative">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -z-10"></div>

            <div className="max-w-md mx-auto w-full">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Create Account
                  </h2>
                  <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                </div>
                <p className="text-gray-600">Start your 14-day free trial. No credit card required.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Organization Name */}
                <div className="group">
                  <label htmlFor="organizationName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Building2 className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                      placeholder="Acme Corporation"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="group">
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                      placeholder="At least 8 characters"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Shield className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                      placeholder="Repeat your password"
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    I agree to the{' '}
                    <Link href="#" className="text-blue-600 hover:text-purple-600 font-medium transition-colors">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" className="text-blue-600 hover:text-purple-600 font-medium transition-colors">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
                </div>
              </div>

              {/* Login Link */}
              <Link
                href="/login"
                className="block w-full px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-300 font-semibold text-center border-2 border-gray-200 hover:border-gray-300 hover:scale-[1.02]"
              >
                Sign In Instead
              </Link>

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Free Trial</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span>Quick Setup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
