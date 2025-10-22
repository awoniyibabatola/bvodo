'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show loading on login/register pages or initial load
    if (pathname === '/login' || pathname === '/register' || pathname === '/') {
      setLoading(false);
      return;
    }

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
    </>
  );
}
