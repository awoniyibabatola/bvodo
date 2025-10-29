import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getBookings,
  getBookingById,
  createBooking,
  getCancellationPreview,
  cancelBooking,
  approveBooking,
  rejectBooking,
  confirmBooking,
  getBookingStats,
} from '../controllers/booking.controller';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for organization
 * @access  Private
 * @query   status, bookingType, startDate, endDate, userId, page, limit, sortBy, sortOrder
 */
router.get('/', getBookings);

/**
 * @route   GET /api/bookings/stats
 * @desc    Get booking statistics
 * @access  Private
 */
router.get('/stats', getBookingStats);

/**
 * @route   GET /api/bookings/:id/cancellation-preview
 * @desc    Get cancellation preview/quote
 * @access  Private
 */
router.get('/:id/cancellation-preview', getCancellationPreview);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', getBookingById);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/', createBooking);

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Private
 */
router.put('/:id/cancel', cancelBooking);

/**
 * @route   PUT /api/bookings/:id/approve
 * @desc    Approve a booking (admin/manager only)
 * @access  Private (admin/manager)
 */
router.put('/:id/approve', approveBooking);

/**
 * @route   PUT /api/bookings/:id/reject
 * @desc    Reject a booking (admin/manager only)
 * @access  Private (admin/manager)
 */
router.put('/:id/reject', rejectBooking);

/**
 * @route   PUT /api/bookings/:id/confirm
 * @desc    Confirm a booking after availability check (super_admin only)
 * @access  Private (super_admin)
 */
router.put('/:id/confirm', confirmBooking);

export default router;
