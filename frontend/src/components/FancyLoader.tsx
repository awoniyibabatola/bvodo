'use client';

import { Building2, Search, LucideIcon } from 'lucide-react';

interface FancyLoaderProps {
  message?: string;
  fullScreen?: boolean;
  icon?: LucideIcon;
}

export default function FancyLoader({ message = 'Loading...', fullScreen = false, icon: Icon = Building2 }: FancyLoaderProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white flex items-center justify-center z-50'
    : 'flex items-center justify-center py-8 md:py-12';

  return (
    <div className={containerClasses}>
      <div className="text-center px-4">
        {/* Simple Icon Animation */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-gray-900 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-6 h-6 md:w-8 md:h-8 text-gray-900" />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <p className="text-sm md:text-base font-semibold text-gray-900">
            {message}
          </p>

          {/* Simple loading dots */}
          <div className="flex justify-center gap-1.5">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce [animation-delay:0ms]"></div>
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce [animation-delay:150ms]"></div>
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce [animation-delay:300ms]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
