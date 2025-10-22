'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Show loading indicator
    setLoading(true);

    // Hide after a short delay to allow page to render
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <>
      {/* Top loading bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-loading-bar origin-left"></div>
      </div>

      {/* Optional: Full page overlay with spinner for slower loads */}
      <div className="fixed inset-0 z-[59] bg-white/50 backdrop-blur-sm flex items-center justify-center opacity-0 animate-fade-in pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 font-medium">Loading...</span>
        </div>
      </div>
    </>
  );
}
