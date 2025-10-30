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
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden flex flex-col justify-between p-5 min-h-[200px]"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
        {/* Subtle glow accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ADF802]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>

        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Simple dot pattern for minimal texture */}
              <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="white" opacity="0.15"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#ADF802]/25 backdrop-blur-sm rounded-xl flex items-center justify-center border border-[#ADF802]/40 shadow-lg shadow-[#ADF802]/20">
                <Plane className="w-4 h-4 text-[#ADF802] drop-shadow-[0_0_6px_rgba(173,248,2,0.5)]" />
              </div>
              <span className="text-lg font-bold text-white tracking-wide drop-shadow-lg">bvodo</span>
            </div>

            {/* Enhanced Chip Design */}
            <div className="w-10 h-8 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 rounded-md relative shadow-lg">
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ADF802] rounded-full border-2 border-slate-800 shadow-[0_0_8px_rgba(173,248,2,0.6)]"></div>
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
          <div className="text-white/60 text-[11px] font-semibold uppercase tracking-wider mb-1.5">Available Balance</div>
          <div className="text-1xl md:text-2xl font-bold text-white tracking-tight drop-shadow-lg">
            ${(availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10">
          <div className="flex justify-between items-end">
            <div className="flex-1 min-w-0">
              <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1">Card Holder</div>
              <div className="text-white/90 font-light text-sm uppercase tracking-wide truncate">{organizationName}</div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1">Valid Thru</div>
                <div className="text-white/90 font-light text-sm">12/25</div>
              </div>
              {/* Enhanced VISA logo */}
              <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/30 shadow-lg">
                <span className="text-white font-bold text-sm tracking-wider drop-shadow-md">VISA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced gradient overlay for depth and shimmer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-[#ADF802]/5 via-transparent to-blue-500/5 pointer-events-none"></div>
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
