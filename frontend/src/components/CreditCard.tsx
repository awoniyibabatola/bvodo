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
        {/* Solid isometric geometric shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            {/* Isometric cubes - top right */}
            <g transform="translate(280, -20)">
              {/* Pink cube */}
              <polygon points="0,20 30,0 60,20 30,40" fill="#ec4899" opacity="0.7"/>
              <polygon points="30,40 60,20 60,60 30,80" fill="#db2777" opacity="0.7"/>
              <polygon points="0,20 30,40 30,80 0,60" fill="#be185d" opacity="0.7"/>

              {/* Cyan cube - offset */}
              <polygon points="40,50 70,30 100,50 70,70" fill="#06b6d4" opacity="0.6"/>
              <polygon points="70,70 100,50 100,90 70,110" fill="#0891b2" opacity="0.6"/>
              <polygon points="40,50 70,70 70,110 40,90" fill="#0e7490" opacity="0.6"/>
            </g>

            {/* Isometric shapes - bottom left */}
            <g transform="translate(-20, 120)">
              {/* Purple hexagon */}
              <polygon points="30,0 60,15 60,45 30,60 0,45 0,15" fill="#a855f7" opacity="0.5"/>

              {/* Pink triangle */}
              <polygon points="80,20 110,40 80,60" fill="#ec4899" opacity="0.6"/>

              {/* Cyan diamond */}
              <polygon points="50,80 70,95 50,110 30,95" fill="#22d3ee" opacity="0.5"/>
            </g>

            {/* Small geometric accents scattered */}
            <circle cx="200" cy="50" r="8" fill="#f472b6" opacity="0.4"/>
            <circle cx="100" cy="180" r="6" fill="#67e8f9" opacity="0.4"/>
            <rect x="320" y="150" width="15" height="15" fill="#c084fc" opacity="0.4" transform="rotate(45 327.5 157.5)"/>
          </svg>
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-pink-500/25 backdrop-blur-sm rounded-xl flex items-center justify-center border border-pink-400/40 shadow-lg">
                <Plane className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-lg font-bold text-white tracking-wide drop-shadow-lg">bvodo</span>
            </div>

            {/* Enhanced Chip Design with pink accent */}
            <div className="w-10 h-8 bg-amber-400 rounded-md relative shadow-lg">
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-slate-800"></div>
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
