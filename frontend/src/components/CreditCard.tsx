'use client';

import { useState } from 'react';
import { Plane } from 'lucide-react';

interface CreditCardProps {
  organizationName: string;
  availableBalance: number;
  className?: string;
  size?: 'small' | 'large';
  disableInternalFlip?: boolean;
}

export default function CreditCard({
  organizationName,
  availableBalance,
  className = '',
  size = 'large',
  disableInternalFlip = false
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
          className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between p-5 min-h-[200px]"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Simple dot pattern for minimal texture */}
              <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="white" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#ADF802]/20 backdrop-blur rounded-xl flex items-center justify-center border border-[#ADF802]/30">
                <Plane className="w-4 h-4 text-[#ADF802]" />
              </div>
              <span className="text-lg font-semibold text-white/90 tracking-wide">bvodo</span>
            </div>

            {/* Minimal Chip Design */}
            <div className="w-9 h-7 bg-gradient-to-br from-amber-400/80 to-amber-500/80 rounded-md relative">
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#ADF802] rounded-full border border-slate-800"></div>
              <div className="grid grid-cols-3 grid-rows-3 gap-[0.5px] p-1">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-amber-600/40 rounded-[0.5px]"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Balance */}
        <div className="relative z-10 py-3">
          <div className="text-white/50 text-[11px] font-medium uppercase tracking-wider mb-1.5">Available Balance</div>
          <div className="text-1xl md:text-2xl font-bold text-white tracking-tight">
            ${(availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10">
          {/* Card Number (decorative) */}
          <div className="flex gap-3.5 mb-4 text-white/70 text-sm tracking-widest font-light">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>•••• </span>
          </div>

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
              {/* Minimal VISA logo */}
              <div className="bg-white/10 backdrop-blur px-2.5 py-1 rounded-lg border border-white/20">
                <span className="text-white font-semibold text-sm tracking-wide">VISA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
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
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#ADF802]/20 rounded-lg flex items-center justify-center border border-[#ADF802]/30">
                <Plane className="w-3.5 h-3.5 text-[#ADF802]" />
              </div>
              <span className="text-sm font-semibold text-gray-900 tracking-wide">bvodo</span>
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Card Usage</div>
          </div>

          {/* Usage Stats */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-xs text-gray-600">This Month</span>
              <span className="text-sm font-bold text-gray-900">$0</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-xs text-gray-600">Total Spent</span>
              <span className="text-sm font-bold text-gray-900">$0</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-xs text-gray-600">Transactions</span>
              <span className="text-sm font-bold text-gray-900">0</span>
            </div>
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
