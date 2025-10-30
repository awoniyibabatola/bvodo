'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plane, ArrowLeft, Menu, X } from 'lucide-react';
import UserMenu from './UserMenu';

interface NavLink {
  label: string;
  href: string;
  key: string;
  gradient?: boolean;
}

interface UnifiedNavBarProps {
  currentPage?: string;
  user: {
    name: string;
    role: string;
    email?: string;
    organization?: string;
    avatar?: string;
  };
  showBackButton?: boolean;
  backButtonHref?: string;
  backButtonLabel?: string;
}

export default function UnifiedNavBar({
  currentPage,
  user,
  showBackButton = false,
  backButtonHref = '/dashboard',
  backButtonLabel = 'Back to Dashboard',
}: UnifiedNavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Define navigation links based on user role
  const getNavLinks = (): NavLink[] => {
    if (user.role === 'super_admin') {
      return [
        { label: 'Dashboard', href: '/dashboard', key: 'dashboard' },
        { label: 'Super Admin', href: '/super-admin', key: 'super-admin', gradient: true },
      ];
    }

    const baseLinks: NavLink[] = [
      { label: 'Dashboard', href: '/dashboard', key: 'dashboard' },
      { label: 'Bookings', href: '/dashboard/bookings', key: 'bookings' },
      { label: 'Flights', href: '/dashboard/flights/search?new=true', key: 'flights' },
      { label: 'Hotels', href: '/dashboard/hotels/search', key: 'hotels' },
      { label: 'Perks', href: '/dashboard/perks', key: 'perks' },
    ];

    // Add Approvals for admin, manager, company_admin
    if (user.role === 'admin' || user.role === 'manager' || user.role === 'company_admin') {
      baseLinks.push({ label: 'Approvals', href: '/dashboard/approvals', key: 'approvals' });
    }

    // Add Users and Analytics for admin and company_admin
    if (user.role === 'admin' || user.role === 'company_admin') {
      baseLinks.push(
        { label: 'Users', href: '/dashboard/users', key: 'users' },
        { label: 'Analytics', href: '/dashboard/analytics', key: 'analytics' }
      );
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  const isActive = (key: string) => {
    if (!currentPage) return false;
    return currentPage === key;
  };

  return (
    <nav className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 md:gap-8">
            {/* Mobile Menu Button */}
            {!showBackButton && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 md:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gray-900 rounded-2xl blur opacity-20 group-hover:opacity-30 transition"></div>
                <div className="relative w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center">
                  <Plane className="text-white w-5 h-5" />
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">
                bvodo
              </span>
            </Link>

            {/* Back Button (optional) */}
            {showBackButton && (
              <Link
                href={backButtonHref}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden md:inline text-sm">{backButtonLabel}</span>
              </Link>
            )}

            {/* Desktop Navigation Links */}
            {!showBackButton && (
              <div className="hidden md:flex gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className={
                      link.gradient
                        ? 'px-4 py-2 text-white font-medium bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:shadow-lg transition'
                        : isActive(link.key)
                        ? 'px-4 py-2 text-gray-900 font-medium bg-gray-100 rounded-xl'
                        : 'px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition'
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* User Menu */}
          <UserMenu user={user} />
        </div>

        {/* Mobile Navigation Menu */}
        {!showBackButton && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    link.gradient
                      ? 'px-4 py-3 text-white font-medium bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:shadow-lg transition text-center'
                      : isActive(link.key)
                      ? 'px-4 py-3 text-gray-900 font-medium bg-gray-100 rounded-xl'
                      : 'px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition'
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
