import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { convertCurrency } from '../services/exchange-rate.service';
import {
  sendBookingRequestEmail,
  sendBookingApprovalEmail,
  sendBookingConfirmationEmail,
  sendBookingRejectionEmail,
  sendBookingCancellationEmail,
} from '../utils/email.service';

/**
 * Get all bookings for an organization
 * Supports filtering by status, type, date range, and user
 */
export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      status,
      bookingType,
      startDate,
      endDate,
      userId,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build where clause
    const where: Prisma.BookingWhereInput = {
      organizationId: user.organizationId,
      deletedAt: null,
    };

    // Filter by status
    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Filter by booking type
    if (bookingType && typeof bookingType === 'string') {
      where.bookingType = bookingType;
    }

    // Filter by user (admins/managers can see all, travelers see only their own)
    if (user.role === 'traveler') {
      where.userId = user.userId;
    } else if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    // Filter by date range
    if (startDate && typeof startDate === 'string') {
      where.departureDate = {
        ...(where.departureDate && typeof where.departureDate === 'object' ? where.departureDate : {}),
        gte: new Date(startDate),
      };
    }
    if (endDate && typeof endDate === 'string') {
      where.departureDate = {
        ...(where.departureDate && typeof where.departureDate === 'object' ? where.departureDate : {}),
        lte: new Date(endDate),
      };
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Fetch bookings with relations
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          flightBookings: true,
          hotelBookings: {
            include: {
              rooms: {
                include: {
                  guests: true,
                },
              },
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve bookings',
    });
  }
};

