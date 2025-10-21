'use client';

import { Check } from 'lucide-react';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails?: {
    confirmationNumber?: string;
    numberOfRooms?: number;
    hotelName?: string;
  };
}

export default function BookingSuccessModal({
  isOpen,
  onClose,
  bookingDetails,
}: BookingSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Success Icon */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Booking Successful!
          </h2>
          <p className="text-green-50">
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

          {bookingDetails?.numberOfRooms && bookingDetails.numberOfRooms > 1 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Rooms Booked</p>
              <p className="font-semibold text-gray-900">
                {bookingDetails.numberOfRooms} rooms
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">
              A confirmation email has been sent to your email address.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
            >
              View My Bookings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
