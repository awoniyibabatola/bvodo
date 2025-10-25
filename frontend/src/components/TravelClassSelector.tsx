'use client';

import { Luggage, Briefcase } from 'lucide-react';

interface TravelClassOption {
  value: string;
  label: string;
  icon: typeof Luggage | typeof Briefcase;
}

interface TravelClassSelectorProps {
  value: string;
  onChange: (value: string) => void;
  variant?: 'desktop' | 'mobile';
  className?: string;
}

const travelClasses: TravelClassOption[] = [
  { value: 'ECONOMY', label: 'Economy', icon: Luggage },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', icon: Briefcase },
  { value: 'BUSINESS', label: 'Business', icon: Briefcase },
  { value: 'FIRST', label: 'First Class', icon: Briefcase },
];

export default function TravelClassSelector({
  value,
  onChange,
  variant = 'desktop',
  className = '',
}: TravelClassSelectorProps) {
  const isDesktop = variant === 'desktop';

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${isDesktop ? 'md:gap-2' : ''} ${className}`}>
      {travelClasses.map((cls) => {
        const Icon = cls.icon;
        const isSelected = value === cls.value;

        return (
          <button
            key={cls.value}
            type="button"
            onClick={() => onChange(cls.value)}
            className={`p-3 ${isDesktop ? 'md:p-2' : ''} rounded-lg ${isDesktop ? 'md:rounded' : ''} font-medium border transition-all ${
              isSelected
                ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <Icon
              className={`w-4 h-4 ${isDesktop ? 'md:w-4 md:h-4' : ''} mx-auto mb-1 ${isDesktop ? 'md:mb-0 md:inline md:mr-1.5' : ''}`}
            />
            <span className={`text-xs ${isDesktop ? 'md:text-xs' : ''} block ${isDesktop ? 'md:inline' : ''}`}>
              {cls.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