/**
 * Get a single booking by ID
 */
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        ...(user.role === 'traveler' ? { userId: user.userId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        flightBookings: true,
        hotelBookings: {
          include: {
            rooms: {
              include: {
                guests: true,
              },
            },
          },
        },
        creditTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking,
    });
  } catch (error: any) {
    logger.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve booking',
    });
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      bookingType,
      isGroupBooking,
      numberOfTravelers,
      groupName,
      origin,
      destination,
      departureDate,
      returnDate,
      isRoundTrip,
      passengers,
      passengerDetails,
      basePrice,
      taxesFees,
      totalPrice,
      currency,
      travelReason,
      notes,
      providerName,
      providerBookingReference,
      bookingData,
      flightDetails,
      hotelDetails,
    } = req.body;

    // Validation
    if (!bookingType || !destination || !departureDate || !passengerDetails) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
      return;
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
      return;
    }

    // Get current user details to find approver
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { approverId: true },
    });

    // Check if booking requires approval
    const requiresApproval =
      organization.requireApprovalAll ||
      (totalPrice && parseFloat(totalPrice) >= parseFloat(organization.approvalThreshold.toString()));

    // Generate unique booking reference
    const bookingReference = `BK${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create booking with flight/hotel details in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create main booking
      const newBooking = await tx.booking.create({
        data: {
          organizationId: user.organizationId,
          userId: user.userId,
          bookingReference,
          bookingType,
          isGroupBooking: isGroupBooking || false,
          numberOfTravelers: numberOfTravelers || passengers || 1,
          groupName,
          origin,
          destination,
          departureDate: new Date(departureDate),
          returnDate: returnDate ? new Date(returnDate) : null,
          isRoundTrip: isRoundTrip || false,
          passengers: passengers || 1,
          passengerDetails,
          basePrice: basePrice || 0,
          taxesFees: taxesFees || 0,
          totalPrice: totalPrice || 0,
          currency: currency || 'USD',
          status: requiresApproval ? 'pending_approval' : 'pending',
          requiresApproval,
          approverId: requiresApproval && currentUser?.approverId ? currentUser.approverId : null,
          travelReason,
          notes,
          providerName,
          providerBookingReference,
          bookingData,
        },
      });

      // Create flight booking if flight details provided
      if (bookingType === 'flight' && flightDetails) {
        await tx.flightBooking.create({
          data: {
            bookingId: newBooking.id,
            ...flightDetails,
          },
        });
      }

      // Create hotel booking if hotel details provided
      if (bookingType === 'hotel' && hotelDetails) {
        const { rooms: multiRoomData, isMultiRoom, photoUrl, ...hotelData } = hotelDetails;

        // Create main hotel booking
        const hotelBooking = await tx.hotelBooking.create({
          data: {
            bookingId: newBooking.id,
            isMultiRoom: isMultiRoom || false,
            photoUrl: photoUrl || null,
            ...hotelData,
          },
        });

        // If multi-room booking, create room items and guests
        if (isMultiRoom && multiRoomData && Array.isArray(multiRoomData)) {
          for (const room of multiRoomData) {
            // Create room booking item
            const roomBookingItem = await tx.roomBookingItem.create({
              data: {
                hotelBookingId: hotelBooking.id,
                roomNumber: room.roomNumber,
                offerId: room.offerId,
                roomType: room.offerDetails?.room?.typeEstimated?.category || 'Standard',
                bedType: room.offerDetails?.room?.typeEstimated?.bedType || null,
                roomDescription: room.offerDetails?.room?.description?.text || null,
                price: room.price,
                currency: room.offerDetails?.price?.currency || 'USD',
                numberOfGuests: room.guests?.length || 0,
              },
            });

            // Create guest records for this room
            if (room.guests && Array.isArray(room.guests)) {
              for (const guest of room.guests) {
                await tx.guest.create({
                  data: {
                    roomBookingId: roomBookingItem.id,
                    firstName: guest.firstName,
                    lastName: guest.lastName,
                    email: guest.email,
                    phone: guest.phone,
                    dateOfBirth: guest.dateOfBirth,
                    address: guest.address || null,
                    city: guest.city || null,
                    country: guest.country || null,
                    passportNumber: guest.passportNumber || null,
                    passportExpiry: guest.passportExpiry || null,
                    passportCountry: guest.passportCountry || null,
                  },
                });
              }
            }
          }
        }
      }

      // Create credit transaction (hold funds)
      if (totalPrice && parseFloat(totalPrice) > 0) {
        const bookingCost = parseFloat(totalPrice);

        // Get user's current credit balance
        const bookingUser = await tx.user.findUnique({
          where: { id: user.userId },
          select: {
            availableCredits: true,
            role: true,
          },
        });

        if (!bookingUser) {
          throw new Error('User not found');
        }

        const userBalance = parseFloat(bookingUser.availableCredits.toString());

        // Check if user has sufficient credits
        if (userBalance < bookingCost) {
          throw new Error('Insufficient credits. Please contact your administrator to increase your credit limit.');
        }

        // Deduct from user's available credits
        await tx.user.update({
          where: { id: user.userId },
          data: {
            availableCredits: userBalance - bookingCost,
          },
        });

        // Create credit transaction
        await tx.creditTransaction.create({
          data: {
            organizationId: user.organizationId,
            userId: user.userId,
            bookingId: newBooking.id,
            transactionType: 'credit_held',
            amount: bookingCost,
            currency: currency || 'USD',
            balanceBefore: userBalance,
            balanceAfter: userBalance - bookingCost,
            description: `Credit held for booking ${bookingReference}`,
            createdBy: user.userId,
          },
        });
      }

      return newBooking;
    });

    // Fetch complete booking with relations
    const completeBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        flightBookings: true,
        hotelBookings: {
          include: {
            rooms: {
              include: {
                guests: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send booking request email to traveler
    if (completeBooking) {
      await sendBookingRequestEmail(
        completeBooking.user.email,
        `${completeBooking.user.firstName} ${completeBooking.user.lastName}`,
        completeBooking.bookingReference,
        completeBooking.bookingType,
        completeBooking.origin || '',
        completeBooking.destination,
        completeBooking.departureDate,
        completeBooking.returnDate,
        parseFloat(completeBooking.totalPrice.toString()),
        completeBooking.currency,
        requiresApproval,
        currentUser?.approverId ? 'your approver' : undefined
      );
    }

    res.status(201).json({
      success: true,
      message: requiresApproval
        ? 'Booking created and pending approval'
        : 'Booking created successfully',
      data: completeBooking,
    });
  } catch (error: any) {
    logger.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { cancellationReason } = req.body;

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        ...(user.role === 'traveler' ? { userId: user.userId } : {}),
      },
      include: {
        creditTransactions: true,
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
      return;
    }

    // Update booking and release credits in a transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason,
        },
      });

      // Release held credits back to the user who made the booking
      const heldTransaction = booking.creditTransactions.find(
        t => t.transactionType === 'credit_held'
      );

      if (heldTransaction) {
        const bookingUser = await tx.user.findUnique({
          where: { id: booking.userId },
          select: { availableCredits: true },
        });

        if (bookingUser) {
          const currentBalance = parseFloat(bookingUser.availableCredits.toString());
          const refundAmount = parseFloat(heldTransaction.amount.toString());

          await tx.creditTransaction.create({
            data: {
              organizationId: user.organizationId,
              userId: booking.userId,
              bookingId: id,
              transactionType: 'credit_released',
              amount: refundAmount,
              currency: heldTransaction.currency,
              balanceBefore: currentBalance,
              balanceAfter: currentBalance + refundAmount,
              description: `Credit released from cancelled booking ${booking.bookingReference}`,
              createdBy: user.userId,
            },
          });

          await tx.user.update({
            where: { id: booking.userId },
            data: {
              availableCredits: currentBalance + refundAmount,
            },
          });
        }
      }

      return updated;
    });

    // Fetch complete booking with user details for email
    const completeBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (completeBooking) {
      // Calculate refund amount from transactions
      const heldTransaction = booking.creditTransactions.find(
        t => t.transactionType === 'credit_held'
      );
      const refundAmount = heldTransaction ? parseFloat(heldTransaction.amount.toString()) : 0;

      // Get canceller name
      const cancellerUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { firstName: true, lastName: true },
      });
      const cancellerName = cancellerUser
        ? `${cancellerUser.firstName} ${cancellerUser.lastName}`
        : 'System';

      // Send cancellation email to traveler
      await sendBookingCancellationEmail(
        completeBooking.user.email,
        `${completeBooking.user.firstName} ${completeBooking.user.lastName}`,
        completeBooking.bookingReference,
        completeBooking.bookingType,
        completeBooking.destination,
        cancellationReason || 'No reason provided',
        cancellerName,
        refundAmount,
        completeBooking.currency
      );
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking,
    });
  } catch (error: any) {
    logger.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
    });
  }
};

/**
 * Approve a booking - First Tier (admin/manager/company_admin only)
 * This moves the booking to 'awaiting_confirmation' status for super admin confirmation
 */
export const approveBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'company_admin')) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized. Only admins, managers, and company admins can approve bookings'
      });
      return;
    }

    const { id } = req.params;
    const { approvalNotes } = req.body;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        status: 'pending_approval',
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found or not pending approval',
      });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'awaiting_confirmation',
        approverId: user.userId,
        approvedAt: new Date(),
        approvalNotes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send approval email to traveler
    if (updatedBooking.approver) {
      await sendBookingApprovalEmail(
        updatedBooking.user.email,
        `${updatedBooking.user.firstName} ${updatedBooking.user.lastName}`,
        updatedBooking.bookingReference,
        updatedBooking.bookingType,
        updatedBooking.destination,
        `${updatedBooking.approver.firstName} ${updatedBooking.approver.lastName}`,
        updatedBooking.approvedAt!
      );
    }

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully. Awaiting rate confirmation.',
      data: updatedBooking,
    });
  } catch (error: any) {
    logger.error('Approve booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve booking',
    });
  }
};

/**
 * Reject a booking (admin/manager only)
 */
export const rejectBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized. Only admins and managers can reject bookings'
      });
      return;
    }

    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        status: 'pending_approval',
      },
      include: {
        creditTransactions: true,
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found or not pending approval',
      });
      return;
    }

    // Reject booking and release credits
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: 'rejected',
          approverId: user.userId,
          rejectionReason,
        },
      });

      // Release held credits back to the user who made the booking
      const heldTransaction = booking.creditTransactions.find(
        t => t.transactionType === 'credit_held'
      );

      if (heldTransaction) {
        const bookingUser = await tx.user.findUnique({
          where: { id: booking.userId },
          select: { availableCredits: true },
        });

        if (bookingUser) {
          const currentBalance = parseFloat(bookingUser.availableCredits.toString());
          const refundAmount = parseFloat(heldTransaction.amount.toString());

          await tx.creditTransaction.create({
            data: {
              organizationId: user.organizationId,
              userId: booking.userId,
              bookingId: id,
              transactionType: 'credit_released',
              amount: refundAmount,
              currency: heldTransaction.currency,
              balanceBefore: currentBalance,
              balanceAfter: currentBalance + refundAmount,
              description: `Credit released from rejected booking ${booking.bookingReference}`,
              createdBy: user.userId,
            },
          });

          await tx.user.update({
            where: { id: booking.userId },
            data: {
              availableCredits: currentBalance + refundAmount,
            },
          });
        }
      }

      return updated;
    });

    // Fetch complete booking with user details for email
    const completeBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        approver: true,
      },
    });

    if (completeBooking) {
      // Send rejection email to traveler
      await sendBookingRejectionEmail(
        completeBooking.user.email,
        `${completeBooking.user.firstName} ${completeBooking.user.lastName}`,
        completeBooking.bookingReference,
        completeBooking.bookingType,
        completeBooking.destination,
        rejectionReason,
        `${completeBooking.approver?.firstName || 'Administrator'} ${completeBooking.approver?.lastName || ''}`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: updatedBooking,
    });
  } catch (error: any) {
    logger.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject booking',
    });
  }
};

/**
 * Confirm a booking - Second Tier (super_admin only)
 * This finalizes the booking after checking availability and moves it to 'confirmed' status
 */
export const confirmBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Unauthorized. Only super admins can confirm bookings'
      });
      return;
    }

    const { id } = req.params;
    const { confirmationNotes } = req.body;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        status: 'awaiting_confirmation',
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found or not awaiting confirmation',
      });
      return;
    }

    // Final confirmation - move to confirmed status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmerId: user.userId,
        confirmedByAt: new Date(),
        confirmedAt: new Date(),
        confirmationNotes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        confirmer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send confirmation email to traveler
    await sendBookingConfirmationEmail(
      updatedBooking.user.email,
      `${updatedBooking.user.firstName} ${updatedBooking.user.lastName}`,
      updatedBooking.bookingReference,
      updatedBooking.bookingType,
      updatedBooking.origin || '',
      updatedBooking.destination,
      updatedBooking.departureDate,
      updatedBooking.returnDate,
      parseFloat(updatedBooking.totalPrice.toString()),
      updatedBooking.currency
    );

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: updatedBooking,
    });
  } catch (error: any) {
    logger.error('Confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm booking',
    });
  }
};

/**
 * Get booking statistics for dashboard
 */
export const getBookingStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const where: Prisma.BookingWhereInput = {
      organizationId: user.organizationId,
      deletedAt: null,
      ...(user.role === 'traveler' ? { userId: user.userId } : {}),
    };

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      flightBookings,
      hotelBookings,
      totalSpent,
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: 'pending' } }),
      prisma.booking.count({ where: { ...where, status: 'confirmed' } }),
      prisma.booking.count({ where: { ...where, bookingType: 'flight' } }),
      prisma.booking.count({ where: { ...where, bookingType: 'hotel' } }),
      prisma.booking.aggregate({
        where: { ...where, status: { in: ['confirmed', 'completed'] } },
        _sum: { totalPrice: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Booking statistics retrieved successfully',
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        flightBookings,
        hotelBookings,
        totalSpent: totalSpent._sum.totalPrice || 0,
      },
    });
  } catch (error: any) {
    logger.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve booking statistics',
    });
  }
};
