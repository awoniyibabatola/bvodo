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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'awaiting_confirmation':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_approval':
        return 'bg-amber-100 text-amber-800';
      case 'awaiting_confirmation':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The booking you are looking for does not exist.'}</p>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const hotelBooking = booking.hotelBookings?.[0];
  const hotelDetails = hotelBooking; // Hotel details are on the hotelBooking object itself

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Bookings
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Details</h1>
              <p className="text-gray-600">
                Confirmation: <span className="font-semibold text-gray-900">{booking.confirmationNumber}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(booking.status)}`}>
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
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="hidden md:inline">Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      setApprovalAction('reject');
                      setShowApprovalModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="hidden md:inline">Reject</span>
                  </button>
                </>
              )}

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition font-semibold"
              >
                <Download className="w-5 h-5" />
                <span className="hidden md:inline">Download</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Hotel className="w-24 h-24 text-white opacity-50" />
                      </div>
                    </>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                    <h2 className="text-2xl font-bold text-white mb-1">{hotelDetails.hotelName}</h2>
                    <div className="flex items-center gap-2 text-white text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{hotelDetails.city}, {hotelDetails.country}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Confirmed Reservation</span>
                    </div>
                    <span className="text-sm">Ref: {booking.confirmationNumber}</span>
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
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <p className="font-semibold text-gray-900">{formatDate(hotelDetails.checkInDate)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">After 3:00 PM</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Check-out</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <p className="font-semibold text-gray-900">{formatDate(hotelDetails.checkOutDate)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Before 11:00 AM</p>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Bed className="w-5 h-5 text-blue-600" />
                        <p className="text-sm text-gray-600">Rooms</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{hotelDetails.numberOfRooms}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-purple-600" />
                        <p className="text-sm text-gray-600">Guests</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{booking.numberOfTravelers}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-gray-600">Nights</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{hotelDetails.numberOfNights}</p>
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
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-indigo-600">{room.roomNumber}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white">Room {room.roomNumber}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">{room.currency} ${parseFloat(room.price.toString()).toFixed(2)}</p>
                          <p className="text-indigo-200 text-xs">for {hotelDetails?.numberOfNights} nights</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">

                      {/* Check-in and Check-out Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-xs text-gray-600 mb-1">Check-in</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <p className="font-semibold text-gray-900 text-sm">{formatDate(hotelDetails?.checkInDate || '')}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">After 3:00 PM</p>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-xs text-gray-600 mb-1">Check-out</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
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
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
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
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Room Details</h3>
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
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Guest Information</h2>
                <p className="text-purple-100 text-sm">{booking.numberOfTravelers} {booking.numberOfTravelers === 1 ? 'guest' : 'guests'}</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {booking.passengerDetails?.map((passenger, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
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
          <div className="space-y-6">
            {/* Price Summary */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Price Summary</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-semibold text-gray-900">
                    {booking.currency} ${parseFloat(booking.basePrice.toString()).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-semibold text-gray-900">
                    {booking.currency} ${parseFloat(booking.taxesFees.toString()).toFixed(2)}
                  </span>
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {booking.currency} ${parseFloat(booking.totalPrice.toString()).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
              <div className="bg-gray-100 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">Booking Information</h2>
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
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3">Need Help?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Contact our support team if you need to modify or cancel your booking.
                </p>
                <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition">
                  Contact Support
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
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
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Approve this booking?</p>
                        <p className="text-sm text-green-700">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={3}
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-900">Reject this booking?</p>
                        <p className="text-sm text-red-700">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        rows={3}
                        required
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleReject}
                        disabled={isProcessing || !rejectionReason.trim()}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
