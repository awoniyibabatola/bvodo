'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  CreditCard,
  Shield,
  HelpCircle,
} from 'lucide-react';
import CurrencySwitcher from './CurrencySwitcher';
import { getApiEndpoint } from '@/lib/api-config';

interface UserMenuProps {
  user: {
    name: string;
    email?: string;
    role: string;
    organization?: string;
    avatar?: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      await fetch(getApiEndpoint('auth/logout'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');

      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      router.push('/login');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'text-purple-600 bg-purple-100';
      case 'admin':
      case 'company_admin':
        return 'text-blue-600 bg-blue-100';
      case 'manager':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex items-center gap-3">
      {/* Notifications */}
      <button
        onClick={() => router.push('/dashboard/notifications')}
        className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
      >
        <Bell className="w-5 h-5" />
      </button>

      {/* User Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:bg-gray-50 rounded-r-xl transition-colors py-1 pr-2"
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white ring-2 ring-[#FF6B6B]/20"
            />
          ) : (
            <div className="w-10 h-10 bg-[#FF6B6B] rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white ring-2 ring-[#FF6B6B]/20">
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-900">{user.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user.organization || ''}</p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform hidden md:block ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900">{user.name || 'User'}</p>
              {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getRoleColor(
                    user.role
                  )}`}
                >
                  {formatRole(user.role)}
                </span>
              </div>
            </div>

            {/* Currency Switcher Section */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Display Currency
              </p>
              <CurrencySwitcher />
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  router.push('/dashboard/profile');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">My Profile</p>
                  <p className="text-xs text-gray-500">View and edit your profile</p>
                </div>
              </button>

              <button
                onClick={() => {
                  router.push('/dashboard/settings');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Settings</p>
                  <p className="text-xs text-gray-500">Account preferences</p>
                </div>
              </button>

              {(user.role === 'admin' || user.role === 'company_admin') && (
                <button
                  onClick={() => {
                    router.push('/dashboard/billing');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Billing</p>
                    <p className="text-xs text-gray-500">Manage subscription</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  router.push('/dashboard/help');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Help & Support</p>
                  <p className="text-xs text-gray-500">Get help and contact us</p>
                </div>
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 mt-2">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
