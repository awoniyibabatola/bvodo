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
import emailService from '../services/email.service';
import { stripeService } from '../services/stripe.service';

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
          provider: provider || 'duffel',  // NEW: Save provider type
          providerName,
          providerBookingReference,
          bookingData: {
            ...bookingData,
            services: services || undefined,  // Store services in bookingData JSON
          },
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

      // NOTE: Credits are NOT deducted here - only held/reserved until approval
      // When admin approves, credits will be deducted and Duffel order created
      // This validates user has sufficient credits but doesn't charge yet
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

        // Check if user has sufficient credits (validation only - no deduction)
        if (userBalance < bookingCost) {
          throw new Error('Insufficient credits. Please contact your administrator to increase your credit limit.');
        }

        // NOTE: No credit deduction here! Credits will be deducted on approval
        // This just validates the user has enough credits for the booking
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

      // 1. Deduct credits from user ONLY if Duffel order succeeded (or non-Duffel booking)
      try {
        const bookingCost = parseFloat(totalPrice || '0');

        if (bookingCost > 0) {
          await prisma.$transaction(async (tx) => {
            // Get user's current credit balance
            const bookingUser = await tx.user.findUnique({
              where: { id: user.userId },
              select: {
                availableCredits: true,
              },
            });

            if (!bookingUser) {
              throw new Error('User not found');
            }

            const userBalance = parseFloat(bookingUser.availableCredits.toString());

            // Deduct from user's available credits
            await tx.user.update({
              where: { id: user.userId },
              data: {
                availableCredits: userBalance - bookingCost,
              },
            });

            // Create credit transaction for deduction
            await tx.creditTransaction.create({
              data: {
                organizationId: user.organizationId,
                userId: user.userId,
                bookingId: booking.id,
                transactionType: 'booking_charged',
                amount: bookingCost,
                currency: currency || 'USD',
                balanceBefore: userBalance,
                balanceAfter: userBalance - bookingCost,
                description: `Booking auto-approved and charged: ${bookingReference}`,
                createdBy: user.userId,
              },
            });
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
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

        const session = await stripeService.createCheckoutSession({
          bookingReference: completeBooking.bookingReference,
          amount: parseFloat(completeBooking.totalPrice.toString()),
          currency: completeBooking.currency,
          customerEmail: completeBooking.user.email,
          successUrl: `${frontendUrl}/dashboard/bookings/${completeBooking.bookingReference}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${frontendUrl}/dashboard/bookings/${completeBooking.bookingReference}?payment=cancelled`,
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
        logger.error('[Booking] Failed to create Stripe checkout:', stripeError);
        // Don't fail the booking, just log the error
        // User can retry payment later via the payment page
      }
    }

    res.status(201).json({
      success: true,
      message: requiresApproval
        ? 'Booking created and pending approval'
        : paymentMethod === 'card'
          ? 'Booking created. Please complete payment to confirm.'
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

    // Process approval in transaction: deduct credits + create Duffel order
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Deduct credits from user
      const bookingCost = parseFloat(booking.totalPrice.toString());

      if (bookingCost > 0) {
        // Get user's current credit balance
        const bookingUser = await tx.user.findUnique({
          where: { id: booking.userId },
          select: {
            availableCredits: true,
          },
        });

        if (!bookingUser) {
          throw new Error('Booking user not found');
        }

        const userBalance = parseFloat(bookingUser.availableCredits.toString());

        // Check if user still has sufficient credits
        if (userBalance < bookingCost) {
          throw new Error('Insufficient credits. User no longer has enough credits for this booking.');
        }

        // Deduct from user's available credits
        await tx.user.update({
          where: { id: booking.userId },
          data: {
            availableCredits: userBalance - bookingCost,
          },
        });

        // Create credit transaction for deduction
        await tx.creditTransaction.create({
          data: {
            organizationId: booking.organizationId,
            userId: booking.userId,
            bookingId: booking.id,
            transactionType: 'booking_charged',
            amount: bookingCost,
            currency: booking.currency,
            balanceBefore: userBalance,
            balanceAfter: userBalance - bookingCost,
            description: `Booking approved and charged: ${booking.bookingReference}`,
            createdBy: user.userId,
          },
        });
      }

      // 2. Update booking status to confirmed
      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: 'confirmed',
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

    // 3. Create Duffel order for flight bookings (outside transaction as it's external API)
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

        // REFUND credits since Duffel failed
        try {
          const bookingCost = parseFloat(booking.totalPrice.toString());

          await prisma.$transaction(async (tx) => {
            const bookingUser = await tx.user.findUnique({
              where: { id: booking.userId },
              select: { availableCredits: true },
            });

            if (bookingUser) {
              const currentBalance = parseFloat(bookingUser.availableCredits.toString());

              // Refund credits
              await tx.user.update({
                where: { id: booking.userId },
                data: {
                  availableCredits: currentBalance + bookingCost,
                },
              });

              // Create refund transaction
              await tx.creditTransaction.create({
                data: {
                  organizationId: booking.organizationId,
                  userId: booking.userId,
                  bookingId: booking.id,
                  transactionType: 'booking_refunded',
                  amount: bookingCost,
                  currency: booking.currency,
                  balanceBefore: currentBalance,
                  balanceAfter: currentBalance + bookingCost,
                  description: `Refund: Duffel booking failed for ${booking.bookingReference}`,
                  createdBy: user.userId,
                },
              });

              logger.info(`[Approval] ✅ Credits refunded: ${bookingCost}`);
            }
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



