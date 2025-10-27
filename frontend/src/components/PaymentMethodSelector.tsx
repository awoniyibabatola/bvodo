'use client';

import { Wallet, CreditCard } from 'lucide-react';

interface PaymentMethodOption {
  value: 'credit' | 'card';
  label: string;
  description: string;
  icon: typeof Wallet | typeof CreditCard;
  colors: {
    gradient: string;
    iconBg: string;
    iconColor: string;
    border: string;
    hoverBorder: string;
  };
}

interface PaymentMethodSelectorProps {
  value: 'credit' | 'card';
  onChange: (value: 'credit' | 'card') => void;
  userCredits?: number;
  bookingAmount?: number;
  className?: string;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    value: 'credit',
    label: 'Bvodo Credit',
    description: 'Use company prepaid balance',
    icon: Wallet,
    colors: {
      gradient: 'from-black to-gray-900',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      border: 'border-black',
      hoverBorder: 'hover:border-gray-300',
    }
  },
  {
    value: 'card',
    label: 'Credit/Debit Card',
    description: 'Pay with your personal card',
    icon: CreditCard,
    colors: {
      gradient: 'from-black to-gray-900',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      border: 'border-black',
      hoverBorder: 'hover:border-gray-300',
    }
  },
];

export default function PaymentMethodSelector({
  value,
  onChange,
  userCredits,
  bookingAmount,
  className = '',
}: PaymentMethodSelectorProps) {
  const hasInsufficientCredits = userCredits !== undefined &&
                                  bookingAmount !== undefined &&
                                  userCredits < bookingAmount;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Payment Method
      </label>

      {userCredits !== undefined && (
        <div className="text-sm text-gray-600 mb-3">
          <div className="font-medium text-gray-700 mb-1">Company Bvodo Credits</div>
          <div>Available Balance: <span className="font-semibold text-gray-900">${userCredits.toFixed(2)}</span></div>
          {bookingAmount !== undefined && (
            <div className="mt-1">
              Booking Amount: <span className="font-semibold text-gray-900">${bookingAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.value;
          const isDisabled = method.value === 'credit' && hasInsufficientCredits;

          return (
            <button
              key={method.value}
              type="button"
              onClick={() => !isDisabled && onChange(method.value)}
              disabled={isDisabled}
              className={`group relative overflow-hidden p-4 rounded-xl font-medium border-2 transition-all duration-300 ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-300'
                  : isSelected
                    ? `${method.colors.border} bg-gradient-to-br ${method.colors.gradient} text-white shadow-lg scale-[1.02]`
                    : `border-gray-200 bg-white text-gray-700 ${method.colors.hoverBorder} hover:shadow-md hover:scale-[1.01]`
              }`}
            >
              {/* Icon and Label */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  isDisabled
                    ? 'bg-gray-200'
                    : isSelected
                      ? 'bg-white/20 backdrop-blur-sm'
                      : method.colors.iconBg
                } transition-all duration-300`}>
                  <Icon
                    className={`w-5 h-5 ${
                      isDisabled
                        ? 'text-gray-400'
                        : isSelected
                          ? 'text-white'
                          : method.colors.iconColor
                    } transition-all duration-300`}
                  />
                </div>

                <div className="text-left flex-1">
                  <div className={`text-sm font-semibold ${
                    isDisabled
                      ? 'text-gray-400'
                      : isSelected
                        ? 'text-white'
                        : 'text-gray-900'
                  }`}>
                    {method.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    isDisabled
                      ? 'text-gray-400'
                      : isSelected
                        ? 'text-gray-300'
                        : 'text-gray-500'
                  }`}>
                    {method.description}
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && !isDisabled && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </div>

              {/* Insufficient Credits Warning */}
              {isDisabled && (
                <div className="mt-2 text-xs text-red-600 font-medium">
                  Insufficient credits
                </div>
              )}
            </button>
          );
        })}
      </div>

      {hasInsufficientCredits && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Your available credits are insufficient for this booking. Please select Credit Card payment or contact your administrator to add more credits.
          </p>
        </div>
      )}
    </div>
  );
}
