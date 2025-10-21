'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plane, Mail, Lock, ArrowRight, Sparkles, Globe, Zap, Shield, TrendingUp, Check } from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(getApiEndpoint('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
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
        alert('Login successful! Redirecting to dashboard...');

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        alert(data.message || 'Login failed. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-scale-in">
        <div className="grid lg:grid-cols-2 min-h-[700px]">
          {/* Left Side - Visual/Branding */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-12 flex flex-col justify-between overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>

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
                    Welcome Back!
                  </h1>
                  <p className="text-xl text-blue-100 leading-relaxed">
                    Continue managing your corporate travel with ease
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <p className="text-blue-100">Track all bookings in real-time</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <p className="text-blue-100">Generate automated invoices</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <p className="text-blue-100">Manage team travel with approval workflows</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Quote */}
            <div className="relative z-10 pt-8 border-t border-white/20">
              <div className="text-white/90 italic mb-2">
                "bvodo reduced our travel management time by 70%. It's a game-changer!"
              </div>
              <div className="text-blue-100 text-sm">
                — Chidi Okafor, CFO at TechHub Nigeria
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
                    Sign In
                  </h2>
                  <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                </div>
                <p className="text-gray-600">Access your dashboard and manage your travel</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-purple-600 font-medium transition-colors">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-700 cursor-pointer">
                    Remember me for 30 days
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">New to bvodo?</span>
                </div>
              </div>

              {/* Register Link */}
              <Link
                href="/register"
                className="block w-full px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-300 font-semibold text-center border-2 border-gray-200 hover:border-gray-300 hover:scale-[1.02]"
              >
                Create an Account
              </Link>

              {/* Footer */}
              <p className="text-center text-xs text-gray-500 mt-8">
                By signing in, you agree to our{' '}
                <Link href="#" className="text-blue-600 hover:text-purple-600 font-medium transition-colors">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-blue-600 hover:text-purple-600 font-medium transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
