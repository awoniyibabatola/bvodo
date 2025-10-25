'use client';

import { Luggage, Briefcase, Crown, Sparkles } from 'lucide-react';

interface TravelClassOption {
  value: string;
  label: string;
  icon: typeof Luggage | typeof Briefcase | typeof Crown | typeof Sparkles;
  colors: {
    gradient: string;
    iconBg: string;
    iconColor: string;
    border: string;
    hoverBorder: string;
  };
}

interface TravelClassSelectorProps {
  value: string;
  onChange: (value: string) => void;
  variant?: 'desktop' | 'mobile';
  className?: string;
}

const travelClasses: TravelClassOption[] = [
  {
    value: 'ECONOMY',
    label: 'Economy',
    icon: Luggage,
    colors: {
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-300',
    }
  },
  {
    value: 'PREMIUM_ECONOMY',
    label: 'Premium Economy',
    icon: Briefcase,
    colors: {
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      border: 'border-purple-200',
      hoverBorder: 'hover:border-purple-300',
    }
  },
  {
    value: 'BUSINESS',
    label: 'Business',
    icon: Crown,
    colors: {
      gradient: 'from-amber-500 to-amber-600',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-300',
    }
  },
  {
    value: 'FIRST',
    label: 'First Class',
    icon: Sparkles,
    colors: {
      gradient: 'from-slate-700 to-slate-900',
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-700',
      border: 'border-slate-200',
      hoverBorder: 'hover:border-slate-300',
    }
  },
];

export default function TravelClassSelector({
  value,
  onChange,
  variant = 'desktop',
  className = '',
}: TravelClassSelectorProps) {
  const isDesktop = variant === 'desktop';

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isDesktop ? 'md:gap-2.5' : ''} ${className}`}>
      {travelClasses.map((cls) => {
        const Icon = cls.icon;
        const isSelected = value === cls.value;

        return (
          <button
            key={cls.value}
            type="button"
            onClick={() => onChange(cls.value)}
            className={`group relative overflow-hidden p-4 ${isDesktop ? 'md:p-2.5' : ''} rounded-xl ${isDesktop ? 'md:rounded-lg' : ''} font-medium border-2 transition-all duration-300 ${
              isSelected
                ? `${cls.colors.border} bg-gradient-to-br ${cls.colors.gradient} text-white shadow-lg shadow-${cls.colors.gradient.split('-')[1]}-200 scale-[1.02]`
                : `border-gray-200 bg-white text-gray-700 ${cls.colors.hoverBorder} hover:shadow-md hover:scale-[1.01]`
            }`}
          >
            {/* Icon Badge */}
            <div className={`${isDesktop ? 'md:inline-flex md:items-center md:gap-2' : 'flex flex-col items-center gap-2'}`}>
              <div className={`flex items-center justify-center w-10 h-10 ${isDesktop ? 'md:w-7 md:h-7' : ''} rounded-lg ${
                isSelected
                  ? 'bg-white/20 backdrop-blur-sm'
                  : `${cls.colors.iconBg}`
              } transition-all duration-300 ${isDesktop ? 'mx-auto mb-2 md:mb-0 md:mx-0' : 'mx-auto'}`}>
                <Icon
                  className={`w-5 h-5 ${isDesktop ? 'md:w-4 md:h-4' : ''} ${
                    isSelected ? 'text-white' : cls.colors.iconColor
                  } transition-all duration-300`}
                />
              </div>

              {/* Label */}
              <div className={`${isDesktop ? 'md:text-left' : 'text-center'}`}>
                <span className={`text-xs ${isDesktop ? 'md:text-[11px]' : ''} font-semibold block leading-tight`}>
                  {cls.label}
                </span>
              </div>
            </div>

            {/* Selected Indicator - Small dot or checkmark */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}
