'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Hotel, ArrowRight, X, Sparkles } from 'lucide-react';

interface CrossSellCardProps {
  bookingType: 'flight' | 'hotel';
  destination?: string;
  checkInDate?: string;
  checkOutDate?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  city?: string;
}

export default function CrossSellCard({
  bookingType,
  destination,
  checkInDate,
  checkOutDate,
  departureAirport,
  arrivalAirport,
  city,
}: CrossSellCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();

  if (isDismissed) {
    return null;
  }

  const isHotelBooking = bookingType === 'hotel';
  const targetService = isHotelBooking ? 'flight' : 'hotel';

  const handleBookNow = () => {
    // Pre-fill search parameters and redirect
    if (targetService === 'flight') {
      // For hotel bookings, suggest adding a flight
      const params = new URLSearchParams();

      if (departureAirport || destination) {
        // Use the city/destination as arrival if we don't have specific airport
        params.set('to', destination || city || '');
      }
      if (checkInDate) {
        params.set('departure', checkInDate);
      }
      if (checkOutDate) {
        params.set('return', checkOutDate);
      }
      params.set('cabin', 'economy');
      params.set('adults', '1');

      router.push(`/dashboard/flights/search?${params.toString()}`);
    } else {
      // For flight bookings, suggest adding a hotel
      const params = new URLSearchParams();

      if (arrivalAirport || destination) {
        params.set('city', arrivalAirport || destination || '');
      }
      if (checkInDate) {
        params.set('checkIn', checkInDate);
      }
      if (checkOutDate) {
        params.set('checkOut', checkOutDate);
      }
      params.set('guests', '1');
      params.set('rooms', '1');

      router.push(`/dashboard/hotels/search?${params.toString()}`);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6 no-print">
      {/* Decorative header bar */}
      <div className="h-1 bg-gradient-to-r from-gray-900 via-[#ADF802] to-gray-900"></div>

      <div className="p-6 md:p-8 relative">
        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Icon section */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
              {targetService === 'flight' ? (
                <Plane className="w-8 h-8 md:w-10 md:h-10 text-white" />
              ) : (
                <Hotel className="w-8 h-8 md:w-10 md:h-10 text-white" />
              )}
            </div>
          </div>

          {/* Content section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-[#ADF802]" />
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                Complete Your Trip
              </h3>
            </div>

            <p className="text-gray-700 mb-4 text-sm md:text-base">
              {isHotelBooking ? (
                <>
                  Don't forget your flight! Book a flight to <span className="font-semibold">{destination || city || 'your destination'}</span> and enjoy a seamless travel experience.
                </>
              ) : (
                <>
                  Need a place to stay? Book a hotel in <span className="font-semibold">{arrivalAirport || destination || 'your destination'}</span> and complete your trip planning.
                </>
              )}
            </p>

            {/* Trip details preview */}
            {(checkInDate || checkOutDate) && (
              <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Your trip details</p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {destination && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                      <span className="font-medium text-gray-900">{destination || city || arrivalAirport}</span>
                    </div>
                  )}
                  {checkInDate && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span className="text-gray-700">{new Date(checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                  {checkOutDate && (
                    <>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">{new Date(checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBookNow}
                className="group bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg inline-flex items-center justify-center gap-2"
              >
                <span>Book {targetService === 'flight' ? 'Flight' : 'Hotel'} Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setIsDismissed(true)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-white transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
