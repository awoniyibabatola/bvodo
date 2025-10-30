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
import duffelService from '../services/duffel.service';
import { duffelStaysService } from '../services/duffel-stays.service';
import emailService from '../services/email.service';
import { stripeService } from '../services/stripe.service';
import PolicyService from '../services/policy.service';

/**
 * Helper function to deduct credits based on user role
 * Admins: deduct from organization credits
 * Regular users: deduct from personal credit limit
 */
async function deductCredits(
  tx: any,
  userId: string,
  organizationId: string,
  bookingId: string,
  amount: number,
  currency: string,
  description: string
) {
  // Get user to check role
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { role: true, availableCredits: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isAdmin = user.role === 'admin' || user.role === 'company_admin';

  if (isAdmin) {
    // Deduct from organization credits
    const org = await tx.organization.findUnique({
      where: { id: organizationId },
      select: { availableCredits: true },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    const orgBalance = parseFloat(org.availableCredits.toString());

    if (orgBalance < amount) {
      throw new Error('Insufficient organization credits');
    }

    await tx.organization.update({
      where: { id: organizationId },
      data: { availableCredits: orgBalance - amount },
    });

    await tx.creditTransaction.create({
      data: {
        organizationId,
        userId,
        bookingId,
        transactionType: 'booking_charged',
        amount,
        currency,
        balanceBefore: orgBalance,
        balanceAfter: orgBalance - amount,
        description: `${description} (from organization credits)`,
        createdBy: userId,
      },
    });
  } else {
    // Deduct from personal credit limit
    const userBalance = parseFloat(user.availableCredits.toString());

    if (userBalance < amount) {
      throw new Error('Insufficient personal credits');
    }

    await tx.user.update({
      where: { id: userId },
      data: { availableCredits: userBalance - amount },
    });

    await tx.creditTransaction.create({
      data: {
        organizationId,
        userId,
        bookingId,
        transactionType: 'booking_charged',
        amount,
        currency,
        balanceBefore: userBalance,
        balanceAfter: userBalance - amount,
        description: `${description} (from personal credits)`,
        createdBy: userId,
      },
    });
  }
}

/**
 * Helper function to refund credits based on user role
 * Admins: refund to organization credits
 * Regular users: refund to personal credit limit
 */
async function refundCredits(
  tx: any,
  userId: string,
  organizationId: string,
  bookingId: string,
  amount: number,
  currency: string,
  description: string
) {
  // Get user to check role
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { role: true, availableCredits: true },
  });

  if (!user) {
    return; // Silently fail if user not found
  }

  const isAdmin = user.role === 'admin' || user.role === 'company_admin';

  if (isAdmin) {
    // Refund to organization credits
    const org = await tx.organization.findUnique({
      where: { id: organizationId },
      select: { availableCredits: true },
    });

    if (!org) {
      return;
    }

    const orgBalance = parseFloat(org.availableCredits.toString());

    await tx.organization.update({
      where: { id: organizationId },
      data: { availableCredits: orgBalance + amount },
    });

    await tx.creditTransaction.create({
      data: {
        organizationId,
        userId,
        bookingId,
        transactionType: 'booking_refunded',
        amount,
        currency,
        balanceBefore: orgBalance,
        balanceAfter: orgBalance + amount,
        description: `${description} (to organization credits)`,
        createdBy: userId,
      },
    });
  } else {
    // Refund to personal credit limit
    const userBalance = parseFloat(user.availableCredits.toString());

    await tx.user.update({
      where: { id: userId },
      data: { availableCredits: userBalance + amount },
    });

    await tx.creditTransaction.create({
      data: {
        organizationId,
        userId,
        bookingId,
        transactionType: 'booking_refunded',
        amount,
        currency,
        balanceBefore: userBalance,
        balanceAfter: userBalance + amount,
        description: `${description} (to personal credits)`,
        createdBy: userId,
      },
    });
  }
}

/**
 * Parse ISO 8601 duration string to minutes
 * Example: "PT7H12M" -> 432 minutes (7*60 + 12)
 */
function parseDurationToMinutes(duration: string | null | undefined): number | null {
  if (!duration) return null;

  try {
    // Match pattern: PT(hours)H(minutes)M or PT(hours)H or PT(minutes)M
    const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!matches) return null;

    const hours = matches[1] ? parseInt(matches[1]) : 0;
    const minutes = matches[2] ? parseInt(matches[2]) : 0;

    return hours * 60 + minutes;
  } catch (error) {
    logger.error('Error parsing duration:', error);
    return null;
  }
}

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
      provider,                     // NEW: Provider type (duffel, amadeus)
      providerName,
      providerBookingReference,
      bookingData,
      services,                     // NEW: Services array (seats & baggage)
      paymentMethod = 'credit',     // NEW: Payment method ('credit' or 'card')
      isInstantConfirmation,        // NEW: For hotels - instant vs non-instant confirmation
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

    // ============================================
    // POLICY VALIDATION
    // ============================================
    let policyViolation = null;
    let policyRequiresApproval = false;

    try {
      // Get user's effective policy
      const policy = await PolicyService.getPolicyForUser(
        user.userId,
        user.organizationId
      );

      if (policy) {
        // Get effective limits (exception overrides base policy)
        const effectiveFlightMaxAmount = policy.exception?.flightMaxAmount || policy.flightMaxAmount;
        const effectiveHotelMaxPerNight = policy.exception?.hotelMaxAmountPerNight || policy.hotelMaxAmountPerNight;
        const effectiveHotelMaxTotal = policy.exception?.hotelMaxAmountTotal || policy.hotelMaxAmountTotal;
        const requiresApprovalAbove = policy.requiresApprovalAbove;

        const bookingAmount = parseFloat(totalPrice);

        // Check flight policy
        if (bookingType === 'flight' && effectiveFlightMaxAmount) {
          const maxAmount = Number(effectiveFlightMaxAmount);
          if (bookingAmount > maxAmount) {
            policyViolation = `Booking amount (${currency} ${totalPrice}) exceeds your flight policy limit of ${currency} ${maxAmount}`;
          }

          // Check flight class restrictions
          if (policy.allowedFlightClasses && Array.isArray(policy.allowedFlightClasses) && flightDetails) {
            const allowedClasses = policy.allowedFlightClasses as string[];
            const flightClass = (flightDetails.cabinClass || flightDetails.travelClass || 'economy').toLowerCase();

            if (!allowedClasses.includes(flightClass)) {
              policyViolation = `Flight class '${flightClass}' is not allowed by your policy. Allowed classes: ${allowedClasses.join(', ')}`;
            }
          }
        }

        // Check hotel policy
        if (bookingType === 'hotel' && hotelDetails) {
          const checkIn = new Date(departureDate);
          const checkOut = returnDate ? new Date(returnDate) : new Date(departureDate);
          const numberOfNights = Math.max(1, Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
          ));
          const perNightPrice = bookingAmount / numberOfNights;

          // Check per-night limit
          if (effectiveHotelMaxPerNight) {
            const maxPerNight = Number(effectiveHotelMaxPerNight);
            if (perNightPrice > maxPerNight) {
              policyViolation = `Hotel rate (${currency} ${perNightPrice.toFixed(2)}/night) exceeds your policy limit of ${currency} ${maxPerNight}/night`;
            }
          }

          // Check total limit
          if (effectiveHotelMaxTotal) {
            const maxTotal = Number(effectiveHotelMaxTotal);
            if (bookingAmount > maxTotal) {
              policyViolation = `Total hotel cost (${currency} ${totalPrice}) exceeds your policy limit of ${currency} ${maxTotal}`;
            }
          }
        }

        // Check if amount requires approval (even if within policy)
        if (requiresApprovalAbove && bookingAmount > Number(requiresApprovalAbove)) {
          policyRequiresApproval = true;
        }

        // Log policy check
        await PolicyService.logPolicyUsage({
          policyId: policy.id,
          organizationId: user.organizationId,
          userId: user.userId,
          eventType: policyViolation ? 'policy_violated' : 'policy_applied',
          bookingType,
          requestedAmount: bookingAmount,
          currency,
          policySnapshot: policy as any,
          wasAllowed: !policyViolation,
          requiresApproval: policyRequiresApproval,
        });
      }
    } catch (policyError) {
      logger.warn('Error checking booking policy:', policyError);
      // Continue without policy enforcement if there's an error
    }

    // Reject booking if it violates policy
    if (policyViolation && paymentMethod === 'credit') {
      res.status(403).json({
        success: false,
        message: 'Booking violates your organization policy',
        error: policyViolation,
        requiresException: true,
      });
      return;
    }

    // Check if booking requires approval
    // Card payments are auto-approved after Stripe payment (user pays with own money)
    // Balance/credit payments require manual approval (using company money)
    const requiresApproval = paymentMethod === 'credit' && (
      policyRequiresApproval ||
      organization.requireApprovalAll ||
      (totalPrice && parseFloat(totalPrice) >= parseFloat(organization.approvalThreshold.toString()))
    );

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
          provider: provider || 'duffel',  // NEW: Save provider type
          providerName,
          providerBookingReference,
          bookingData: {
            ...bookingData,
            services: services || undefined,  // Store services in bookingData JSON
            paymentMethod: paymentMethod || 'credit',  // Store payment method for display
            isInstantConfirmation: bookingType === 'hotel' ? (isInstantConfirmation !== false) : undefined,  // For hotels, store instant confirmation flag
          },
          // Duffel Go-Live Compliance Fields
          taxes: bookingData?.selectedOffer?.price?.taxes ? parseFloat(bookingData.selectedOffer.price.taxes) : null,
          fees: bookingData?.selectedOffer?.price?.fees ? parseFloat(bookingData.selectedOffer.price.fees) : null,
          dueAtAccommodation: bookingData?.selectedOffer?.price?.dueAtAccommodation ? parseFloat(bookingData.selectedOffer.price.dueAtAccommodation) : null,
          cancellationTimeline: bookingData?.selectedOffer?.policies?.cancellation?.timeline || null,
          supplier: bookingData?.selectedOffer?.supplier || null,
          checkInTime: bookingData?.selectedOffer?.policies?.checkIn?.from || hotelDetails?.checkInTime || null,
          checkOutTime: bookingData?.selectedOffer?.policies?.checkOut?.before || hotelDetails?.checkOutTime || null,
        },
      });

      // Create flight booking if flight details provided
      if (bookingType === 'flight' && flightDetails) {
        // Extract only the fields that belong in the FlightBooking table
        const flightBookingData: any = {};

        // Map airline fields
        if (flightDetails.airline) flightBookingData.airline = flightDetails.airline;
        if (flightDetails.airlineCode) flightBookingData.airlineCode = flightDetails.airlineCode;
        if (flightDetails.flightNumber) flightBookingData.flightNumber = flightDetails.flightNumber;

        // Map airport fields
        if (flightDetails.departureAirport) flightBookingData.departureAirport = flightDetails.departureAirport;
        if (flightDetails.departureAirportCode) flightBookingData.departureAirportCode = flightDetails.departureAirportCode;
        if (flightDetails.arrivalAirport) flightBookingData.arrivalAirport = flightDetails.arrivalAirport;
        if (flightDetails.arrivalAirportCode) flightBookingData.arrivalAirportCode = flightDetails.arrivalAirportCode;

        // Map time fields (convert to Date objects)
        if (flightDetails.departureTime) flightBookingData.departureTime = new Date(flightDetails.departureTime);
        if (flightDetails.arrivalTime) flightBookingData.arrivalTime = new Date(flightDetails.arrivalTime);

        // Map duration (convert ISO 8601 to minutes)
        if (flightDetails.duration) flightBookingData.duration = parseDurationToMinutes(flightDetails.duration);

        // Map cabin class
        if (flightDetails.cabinClass) flightBookingData.cabinClass = flightDetails.cabinClass;

        // Map stops (numberOfStops → stops)
        if (flightDetails.numberOfStops !== undefined) flightBookingData.stops = flightDetails.numberOfStops;

        // Map layover info
        if (flightDetails.layoverInfo) flightBookingData.layoverInfo = flightDetails.layoverInfo;

        // Map baggage allowance (convert to string)
        if (flightDetails.baggageAllowance != null) flightBookingData.baggageAllowance = String(flightDetails.baggageAllowance);

        // Map optional fields
        if (flightDetails.carryOnAllowance) flightBookingData.carryOnAllowance = flightDetails.carryOnAllowance;
        if (flightDetails.seatNumbers) flightBookingData.seatNumbers = flightDetails.seatNumbers;
        if (flightDetails.aircraft) flightBookingData.aircraft = flightDetails.aircraft;
        if (flightDetails.terminal) flightBookingData.terminal = flightDetails.terminal;
        if (flightDetails.gate) flightBookingData.gate = flightDetails.gate;
        if (flightDetails.eTicketNumbers) flightBookingData.eTicketNumbers = flightDetails.eTicketNumbers;
        if (flightDetails.pnr) flightBookingData.pnr = flightDetails.pnr;

        await tx.flightBooking.create({
          data: {
            bookingId: newBooking.id,
            ...flightBookingData,
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

        // Create room items and guests based on booking type
        if (isMultiRoom && multiRoomData && Array.isArray(multiRoomData)) {
          // MULTI-ROOM: Create multiple room records
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
                    phone: guest.phone || '',  // Schema requires string, not null
                    dateOfBirth: guest.dateOfBirth || '1990-01-01',  // Schema requires string, not null
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
        } else {
          // SINGLE-ROOM: Create one room record with guests from passengerDetails
          const guestList = passengerDetails || bookingData?.passengerDetails || [];

          if (Array.isArray(guestList) && guestList.length > 0) {
            // Create single room booking item
            const roomBookingItem = await tx.roomBookingItem.create({
              data: {
                hotelBookingId: hotelBooking.id,
                roomNumber: 1,
                offerId: providerBookingReference || bookingData?.rateId || null, // Use rate ID as offer ID
                roomType: hotelData.roomType || 'Standard',
                bedType: hotelData.bedType || null,
                roomDescription: hotelData.roomDescription || null,
                price: totalPrice ? parseFloat(totalPrice.toString()) : 0,
                currency: currency || 'USD',
                numberOfGuests: guestList.length,
              },
            });

            // Create guest records for single room
            for (const guest of guestList) {
              await tx.guest.create({
                data: {
                  roomBookingId: roomBookingItem.id,
                  firstName: guest.firstName,
                  lastName: guest.lastName,
                  email: guest.email,
                  phone: guest.phone || '',  // Schema requires string, not null
                  dateOfBirth: guest.dateOfBirth || '1990-01-01',  // Schema requires string, not null
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

      // NOTE: Credits are NOT deducted here - only held/reserved until approval
      // When admin approves, credits will be deducted and Duffel order created
      // This validates user has sufficient credits but doesn't charge yet
      // Only check credits if paying with Bvodo credit (not for card payments)
      if (paymentMethod === 'credit' && totalPrice && parseFloat(totalPrice) > 0) {
        const bookingCost = parseFloat(totalPrice);

        // Get user's current credit balance and role
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

        // Determine which balance to check based on user role
        const isAdminRole = bookingUser.role === 'admin' || bookingUser.role === 'company_admin' || bookingUser.role === 'super_admin';

        let availableBalance: number;
        if (isAdminRole) {
          // For admins: check organization credits
          const orgBalance = parseFloat(organization.availableCredits.toString());
          availableBalance = orgBalance;
        } else {
          // For travelers: check personal credit limit
          const userBalance = parseFloat(bookingUser.availableCredits.toString());
          availableBalance = userBalance;
        }

        // Check if sufficient credits are available (validation only - no deduction)
        if (availableBalance < bookingCost) {
          if (isAdminRole) {
            throw new Error('Insufficient organization credits. Please contact your super admin to top up the company balance.');
          } else {
            throw new Error('Insufficient credits. Please contact your administrator to increase your credit limit.');
          }
        }

        // NOTE: No credit deduction here! Credits will be deducted on approval
        // This just validates there are enough credits for the booking
      }

      return newBooking;
    });

    // For bookings that don't require approval AND using Bvodo credits: deduct credits and create Duffel order immediately
    // For card payments, this will be handled after Stripe payment via webhook
    if (!requiresApproval && paymentMethod === 'credit') {
      // 2. Create Duffel order for flight bookings FIRST (before deducting credits)
      let duffelOrder: any = null;

      if (bookingType === 'flight' && provider === 'duffel') {
        const offerId = providerBookingReference || bookingData?.id;

        if (!offerId) {
          throw new Error('Cannot create Duffel booking: Offer ID is missing');
        }

        try {
          logger.info(`[Auto-Approved] Creating Duffel order for booking ${bookingReference}`);
          logger.info(`[Auto-Approved] Offer ID: ${offerId}`);

          // Validate offer is still valid
          await duffelService.getOfferDetails(offerId as string);
          logger.info(`[Auto-Approved] Offer ${offerId} validation passed`);

          // Extract contact info from passenger details
          const firstPassenger = Array.isArray(passengerDetails) ? passengerDetails[0] : null;
          const contactEmail = firstPassenger?.email || user.email;
          const contactPhone = firstPassenger?.phone || '';

          logger.info(`[Auto-Approved] Contact: ${contactEmail}, Phone: ${contactPhone}`);
          logger.info(`[Auto-Approved] Passengers: ${Array.isArray(passengerDetails) ? passengerDetails.length : 0}`);
          logger.info(`[Auto-Approved] Services: ${services ? JSON.stringify(services) : 'none'}`);

          // Create Duffel order
          duffelOrder = await duffelService.createBooking({
            offerId: offerId as string,
            passengers: passengerDetails || [],
            contactEmail,
            contactPhone,
            services: services || undefined,
          });

          logger.info(`[Auto-Approved] ✅ Duffel order created: ${duffelOrder.bookingReference}`);
        } catch (duffelError: any) {
          // Log detailed error information
          logger.error(`[Auto-Approved] ❌ Duffel order creation FAILED for ${bookingReference}`);
          logger.error(`[Auto-Approved] Error type: ${duffelError.constructor.name}`);
          logger.error(`[Auto-Approved] Error message: ${duffelError.message}`);

          if (duffelError.response) {
            logger.error(`[Auto-Approved] Duffel API Response Status: ${duffelError.response.status}`);
            logger.error(`[Auto-Approved] Duffel API Response Data:`, JSON.stringify(duffelError.response.data, null, 2));
          }

          if (duffelError.stack) {
            logger.error(`[Auto-Approved] Stack trace:`, duffelError.stack);
          }

          // Update booking status to failed
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'failed',
              notes: `Duffel order creation failed: ${duffelError.message}. No credits were charged.`,
            },
          });

          // Throw error to prevent credit deduction and inform user
          throw new Error(
            `Failed to create flight booking with airline: ${duffelError.message}. ` +
            `Your credits have NOT been charged. Please try again or contact support if the issue persists.`
          );
        }
      }

      // 2b. Create Duffel Stays booking for hotel bookings
      if (bookingType === 'hotel' && provider === 'duffel') {
        const rateId = providerBookingReference || bookingData?.rateId;

        if (!rateId) {
          throw new Error('Cannot create Duffel hotel booking: Rate ID is missing');
        }

        try {
          logger.info(`[Auto-Approved Hotel] Creating Duffel Stays booking for ${bookingReference}`);
          logger.info(`[Auto-Approved Hotel] Rate ID: ${rateId}`);

          // Import duffelStaysService at the top of the file
          const { duffelStaysService } = await import('../services/duffel-stays.service');

          // Step 1: Create quote to validate rate availability and lock pricing
          logger.info(`[Auto-Approved Hotel] Creating quote for rate ${rateId}`);
          const quote = await duffelStaysService.createQuote(rateId);
          logger.info(`[Auto-Approved Hotel] Quote created: ${quote.id}, expires at ${quote.expires_at}`);

          // Step 2: Prepare guest details
          // hotelDetails should have guest information
          const hotelData = hotelDetails as any;
          const guests = hotelData?.guests || [];

          if (guests.length === 0) {
            throw new Error('No guest details provided for hotel booking');
          }

          // Format guests for Duffel (map to their required format)
          const duffelGuests = guests.map((guest: any) => ({
            given_name: guest.firstName || guest.given_name,
            family_name: guest.lastName || guest.family_name,
            born_on: guest.dateOfBirth || guest.born_on,
            email: guest.email,
            phone_number: guest.phone || guest.phone_number,
          }));

          const contactEmail = duffelGuests[0]?.email || user.email;
          const contactPhone = duffelGuests[0]?.phone_number || '';

          logger.info(`[Auto-Approved Hotel] Contact: ${contactEmail}, Phone: ${contactPhone}`);
          logger.info(`[Auto-Approved Hotel] Guests: ${duffelGuests.length}`);

          // Step 3: Create Duffel Stays booking
          const duffelHotelBooking = await duffelStaysService.createBooking({
            quote_id: quote.id,
            email: contactEmail,
            phone_number: contactPhone,
            guests: duffelGuests,
            accommodation_special_requests: hotelData?.specialRequests || bookingData?.specialRequests,
          });

          logger.info(`[Auto-Approved Hotel] ✅ Duffel Stays booking created: ${duffelHotelBooking.id}`);

          // Store Duffel booking data
          duffelOrder = {
            bookingReference: duffelHotelBooking.id,
            rawData: JSON.parse(JSON.stringify(duffelHotelBooking)),
          };
        } catch (duffelError: any) {
          logger.error(`[Auto-Approved Hotel] ❌ Duffel Stays booking creation FAILED for ${bookingReference}`);
          logger.error(`[Auto-Approved Hotel] Error: ${duffelError.message}`);

          if (duffelError.response) {
            logger.error(`[Auto-Approved Hotel] Duffel API Response:`, JSON.stringify(duffelError.response.data, null, 2));
          }

          // Update booking status to failed
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'failed',
              notes: `Duffel Stays booking creation failed: ${duffelError.message}. No credits were charged.`,
            },
          });

          // Throw error to prevent credit deduction
          throw new Error(
            `Failed to create hotel booking: ${duffelError.message}. ` +
            `Your credits have NOT been charged. Please try again or contact support.`
          );
        }
      }

      // 1. Deduct credits ONLY if Duffel order succeeded (or non-Duffel booking)
      // Uses helper function that handles admin vs regular user credit deduction
      try {
        const bookingCost = parseFloat(totalPrice || '0');

        if (bookingCost > 0) {
          await prisma.$transaction(async (tx) => {
            await deductCredits(
              tx,
              user.userId,
              user.organizationId,
              booking.id,
              bookingCost,
              currency || 'USD',
              `Booking auto-approved and charged: ${bookingReference}`
            );
          });

          logger.info(`[Auto-Approved] ✅ Credits deducted: ${bookingCost}`);
        }

        // Update booking with Duffel order details and set status to confirmed
        if (duffelOrder) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              providerOrderId: duffelOrder.bookingReference,
              providerConfirmationNumber: duffelOrder.bookingReference,
              providerRawData: duffelOrder.rawData,
              status: 'confirmed',
            },
          });

          logger.info(`[Auto-Approved] ✅ Booking confirmed with PNR: ${duffelOrder.bookingReference}`);

          // Send booking confirmation email
          try {
            // Fetch full user details for email
            const fullUser = await prisma.user.findUnique({
              where: { id: user.userId },
              select: { firstName: true, lastName: true },
            });

            const firstSegment = bookingData?.outbound?.[0];
            const lastSegment = bookingData?.outbound?.[bookingData.outbound.length - 1];

            if (firstSegment && passengerDetails && fullUser) {
              await emailService.sendBookingConfirmation({
                bookingId: booking.id,
                bookingReference: bookingReference,
                pnr: duffelOrder.bookingReference,
                travelerName: `${passengerDetails[0]?.firstName} ${passengerDetails[0]?.lastName}`,
                bookerName: `${fullUser.firstName} ${fullUser.lastName}`,
                bookerEmail: user.email,
                flightDetails: {
                  airline: firstSegment.airline || 'N/A',
                  from: origin || firstSegment.departure?.airportCode || 'N/A',
                  to: destination || lastSegment.arrival?.airportCode || 'N/A',
                  departureDate: new Date(departureDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }),
                  departureTime: firstSegment.departure?.time ? new Date(firstSegment.departure.time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A',
                  arrivalTime: lastSegment.arrival?.time ? new Date(lastSegment.arrival.time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A',
                  flightNumber: firstSegment.flightNumber || undefined,
                },
                passengerDetails: Array.isArray(passengerDetails) ? passengerDetails.map((p: any) => ({
                  firstName: p.firstName,
                  lastName: p.lastName,
                  email: p.email,
                })) : [],
                priceDetails: {
                  basePrice: Number(basePrice || 0),
                  taxes: Number(taxesFees || 0),
                  total: Number(totalPrice || 0),
                  currency: currency || 'USD',
                },
                seatsSelected: bookingData?.seatsSelected || undefined,
                baggageSelected: bookingData?.baggageSelected || undefined,
              });
              logger.info(`[Auto-Approved] ✅ Confirmation email sent`);
            }
          } catch (emailError) {
            logger.error('[Auto-Approved] Failed to send confirmation email:', emailError);
            // Don't fail the booking if email fails
          }
        } else {
          // For non-Duffel bookings or hotel bookings, just update status to confirmed
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'confirmed',
            },
          });
          logger.info(`[Auto-Approved] ✅ Non-Duffel booking confirmed`);
        }
      } catch (error: any) {
        logger.error('[Auto-Approved] Credit deduction or update failed:', error);
        throw error; // Re-throw to return error to user
      }
    }

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

    // If payment method is 'card', create Stripe checkout session
    let checkoutUrl = null;
    if (paymentMethod === 'card' && completeBooking) {
      try {
        // VALIDATE DUFFEL OFFER BEFORE PAYMENT - Prevent payment for expired/invalid offers
        // NOTE: Only validate FLIGHT offers, not hotel rates (hotel validation happens during Duffel Stays booking creation)
        if (provider === 'duffel' && bookingType === 'flight') {
          const offerId = providerBookingReference || bookingData?.id;
          if (!offerId) {
            throw new Error('Duffel offer ID not found in booking data');
          }

          logger.info(`[Booking] Validating Duffel flight offer ${offerId} before payment`);

          try {
            // This will throw if offer is expired or invalid
            await duffelService.getOfferDetails(offerId);
            logger.info(`[Booking] ✅ Offer ${offerId} is valid, proceeding to payment`);
          } catch (offerError: any) {
            logger.error(`[Booking] ❌ Offer validation failed:`, offerError.message);

            // Delete the booking since offer is invalid
            await prisma.booking.delete({
              where: { id: completeBooking.id }
            });

            res.status(400).json({
              success: false,
              message: offerError.message || 'This flight offer has expired. Please search for flights again to get fresh availability and pricing.',
              error: 'OFFER_EXPIRED'
            });
            return;
          }

          // Validate passport expiry dates BEFORE payment
          if (Array.isArray(passengerDetails)) {
            const tripReturnDate = returnDate ? new Date(returnDate) : new Date(departureDate);
            tripReturnDate.setDate(tripReturnDate.getDate() + 7); // Add buffer

            for (const passenger of passengerDetails) {
              if (passenger.passportExpiry && passenger.passportExpiry !== '') {
                const expiryDate = new Date(passenger.passportExpiry);
                if (expiryDate <= tripReturnDate) {
                  // Delete the booking since passport is invalid
                  await prisma.booking.delete({
                    where: { id: completeBooking.id }
                  });

                  res.status(400).json({
                    success: false,
                    message: `Passport for ${passenger.firstName} ${passenger.lastName} expires ${passenger.passportExpiry}, which is too soon. Passport must be valid for at least 7 days after your return date. Please update passport details or leave blank if not required.`,
                    error: 'PASSPORT_EXPIRY_INVALID'
                  });
                  return;
                }
              }
            }
            logger.info(`[Booking] ✅ All passport expiry dates validated`);
          }
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

        const session = await stripeService.createCheckoutSession({
          bookingReference: completeBooking.bookingReference,
          amount: parseFloat(completeBooking.totalPrice.toString()),
          currency: completeBooking.currency,
          customerEmail: completeBooking.user.email,
          successUrl: `${frontendUrl}/dashboard/bookings/${completeBooking.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${frontendUrl}/dashboard/bookings/${completeBooking.id}?payment=cancelled`,
          metadata: {
            bookingId: completeBooking.id,
            userId: completeBooking.userId,
            organizationId: completeBooking.organizationId,
            requiresApproval: requiresApproval.toString(),
          },
        });

        checkoutUrl = session.url;

        // Update booking with checkout session ID
        await prisma.booking.update({
          where: { id: completeBooking.id },
          data: {
            checkoutSessionId: session.id,
            paymentStatus: 'pending',
          },
        });

        logger.info(`[Booking] Stripe checkout created for ${completeBooking.bookingReference}: ${session.id}`);
      } catch (stripeError: any) {
        logger.error('[Booking] ❌ CRITICAL: Failed to create Stripe checkout:', stripeError);

        // Delete the booking since we can't process payment
        await prisma.booking.delete({
          where: { id: completeBooking.id }
        });

        // Return error to user
        res.status(500).json({
          success: false,
          message: 'Failed to create payment session. Please try again or contact support if the issue persists.',
          error: 'STRIPE_CHECKOUT_FAILED',
          details: stripeError.message
        });
        return;
      }
    }

    // If card payment was selected but no checkout URL, something went wrong
    if (paymentMethod === 'card' && !checkoutUrl && completeBooking) {
      logger.error('[Booking] ❌ Card payment selected but no checkout URL generated');

      // Delete the booking
      await prisma.booking.delete({
        where: { id: completeBooking.id }
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create payment session. Please try again.',
        error: 'CHECKOUT_URL_MISSING'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: requiresApproval
        ? 'Booking created and pending approval'
        : paymentMethod === 'card'
          ? 'Booking created. Redirecting to payment...'
          : 'Booking created successfully',
      data: completeBooking,
      checkoutUrl, // Include checkout URL for card payments
    });
  } catch (error: any) {
    logger.error('Create booking error:', error);

    // Don't expose detailed Prisma errors to client (security risk)
    // Only send generic error messages
    let userMessage = 'Failed to create booking. Please try again.';

    // Check for specific known errors we want to show to users
    if (error.message?.includes('Insufficient credits')) {
      userMessage = error.message;
    } else if (error.message?.includes('User not found')) {
      userMessage = 'User account not found';
    } else if (error.message?.includes('Organization not found')) {
      userMessage = 'Organization not found';
    }

    res.status(500).json({
      success: false,
      message: userMessage,
    });
  }
};

