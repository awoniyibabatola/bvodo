'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Plane,
  Calendar,
  Clock,
  Users,
  MapPin,
  DollarSign,
  Mail,
  Download,
  ArrowRight,
  Ticket,
  Home,
  FileText,
  Armchair,
  Briefcase,
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface SeatSelection {
  passengerId: string;
  passengerName: string;
  segmentId: string;
  seatDesignator: string;
  serviceId: string;
  price: {
    amount: number;
    currency: string;
  };
}

interface BaggageSelection {
  serviceId: string;
  description: string;
  quantity: number;
  price: {
    amount: number;
    currency: string;
  };
  totalPrice: number;
}

interface BookingDetails {
  id: string;
  bookingReference: string;
  providerConfirmationNumber?: string;
  bookingType: string;
  status: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  passengerDetails: Array<{
    firstName: string;
    lastName: string;
    email?: string;
  }>;
  basePrice: number;
  taxesFees: number;
  totalPrice: number;
  currency: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  bookingData?: {
    seatsSelected?: SeatSelection[];
    baggageSelected?: BaggageSelection[];
    [key: string]: any;
  };
  createdAt: string;
  approvedAt?: string;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`bookings/${bookingId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Backend wraps data in { success, message, data }
        setBooking(result.data);

        // Simulate email sent notification
        setTimeout(() => setEmailSent(true), 1000);
      } else {
        console.error('Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Booking not found</p>
          <Link href="/dashboard/bookings" className="text-blue-600 hover:text-blue-700">
            View all bookings
          </Link>
        </div>
      </div>
    );
  }

  const firstSegment = booking.bookingData?.outbound?.[0];
  const lastSegment = booking.bookingData?.outbound?.[booking.bookingData?.outbound?.length - 1];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-black mb-6 transition-colors"
        >
          <ArrowRight className="h-3 w-3 rotate-180" />
          Back
        </Link>

        {/* Success Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C6F432] rounded-lg mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-900" />
            <span className="text-gray-900 text-xs font-medium tracking-wider">CONFIRMED</span>
          </div>
          <h1 className="text-2xl text-black mb-2" style={{ fontWeight: 300 }}>
            Your booking is confirmed
          </h1>
          <p className="text-sm text-gray-600" style={{ fontWeight: 300 }}>
            Confirmation details sent to {booking.user.email}
          </p>
        </div>

        {/* Booking Reference Card */}
        <div className="border border-gray-200 mb-6">
          <div className="px-6 py-6">
            {booking.providerConfirmationNumber ? (
              <>
                {/* PNR - Main/Bold */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>PNR (Airline Confirmation)</p>
                    </div>
                  </div>
                  <p className="text-3xl text-black tracking-widest mb-1" style={{ fontWeight: 500 }}>{booking.providerConfirmationNumber}</p>
                  <p className="text-xs text-gray-500 mt-1" style={{ fontWeight: 300 }}>
                    Use this to check in online 24 hours before departure
                  </p>
                </div>

                {/* BVODO Reference - Secondary */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>BVODO Reference</p>
                  <p className="text-lg text-gray-700 tracking-wider" style={{ fontWeight: 400 }}>{booking.bookingReference}</p>
                </div>
              </>
            ) : (
              /* If no PNR yet, show BVODO reference as main */
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2" style={{ fontWeight: 500 }}>BVODO Reference</p>
                  </div>
                </div>
                <p className="text-3xl text-black tracking-widest mb-1" style={{ fontWeight: 400 }}>{booking.bookingReference}</p>
                <p className="text-xs text-gray-500 mt-1" style={{ fontWeight: 300 }}>
                  PNR will be available once airline confirms the booking
                </p>
              </div>
            )}
          </div>

          {/* Flight Details */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>Flight</p>
            </div>

            {firstSegment?.airline && (
              <p className="text-sm text-gray-500 mb-3" style={{ fontWeight: 400 }}>{firstSegment.airline}</p>
            )}

            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl text-black" style={{ fontWeight: 400 }}>{booking.origin}</span>
              <ArrowRight className="w-6 h-6 text-gray-900" />
              <span className="text-2xl text-black" style={{ fontWeight: 400 }}>{booking.destination}</span>
            </div>

            <div className="space-y-2 text-sm">
              {firstSegment?.flightNumber && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500" style={{ fontWeight: 400 }}>Flight</span>
                  <span className="text-black" style={{ fontWeight: 400 }}>{firstSegment.flightNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500" style={{ fontWeight: 400 }}>Date</span>
                <span className="text-black" style={{ fontWeight: 400 }}>{formatDate(booking.departureDate)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500" style={{ fontWeight: 400 }}>Departure</span>
                <span className="text-black" style={{ fontWeight: 400 }}>
                  {firstSegment?.departure?.time ? formatTime(firstSegment.departure.time) : 'TBD'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500" style={{ fontWeight: 400 }}>Arrival</span>
                <span className="text-black" style={{ fontWeight: 400 }}>
                  {lastSegment?.arrival?.time ? formatTime(lastSegment.arrival.time) : 'TBD'}
                </span>
              </div>
            </div>
          </div>

          {/* Passenger Details */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>Passengers</p>
            </div>
            <div className="space-y-2">
              {booking.passengerDetails.map((passenger, index) => (
                <div key={index} className="py-2 text-sm" style={{ fontWeight: 400 }}>
                  <p className="text-black">{passenger.firstName} {passenger.lastName}</p>
                  {passenger.email && (
                    <p className="text-gray-500 text-xs mt-0.5">{passenger.email}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seat Assignments */}
          {booking.bookingData?.seatsSelected && booking.bookingData.seatsSelected.length > 0 && (
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Armchair className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>Seat Assignments</p>
              </div>
              <div className="space-y-2">
                {booking.bookingData.seatsSelected.map((seat, index) => (
                  <div key={index} className="flex justify-between items-center py-2 text-sm" style={{ fontWeight: 400 }}>
                    <div className="flex items-center gap-2">
                      <Armchair className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-black">{seat.passengerName}</p>
                        <p className="text-gray-500 text-xs">Seat {seat.seatDesignator}</p>
                      </div>
                    </div>
                    <span className="text-black">
                      {seat.price.currency} {seat.price.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Baggage */}
          {booking.bookingData?.baggageSelected && booking.bookingData.baggageSelected.length > 0 && (
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>Additional Baggage</p>
              </div>
              <div className="space-y-2">
                {booking.bookingData.baggageSelected.map((bag, index) => (
                  <div key={index} className="flex justify-between items-center py-2 text-sm" style={{ fontWeight: 400 }}>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-black">{bag.description}</p>
                        <p className="text-gray-500 text-xs">Quantity: {bag.quantity}</p>
                      </div>
                    </div>
                    <span className="text-black">
                      {bag.price.currency} {bag.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="px-6 py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>Total</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-gray-500" style={{ fontWeight: 400 }}>Base</span>
                <span className="text-black" style={{ fontWeight: 400 }}>
                  {booking.currency} {Number(booking.basePrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500" style={{ fontWeight: 400 }}>Tax</span>
                <span className="text-black" style={{ fontWeight: 400 }}>
                  {booking.currency} {Number(booking.taxesFees).toFixed(2)}
                </span>
              </div>
              {(() => {
                const seatsCost = booking.bookingData?.seatsSelected?.reduce((sum, seat) => sum + (seat.price?.amount || 0), 0) || 0;
                const baggageCost = booking.bookingData?.baggageSelected?.reduce((sum, bag) => sum + (bag.totalPrice || 0), 0) || 0;
                const servicesCost = seatsCost + baggageCost;

                return servicesCost > 0 ? (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500" style={{ fontWeight: 400 }}>Additional Services</span>
                    <span className="text-black" style={{ fontWeight: 400 }}>
                      {booking.currency} {servicesCost.toFixed(2)}
                    </span>
                  </div>
                ) : null;
              })()}
              <div className="flex justify-between py-3 border-t border-black text-base">
                <span className="text-black" style={{ fontWeight: 500 }}>Total</span>
                <span className="text-black" style={{ fontWeight: 600 }}>
                  {booking.currency} {Number(booking.totalPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-gray-50 border-l-4 border-gray-900 px-6 py-5 mb-8">
          <p className="text-xs text-black uppercase tracking-wider mb-3" style={{ fontWeight: 500 }}>Important</p>
          <ul className="space-y-2 text-xs text-gray-600" style={{ fontWeight: 300 }}>
            <li className="pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-gray-900 before:font-bold">
              Arrive 2-3 hours before departure
            </li>
            <li className="pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-gray-900 before:font-bold">
              Bring valid ID and passport
            </li>
            {booking.providerConfirmationNumber && (
              <li className="pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-gray-900 before:font-bold">
                Check in online with PNR {booking.providerConfirmationNumber}
              </li>
            )}
            {booking.bookingData?.seatsSelected && booking.bookingData.seatsSelected.length > 0 && (
              <li className="pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-gray-900 before:font-bold">
                Your seat assignments are confirmed and shown above
              </li>
            )}
            {booking.bookingData?.baggageSelected && booking.bookingData.baggageSelected.length > 0 && (
              <li className="pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-gray-900 before:font-bold">
                Additional baggage has been added to your booking
              </li>
            )}
            <li className="pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-gray-900 before:font-bold">
              Verify baggage allowance
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors"
            style={{ fontWeight: 500 }}
          >
            View Details
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-black text-xs hover:bg-gray-50 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Download className="h-3.5 w-3.5" />
            Print
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-black text-xs hover:bg-gray-50 transition-colors"
            style={{ fontWeight: 500 }}
          >
            Dashboard
          </Link>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500" style={{ fontWeight: 300 }}>
          <p>Booked by {booking.user.firstName} {booking.user.lastName}</p>
          <p className="mt-1">Confirmation sent to {booking.user.email}</p>
        </div>
      </div>
    </div>
  );
}
