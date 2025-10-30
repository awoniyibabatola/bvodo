'use client';

import Link from 'next/link';
import { User, Settings, HelpCircle } from 'lucide-react';

interface AccountSubNavProps {
  currentPage: 'profile' | 'settings' | 'help';
}

export default function AccountSubNav({ currentPage }: AccountSubNavProps) {
  const links = [
    {
      key: 'profile',
      href: '/dashboard/profile',
      label: 'My Profile',
      icon: User,
    },
    {
      key: 'settings',
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
    },
    {
      key: 'help',
      href: '/dashboard/help',
      label: 'Help & Support',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="border-b border-gray-200 mb-8">
      <div className="flex gap-1 overflow-x-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentPage === link.key;

          return (
            <Link
              key={link.key}
              href={link.href}
              className={`
                flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap
                ${isActive
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
