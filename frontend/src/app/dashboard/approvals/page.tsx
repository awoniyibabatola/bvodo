'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/currency';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getApiEndpoint } from '@/lib/api-config';
import UnifiedNavBar from '@/components/UnifiedNavBar';
import {
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Plane,
  Hotel,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
} from 'lucide-react';

interface Booking {
  id: string;
  bookingReference: string;
  bookingType: string;
  isGroupBooking: boolean;
  numberOfTravelers: number;
  groupName?: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  totalPrice: number;
  currency: string;
  status: string;
  bookedAt: string;
  requiresApproval: boolean;
  approvalNotes?: string;
  rejectionReason?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  flightBookings?: any[];
  hotelBookings?: any[];
}

interface ApprovalModalProps {
  booking: Booking | null;
  userRole: string;
  onClose: () => void;
  onApprove?: (bookingId: string, notes?: string) => void;
  onConfirm?: (bookingId: string, notes?: string) => void;
  onReject: (bookingId: string, reason: string) => void;
  isProcessing: boolean;
}

function ApprovalModal({ booking, userRole, onClose, onApprove, onConfirm, onReject, isProcessing }: ApprovalModalProps) {
  const { formatAmount } = useCurrency();
  const [action, setAction] = useState<'approve' | 'confirm' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  if (!booking) return null;

  const isSuperAdmin = userRole === 'super_admin';
  const isAwaitingConfirmation = booking.status === 'awaiting_confirmation';

  const handleSubmit = () => {
    if (action === 'approve' && onApprove) {
      onApprove(booking.id, notes || undefined);
    } else if (action === 'confirm' && onConfirm) {
      onConfirm(booking.id, notes || undefined);
    } else if (action === 'reject') {
      if (!reason.trim()) {
        alert('Please provide a rejection reason');
        return;
      }
      onReject(booking.id, reason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Review Booking</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              disabled={isProcessing}
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Booking Reference</span>
              <span className="font-mono font-semibold text-gray-900 text-sm">{booking.bookingReference}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Traveler</span>
              <span className="font-medium text-gray-900 text-sm">
                {booking.user.firstName} {booking.user.lastName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Email</span>
              <span className="text-gray-900 text-sm">{booking.user.email}</span>
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {booking.bookingType === 'flight' ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <Plane className="w-4 h-4 text-gray-700" />
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0"></div>
                  <Hotel className="w-4 h-4 text-gray-700" />
                </>
              )}
              <span className="font-semibold text-gray-900 capitalize text-sm">{booking.bookingType} Booking</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-600 block mb-1">Origin</span>
                <span className="font-medium text-gray-900 text-sm">{booking.origin}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block mb-1">Destination</span>
                <span className="font-medium text-gray-900 text-sm">{booking.destination}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block mb-1">Departure</span>
                <span className="font-medium text-gray-900 text-sm">
                  {new Date(booking.departureDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {booking.returnDate && (
                <div>
                  <span className="text-xs text-gray-600 block mb-1">Return</span>
                  <span className="font-medium text-gray-900 text-sm">
                    {new Date(booking.returnDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {booking.isGroupBooking && (
              <div className="flex items-center gap-2 text-gray-900 bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">
                  Group Booking - {booking.numberOfTravelers} travelers
                  {booking.groupName && ` (${booking.groupName})`}
                </span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium text-sm">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">
                {formatAmount(Number(booking.totalPrice), booking.currency)}
              </span>
            </div>
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="grid grid-cols-2 gap-4">
              {isSuperAdmin && isAwaitingConfirmation ? (
                <button
                  onClick={() => setAction('confirm')}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm Booking
                </button>
              ) : (
                <button
                  onClick={() => setAction('approve')}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
              )}
              <button
                onClick={() => setAction('reject')}
                className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}

          {/* Approval Form */}
          {action === 'approve' && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-gray-700" />
                Approve Booking
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or comments about this approval..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                  rows={3}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-2.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Approval'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  disabled={isProcessing}
                  className="px-6 py-2.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Form (Super Admin) */}
          {action === 'confirm' && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-gray-700" />
                Final Confirmation
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-700">
                  <strong>Rate Confirmation:</strong> Please verify rates and availability before confirming this booking.
                  This will finalize the booking and make it active.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add availability confirmation details or any notes..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                  rows={3}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-2.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Booking'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  disabled={isProcessing}
                  className="px-6 py-2.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {action === 'reject' && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 text-red-600" />
                Reject Booking
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejecting this booking..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                  rows={3}
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !reason.trim()}
                  className="flex-1 px-6 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  disabled={isProcessing}
                  className="px-6 py-2.5 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const { formatAmount } = useCurrency();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    name: 'User',
    role: 'traveler',
    email: '',
    organization: '',
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    minAmount: '',
    maxAmount: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    // Check user role
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        name: `${parsedUser.firstName} ${parsedUser.lastName}`,
        role: parsedUser.role,
        email: parsedUser.email,
        organization: parsedUser.organization || '',
      });

      // Only admin, manager, company_admin, and super_admin can access this page
      if (parsedUser.role !== 'admin' && parsedUser.role !== 'manager' && parsedUser.role !== 'company_admin' && parsedUser.role !== 'super_admin') {
        alert('You do not have permission to access this page');
        window.location.href = '/dashboard';
        return;
      }
    }

    fetchApprovals();
  }, [pagination.page]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      const parsedUser = userData ? JSON.parse(userData) : null;

      // Super admins see bookings awaiting confirmation
      // Other roles see bookings pending approval
      const status = parsedUser?.role === 'super_admin' ? 'awaiting_confirmation' : 'pending_approval';

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status,
      });

      const response = await fetch(
        `${getApiEndpoint('bookings')}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      } else {
        console.error('Failed to fetch approvals');
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string, notes?: string) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        getApiEndpoint(`bookings/${bookingId}/approve`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approvalNotes: notes }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Booking approved successfully! Awaiting rate confirmation.');
        setSelectedBooking(null);
        fetchApprovals(); // Refresh list
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

  const handleConfirm = async (bookingId: string, notes?: string) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        getApiEndpoint(`bookings/${bookingId}/confirm`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ confirmationNotes: notes }),
        }
      );

      if (response.ok) {
        alert('Booking confirmed successfully!');
        setSelectedBooking(null);
        fetchApprovals(); // Refresh list
      } else {
        const errorData = await response.json();
        alert(`Failed to confirm booking: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('An error occurred while confirming the booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (bookingId: string, reason: string) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        getApiEndpoint(`bookings/${bookingId}/reject`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rejectionReason: reason }),
        }
      );

      if (response.ok) {
        alert('Booking rejected successfully. Credits have been released back to the user.');
        setSelectedBooking(null);
        fetchApprovals(); // Refresh list
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

  const toggleBookingSelection = (bookingId: string) => {
    const newSelection = new Set(selectedBookingIds);
    if (newSelection.has(bookingId)) {
      newSelection.delete(bookingId);
    } else {
      newSelection.add(bookingId);
    }
    setSelectedBookingIds(newSelection);
  };

  const toggleAllBookings = () => {
    if (selectedBookingIds.size === filteredBookings.length) {
      setSelectedBookingIds(new Set());
    } else {
      setSelectedBookingIds(new Set(filteredBookings.map((b) => b.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'confirm' | 'reject') => {
    if (selectedBookingIds.size === 0) {
      alert('Please select at least one booking');
      return;
    }

    let confirmMessage = '';
    if (action === 'approve') {
      confirmMessage = `Are you sure you want to approve ${selectedBookingIds.size} booking(s)?`;
    } else if (action === 'confirm') {
      confirmMessage = `Are you sure you want to confirm ${selectedBookingIds.size} booking(s)?`;
    } else {
      confirmMessage = `Are you sure you want to reject ${selectedBookingIds.size} booking(s)?`;
    }

    if (!confirm(confirmMessage)) return;

    const reason = action === 'reject' ? prompt('Enter rejection reason:') : '';
    if (action === 'reject' && !reason) {
      alert('Rejection reason is required');
      return;
    }

    setIsProcessing(true);
    const results = { success: 0, failed: 0 };

    for (const bookingId of Array.from(selectedBookingIds)) {
      try {
        if (action === 'approve') {
          await handleApprove(bookingId);
        } else if (action === 'confirm') {
          await handleConfirm(bookingId);
        } else {
          await handleReject(bookingId, reason || '');
        }
        results.success++;
      } catch (error) {
        results.failed++;
      }
    }

    setIsProcessing(false);
    setSelectedBookingIds(new Set());
    alert(`Bulk action completed:\n${results.success} successful\n${results.failed} failed`);
    fetchApprovals();
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      !filters.search ||
      booking.bookingReference.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.destination.toLowerCase().includes(filters.search.toLowerCase()) ||
      `${booking.user.firstName} ${booking.user.lastName}`
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    const matchesMinAmount =
      !filters.minAmount || booking.totalPrice >= parseFloat(filters.minAmount);

    const matchesMaxAmount =
      !filters.maxAmount || booking.totalPrice <= parseFloat(filters.maxAmount);

    return matchesSearch && matchesMinAmount && matchesMaxAmount;
  });

  return (
    <div className="min-h-screen bg-gray-50" style={{ minWidth: '100%' }}>
      {/* Navigation */}
      <UnifiedNavBar currentPage="approvals" user={user} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
            {user?.role === 'super_admin' ? 'Booking Confirmations' : 'Booking Approvals'}
          </h1>
          <p className="text-xs text-gray-600">
            {user?.role === 'super_admin'
              ? 'Review and confirm bookings that have been approved by managers. Verify rates and availability before confirming.'
              : 'Review and approve or reject pending booking requests. Approved bookings will need rate confirmation.'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
            <div className="w-1 h-4 bg-gray-900 rounded-full"></div>
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by reference, traveler, or destination..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                placeholder="Min amount"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                placeholder="Max amount"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-2 border-l-gray-900">
            <p className="text-xs font-medium text-gray-600 mb-2">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-2 border-l-gray-900">
            <p className="text-xs font-medium text-gray-600 mb-2">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredBookings.length > 0 ? formatAmount(
                filteredBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0),
                filteredBookings[0].currency
              ) : formatAmount(0, 'USD')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-2 border-l-gray-900">
            <p className="text-xs font-medium text-gray-600 mb-2">Travelers</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredBookings.reduce((sum, b) => sum + b.numberOfTravelers, 0)}
            </p>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedBookingIds.size > 0 && (
          <div className="bg-gray-900 text-white rounded-lg shadow-sm border border-gray-800 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold text-sm">{selectedBookingIds.size} booking(s) selected</span>
              </div>
              <div className="flex gap-2">
                {user?.role === 'super_admin' ? (
                  <button
                    onClick={() => handleBulkAction('confirm')}
                    disabled={isProcessing}
                    className="px-4 py-2 text-sm bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium disabled:opacity-50"
                  >
                    Confirm Selected
                  </button>
                ) : (
                  <button
                    onClick={() => handleBulkAction('approve')}
                    disabled={isProcessing}
                    className="px-4 py-2 text-sm bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium disabled:opacity-50"
                  >
                    Approve Selected
                  </button>
                )}
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  Reject Selected
                </button>
                <button
                  onClick={() => setSelectedBookingIds(new Set())}
                  className="px-4 py-2 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Matrix Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading pending approvals...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600 text-sm">There are no pending approvals at the moment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto" style={{ minWidth: 'auto' }}>
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedBookingIds.size === filteredBookings.length && filteredBookings.length > 0}
                        onChange={toggleAllBookings}
                        className="w-4 h-4 text-gray-900 rounded focus:ring-1 focus:ring-gray-900"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[180px]">Traveler</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Travelers</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <>
                      <tr
                        key={booking.id}
                        className={`hover:bg-gray-50 transition ${
                          selectedBookingIds.has(booking.id) ? 'bg-gray-50' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedBookingIds.has(booking.id)}
                            onChange={() => toggleBookingSelection(booking.id)}
                            className="w-4 h-4 text-gray-900 rounded focus:ring-1 focus:ring-gray-900"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            {booking.bookingType === 'flight' ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                <Plane className="w-4 h-4 text-gray-700 flex-shrink-0" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0"></div>
                                <Hotel className="w-4 h-4 text-gray-700 flex-shrink-0" />
                              </div>
                            )}
                            <span className="text-sm capitalize font-medium text-gray-900">{booking.bookingType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setExpandedRowId(expandedRowId === booking.id ? null : booking.id)}
                            className="font-mono text-xs text-gray-900 font-semibold hover:text-gray-700 transition"
                          >
                            {booking.bookingReference}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {booking.user.firstName[0]}{booking.user.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {booking.user.firstName} {booking.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{booking.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                            {booking.origin} → {booking.destination}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 whitespace-nowrap">
                            {new Date(booking.departureDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-sm">
                            {booking.isGroupBooking && <Users className="w-3 h-3 text-gray-700 flex-shrink-0" />}
                            <span className="text-gray-900 font-medium">{booking.numberOfTravelers}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                            {formatAmount(Number(booking.totalPrice), booking.currency)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition"
                              title="Review"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {user?.role === 'super_admin' ? (
                              <button
                                onClick={() => handleConfirm(booking.id)}
                                disabled={isProcessing}
                                className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition disabled:opacity-50"
                                title="Confirm"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprove(booking.id)}
                                disabled={isProcessing}
                                className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) handleReject(booking.id, reason);
                              }}
                              disabled={isProcessing}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row Details */}
                      {expandedRowId === booking.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 font-medium">Email:</span>
                                <span className="ml-2 text-gray-900">{booking.user.email}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 font-medium">Departure:</span>
                                <span className="ml-2 text-gray-900">
                                  {new Date(booking.departureDate).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              {booking.returnDate && (
                                <div>
                                  <span className="text-gray-600 font-medium">Return:</span>
                                  <span className="ml-2 text-gray-900">
                                    {new Date(booking.returnDate).toLocaleDateString('en-US', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                              )}
                              {booking.isGroupBooking && booking.groupName && (
                                <div>
                                  <span className="text-gray-600 font-medium">Group Name:</span>
                                  <span className="ml-2 text-gray-900">{booking.groupName}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-600 font-medium">Booked:</span>
                                <span className="ml-2 text-gray-900">
                                  {new Date(booking.bookedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredBookings.length > 0 && pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 flex items-center justify-between mt-6">
            <div className="text-xs text-gray-700">
              Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> (
              <span className="font-semibold">{pagination.total}</span> total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedBooking && user && (
        <ApprovalModal
          booking={selectedBooking}
          userRole={user.role}
          onClose={() => setSelectedBooking(null)}
          onApprove={handleApprove}
          onConfirm={handleConfirm}
          onReject={handleReject}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
