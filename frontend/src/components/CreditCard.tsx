'use client';

import { useState } from 'react';
import { Plane } from 'lucide-react';

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

  return (
    <div className={`group relative ${className}`} style={{ perspective: '1000px' }}>
      <div
        className={`relative w-full ${!disableInternalFlip ? 'cursor-pointer' : ''}`}
        onClick={() => !disableInternalFlip && setIsFlipped(!isFlipped)}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '200px',
        }}
      >
        {/* Front Side */}
        <div
          className="relative bg-gradient-to-br from-pink-600 via-pink-500 to-rose-600 rounded-2xl shadow-[0_8px_30px_rgb(219,39,119,0.4)] overflow-hidden flex flex-col justify-between p-5 min-h-[200px]"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
        {/* Travel-themed background patterns */}
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            {/* Hotel building - top right */}
            <g transform="translate(280, 10)">
              <rect x="0" y="30" width="40" height="60" fill="#ffffff" opacity="0.6"/>
              <rect x="5" y="35" width="8" height="8" fill="#ff1b8d" opacity="0.5"/>
              <rect x="27" y="35" width="8" height="8" fill="#ff1b8d" opacity="0.5"/>
              <rect x="5" y="50" width="8" height="8" fill="#ff1b8d" opacity="0.5"/>
              <rect x="27" y="50" width="8" height="8" fill="#ff1b8d" opacity="0.5"/>
              <rect x="5" y="65" width="8" height="8" fill="#ff1b8d" opacity="0.5"/>
              <rect x="27" y="65" width="8" height="8" fill="#ff1b8d" opacity="0.5"/>
              <polygon points="20,15 0,30 40,30" fill="#ffffff" opacity="0.7"/>
            </g>

            {/* Plane icon - top left */}
            <g transform="translate(30, 30)">
              <path d="M25 15 L35 20 L50 15 L55 18 L40 25 L45 35 L42 37 L35 28 L28 30 L26 35 L24 35 L25 28 L18 26 L15 30 L12 28 L15 20 L12 12 L15 10 L18 14 L25 15 Z" fill="#ffffff" opacity="0.6"/>
            </g>

            {/* Hotel building - bottom left */}
            <g transform="translate(20, 140)">
              <rect x="0" y="20" width="30" height="45" fill="#ffffff" opacity="0.5"/>
              <rect x="4" y="25" width="6" height="6" fill="#ff006e" opacity="0.4"/>
              <rect x="20" y="25" width="6" height="6" fill="#ff006e" opacity="0.4"/>
              <rect x="4" y="38" width="6" height="6" fill="#ff006e" opacity="0.4"/>
              <rect x="20" y="38" width="6" height="6" fill="#ff006e" opacity="0.4"/>
              <rect x="4" y="51" width="6" height="6" fill="#ff006e" opacity="0.4"/>
              <rect x="20" y="51" width="6" height="6" fill="#ff006e" opacity="0.4"/>
              <polygon points="15,10 0,20 30,20" fill="#ffffff" opacity="0.6"/>
            </g>

            {/* Small plane - bottom right */}
            <g transform="translate(300, 160) scale(0.6)">
              <path d="M25 15 L35 20 L50 15 L55 18 L40 25 L45 35 L42 37 L35 28 L28 30 L26 35 L24 35 L25 28 L18 26 L15 30 L12 28 L15 20 L12 12 L15 10 L18 14 L25 15 Z" fill="#ffffff" opacity="0.5"/>
            </g>

            {/* Scattered dots for atmosphere */}
            <circle cx="180" cy="40" r="3" fill="#ffffff" opacity="0.4"/>
            <circle cx="140" cy="90" r="4" fill="#ffffff" opacity="0.3"/>
            <circle cx="260" cy="130" r="3" fill="#ffffff" opacity="0.4"/>
          </svg>
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/40 shadow-lg">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-wide drop-shadow-lg">bvodo</span>
            </div>

            {/* Enhanced Chip Design with white accent */}
            <div className="w-10 h-8 bg-amber-400 rounded-md relative shadow-lg">
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-pink-700"></div>
              <div className="grid grid-cols-3 grid-rows-3 gap-[0.5px] p-1.5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-amber-600/50 rounded-[0.5px]"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Balance */}
        <div className="relative z-10 py-3">
          <div className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Available Balance</div>
          <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
            ${(availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex-1 min-w-0">
              <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5">Card Holder</div>
              <div className="text-white font-semibold text-sm uppercase tracking-wide truncate">{organizationName}</div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1.5">Valid Thru</div>
                <div className="text-white font-semibold text-sm">12/25</div>
              </div>
              {/* Enhanced VISA logo */}
              <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/30 shadow-lg">
                <span className="text-white font-extrabold text-sm tracking-wider drop-shadow-md">VISA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-white/[0.03] pointer-events-none"></div>
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
              ${(availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Used</span>
              <span className="text-gray-900 font-semibold">
                ${(usageData.used || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total</span>
              <span className="text-gray-900 font-semibold">
                ${(usageData.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
