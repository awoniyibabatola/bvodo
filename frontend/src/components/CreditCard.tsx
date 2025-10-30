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
        {/* Modern gradient glow accents - pink & cyan */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl"></div>

        {/* Modern wave/spiral pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Spiral/wave pattern */}
              <pattern id="waves" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0,50 Q25,30 50,50 T100,50" stroke="rgba(236,72,153,0.3)" fill="none" strokeWidth="1"/>
                <path d="M0,60 Q25,40 50,60 T100,60" stroke="rgba(34,211,238,0.25)" fill="none" strokeWidth="1"/>
                <path d="M0,70 Q25,50 50,70 T100,70" stroke="rgba(168,85,247,0.2)" fill="none" strokeWidth="1"/>
              </pattern>
              {/* Dot pattern for subtle texture */}
              <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="white" opacity="0.12"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waves)"/>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-pink-500/30 to-purple-500/25 backdrop-blur-sm rounded-xl flex items-center justify-center border border-pink-400/40 shadow-lg shadow-pink-500/30">
                <Plane className="w-4 h-4 text-pink-300 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
              </div>
              <span className="text-lg font-bold text-white tracking-wide drop-shadow-lg">bvodo</span>
            </div>

            {/* Enhanced Chip Design with pink accent */}
            <div className="w-10 h-8 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 rounded-md relative shadow-lg">
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-400 rounded-full border-2 border-slate-800 shadow-[0_0_8px_rgba(236,72,153,0.7)]"></div>
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

        {/* Enhanced gradient overlay for depth and shimmer - pink accent */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-pink-500/10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-cyan-400/10 via-transparent to-purple-500/10 pointer-events-none"></div>
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
