'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plane, Mail, Lock, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Plane className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-semibold text-gray-900">bvodo</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in</h2>
          <p className="text-sm text-gray-600 mb-6">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none min-h-[44px]"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-gray-900 hover:underline">
                Sign up
              </Link>
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2024 bvodo. All rights reserved.
        </p>
      </div>
    </div>
  );
}