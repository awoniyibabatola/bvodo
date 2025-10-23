'use client';

import { Plane } from 'lucide-react';

interface CreditCardProps {
  organizationName: string;
  availableBalance: number;
  className?: string;
  size?: 'small' | 'large';
}

export default function CreditCard({
  organizationName,
  availableBalance,
  className = '',
  size = 'large'
}: CreditCardProps) {
  const isSmall = size === 'small';

  return (
    <div className={`group relative ${className}`}>
      <div className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between p-5`}>
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
              <div className="w-9 h-9 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-white/90 tracking-wide">bvodo</span>
            </div>

            {/* Minimal Chip Design */}
            <div className="w-9 h-7 bg-gradient-to-br from-amber-400/80 to-amber-500/80 rounded-md">
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
          <div className="text-2xl md:text-3xl font-light text-white tracking-tight">
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
    </div>
  );
}
