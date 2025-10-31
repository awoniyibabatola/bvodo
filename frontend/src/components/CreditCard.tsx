'use client';

import { useState } from 'react';
import { Plane, Eye, EyeOff } from 'lucide-react';

interface CreditCardProps {
  organizationName: string;
  availableBalance: number;
  className?: string;
  size?: 'small' | 'large';
  disableInternalFlip?: boolean;
  usageData?: {
    used?: number;
    total?: number;
    usagePercentage?: number;
  };
}

export default function CreditCard({
  organizationName,
  availableBalance,
  className = '',
  size = 'large',
  disableInternalFlip = false,
  usageData = {}
}: CreditCardProps) {
  const isSmall = size === 'small';
  const [isFlipped, setIsFlipped] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't flip card if clicking the eye icon
    const target = e.target as HTMLElement;
    if (target.closest('.balance-toggle')) {
      return;
    }
    if (!disableInternalFlip) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div className={`group relative ${className}`} style={{ perspective: '1000px' }}>
      <div
        className={`relative w-full ${!disableInternalFlip ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '200px',
        }}
      >
        {/* Front Side */}
        <div
          className="relative bg-gradient-to-br from-[#ADF802] to-[#9DE002] rounded-2xl shadow-[0_8px_30px_rgba(173,248,2,0.4)] overflow-hidden flex flex-col justify-between p-5 min-h-[200px]"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
        {/* Travel-themed background patterns */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            {/* Hotel building - top right */}
            <g transform="translate(280, 10)">
              <rect x="0" y="30" width="40" height="60" fill="#000000" opacity="0.3"/>
              <rect x="5" y="35" width="8" height="8" fill="#000000" opacity="0.4"/>
              <rect x="27" y="35" width="8" height="8" fill="#000000" opacity="0.4"/>
              <rect x="5" y="50" width="8" height="8" fill="#000000" opacity="0.4"/>
              <rect x="27" y="50" width="8" height="8" fill="#000000" opacity="0.4"/>
              <rect x="5" y="65" width="8" height="8" fill="#000000" opacity="0.4"/>
              <rect x="27" y="65" width="8" height="8" fill="#000000" opacity="0.4"/>
              <polygon points="20,15 0,30 40,30" fill="#000000" opacity="0.3"/>
            </g>

            {/* Plane icon - top left */}
            <g transform="translate(30, 30)">
              <path d="M25 15 L35 20 L50 15 L55 18 L40 25 L45 35 L42 37 L35 28 L28 30 L26 35 L24 35 L25 28 L18 26 L15 30 L12 28 L15 20 L12 12 L15 10 L18 14 L25 15 Z" fill="#000000" opacity="0.3"/>
            </g>

            {/* Hotel building - bottom left */}
            <g transform="translate(20, 140)">
              <rect x="0" y="20" width="30" height="45" fill="#000000" opacity="0.3"/>
              <rect x="4" y="25" width="6" height="6" fill="#000000" opacity="0.3"/>
              <rect x="20" y="25" width="6" height="6" fill="#000000" opacity="0.3"/>
              <rect x="4" y="38" width="6" height="6" fill="#000000" opacity="0.3"/>
              <rect x="20" y="38" width="6" height="6" fill="#000000" opacity="0.3"/>
              <rect x="4" y="51" width="6" height="6" fill="#000000" opacity="0.3"/>
              <rect x="20" y="51" width="6" height="6" fill="#000000" opacity="0.3"/>
              <polygon points="15,10 0,20 30,20" fill="#000000" opacity="0.3"/>
            </g>

            {/* Small plane - bottom right */}
            <g transform="translate(300, 160) scale(0.6)">
              <path d="M25 15 L35 20 L50 15 L55 18 L40 25 L45 35 L42 37 L35 28 L28 30 L26 35 L24 35 L25 28 L18 26 L15 30 L12 28 L15 20 L12 12 L15 10 L18 14 L25 15 Z" fill="#000000" opacity="0.3"/>
            </g>

            {/* Scattered dots for atmosphere */}
            <circle cx="180" cy="40" r="3" fill="#000000" opacity="0.2"/>
            <circle cx="140" cy="90" r="4" fill="#000000" opacity="0.2"/>
            <circle cx="260" cy="130" r="3" fill="#000000" opacity="0.2"/>
          </svg>
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-black/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-black/30 shadow-lg">
                <Plane className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-extrabold text-black tracking-wide drop-shadow-sm">bvodo</span>
            </div>
            {/* Toggle Balance Visibility */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsBalanceVisible(!isBalanceVisible);
              }}
              className="balance-toggle w-8 h-8 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-black/30 hover:bg-black/30 transition-colors"
            >
              {isBalanceVisible ? (
                <Eye className="w-4 h-4 text-black" />
              ) : (
                <EyeOff className="w-4 h-4 text-black" />
              )}
            </button>
          </div>
        </div>

        {/* Middle Section - Balance */}
        <div className="relative z-10 py-3">
          <div className="text-black/70 text-xs font-bold uppercase tracking-wider mb-2">Available Balance</div>
          <div className="text-2xl md:text-3xl font-extrabold text-black tracking-tight drop-shadow-sm">
            {isBalanceVisible ? (
              `$${(availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            ) : (
              <span className="tracking-wider">$••••••</span>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex-1 min-w-0">
              <div className="text-black/50 text-[10px] font-bold uppercase tracking-wider mb-1.5">Card Holder</div>
              <div className="text-black font-semibold text-sm uppercase tracking-wide truncate">{organizationName}</div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-black/50 text-[10px] font-bold uppercase tracking-wider mb-1.5">Valid Thru</div>
                <div className="text-black font-semibold text-sm">12/25</div>
              </div>
              {/* Enhanced VISA logo */}
              <div className="bg-black/15 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-black/30 shadow-lg">
                <span className="text-black font-extrabold text-sm tracking-wider drop-shadow-sm">VISA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-black/[0.03] pointer-events-none"></div>
      </div>

        {/* Back Side - Usage Information */}
        <div
          className="absolute top-0 left-0 w-full bg-white rounded-2xl shadow-sm overflow-hidden min-h-[200px] flex flex-col p-5"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#ADF802]/20 rounded-lg flex items-center justify-center border border-[#ADF802]/30">
                <Plane className="w-3.5 h-3.5 text-[#ADF802]" />
              </div>
              <span className="text-sm font-semibold text-gray-900 tracking-wide">bvodo</span>
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Credit Usage</div>
          </div>

          {/* Available Balance */}
          <div className="mb-6">
            <div className="text-gray-500 text-[10px] font-medium uppercase tracking-wider mb-1">Available Balance</div>
            <div className="text-2xl font-bold text-gray-900">
              {isBalanceVisible ? (
                `$${(availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              ) : (
                <span className="tracking-wider">$••••••</span>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Used</span>
              <span className="text-gray-900 font-semibold">
                {isBalanceVisible ? (
                  `$${(usageData.used || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                ) : (
                  '$••••'
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total</span>
              <span className="text-gray-900 font-semibold">
                {isBalanceVisible ? (
                  `$${(usageData.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                ) : (
                  '$••••'
                )}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gray-900 rounded-full" style={{width: `${usageData.usagePercentage || 0}%`}}></div>
            </div>
            <div className="text-gray-500 text-[10px] text-center pt-1">{usageData.usagePercentage || 0}% utilized</div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-gray-200">
            <div className="text-[9px] text-gray-400 text-center">
              {organizationName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