/**
 * Get cancellation preview/quote
 * Shows what refund the user would get if they cancel now
 */
export const getCancellationPreview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Find booking
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        ...(user.role === 'traveler' ? { userId: user.userId } : {}),
      },
      select: {
        id: true,
        bookingReference: true,
        bookingType: true,
        status: true,
        totalPrice: true,
        currency: true,
        departureDate: true,
        cancellationTimeline: true,
        cancelledAt: true,
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

    // Check if booking can be cancelled
    if (!booking.cancellationTimeline || (Array.isArray(booking.cancellationTimeline) && booking.cancellationTimeline.length === 0)) {
      res.status(200).json({
        success: true,
        data: {
          canCancel: false,
          refundAmount: 0,
          refundCurrency: booking.currency,
          isNonRefundable: true,
          message: 'This booking is non-refundable',
        },
      });
      return;
    }

    // Parse cancellation timeline
    const timeline = booking.cancellationTimeline as any[];
    const now = new Date();

    // Find the applicable refund based on current time
    let refundInfo = {
      canCancel: true,
      refundAmount: 0,
      refundCurrency: booking.currency,
      refundPercentage: 0,
      deadline: null as string | null,
      isNonRefundable: false,
      isPastDeadline: false,
    };

    // Check each timeline entry
    for (const entry of timeline) {
      const deadline = new Date(entry.before);

      // If current time is before the deadline, this refund applies
      if (now < deadline) {
        refundInfo.refundAmount = parseFloat(entry.refund_amount || '0');
        refundInfo.refundCurrency = entry.currency || booking.currency;
        refundInfo.deadline = entry.before;
        refundInfo.refundPercentage = Math.round((refundInfo.refundAmount / parseFloat(booking.totalPrice.toString())) * 100);
        break;
      }
    }

    // If no timeline entry applies, booking is past all deadlines (non-refundable)
    if (refundInfo.refundAmount === 0 && timeline.length > 0) {
      refundInfo.isNonRefundable = true;
      refundInfo.isPastDeadline = true;
      refundInfo.canCancel = true; // Can still cancel, but no refund
    }

    res.status(200).json({
      success: true,
      data: refundInfo,
    });
  } catch (error: any) {
    logger.error('Get cancellation preview error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cancellation preview',
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

    // For hotel bookings, cancel with Duffel API first
    let duffelCancellation = null;
    if (booking.bookingType === 'hotel') {
      if (booking.providerOrderId) {
        try {
          logger.info('[Cancellation] Cancelling hotel booking with Duffel Stays API', {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            providerOrderId: booking.providerOrderId,
            status: booking.status,
          });

          duffelCancellation = await duffelStaysService.cancelBooking(booking.providerOrderId);

          logger.info('[Cancellation] ✅ Duffel Stays cancellation successful', {
            bookingReference: booking.bookingReference,
            cancellationId: duffelCancellation.id,
            refundAmount: duffelCancellation.refund_amount,
            refundCurrency: duffelCancellation.refund_currency,
          });
        } catch (error: any) {
          logger.error('[Cancellation] ❌ Failed to cancel hotel booking with Duffel:', {
            bookingReference: booking.bookingReference,
            error: error.message,
            response: error.response?.data,
          });

          // Don't block the cancellation if Duffel API fails
          // Still proceed with internal cancellation but log the error
          logger.warn('[Cancellation] ⚠️ Proceeding with internal cancellation despite Duffel API error');
        }
      } else {
        logger.warn('[Cancellation] ⚠️ Hotel booking has no providerOrderId - Duffel booking was never created', {
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          status: booking.status,
        });
        logger.info('[Cancellation] This booking was likely cancelled before Super Admin confirmation');
      }
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

      // Release held credits back to the user who made the booking (handles admin vs regular user automatically)
      const heldTransaction = booking.creditTransactions.find(
        t => t.transactionType === 'credit_held'
      );

      if (heldTransaction) {
        const refundAmount = parseFloat(heldTransaction.amount.toString());
        await refundCredits(
          tx,
          booking.userId,
          user.organizationId,
          id,
          refundAmount,
          heldTransaction.currency,
          `Credit released from cancelled booking ${booking.bookingReference}`
        );
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
      include: {
        flightBookings: true,
        hotelBookings: true,
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

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found or not pending approval',
      });
      return;
    }

    // Process approval in transaction: deduct credits + update status
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Deduct credits (handles admin vs regular user automatically)
      const bookingCost = parseFloat(booking.totalPrice.toString());

      if (bookingCost > 0) {
        await deductCredits(
          tx,
          booking.userId,
          booking.organizationId,
          booking.id,
          bookingCost,
          booking.currency,
          `Booking approved and charged: ${booking.bookingReference}`
        );
      }

      // 2. Update booking status
      // For HOTELS: Move to 'awaiting_confirmation' (requires Super Admin confirmation)
      // For FLIGHTS: Move to 'confirmed' (no second tier required)
      const newStatus = booking.bookingType === 'hotel' ? 'awaiting_confirmation' : 'confirmed';

      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: newStatus,
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
          flightBookings: true,
        },
      });

      return updated;
    });

    // 3. Create Duffel order for FLIGHT bookings ONLY (outside transaction as it's external API)
    // HOTELS: Duffel booking creation is deferred to confirmBooking() for 2-tier approval
    if (updatedBooking.bookingType === 'flight' && updatedBooking.provider === 'duffel') {
      try {
        // Get offer ID from either providerBookingReference or bookingData.id
        const bookingData = updatedBooking.bookingData as any;
        const offerId = updatedBooking.providerBookingReference || bookingData?.id;

        if (!offerId) {
          logger.error(`No offer ID found for booking ${updatedBooking.bookingReference}`);
          throw new Error('Cannot create Duffel order: Offer ID not found');
        }

        logger.info(`Creating Duffel order for booking ${updatedBooking.bookingReference}`);
        logger.info(`Provider: ${updatedBooking.provider}, Offer ID: ${offerId}`);

        // First, check if the offer is still valid by trying to fetch it
        try {
          await duffelService.getOfferDetails(offerId as string);
          logger.info(`[Duffel] Offer ${offerId} is still valid`);
        } catch (offerError: any) {
          // Offer has expired or is no longer available
          logger.error(`[Duffel] Offer ${offerId} is no longer valid:`, offerError.message);

          // Update booking status to indicate offer expired
          await prisma.booking.update({
            where: { id: updatedBooking.id },
            data: {
              status: 'pending_reselection',
              notes: `${updatedBooking.notes || ''}\n\n[System] Offer expired. Please have the traveler re-search and select a new flight, then try approving again.`.trim(),
            },
          });

          throw new Error(
            'The selected flight offer has expired. Please have the traveler search for flights again and select a new option. ' +
            'Duffel flight offers are only valid for 5-15 minutes. Once a new flight is selected, you can approve the booking again.'
          );
        }

        // Cast passengerDetails to proper type
        const passengerDetails = updatedBooking.passengerDetails as any;

        // Extract contact info from first passenger or updated booking user
        const firstPassenger = Array.isArray(passengerDetails) ? passengerDetails[0] : null;
        const contactEmail = firstPassenger?.email || updatedBooking.user.email;
        const contactPhone = firstPassenger?.phone || '';

        logger.info(`Passenger count: ${Array.isArray(passengerDetails) ? passengerDetails.length : 0}`);
        logger.info(`Contact: ${contactEmail}, ${contactPhone}`);

        // Extract services (seats & baggage) from booking data if available
        const bookingDataWithServices = updatedBooking.bookingData as any;
        const servicesData = bookingDataWithServices?.services;
        logger.info(`Services found: ${servicesData ? JSON.stringify(servicesData) : 'none'}`);

        // Create Duffel order with services
        const duffelOrder = await duffelService.createBooking({
          offerId: offerId as string,
          passengers: passengerDetails || [],
          contactEmail,
          contactPhone,
          services: servicesData || undefined, // Include seat & baggage services
        });

        // Update booking with Duffel order details and PNR
        const bookingWithPNR = await prisma.booking.update({
          where: { id: updatedBooking.id },
          data: {
            providerOrderId: duffelOrder.bookingReference,
            providerConfirmationNumber: duffelOrder.bookingReference,
            providerRawData: duffelOrder.rawData,
          },
        });

        logger.info(`Duffel order created successfully: ${duffelOrder.bookingReference}`);

        // Send detailed booking confirmation email with ticket details
        try {
          const flightData = updatedBooking.bookingData as any;
          const firstSegment = flightData?.outbound?.[0];
          const lastSegment = flightData?.outbound?.[flightData.outbound.length - 1];

          if (firstSegment && passengerDetails) {
            await emailService.sendBookingConfirmation({
              bookingId: updatedBooking.id,
              bookingReference: updatedBooking.bookingReference,
              pnr: duffelOrder.bookingReference,
              travelerName: `${passengerDetails[0]?.firstName || updatedBooking.user.firstName} ${passengerDetails[0]?.lastName || updatedBooking.user.lastName}`,
              bookerName: `${updatedBooking.user.firstName} ${updatedBooking.user.lastName}`,
              bookerEmail: updatedBooking.user.email,
              flightDetails: {
                airline: firstSegment.airline || 'N/A',
                from: updatedBooking.origin || firstSegment.departure?.airportCode || 'N/A',
                to: updatedBooking.destination || lastSegment.arrival?.airportCode || 'N/A',
                departureDate: new Date(updatedBooking.departureDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                departureTime: firstSegment.departure?.time ? new Date(firstSegment.departure.time).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A',
                arrivalTime: lastSegment.arrival?.time ? new Date(lastSegment.arrival.time).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A',
                flightNumber: firstSegment.flightNumber || undefined,
              },
              passengerDetails: Array.isArray(passengerDetails) ? passengerDetails.map((p: any) => ({
                firstName: p.firstName,
                lastName: p.lastName,
                email: p.email,
              })) : [],
              priceDetails: {
                basePrice: Number(updatedBooking.basePrice),
                taxes: Number(updatedBooking.taxesFees),
                total: Number(updatedBooking.totalPrice),
                currency: updatedBooking.currency,
              },
              seatsSelected: flightData?.seatsSelected || undefined,
              baggageSelected: flightData?.baggageSelected || undefined,
            });
            logger.info(`Booking confirmation email sent for ${updatedBooking.bookingReference}`);
          }
        } catch (emailError) {
          logger.error('Failed to send booking confirmation email:', emailError);
          // Don't fail the approval if email fails
        }
      } catch (error: any) {
        // CRITICAL: Duffel order creation failed AFTER credits were deducted!
        logger.error(`[Approval] ❌ Duffel order creation FAILED for ${updatedBooking.bookingReference}`);
        logger.error(`[Approval] Error type: ${error.constructor.name}`);
        logger.error(`[Approval] Error message: ${error.message}`);

        if (error.response) {
          logger.error(`[Approval] Duffel API Response Status: ${error.response.status}`);
          logger.error(`[Approval] Duffel API Response Data:`, JSON.stringify(error.response.data, null, 2));
        }

        if (error.stack) {
          logger.error(`[Approval] Stack trace:`, error.stack);
        }

        // REFUND credits since Duffel failed (handles admin vs regular user automatically)
        try {
          const bookingCost = parseFloat(booking.totalPrice.toString());

          await prisma.$transaction(async (tx) => {
            await refundCredits(
              tx,
              booking.userId,
              booking.organizationId,
              booking.id,
              bookingCost,
              booking.currency,
              `Refund: Duffel booking failed for ${booking.bookingReference}`
            );
            logger.info(`[Approval] ✅ Credits refunded: ${bookingCost}`);
          });

          // Update booking status to failed
          await prisma.booking.update({
            where: { id: updatedBooking.id },
            data: {
              status: 'failed',
              notes: `${updatedBooking.notes || ''}\n\n[System] Duffel order creation failed: ${error.message}. Credits have been refunded.`.trim(),
            },
          });

          logger.error(`[Approval] Booking status updated to 'failed' and credits refunded`);
        } catch (refundError) {
          logger.error(`[Approval] CRITICAL: Failed to refund credits!`, refundError);
          // Don't throw - log for manual intervention
        }

        // Throw the original error to inform the admin
        throw new Error(
          `Failed to create flight booking with airline: ${error.message}. ` +
          `Credits have been refunded to the user. Please try approving again or contact support.`
        );
      }
    }

    // 4. For HOTEL bookings: Skip Duffel booking creation during approval
    // Hotel bookings with Bvodo Credit require 2-tier approval:
    // - First tier (Company Admin): Approves and moves to 'awaiting_confirmation' (this function)
    // - Second tier (Super Admin): Confirms and creates Duffel booking (confirmBooking function)
    if (updatedBooking.bookingType === 'hotel') {
      logger.info(`[Approval Hotel] Hotel booking ${updatedBooking.bookingReference} approved by Company Admin`);
      logger.info(`[Approval Hotel] Status: awaiting_confirmation - waiting for Super Admin confirmation`);
      logger.info(`[Approval Hotel] Credits deducted: ${booking.totalPrice} ${booking.currency}`);
      // Duffel booking creation will happen in confirmBooking()
    }

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
      message: 'Booking approved successfully. Credits charged and booking confirmed.',
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
        const refundAmount = parseFloat(heldTransaction.amount.toString());
        await refundCredits(
          tx,
          booking.userId,
          user.organizationId,
          id,
          refundAmount,
          heldTransaction.currency,
          `Credit released from rejected booking ${booking.bookingReference}`
        );
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
      include: {
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

    // Create Duffel Stays booking for hotel bookings (outside transaction as it's external API)
    if (updatedBooking.bookingType === 'hotel' && updatedBooking.provider === 'duffel') {
      try {
        logger.info(`[Confirmation Hotel] Creating Duffel Stays booking for ${updatedBooking.bookingReference}`);

        // Import duffelStaysService
        const { duffelStaysService } = await import('../services/duffel-stays.service');

        // Get rate ID from either providerBookingReference or bookingData.rateId
        const bookingData = updatedBooking.bookingData as any;
        const rateId = updatedBooking.providerBookingReference || bookingData?.rateId;

        if (!rateId) {
          logger.error(`[Confirmation Hotel] No rate ID found for hotel booking ${updatedBooking.bookingReference}`);
          throw new Error('Cannot create Duffel Stays booking: Rate ID not found');
        }

        logger.info(`[Confirmation Hotel] Provider: ${updatedBooking.provider}, Rate ID: ${rateId}`);

        // Step 1: Create quote (validates availability and handles expiry)
        let quote;
        try {
          quote = await duffelStaysService.createQuote(rateId);
          logger.info(`[Confirmation Hotel] Quote created: ${quote.id}, expires at ${quote.expires_at}`);
        } catch (quoteError: any) {
          // Rate has expired or is no longer available
          logger.error(`[Confirmation Hotel] Rate ${rateId} is no longer valid:`, quoteError.message);

          // Update booking status to indicate rate expired
          await prisma.booking.update({
            where: { id: updatedBooking.id },
            data: {
              status: 'awaiting_confirmation',
              notes: `${updatedBooking.notes || ''}\n\n[System] Hotel rate expired during confirmation. Please have the traveler re-search and select a new room, then try confirming again.`.trim(),
            },
          });

          throw new Error(
            'The selected hotel rate has expired. Please have the traveler search for hotels again and select a new room. ' +
            'Once a new room is selected, you can confirm the booking again.'
          );
        }

        // Step 2: Prepare guest details
        // Get hotel booking to access guest information
        const hotelBooking = await prisma.hotelBooking.findFirst({
          where: { bookingId: updatedBooking.id },
          include: {
            rooms: {
              include: {
                guests: true,
              },
            },
          },
        });

        if (!hotelBooking || !hotelBooking.rooms || hotelBooking.rooms.length === 0) {
          throw new Error('No guest details found for hotel booking');
        }

        // Collect all guests from all rooms
        const allGuests = hotelBooking.rooms.flatMap(room => room.guests);

        if (allGuests.length === 0) {
          throw new Error('No guest details provided for hotel booking');
        }

        // Format guests for Duffel
        const duffelGuests = allGuests.map((guest: any) => {
          // Ensure phone number has + prefix for E.164 format
          let phoneNumber = guest.phone || undefined;
          if (phoneNumber && !phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
          }
          return {
            given_name: guest.firstName,
            family_name: guest.lastName,
            born_on: guest.dateOfBirth || undefined,
            email: guest.email || undefined,
            phone_number: phoneNumber,
          };
        });

        const contactEmail = duffelGuests[0]?.email || updatedBooking.user.email;
        let contactPhone = duffelGuests[0]?.phone_number || '';

        // FIX: Ensure phone number has + prefix for E.164 format (required by Duffel)
        if (contactPhone && !contactPhone.startsWith('+')) {
          contactPhone = '+' + contactPhone;
          logger.info(`[Confirmation Hotel] 🔧 Added + prefix to phone number: ${contactPhone}`);
        }

        logger.info(`[Confirmation Hotel] Guest count: ${duffelGuests.length}`);
        logger.info(`[Confirmation Hotel] Contact: ${contactEmail}, ${contactPhone}`);

        // Step 3: Create Duffel Stays booking
        const duffelHotelBooking = await duffelStaysService.createBooking({
          quote_id: quote.id,
          email: contactEmail,
          phone_number: contactPhone,
          guests: duffelGuests,
          accommodation_special_requests: bookingData?.specialRequests,
        });

        // Use the short accommodation reference (e.g. "5JISXI") if available, otherwise fall back to booking ID
        const shortReference = (duffelHotelBooking as any).reference || duffelHotelBooking.id;

        // Update booking with Duffel booking ID
        await prisma.booking.update({
          where: { id: updatedBooking.id },
          data: {
            providerOrderId: duffelHotelBooking.id,
            providerConfirmationNumber: shortReference, // 🔥 SAVE SHORT REFERENCE (e.g. "5JISXI")
            providerRawData: JSON.parse(JSON.stringify(duffelHotelBooking)),
          },
        });

        logger.info(`[Confirmation Hotel] ✅ Booking ${updatedBooking.bookingReference} confirmed with short ref: ${shortReference}`);

        logger.info(`[Confirmation Hotel] ✅ Duffel Stays booking created: ${duffelHotelBooking.id}`);
      } catch (error: any) {
        // CRITICAL: Duffel Stays booking creation failed!
        logger.error(`[Confirmation Hotel] ❌ Duffel Stays booking creation FAILED for ${updatedBooking.bookingReference}`);
        logger.error(`[Confirmation Hotel] Error: ${error.message}`);

        if (error.response) {
          logger.error(`[Confirmation Hotel] Duffel API Response:`, JSON.stringify(error.response.data, null, 2));
        }

        // Update booking with failure note
        await prisma.booking.update({
          where: { id: updatedBooking.id },
          data: {
            status: 'awaiting_confirmation',
            notes: `${updatedBooking.notes || ''}\n\n[System] Duffel Stays booking creation failed: ${error.message}. Please try confirming again or contact support.`.trim(),
          },
        });

        // Throw the error to inform the Super Admin
        throw new Error(
          `Failed to create hotel booking: ${error.message}. ` +
          `Please try confirming again or contact support if the issue persists.`
        );
      }
    }

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



 
