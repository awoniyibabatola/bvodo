'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Hotel,
  Plane,
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
  Armchair,
  Briefcase,
  FileText,
  Ticket,
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api-config';
import BusinessFooter from '@/components/BusinessFooter';
import CrossSellCard from '@/components/CrossSellCard';

interface FlightBooking {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departureAirport: string;
  departureAirportCode: string;
  arrivalAirport: string;
  arrivalAirportCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  cabinClass: string;
  stops: number;
  baggageAllowance: string;
}

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

interface CreditTransaction {
  id: string;
  transactionType: string;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingReference: string;
  confirmationNumber: string;
  providerConfirmationNumber?: string;
  bookingType: string;
  isGroupBooking: boolean;
  numberOfTravelers: number;
  groupName?: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  totalPrice: number;
  basePrice: number;
  taxesFees: number;
  taxes?: number;
  fees?: number;
  dueAtAccommodation?: number;
  currency: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  bookedAt: string;
  approvedAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  passengerDetails: PassengerDetail[];
  flightBookings?: FlightBooking[];
  hotelBookings?: HotelBooking[];
  creditTransactions?: CreditTransaction[];
  cancellationTimeline?: any[];
  supplier?: string;
  checkInTime?: string;
  checkOutTime?: string;
  bookingData?: {
    seatsSelected?: SeatSelection[];
    baggageSelected?: BaggageSelection[];
    paymentMethod?: string;
    [key: string]: any;
  };
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
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'credit' | 'card'>('credit');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Cancellation states
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationPreview, setCancellationPreview] = useState<any>(null);
  const [loadingCancellationPreview, setLoadingCancellationPreview] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchBookingDetails();

    // Check if returning from Stripe payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    let pollInterval: NodeJS.Timeout | null = null;

    if (paymentStatus === 'success' && sessionId) {
      setIsVerifyingPayment(true);
      setPaymentError('');

      // Manually trigger payment verification (for local development without webhooks)
      const verifyPaymentAsync = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(getApiEndpoint('payments/verify'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Payment verification failed');
          }
        } catch (err: any) {
          console.error('Error verifying payment:', err);
          setPaymentError(err.message || 'Failed to verify payment. Please contact support.');
          setIsVerifyingPayment(false);
        }
      };

      verifyPaymentAsync();

      // Poll for booking confirmation (webhook may take a few seconds)
      let pollCount = 0;
      const maxPolls = 20; // Poll for up to 40 seconds
      pollInterval = setInterval(async () => {
        pollCount++;

        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(getApiEndpoint(`bookings/${bookingId}`), {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const result = await response.json();
            const currentBooking = result.data;

            // If booking is confirmed OR payment is complete (approved), stop polling and update UI
            // Payment complete means Stripe payment succeeded, backend booking may still be processing
            const isPaymentComplete = currentBooking.paymentStatus === 'completed';
            const isConfirmed = currentBooking.status === 'confirmed';
            const isApproved = currentBooking.status === 'approved';

            if (isConfirmed || (isPaymentComplete && isApproved)) {
              setBooking(currentBooking);
              if (pollInterval) clearInterval(pollInterval);
              setIsVerifyingPayment(false);
              setPaymentError('');

              // Clean up URL
              window.history.replaceState({}, '', window.location.pathname);

              // If payment complete but not yet confirmed, show info message
              if (!isConfirmed && isPaymentComplete) {
                // Payment succeeded, booking is being confirmed
                console.log('Payment completed successfully. Booking confirmation in progress...');
              }
            }
          }
        } catch (err) {
          console.error('Error polling booking status:', err);
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          if (pollInterval) clearInterval(pollInterval);

          // Fetch final booking status
          try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(getApiEndpoint(`bookings/${bookingId}`), {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              const result = await response.json();
              setBooking(result.data);
            }
          } catch (err) {
            console.error('Error fetching final booking status:', err);
          }

          setIsVerifyingPayment(false);

          // Clean up URL even if confirmation times out
          window.history.replaceState({}, '', window.location.pathname);

          // Show appropriate message based on booking status
          if (booking) {
            if (booking.status === 'confirmed') {
              // All good, booking confirmed
            } else if (booking.paymentStatus === 'completed' && booking.status === 'approved') {
              // Payment succeeded but still processing
              setPaymentError('Your payment was successful! Your booking is being confirmed and you will receive a confirmation email shortly.');
            } else {
              // Something went wrong
              setPaymentError('Payment processing is taking longer than expected. Please refresh the page or contact support if the issue persists.');
            }
          }
        }
      }, 2000); // Poll every 2 seconds
    }

    // Cleanup function that always runs
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [bookingId]);

  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(getApiEndpoint('auth/profile'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const userRole = data.data.user?.role || '';
            setCurrentUserRole(userRole);

            // Check if user is admin or company_admin
            const isAdmin = userRole === 'admin' || userRole === 'company_admin';

            // Admins/Company Admins use organization credits (company pool)
            // Everyone else (traveler, employee, staff, manager) uses personal credits
            const credits = isAdmin
              ? data.data.organization?.availableCredits
              : data.data.user?.availableCredits;

            setUserCredits(parseFloat(credits || '0'));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
      }
    };

    fetchUserCredits();
  }, []);

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

  const handleCompletePayment = async () => {
    setIsProcessingPayment(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint('payments/complete'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking?.id,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // If card payment, redirect to Stripe
        if (result.paymentMethod === 'card' && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else if (result.paymentMethod === 'credit') {
          // Refresh booking data
          fetchBookingDetails();
          setShowPaymentModal(false);

          if (result.requiresApproval) {
            alert('✅ Payment method updated to Bvodo Credits!\n\nYour booking now requires approval from your manager.');
          } else {
            alert('✅ Payment completed with Bvodo Credits!');
          }
        }
      } else {
        // Handle specific error types
        if (result.error === 'OFFER_EXPIRED') {
          setShowPaymentModal(false);
          alert(
            '❌ Flight No Longer Available\n\n' +
            'This flight offer has expired and is no longer available for booking.\n\n' +
            'Please search for a new flight with current availability.'
          );
        } else if (result.error === 'MISSING_PASSENGER_DETAILS' || result.error === 'INCOMPLETE_PASSENGER_DETAILS') {
          setShowPaymentModal(false);
          alert(
            '❌ Passenger Information Missing\n\n' +
            result.message + '\n\n' +
            'This booking cannot be completed. Please search for a new flight and ensure all passenger details are provided.'
          );
        } else {
          alert(result.message || 'Failed to complete payment');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to complete payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const fetchCancellationPreview = async () => {
    if (!booking) return;

    setLoadingCancellationPreview(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiEndpoint(`bookings/${booking.id}/cancellation-preview`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setCancellationPreview(result.data);
      } else {
        const errorData = await response.json();
        alert(`Failed to fetch cancellation preview: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching cancellation preview:', error);
      alert('Failed to fetch cancellation preview. Please try again.');
    } finally {
      setLoadingCancellationPreview(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !cancellationReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      setIsCancelling(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(getApiEndpoint(`bookings/${booking.id}/cancel`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancellationReason }),
      });

      if (response.ok) {
        alert('Booking cancelled successfully!');
        setShowCancellationModal(false);
        setCancellationReason('');
        fetchBookingDetails(); // Refresh booking details
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel booking: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('An error occurred while cancelling the booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const canApprove = () => {
    return (
      user &&
      (user.role === 'admin' || user.role === 'manager' || user.role === 'company_admin') &&
      booking?.status === 'pending_approval'
    );
  };

  const canCancel = () => {
    return booking && ['confirmed', 'pending', 'approved', 'awaiting_confirmation', 'pending_approval'].includes(booking.status);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-gray-900" />;
      case 'pending':
      case 'pending_approval':
      case 'awaiting_confirmation':
        return <Clock className="w-5 h-5 text-amber-700" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-700" />;
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
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
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

  const getPaymentMethodDisplay = () => {
    // Check bookingData first, then booking level paymentMethod
    const method = booking?.bookingData?.paymentMethod || booking?.paymentMethod;

    if (method === 'card' || method === 'stripe') {
      return {
        short: 'Paid via Credit/Debit Card',
        long: 'Credit/Debit Card (Stripe)',
        icon: CreditCard,
      };
    } else if (method === 'credit' || method === 'balance') {
      return {
        short: 'Paid via Company Credits',
        long: 'Company Travel Credits',
        icon: CreditCard,
      };
    } else {
      // Default fallback
      return {
        short: 'Paid via Company Credits',
        long: 'Company Travel Credits',
        icon: CreditCard,
      };
    }
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
  const flightBooking = booking.flightBookings?.[0];
  const isFlightBooking = booking.bookingType === 'flight';
  const isHotelBooking = booking.bookingType === 'hotel';

  return (
    <>
      <div className="min-h-screen bg-white p-4 md:p-6 print:bg-white print:p-0">
        <div className="max-w-6xl mx-auto print-full-width">

        {/* Payment Verification Banner */}
        {isVerifyingPayment && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-semibold text-blue-900">Verifying Payment...</p>
                <p className="text-sm text-blue-700">Please wait while we confirm your payment. This may take a few moments.</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Error Banner */}
        {paymentError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-1">Payment Verification Issue</p>
                <p className="text-sm text-red-700">{paymentError}</p>
              </div>
              <button
                onClick={() => setPaymentError('')}
                className="text-red-600 hover:text-red-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Payment Required Banner */}
        {booking && (booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed') && (
          <div className="bg-gray-50 border border-gray-300 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Payment Required
                </h3>
                <p className="text-gray-700 mb-4 text-sm">
                  This booking is pending payment. Complete your payment to confirm this booking.
                </p>

                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2 text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 no-print">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700 mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Title and Confirmation Number */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Booking Details</h1>
              <p className="text-sm text-gray-600">
                Confirmation: {booking.confirmationNumber}
              </p>
            </div>

            {/* Status Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-5 pb-5 border-b border-gray-200">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium">
                {getStatusIcon(booking.status)}
                <span className="capitalize">{booking.status.replace('_', ' ')}</span>
              </div>

              {booking.bookingType && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  {booking.bookingType === 'flight' ? (
                    <Plane className="w-3.5 h-3.5 text-gray-700" />
                  ) : (
                    <Hotel className="w-3.5 h-3.5 text-gray-700" />
                  )}
                  <span className="text-gray-700 capitalize">{booking.bookingType}</span>
                </div>
              )}

              {booking.paymentStatus && (
                <div className="inline-flex items-center px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  Payment: <span className="font-medium ml-1 capitalize">{booking.paymentStatus.replace('_', ' ')}</span>
                </div>
              )}

              {booking.isGroupBooking && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <Users className="w-3.5 h-3.5 text-gray-700" />
                  <span className="text-gray-700">Group Booking</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Confirmation Button */}
              {booking.status === 'confirmed' && (
                <Link
                  href={`/dashboard/bookings/confirmed?booking=${booking.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors rounded-lg"
                >
                  <FileText className="w-4 h-4" />
                  View Confirmation
                </Link>
              )}

              {/* Approval Buttons */}
              {canApprove() && (
                <>
                  <button
                    onClick={() => {
                      setApprovalAction('approve');
                      setShowApprovalModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Booking
                  </button>
                  <button
                    onClick={() => {
                      setApprovalAction('reject');
                      setShowApprovalModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-semibold"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Booking
                  </button>
                </>
              )}

              {/* Cancel Booking Button */}
              {canCancel() && (
                <button
                  onClick={() => {
                    setShowCancellationModal(true);
                    fetchCancellationPreview();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-semibold"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Booking
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-900 hover:text-white transition text-sm font-semibold"
              >
                <Download className="w-4 h-4" />
                Download Invoice
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
            {/* Flight Overview */}
            {isFlightBooking && flightBooking && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-6 border-b border-gray-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center border border-gray-900">
                      <Plane className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{flightBooking.airline}</h2>
                      <p className="text-gray-600 text-sm">Flight {flightBooking.flightNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs mb-1">FROM</p>
                      <p className="text-gray-900 text-2xl font-bold">{flightBooking.departureAirportCode}</p>
                      <p className="text-gray-600 text-sm mt-1">{flightBooking.departureAirport}</p>
                    </div>
                    <div className="flex-1 px-6">
                      <div className="border-t-2 border-gray-300 relative">
                        <Plane className="w-6 h-6 text-gray-900 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs mb-1">TO</p>
                      <p className="text-gray-900 text-2xl font-bold">{flightBooking.arrivalAirportCode}</p>
                      <p className="text-gray-600 text-sm mt-1">{flightBooking.arrivalAirport}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Flight Times */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Departure</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-700" />
                        <p className="font-semibold text-gray-900">{formatDate(flightBooking.departureTime)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{formatTime(flightBooking.departureTime)}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Arrival</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-700" />
                        <p className="font-semibold text-gray-900">{formatDate(flightBooking.arrivalTime)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{formatTime(flightBooking.arrivalTime)}</p>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-1">Class</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">{flightBooking.cabinClass}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-1">Duration</p>
                      <p className="text-sm font-bold text-gray-900">{Math.floor(flightBooking.duration / 60)}h {flightBooking.duration % 60}m</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-1">Stops</p>
                      <p className="text-sm font-bold text-gray-900">{flightBooking.stops === 0 ? 'Non-stop' : `${flightBooking.stops} stop${flightBooking.stops > 1 ? 's' : ''}`}</p>
                    </div>
                  </div>

                  {/* Baggage */}
                  {flightBooking.baggageAllowance && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Baggage Allowance</p>
                      <p className="font-semibold text-gray-900">{flightBooking.baggageAllowance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seat Assignments - Display if available */}
            {isFlightBooking && booking.bookingData?.seatsSelected && booking.bookingData.seatsSelected.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Armchair className="w-5 h-5 text-gray-900" />
                    <h2 className="text-base font-bold text-gray-900">Seat Assignments</h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    {booking.bookingData.seatsSelected.map((seat, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                              <Armchair className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{seat.passengerName}</p>
                              <p className="text-sm text-gray-600">Seat {seat.seatDesignator}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {seat.price.currency} {seat.price.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Baggage Selections - Display if available */}
            {isFlightBooking && booking.bookingData?.baggageSelected && booking.bookingData.baggageSelected.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-gray-900" />
                    <h2 className="text-base font-bold text-gray-900">Additional Baggage</h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    {booking.bookingData.baggageSelected.map((bag, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{bag.description}</p>
                              <p className="text-sm text-gray-600">Quantity: {bag.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {bag.price.currency} {bag.totalPrice.toFixed(2)}
                            </p>
                            {bag.quantity > 1 && (
                              <p className="text-xs text-gray-500">
                                {bag.price.currency} {bag.price.amount.toFixed(2)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Hotel Overview with Image */}
            {isHotelBooking && hotelDetails && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
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
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-6 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{hotelDetails.hotelName}</h2>
                    <div className="flex items-center gap-2 text-gray-600 text-xs">
                      <MapPin className="w-4 h-4" />
                      <span>{hotelDetails.city}, {hotelDetails.country}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {booking.status?.toLowerCase() === 'confirmed' || booking.status?.toLowerCase() === 'approved' ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ADF802] text-gray-900 rounded text-xs font-bold border border-[#ADF802]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Confirmed
                          </span>
                          <span className="text-gray-900 text-sm">Reservation</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-gray-900" />
                          <span className="font-semibold text-sm text-gray-900">Reservation</span>
                        </>
                      )}
                    </div>
                    <span className="text-sm text-gray-900">Ref: {booking.confirmationNumber}</span>
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
                  <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-900">
                            <span className="text-base font-bold text-white">{room.roomNumber}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900">Room {room.roomNumber}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 font-bold text-sm">{room.currency} ${parseFloat(room.price.toString()).toFixed(2)}</p>
                          <p className="text-gray-600 text-xs">for {hotelDetails?.numberOfNights} nights</p>
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
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-base font-bold text-gray-900">Room Details</h3>
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
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900">Guest Information</h2>
                <p className="text-gray-600 text-xs">{booking.numberOfTravelers} {booking.numberOfTravelers === 1 ? 'guest' : 'guests'}</p>
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

            {/* Cancellation Policy - For Hotels */}
            {isHotelBooking && booking.cancellationTimeline && Array.isArray(booking.cancellationTimeline) && booking.cancellationTimeline.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-900" />
                    <h2 className="text-base font-bold text-gray-900">Cancellation Policy</h2>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Important Information</p>
                        <p className="text-sm text-gray-700">
                          Review the cancellation deadlines below. Refund amounts decrease as the check-in date approaches.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {booking.cancellationTimeline.map((entry: any, index: number) => {
                      const deadline = new Date(entry.before);
                      const refundAmount = parseFloat(entry.refund_amount || '0');
                      const refundPercentage = Math.round((refundAmount / parseFloat(booking.totalPrice.toString())) * 100);
                      const isPastDeadline = new Date() > deadline;

                      return (
                        <div key={index} className={`border rounded-lg p-4 ${isPastDeadline ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-300'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-gray-600" />
                                <p className="font-semibold text-gray-900">
                                  {isPastDeadline ? 'Expired: ' : 'Cancel before '}
                                  {formatDate(entry.before)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600">
                                {formatTime(entry.before)} local time
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {entry.currency} {refundAmount.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">{refundPercentage}% refund</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {booking.cancellationTimeline.every((entry: any) => new Date() > new Date(entry.before)) && (
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Non-Refundable</p>
                          <p className="text-sm text-gray-700">
                            All cancellation deadlines have passed. This booking is now non-refundable.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline/Activity History */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-900" />
                  <h2 className="text-base font-bold text-gray-900">Booking Timeline</h2>
                </div>
                <p className="text-gray-600 text-xs mt-1">Complete activity history and transaction log</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {/* Booking Created */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      {((booking.creditTransactions && booking.creditTransactions.length > 0) || booking.approvedAt || booking.confirmedAt || booking.cancelledAt) && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-semibold text-gray-900">Booking Created</p>
                      <p className="text-sm text-gray-600">{formatDate(booking.bookedAt)} at {formatTime(booking.bookedAt)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {booking.bookingType === 'flight' ? 'Flight' : 'Hotel'} booking initiated by {booking.user.firstName} {booking.user.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Credit Transactions */}
                  {booking.creditTransactions && booking.creditTransactions.map((transaction, index) => {
                      const isLast = index === booking.creditTransactions!.length - 1;
                      const hasMoreEvents = booking.approvedAt || booking.confirmedAt || booking.cancelledAt;
                      const showConnector = !isLast || hasMoreEvents;
                      const isDebit = transaction.transactionType.includes('charged') || transaction.transactionType.includes('held');
                      const isRefund = transaction.transactionType.includes('refund');
                      const Icon = isDebit ? DollarSign : isRefund ? DollarSign : CheckCircle;

                      return (
                        <div key={transaction.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center">
                              <Icon className="w-5 h-5 text-gray-700" />
                            </div>
                            {showConnector && (
                              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                            )}
                          </div>
                          <div className={`flex-1 ${showConnector ? 'pb-6' : ''}`}>
                            <p className="font-semibold text-gray-900 capitalize">
                              {transaction.transactionType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}</p>
                            <p className="text-xs text-gray-500 mt-1">{transaction.description}</p>
                            <div className="mt-2 flex items-center gap-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {isDebit ? '-' : '+'}{transaction.currency} {parseFloat(transaction.amount.toString()).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Balance: {transaction.currency} {parseFloat(transaction.balanceAfter.toString()).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Approved */}
                    {booking.approvedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-gray-700" />
                          </div>
                          {booking.confirmedAt && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                          )}
                        </div>
                        <div className={`flex-1 ${booking.confirmedAt ? 'pb-6' : ''}`}>
                          <p className="font-semibold text-gray-900">Booking Approved</p>
                          <p className="text-sm text-gray-600">{formatDate(booking.approvedAt)} at {formatTime(booking.approvedAt)}</p>
                          <p className="text-xs text-gray-500 mt-1">Approved by manager/admin</p>
                        </div>
                      </div>
                    )}

                    {/* Confirmed */}
                    {booking.confirmedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-gray-700" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Booking Confirmed</p>
                          <p className="text-sm text-gray-600">{formatDate(booking.confirmedAt)} at {formatTime(booking.confirmedAt)}</p>
                          <p className="text-xs text-gray-500 mt-1">Your booking is confirmed and ready</p>
                          {booking.providerConfirmationNumber && (
                            <p className="text-xs font-mono text-gray-700 mt-1 bg-gray-100 inline-block px-2 py-1 rounded">
                              Confirmation: {booking.providerConfirmationNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancelled */}
                    {booking.cancelledAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-gray-700" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Booking Cancelled</p>
                          <p className="text-sm text-gray-600">{formatDate(booking.cancelledAt)} at {formatTime(booking.cancelledAt)}</p>
                          <p className="text-xs text-gray-500 mt-1">This booking has been cancelled</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Terms and Conditions of Booking */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-900" />
                  <h2 className="text-base font-bold text-gray-900">Terms and Conditions of Booking</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Cancellation Policy Statement */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Cancellation Policy</h3>
                  {booking.cancellationTimeline && Array.isArray(booking.cancellationTimeline) && booking.cancellationTimeline.length > 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        This booking has a flexible cancellation policy. You can cancel your booking and receive a refund based on the cancellation timeline shown above. The refund amount decreases as the {isHotelBooking ? 'check-in' : 'departure'} date approaches.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Non-Refundable</p>
                          <p className="text-sm text-gray-700">
                            You have chosen a non-refundable rate. If you cancel this booking, you will not receive any refund.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Booking Agreement */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Terms and Conditions</h3>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-800 space-y-2">
                        <p>
                          By completing this booking, you confirm that you agree to{' '}
                          <a
                            href="/terms"
                            className="font-semibold underline hover:text-gray-900"
                          >
                            Bvodo's Terms and Conditions
                          </a>
                          {isHotelBooking && (
                            <>
                              {' '}and the accommodation's terms and conditions
                            </>
                          )}
                          {isFlightBooking && (
                            <>
                              {' '}and the airline's fare rules and conditions of carriage
                            </>
                          )}.
                        </p>
                        <p>
                          To find out how Bvodo uses your personal data, please see our{' '}
                          <a
                            href="/privacy-policy"
                            className="font-semibold underline hover:text-gray-900"
                          >
                            Privacy Policy
                          </a>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Information */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Important Information</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    {isFlightBooking && (
                      <>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-semibold mt-0.5">•</span>
                          <p>All passengers must present valid identification and travel documents (passport, visa, etc.) at check-in.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-semibold mt-0.5">•</span>
                          <p>Flight times are subject to change. Please check with the airline 24 hours before departure.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-semibold mt-0.5">•</span>
                          <p>Baggage allowances are determined by the airline and may vary by route and fare class.</p>
                        </div>
                      </>
                    )}
                    {isHotelBooking && (
                      <>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-semibold mt-0.5">•</span>
                          <p>A valid credit card and government-issued photo ID are required at check-in for incidental charges.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-900 font-semibold mt-0.5">•</span>
                          <p>The hotel reserves the right to pre-authorize your credit card prior to arrival.</p>
                        </div>
                        {booking.dueAtAccommodation && parseFloat(booking.dueAtAccommodation.toString()) > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 font-semibold mt-0.5">•</span>
                            <p className="text-amber-800">
                              <strong>Additional payment required:</strong> {booking.currency} {parseFloat(booking.dueAtAccommodation.toString()).toFixed(2)} is due at the hotel upon check-in or check-out.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-gray-900 font-semibold mt-0.5">•</span>
                      <p>All prices shown are final and include applicable taxes and service fees.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-900 font-semibold mt-0.5">•</span>
                      <p>This booking is made through Bvodo Corporate Travels.</p>
                    </div>
                  </div>
                </div>

                {/* Contact Support */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong className="text-gray-900">Need help?</strong> Contact our support team at{' '}
                      <a href="mailto:support@bvodo.com" className="text-gray-900 hover:text-gray-700 font-semibold underline">
                        support@bvodo.com
                      </a>
                      {' '}or call{' '}
                      <a href="tel:+18259456087" className="text-gray-900 hover:text-gray-700 font-semibold">
                        +1 (825) 945-6087
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 print-invoice">
            {/* Invoice - Enhanced Design */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 print-preserve-bg avoid-break">
              {/* Invoice Header */}
              <div className="px-6 py-6 border-b border-gray-200">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">INVOICE</h2>
                      <p className="text-gray-600 text-xs">Payment Receipt</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-900">
                        <CreditCard className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold">PAID</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs uppercase tracking-wider">Invoice #</span>
                      <span className="text-gray-900 font-mono text-sm">{booking.bookingReference}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs uppercase tracking-wider">Date</span>
                      <span className="text-gray-900 text-sm">{formatDate(booking.bookedAt)}</span>
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
                    {/* Flight or Hotel Service */}
                    <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">
                          {isFlightBooking && flightBooking ? (
                            `${flightBooking.airline} Flight ${flightBooking.flightNumber}`
                          ) : isHotelBooking && hotelDetails ? (
                            hotelDetails.hotelName
                          ) : (
                            booking.bookingType === 'flight' ? 'Flight Booking' : 'Hotel Accommodation'
                          )}
                        </p>
                        <div className="space-y-0.5">
                          {isFlightBooking && flightBooking ? (
                            <>
                              <p className="text-xs text-gray-500">
                                {flightBooking.departureAirportCode} → {flightBooking.arrivalAirportCode}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(booking.departureDate)} • {flightBooking.cabinClass}
                              </p>
                              <p className="text-xs text-gray-500">
                                {booking.numberOfTravelers} Passenger{booking.numberOfTravelers > 1 ? 's' : ''}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-gray-500">
                                {formatDate(hotelDetails?.checkInDate || booking.departureDate)} - {formatDate(hotelDetails?.checkOutDate || booking.returnDate)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {hotelDetails?.numberOfRooms || 1} Room{(hotelDetails?.numberOfRooms || 1) > 1 ? 's' : ''} × {hotelDetails?.numberOfNights || 1} Night{(hotelDetails?.numberOfNights || 1) > 1 ? 's' : ''}
                              </p>
                            </>
                          )}
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

                    {/* Additional Services (Seats & Baggage) */}
                    {isFlightBooking && booking.bookingData && (
                      (() => {
                        const seatsCost = booking.bookingData.seatsSelected?.reduce((sum, seat) => sum + (seat.price?.amount || 0), 0) || 0;
                        const baggageCost = booking.bookingData.baggageSelected?.reduce((sum, bag) => sum + (bag.totalPrice || 0), 0) || 0;
                        const servicesCost = seatsCost + baggageCost;

                        return servicesCost > 0 ? (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 text-sm">Additional Services</span>
                            <span className="font-medium text-gray-900">
                              {booking.currency} {servicesCost.toFixed(2)}
                            </span>
                          </div>
                        ) : null;
                      })()
                    )}
                  </div>
                </div>

                {/* Total Section */}
                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="bg-gray-100 rounded-xl p-5 border border-gray-300">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-700 font-semibold mb-1">Amount Due</p>
                        <p className="text-xs text-gray-600">{getPaymentMethodDisplay().short}</p>
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
                      {(() => {
                        const PaymentIcon = getPaymentMethodDisplay().icon;
                        return <PaymentIcon className="w-5 h-5 text-white" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Payment Method</p>
                      <p className="font-semibold text-gray-900">{getPaymentMethodDisplay().long}</p>
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
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 no-print">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Booking Information</h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Booking Reference */}
                <div className="flex items-start gap-3 pb-5 border-b border-gray-100">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Ticket className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Booking Reference</p>
                    <p className="text-lg font-bold text-gray-900 tracking-wider">{booking.bookingReference}</p>
                  </div>
                </div>

                {/* PNR / Accommodation Reference */}
                {booking.providerConfirmationNumber && (
                  <div className="flex items-start gap-3 pb-5 border-b border-gray-100">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      {isFlightBooking ? (
                        <Plane className="w-4 h-4 text-gray-700" />
                      ) : (
                        <Hotel className="w-4 h-4 text-gray-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>
                        {isFlightBooking ? 'PNR (Airline Confirmation)' : 'Accommodation Reference'}
                      </p>
                      <p className="text-lg font-bold text-gray-900 tracking-wider">{booking.providerConfirmationNumber}</p>
                      <p className="text-xs text-gray-500 mt-1.5" style={{ fontWeight: 400 }}>
                        {isFlightBooking
                          ? 'Use this to check in online 24 hours before departure'
                          : 'Use this reference for hotel check-in'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Booked On */}
                <div className="flex items-start gap-3 pb-5 border-b border-gray-100">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Booked On</p>
                    <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>
                      {formatDate(booking.bookedAt)} at {formatTime(booking.bookedAt)}
                    </p>
                  </div>
                </div>

                {/* Booked By */}
                <div className="flex items-start gap-3 pb-5 border-b border-gray-100">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Booked By</p>
                    <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>
                      {booking.user.firstName} {booking.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1" style={{ fontWeight: 400 }}>{booking.user.email}</p>
                  </div>
                </div>

                {/* Group Name */}
                {booking.isGroupBooking && booking.groupName && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Group Name</p>
                      <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{booking.groupName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {booking.status?.toLowerCase() === 'confirmed' && (
              <div className="bg-gray-50 rounded-2xl shadow-sm p-6 no-print border border-gray-200">
                <h3 className="text-base font-bold text-gray-900 mb-3">Need Help?</h3>
                <p className="text-gray-600 text-xs mb-4">
                  Contact our support team if you need to modify or cancel your booking.
                </p>
                <button className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-lg w-full">
              {/* Header */}
              <div className="px-6 py-4 rounded-t-2xl border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
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
                    className="text-gray-600 hover:text-gray-900 transition"
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

        {/* Payment Modal */}
        {showPaymentModal && booking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Payment</h2>

              <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-gray-600 text-xs mb-2">
                  Booking Reference
                </p>
                <p className="font-bold text-gray-900 mb-3">
                  {booking.bookingReference}
                </p>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-gray-600 text-xs mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {booking.currency} {parseFloat(booking.totalPrice.toString()).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Select Payment Method
                </label>

                {/* Bvodo Credits Option */}
                <div
                  onClick={() => setSelectedPaymentMethod('credit')}
                  className={`border rounded-xl p-4 mb-3 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'credit'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === 'credit' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                        {selectedPaymentMethod === 'credit' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Bvodo Credits</p>
                        <p className="text-xs text-gray-600">
                          {currentUserRole === 'admin' || currentUserRole === 'company_admin'
                            ? `Company Pool: ${booking.currency} ${userCredits.toFixed(2)}`
                            : `Personal Balance: ${booking.currency} ${userCredits.toFixed(2)}`
                          }
                        </p>
                      </div>
                    </div>
                    <Shield className="w-5 h-5 text-gray-700" />
                  </div>

                  {userCredits < parseFloat(booking.totalPrice.toString()) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-red-600 font-medium">
                        Insufficient credits. Please top up or select card payment.
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Payment Option */}
                <div
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'card'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === 'card' ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                        {selectedPaymentMethod === 'card' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Credit/Debit Card</p>
                        <p className="text-xs text-gray-600">Secure payment via Stripe</p>
                      </div>
                    </div>
                    <CreditCard className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessingPayment}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompletePayment}
                  disabled={
                    isProcessingPayment ||
                    (selectedPaymentMethod === 'credit' && userCredits < parseFloat(booking.totalPrice.toString()))
                  }
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-colors"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {selectedPaymentMethod === 'card' ? 'Pay with Card' : 'Pay with Credits'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {showCancellationModal && booking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-sm border border-gray-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
                  <button
                    onClick={() => {
                      setShowCancellationModal(false);
                      setCancellationReason('');
                      setCancellationPreview(null);
                    }}
                    disabled={isCancelling}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {/* Booking Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-600 text-xs mb-2">Booking Reference</p>
                  <p className="font-bold text-gray-900 mb-3">{booking.bookingReference}</p>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-gray-600 text-xs mb-1">Booking Amount</p>
                    <p className="text-lg font-bold text-gray-900">
                      {booking.currency} {parseFloat(booking.totalPrice.toString()).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Refund Preview */}
                {loadingCancellationPreview ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
                  </div>
                ) : cancellationPreview ? (
                  <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">
                          {cancellationPreview.isNonRefundable ? 'Non-Refundable' : 'Refund Preview'}
                        </p>
                        {cancellationPreview.isNonRefundable ? (
                          <p className="text-sm text-gray-700">
                            {cancellationPreview.isPastDeadline
                              ? 'All cancellation deadlines have passed. This booking is non-refundable.'
                              : cancellationPreview.message || 'This booking is non-refundable.'}
                          </p>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-gray-900 my-2">
                              {cancellationPreview.refundCurrency} {cancellationPreview.refundAmount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-700">
                              You will receive a {cancellationPreview.refundPercentage}% refund
                              {cancellationPreview.deadline && (
                                <> if you cancel before {formatDate(cancellationPreview.deadline)}</>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Warning */}
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Warning</p>
                      <p className="text-sm text-gray-700">
                        This action cannot be undone. Once cancelled, you will not be able to reactivate this booking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cancellation Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cancellation Reason <span className="text-gray-900">*</span>
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Please provide a reason for cancelling this booking..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    rows={3}
                    required
                    disabled={isCancelling}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowCancellationModal(false);
                      setCancellationReason('');
                      setCancellationPreview(null);
                    }}
                    disabled={isCancelling}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={isCancelling || !cancellationReason.trim()}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Confirm Cancellation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cross-sell: Suggest complementary booking */}
        {booking && (booking.status === 'confirmed' || booking.status === 'completed') && (
          <CrossSellCard
            bookingType={booking.bookingType}
            destination={isHotelBooking ? hotelBooking?.city : flightBooking?.arrivalAirport}
            checkInDate={isHotelBooking ? hotelBooking?.checkInDate : flightBooking?.departureTime}
            checkOutDate={isHotelBooking ? hotelBooking?.checkOutDate : flightBooking?.arrivalTime}
            departureAirport={flightBooking?.departureAirport}
            arrivalAirport={flightBooking?.arrivalAirport}
            city={hotelBooking?.city}
          />
        )}
        </div>

        {/* Footer */}
        <BusinessFooter />
      </div>
    </>
  );
}
