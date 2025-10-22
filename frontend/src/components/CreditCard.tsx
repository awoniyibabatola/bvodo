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
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-30`}></div>
      <div className={`relative h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-5`}>
        {/* Card Pattern/Texture - Multiple Layers */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Dot pattern */}
              <pattern id="dots" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                <circle cx="12.5" cy="12.5" r="1.2" fill="white" opacity="0.25"/>
              </pattern>

              {/* Diagonal lines */}
              <pattern id="lines" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="50" stroke="white" strokeWidth="0.8" opacity="0.12"/>
              </pattern>

              {/* Wave pattern */}
              <pattern id="waves" x="0" y="0" width="80" height="15" patternUnits="userSpaceOnUse">
                <path d="M0 7.5 Q 20 3, 40 7.5 T 80 7.5" stroke="white" strokeWidth="0.8" fill="none" opacity="0.15"/>
              </pattern>

              {/* Circuit pattern */}
              <pattern id="circuits" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" opacity="0.2"/>
                <circle cx="80" cy="80" r="2" fill="white" opacity="0.2"/>
                <line x1="20" y1="20" x2="80" y2="20" stroke="white" strokeWidth="0.5" opacity="0.15"/>
                <line x1="80" y1="20" x2="80" y2="80" stroke="white" strokeWidth="0.5" opacity="0.15"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
            <rect width="100%" height="100%" fill="url(#lines)"/>
            <rect width="100%" height="100%" fill="url(#waves)"/>
            <rect width="100%" height="100%" fill="url(#circuits)"/>
          </svg>
        </div>

        {/* Top Section */}
        <div className="relative z-10">
          {/* Logo and Chip Row */}
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Plane className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-white">bvodo</span>
            </div>

            {/* EMV Chip */}
            <div className="w-11 h-9 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md relative shadow-lg">
              <div className="absolute inset-1 grid grid-cols-4 gap-[1px]">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-yellow-600/30 rounded-[1px]"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Balance */}
        <div className="relative z-10">
          <div className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1.5">Available Balance</div>
          <div className="text-2xl font-bold text-white tracking-tight leading-tight">
            ${(availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Bottom Section - Info Row */}
        <div className="relative z-10 flex justify-between items-end gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-white/60 text-[10px] font-medium uppercase tracking-wider mb-1">Card Holder</div>
            <div className="text-white font-semibold text-xs uppercase truncate">{organizationName}</div>
          </div>
          <div className="flex-shrink-0">
            <div className="text-white/60 text-[10px] font-medium uppercase tracking-wider mb-1 text-center">Valid Thru</div>
            <div className="text-white font-semibold text-xs text-center">12/25</div>
          </div>
          <div className="flex-shrink-0 bg-white px-2.5 py-1 rounded shadow-md">
            <span className="text-blue-600 font-bold text-lg italic">VISA</span>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
}
