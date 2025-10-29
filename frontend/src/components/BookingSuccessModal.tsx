'use client';

import { Check, Plane, Hotel, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails?: {
    confirmationNumber?: string;
    numberOfRooms?: number;
    hotelName?: string;
    flightNumber?: string;
    airline?: string;
  };
  bookingType?: 'hotel' | 'flight';
  tripDetails?: {
    destination?: string;
    checkInDate?: string;
    checkOutDate?: string;
  };
}

export default function BookingSuccessModal({
  isOpen,
  onClose,
  bookingDetails,
  bookingType,
  tripDetails,
}: BookingSuccessModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const isHotelBooking = bookingType === 'hotel';
  const targetService = isHotelBooking ? 'flight' : 'hotel';

  const handleBookComplementary = () => {
    // Pre-fill search parameters and redirect
    if (targetService === 'flight') {
      // For hotel bookings, suggest adding a flight
      const params = new URLSearchParams();
      if (tripDetails?.destination) {
        params.set('to', tripDetails.destination);
      }
      if (tripDetails?.checkInDate) {
        params.set('departure', tripDetails.checkInDate);
      }
      if (tripDetails?.checkOutDate) {
        params.set('return', tripDetails.checkOutDate);
      }
      params.set('cabin', 'economy');
      params.set('adults', '1');
      router.push(`/dashboard/flights/search?${params.toString()}`);
    } else {
      // For flight bookings, suggest adding a hotel
      const params = new URLSearchParams();
      if (tripDetails?.destination) {
        params.set('city', tripDetails.destination);
      }
      if (tripDetails?.checkInDate) {
        params.set('checkIn', tripDetails.checkInDate);
      }
      if (tripDetails?.checkOutDate) {
        params.set('checkOut', tripDetails.checkOutDate);
      }
      params.set('guests', '1');
      params.set('rooms', '1');
      router.push(`/dashboard/hotels/search?${params.toString()}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full overflow-hidden">
        {/* Success Icon */}
        <div className="bg-gray-900 p-8 text-center border-b border-gray-700">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
            <Check className="w-12 h-12 text-gray-900" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Booking Successful!
          </h2>
          <p className="text-gray-200">
            Your booking has been confirmed
          </p>
        </div>

        {/* Booking Details */}
        <div className="p-6 space-y-4">
          {bookingDetails?.confirmationNumber && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Confirmation Number</p>
              <p className="text-xl font-bold text-gray-900">
                {bookingDetails.confirmationNumber}
              </p>
            </div>
          )}

          {bookingDetails?.hotelName && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Hotel</p>
              <p className="font-semibold text-gray-900">
                {bookingDetails.hotelName}
              </p>
            </div>
          )}

          {bookingDetails?.flightNumber && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Flight</p>
              <p className="font-semibold text-gray-900">
                {bookingDetails.airline} {bookingDetails.flightNumber}
              </p>
            </div>
          )}

          {bookingDetails?.numberOfRooms && bookingDetails.numberOfRooms > 1 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Rooms Booked</p>
              <p className="font-semibold text-gray-900">
                {bookingDetails.numberOfRooms} rooms
              </p>
            </div>
          )}

          {/* Cross-sell Section */}
          {bookingType && tripDetails?.destination && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  {targetService === 'flight' ? (
                    <Plane className="w-5 h-5 text-white" />
                  ) : (
                    <Hotel className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-[#ADF802]" />
                    <p className="font-bold text-gray-900 text-sm">Complete Your Trip</p>
                  </div>
                  <p className="text-xs text-gray-700">
                    {isHotelBooking ? (
                      <>Need a flight to {tripDetails.destination}?</>
                    ) : (
                      <>Need accommodation in {tripDetails.destination}?</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">
              A confirmation email has been sent to your email address.
            </p>

            <div className="space-y-2">
              {/* Cross-sell button */}
              {bookingType && tripDetails?.destination && (
                <button
                  onClick={handleBookComplementary}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  {targetService === 'flight' ? (
                    <>
                      <Plane className="w-4 h-4" />
                      <span>Book Flight</span>
                    </>
                  ) : (
                    <>
                      <Hotel className="w-4 h-4" />
                      <span>Book Hotel</span>
                    </>
                  )}
                </button>
              )}

              {/* View bookings button */}
              <button
                onClick={onClose}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  bookingType && tripDetails?.destination
                    ? 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
