import { Request, Response } from 'express';
import AmadeusService, { FlightSearchParams } from '../services/amadeus.service';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import FlightProviderFactory from '../services/flight-provider.factory';
import { FlightSearchParams as StandardFlightSearchParams, ProviderType } from '../interfaces/flight-provider.interface';
import PolicyService from '../services/policy.service';

/**
 * Search for flights
 * Now supports multiple providers (Duffel, Amadeus) with automatic fallback
 */
export const searchFlights = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
      nonStop,
      currencyCode,
      maxPrice,
      max,
      provider, // NEW: Optional provider parameter
    } = req.query;

    // Validation
    if (!origin || !destination || !departureDate || !adults) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: origin, destination, departureDate, adults',
      });
      return;
    }

    const searchParams: StandardFlightSearchParams = {
      originLocationCode: origin as string,
      destinationLocationCode: destination as string,
      departureDate: departureDate as string,
      returnDate: returnDate as string | undefined,
      adults: parseInt(adults as string),
      children: children ? parseInt(children as string) : undefined,
      infants: infants ? parseInt(infants as string) : undefined,
      travelClass: travelClass as any,
      nonStop: nonStop === 'true',
      currencyCode: currencyCode as string,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      max: max ? parseInt(max as string) : 50,
    };

    // Use provider factory with fallback support
    const result = await FlightProviderFactory.searchFlightsWithFallback(
      searchParams,
      provider as ProviderType | undefined
    );

    // Policy Filtering (if user is authenticated)
    let policyInfo = null;
    let filteredOffers = result.offers;
    const authReq = req as AuthRequest;

    if (authReq.user) {
      try {
        // Get user's effective policy
        const policy = await PolicyService.getPolicyForUser(
          authReq.user.id,
          authReq.user.organizationId
        );

        if (policy) {
          // Get effective limits (exception overrides base policy)
          const effectiveFlightMaxAmount =
            policy.exception?.flightMaxAmount || policy.flightMaxAmount;

          // Filter offers by policy limits
          if (effectiveFlightMaxAmount) {
            const maxAmount = Number(effectiveFlightMaxAmount);
            filteredOffers = result.offers.filter(
              (offer: any) => parseFloat(offer.totalPrice) <= maxAmount
            );
          }

          // Filter by allowed flight classes
          if (
            policy.allowedFlightClasses &&
            Array.isArray(policy.allowedFlightClasses)
          ) {
            const allowedClasses = policy.allowedFlightClasses as string[];
            filteredOffers = filteredOffers.filter((offer: any) => {
              const cabinClass = offer.cabinClass || offer.travelClass || 'economy';
              return allowedClasses.includes(cabinClass.toLowerCase());
            });
          }

          // Prepare policy info for response
          policyInfo = {
            policyId: policy.id,
            policyName: policy.name,
            limits: {
              flightMaxAmount: effectiveFlightMaxAmount
                ? Number(effectiveFlightMaxAmount)
                : null,
              allowedFlightClasses: policy.allowedFlightClasses,
            },
            hasException: !!policy.exception,
            requiresApprovalAbove: policy.requiresApprovalAbove
              ? Number(policy.requiresApprovalAbove)
              : null,
          };
        }
      } catch (policyError) {
        logger.warn('Error applying policy filters:', policyError);
        // Continue without policy filtering if there's an error
      }
    }

    res.status(200).json({
      success: true,
      message: 'Flights retrieved successfully',
      data: filteredOffers,
      count: filteredOffers.length,
      meta: {
        provider: result.provider,
        usedFallback: result.usedFallback,
        totalBeforePolicy: result.offers.length,
        filteredByPolicy: policyInfo ? result.offers.length - filteredOffers.length : 0,
      },
      policy: policyInfo,
    });
  } catch (error: any) {
    logger.error('Search flights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search flights',
    });
  }
};

/**
 * Get offer details (NEW - Provider-agnostic)
 */
export const getOfferDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { offerId } = req.params;
    const { provider } = req.query;

    if (!offerId) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: offerId',
      });
      return;
    }

    if (!provider) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: provider',
      });
      return;
    }

    const offer = await FlightProviderFactory.getOfferDetails(
      offerId,
      provider as ProviderType
    );

    res.status(200).json({
      success: true,
      message: 'Offer details retrieved successfully',
      data: offer,
    });
  } catch (error: any) {
    logger.error('Get offer details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get offer details',
    });
  }
};

/**
 * Get flight price (Legacy - for Amadeus compatibility)
 */
export const getFlightPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { flightOffers } = req.body;

    if (!flightOffers || !Array.isArray(flightOffers)) {
      res.status(400).json({
        success: false,
        message: 'Missing or invalid flightOffers',
      });
      return;
    }

    const pricedFlights = await AmadeusService.getFlightPrice(flightOffers);

    res.status(200).json({
      success: true,
      message: 'Flight price retrieved successfully',
      data: pricedFlights,
    });
  } catch (error: any) {
    logger.error('Get flight price error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get flight price',
    });
  }
};

/**
 * Create flight booking (NEW - Provider-agnostic)
 */
