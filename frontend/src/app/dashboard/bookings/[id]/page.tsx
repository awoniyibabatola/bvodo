'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Hotel,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Mail,
  Phone,
  User,
  Bed,
  CreditCard,
  Shield,
  Info,
  Loader2,
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';

interface HotelBooking {
  id: string;
  hotelId: string;
  hotelName: string;
  address: string;
  city: string;
  country: string;
  photoUrl?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  numberOfRooms: number;
  isMultiRoom: boolean;
  roomType: string;
  bedType: string;
  guestsPerRoom: number;
  roomDescription: string;
  mealPlan: string;
  cancellationPolicy: string;
  rooms?: RoomBookingItem[];
}

interface RoomBookingItem {
  id: string;
  roomNumber: number;
  offerId: string;
  roomType: string;
  bedType: string;
  price: number;
  currency: string;
  numberOfGuests: number;
  guests: Guest[];
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

interface PassengerDetail {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

interface Booking {
  id: string;
  bookingReference: string;
  confirmationNumber: string;
  bookingType: string;
  isGroupBooking: boolean;
  numberOfTravelers: number;
  groupName?: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  totalPrice: number;
  basePrice: number;
  taxesFees: number;
  currency: string;
  status: string;
  bookedAt: string;
  passengerDetails: PassengerDetail[];
  hotelBookings?: HotelBooking[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(getApiEndpoint(`bookings/${bookingId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setBooking(result.data);
      } else {
        setError('Failed to load booking details');
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!booking) return;

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        getApiEndpoint(`bookings/${booking.id}/approve`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approvalNotes: approvalNotes || undefined }),
        }
      );

      if (response.ok) {
        alert('Booking approved successfully!');
        setShowApprovalModal(false);
        setApprovalAction(null);
        setApprovalNotes('');
        fetchBookingDetails(); // Refresh booking details
      } else {
        const errorData = await response.json();
        alert(`Failed to approve booking: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      alert('An error occurred while approving the booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!booking || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        getApiEndpoint(`bookings/${booking.id}/reject`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rejectionReason }),
        }
      );

      if (response.ok) {
        alert('Booking rejected successfully. Credits have been released back to the user.');
        setShowApprovalModal(false);
        setApprovalAction(null);
        setRejectionReason('');
        fetchBookingDetails(); // Refresh booking details
      } else {
        const errorData = await response.json();
        alert(`Failed to reject booking: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('An error occurred while rejecting the booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const canApprove = () => {
    return (
      user &&
      (user.role === 'admin' || user.role === 'manager' || user.role === 'company_admin') &&
      booking?.status === 'pending_approval'
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-gray-700" />;
      case 'pending':
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-gray-700" />;
      case 'awaiting_confirmation':
        return <Clock className="w-5 h-5 text-gray-700" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-5 h-5 text-gray-700" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-gray-700" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'approved':
        return 'bg-[#ADF802] text-gray-900 border-[#ADF802]';
      case 'pending':
      case 'pending_approval':
      case 'awaiting_confirmation':
        return 'bg-gray-100 text-gray-900 border-gray-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-gray-100 text-gray-900 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h1 className="text-base font-bold text-gray-900 mb-1">Booking Not Found</h1>
          <p className="text-xs text-gray-600 mb-4">{error || 'The booking you are looking for does not exist.'}</p>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const hotelBooking = booking.hotelBookings?.[0];
  const hotelDetails = hotelBooking; // Hotel details are on the hotelBooking object itself

  return (
    <>
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          .print-container {
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 20mm !important;
            background: white !important;
          }

          .print-full-width {
            max-width: 100% !important;
          }

          .page-break-before {
            page-break-before: always;
          }

          .page-break-after {
            page-break-after: always;
          }

          .avoid-break {
            page-break-inside: avoid;
          }

          /* Hide sidebar on print, show invoice at top */
          .print-hide-sidebar {
            display: none !important;
          }

          .print-invoice {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }

          /* Ensure gradients and colors print */
          .print-preserve-bg {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        .print-only {
          display: none;
        }
      `}</style>

      <div className="min-h-screen bg-white p-4 md:p-6 print:bg-white print:p-0">
        <div className="max-w-6xl mx-auto print-full-width">
        {/* Header */}
        <div className="mb-4 no-print">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#ADF802] font-semibold mb-3 text-xs transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Bookings
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-base font-bold text-gray-900 mb-1">Booking Details</h1>
              <p className="text-xs text-gray-600">
                Confirmation: <span className="font-semibold text-gray-900">{booking.confirmationNumber}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 no-print">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="font-semibold capitalize">{booking.status.replace('_', ' ')}</span>
              </div>

              {/* Approval Buttons - Only shown for admin/manager/company_admin when status is pending_approval */}
              {canApprove() && (
                <>
                  <button
                    onClick={() => {
                      setApprovalAction('approve');
                      setShowApprovalModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-semibold"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="hidden md:inline">Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      setApprovalAction('reject');
                      setShowApprovalModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="hidden md:inline">Reject</span>
                  </button>
                </>
              )}

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition font-semibold text-gray-900"
              >
                <Download className="w-4 h-4" />
                <span>Download Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Print-only Company Header */}
        <div className="print-only mb-8 pb-6 border-b-2 border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-base">B</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">bvodo</h1>
                  <p className="text-xs text-gray-600">Corporate Travel Solutions</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>Email: support@bvodo.com</p>
                <p>Web: www.bvodo.com</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900 mb-1">INVOICE</p>
              <p className="text-xs text-gray-600">#{booking.bookingReference}</p>
              <p className="text-xs text-gray-600">{formatDate(booking.bookedAt)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 print-hide-sidebar">
            {/* Hotel Overview with Image */}
            {hotelDetails && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
                {/* Hotel Image */}
                <div className="relative h-64">
                  {hotelDetails.photoUrl ? (
                    <>
                      <img
                        src={hotelDetails.photoUrl}
                        alt={hotelDetails.hotelName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gray-800"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Hotel className="w-24 h-24 text-white opacity-50" />
                      </div>
                    </>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-900 p-6 border-t border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-2">{hotelDetails.hotelName}</h2>
                    <div className="flex items-center gap-2 text-white text-xs">
                      <MapPin className="w-4 h-4" />
                      <span>{hotelDetails.city}, {hotelDetails.country}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {booking.status?.toLowerCase() === 'confirmed' || booking.status?.toLowerCase() === 'approved' ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ADF802] text-gray-900 rounded text-xs font-bold border border-[#ADF802]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Confirmed
                          </span>
                          <span className="text-white text-sm">Reservation</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-white" />
                          <span className="font-semibold text-sm text-white">Reservation</span>
                        </>
                      )}
                    </div>
                    <span className="text-sm text-white">Ref: {booking.confirmationNumber}</span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Location */}
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">{hotelDetails.address}</p>
                        <p className="text-gray-600">{hotelDetails.city}, {hotelDetails.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Check-in</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-700" />
                        <p className="font-semibold text-gray-900">{formatDate(hotelDetails.checkInDate)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">After 3:00 PM</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Check-out</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-700" />
                        <p className="font-semibold text-gray-900">{formatDate(hotelDetails.checkOutDate)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Before 11:00 AM</p>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Bed className="w-4 h-4 text-gray-700" />
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">Rooms</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{hotelDetails.numberOfRooms}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-gray-700" />
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">Guests</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{booking.numberOfTravelers}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-700" />
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-wide">Nights</p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{hotelDetails.numberOfNights}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Room Details - Multi-room or Single-room */}
            {hotelBooking?.rooms && hotelBooking.rooms.length > 0 ? (
              /* Multi-Room Booking - Show each room separately */
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Room Details</h3>
                {hotelBooking.rooms.map((room, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
                    <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#ADF802] rounded-lg flex items-center justify-center border border-[#ADF802]">
                            <span className="text-base font-bold text-gray-900">{room.roomNumber}</span>
                          </div>
                          <h3 className="text-base font-bold text-white">Room {room.roomNumber}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{room.currency} ${parseFloat(room.price.toString()).toFixed(2)}</p>
                          <p className="text-gray-300 text-xs">for {hotelDetails?.numberOfNights} nights</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">

                      {/* Check-in and Check-out Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Check-in</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-700" />
                            <p className="font-semibold text-gray-900 text-sm">{formatDate(hotelDetails?.checkInDate || '')}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">After 3:00 PM</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Check-out</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-700" />
                            <p className="font-semibold text-gray-900 text-sm">{formatDate(hotelDetails?.checkOutDate || '')}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Before 11:00 AM</p>
                        </div>
                      </div>

                      {/* Room Type and Bed */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Room Type</p>
                        <p className="font-semibold text-gray-900 capitalize text-lg">
                          {room.roomType.toLowerCase().replace(/_/g, ' ')}
                          {room.bedType && ` - ${room.bedType} Bed`}
                        </p>
                      </div>

                      {/* Guests in this room */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-5 h-5 text-gray-600" />
                          <p className="font-semibold text-gray-700">
                            Guests ({room.numberOfGuests})
                          </p>
                        </div>
                        <div className="space-y-2">
                          {room.guests?.map((guest: any, guestIndex: number) => (
                            <div key={guestIndex} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                                  {guestIndex + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 mb-2">
                                    {guest.firstName} {guest.lastName}
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Mail className="w-4 h-4" />
                                      {guest.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Phone className="w-4 h-4" />
                                      {guest.phone}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hotelDetails ? (
              /* Single Room Booking */
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
                <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                  <h3 className="text-base font-bold text-white">Room Details</h3>
                </div>

                <div className="p-6 space-y-4">
                  {/* Room Type */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Room Type</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {hotelDetails.roomType.toLowerCase().replace(/_/g, ' ')} - {hotelDetails.bedType} Bed
                    </p>
                    {hotelDetails.roomDescription && (
                      <p className="text-sm text-gray-600 mt-2">{hotelDetails.roomDescription}</p>
                    )}
                  </div>

                  {/* Policies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <p className="text-sm font-semibold text-gray-700">Cancellation</p>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {hotelDetails.cancellationPolicy.toLowerCase().replace(/_/g, ' ')}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="w-5 h-5 text-gray-600" />
                        <p className="text-sm font-semibold text-gray-700">Meal Plan</p>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {hotelDetails.mealPlan.toLowerCase().replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Guest Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
              <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                <h2 className="text-base font-bold text-white">Guest Information</h2>
                <p className="text-gray-300 text-xs">{booking.numberOfTravelers} {booking.numberOfTravelers === 1 ? 'guest' : 'guests'}</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {booking.passengerDetails?.map((passenger, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-2">
                            {passenger.firstName} {passenger.lastName}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              {passenger.email}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              {passenger.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 print-invoice">
            {/* Invoice - Enhanced Design */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 print-preserve-bg avoid-break">
              {/* Invoice Header */}
              <div className="relative bg-gray-900 px-6 py-8 border-b border-gray-700">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}></div>
                </div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">INVOICE</h2>
                      <p className="text-gray-300 text-xs">Payment Receipt</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ADF802] rounded-lg border border-[#ADF802]">
                        <CreditCard className="w-4 h-4 text-gray-900" />
                        <span className="text-gray-900 text-xs font-semibold">PAID</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 text-xs uppercase tracking-wider">Invoice #</span>
                      <span className="text-white font-mono text-sm">{booking.bookingReference}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 text-xs uppercase tracking-wider">Date</span>
                      <span className="text-white text-sm">{formatDate(booking.bookedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="p-6 space-y-6">
                {/* Billing Info */}
                <div className="pb-6 border-b border-gray-200">
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Bill To</h3>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 text-lg">
                      {booking.user.firstName} {booking.user.lastName}
                    </p>
                    <p className="text-gray-600 text-sm">{booking.user.email}</p>
                    <p className="text-gray-600 text-sm">{booking.user.phone}</p>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">Description</h3>
                  <div className="space-y-3">
                    {/* Hotel Service */}
                    <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">
                          {hotelDetails?.hotelName || 'Hotel Accommodation'}
                        </p>
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-500">
                            {formatDate(hotelDetails?.checkInDate || booking.departureDate)} - {formatDate(hotelDetails?.checkOutDate || booking.returnDate)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hotelDetails?.numberOfRooms || 1} Room{(hotelDetails?.numberOfRooms || 1) > 1 ? 's' : ''} × {hotelDetails?.numberOfNights || 1} Night{(hotelDetails?.numberOfNights || 1) > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 ml-4">
                        {booking.currency} {parseFloat(booking.basePrice.toString()).toFixed(2)}
                      </span>
                    </div>

                    {/* Taxes & Fees */}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 text-sm">Taxes & Service Fees</span>
                      <span className="font-medium text-gray-900">
                        {booking.currency} {parseFloat(booking.taxesFees.toString()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Section */}
                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="bg-gray-100 rounded-xl p-5 border-2 border-gray-300">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-700 font-semibold mb-1">Amount Due</p>
                        <p className="text-xs text-gray-600">Paid via Company Credits</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {booking.currency} {parseFloat(booking.totalPrice.toString()).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Payment Method</p>
                      <p className="font-semibold text-gray-900">Company Travel Credits</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-gray-900" />
                  </div>
                </div>

                {/* Footer Note */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      This is an automated invoice for your booking. For any questions or concerns, please contact our support team.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 no-print">
              <div className="bg-gray-100 px-6 py-4">
                <h2 className="text-base font-bold text-gray-900">Booking Information</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
                  <p className="font-semibold text-gray-900">{booking.bookingReference}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Booked On</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(booking.bookedAt)} at {formatTime(booking.bookedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Booked By</p>
                  <p className="font-semibold text-gray-900">
                    {booking.user.firstName} {booking.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{booking.user.email}</p>
                </div>

                {booking.isGroupBooking && booking.groupName && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Group Name</p>
                    <p className="font-semibold text-gray-900">{booking.groupName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {booking.status?.toLowerCase() === 'confirmed' && (
              <div className="bg-gray-900 rounded-2xl shadow-lg p-6 text-white no-print border border-gray-700">
                <h3 className="text-base font-bold mb-3">Need Help?</h3>
                <p className="text-gray-300 text-xs mb-4">
                  Contact our support team if you need to modify or cancel your booking.
                </p>
                <button className="w-full bg-white text-gray-900 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition">
                  Contact Support
                </button>
              </div>
            )}

            {/* Print-only Footer */}
            <div className="print-only mt-12 pt-6 border-t-2 border-gray-300">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>support@bvodo.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <p className="mb-1">Thank you for choosing bvodo for your corporate travel needs.</p>
                  <p>This invoice was generated electronically and is valid without signature.</p>
                </div>
                <div className="text-xs text-gray-400 pt-4">
                  <p>© {new Date().getFullYear()} bvodo. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              {/* Header */}
              <div className="bg-gray-900 px-6 py-4 rounded-t-2xl border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {approvalAction === 'approve' ? 'Approve Booking' : 'Reject Booking'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setApprovalAction(null);
                      setApprovalNotes('');
                      setRejectionReason('');
                    }}
                    disabled={isProcessing}
                    className="text-white hover:text-gray-200 transition"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {approvalAction === 'approve' ? (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-300">
                      <CheckCircle className="w-6 h-6 text-gray-900" />
                      <div>
                        <p className="font-semibold text-gray-900">Approve this booking?</p>
                        <p className="text-sm text-gray-700">
                          This will allow the traveler to proceed with their trip.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Notes (Optional)
                      </label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add any notes or comments about this approval..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                        rows={3}
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Processing...' : 'Confirm Approval'}
                      </button>
                      <button
                        onClick={() => {
                          setShowApprovalModal(false);
                          setApprovalAction(null);
                          setApprovalNotes('');
                        }}
                        disabled={isProcessing}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-300">
                      <XCircle className="w-6 h-6 text-gray-900" />
                      <div>
                        <p className="font-semibold text-gray-900">Reject this booking?</p>
                        <p className="text-sm text-gray-700">
                          Credits will be released back to the traveler.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a clear reason for rejecting this booking..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                        rows={3}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleReject}
                        disabled={isProcessing || !rejectionReason.trim()}
                        className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                      </button>
                      <button
                        onClick={() => {
                          setShowApprovalModal(false);
                          setApprovalAction(null);
                          setRejectionReason('');
                        }}
                        disabled={isProcessing}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