export const createFlightBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { offerId, passengers, provider, contactEmail, contactPhone } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!offerId || !passengers || !provider) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: offerId, passengers, provider',
      });
      return;
    }

    // Create booking using provider factory
    const bookingConfirmation = await FlightProviderFactory.createBooking(
      {
        offerId,
        passengers,
        contactEmail: contactEmail || user.email,
        contactPhone,
      },
      provider as ProviderType
    );

    // Save booking to database
    const prisma = (await import('../config/database')).default;

    // Generate unique booking reference if provider didn't provide one
    const bookingReference = bookingConfirmation.bookingReference ||
      `BV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Extract trip details from flight offer
    const outbound = bookingConfirmation.flights.outbound[0];
    const inbound = bookingConfirmation.flights.inbound?.[0];
    const isRoundTrip = !!inbound;

    // Calculate dates
    const departureDate = new Date(outbound.departure.time);
    const returnDate = inbound ? new Date(inbound.departure.time) : null;

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        organizationId: user.organizationId,
        userId: user.userId,
        bookingReference,
        bookingType: 'flight',

        // Provider information
        provider: bookingConfirmation.provider,
        providerName: bookingConfirmation.flights.validatingAirline,
        providerOrderId: bookingConfirmation.rawData?.id || offerId,
        providerBookingReference: bookingReference,
        providerRawData: bookingConfirmation.rawData,

        // Trip details
        origin: outbound.departure.airportCode,
        destination: outbound.arrival.airportCode,
        departureDate,
        returnDate,
        isRoundTrip,

        // Passenger information
        passengers: passengers.length,
        passengerDetails: passengers,

        // Pricing
        basePrice: bookingConfirmation.totalPrice.amount,
        taxesFees: 0, // Can be calculated from provider data
        totalPrice: bookingConfirmation.totalPrice.amount,
        currency: bookingConfirmation.totalPrice.currency,

        // Status
        status: 'confirmed',
        paymentStatus: 'pending',

        // Timestamps
        bookedAt: new Date(bookingConfirmation.bookingDate),
        confirmedAt: new Date(),
      },
    });

    // Create flight booking details
    const flightSegments = [
      ...bookingConfirmation.flights.outbound,
      ...(bookingConfirmation.flights.inbound || []),
    ];

    for (const segment of flightSegments) {
      await prisma.flightBooking.create({
        data: {
          bookingId: booking.id,
          airline: segment.airline,
          airlineCode: segment.airlineCode,
          flightNumber: segment.flightNumber,
          departureAirport: segment.departure.airport,
          departureAirportCode: segment.departure.airportCode,
          arrivalAirport: segment.arrival.airport,
          arrivalAirportCode: segment.arrival.airportCode,
          departureTime: new Date(segment.departure.time),
          arrivalTime: new Date(segment.arrival.time),
          duration: segment.duration ? parseInt(segment.duration.replace(/\D/g, '')) : null,
          cabinClass: segment.cabinClass,
          stops: segment.stops,
          aircraft: segment.aircraft?.name,
          baggageAllowance: segment.baggage?.checked,
          carryOnAllowance: segment.baggage?.carryOn,
          pnr: bookingReference,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Flight booked successfully',
      data: {
        ...bookingConfirmation,
        bookingId: booking.id,
      },
    });
  } catch (error: any) {
    logger.error('Create flight booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create flight booking',
    });
  }
};

/**
 * Search for locations (airports/cities)
 * Now supports multiple providers (Duffel, Amadeus)
 */
export const searchLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword, provider } = req.query;

    if (!keyword) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: keyword',
      });
      return;
    }

    let locations;

    // Use Duffel for location search if specified, otherwise default to Amadeus
    if (provider === 'duffel') {
      const duffelService = (await import('../services/duffel.service')).default;
      locations = await duffelService.searchPlaces(keyword as string);
    } else {
      // Default to Amadeus for backward compatibility
      locations = await AmadeusService.searchLocation(keyword as string);
    }

    res.status(200).json({
      success: true,
      message: 'Locations retrieved successfully',
      data: locations,
      meta: {
        provider: provider || 'amadeus',
      },
    });
  } catch (error: any) {
    logger.error('Search locations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search locations',
    });
  }
};

/**
 * Get seat maps for a flight offer
 */
export const getSeatMaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { offerId } = req.params;

    if (!offerId) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: offerId',
      });
      return;
    }

    // Get provider from offer ID (Duffel IDs start with 'off_')
    const provider = offerId.startsWith('off_') ? 'duffel' : 'amadeus';
    const flightProvider = FlightProviderFactory.getProvider(provider as ProviderType);

    const getSeatMaps = flightProvider.getSeatMaps;
    if (!getSeatMaps) {
      res.status(501).json({
        success: false,
        message: 'Seat maps not supported by this provider',
      });
      return;
    }

    const seatMaps = await getSeatMaps.call(flightProvider, offerId);

    res.status(200).json({
      success: true,
      message: 'Seat maps retrieved successfully',
      data: seatMaps,
    });
  } catch (error: any) {
    logger.error('Get seat maps error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get seat maps',
    });
  }
};

/**
 * Get available services (baggage, meals, etc.) for a flight offer
 */
export const getAvailableServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { offerId } = req.params;

    if (!offerId) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter: offerId',
      });
      return;
    }

    // Get provider from offer ID (Duffel IDs start with 'off_')
    const provider = offerId.startsWith('off_') ? 'duffel' : 'amadeus';
    const flightProvider = FlightProviderFactory.getProvider(provider as ProviderType);

    const getAvailableServices = flightProvider.getAvailableServices;
    if (!getAvailableServices) {
      res.status(501).json({
        success: false,
        message: 'Services not supported by this provider',
      });
      return;
    }

    const services = await getAvailableServices.call(flightProvider, offerId);

    res.status(200).json({
      success: true,
      message: 'Available services retrieved successfully',
      data: services,
    });
  } catch (error: any) {
    logger.error('Get available services error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available services',
    });
  }
};
